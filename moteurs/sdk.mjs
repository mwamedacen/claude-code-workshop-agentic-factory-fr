// L'usine — moteur réel du messager : une session Claude Code via l'Agent SDK, en entrée continue.
// Il utilise la connexion Claude Code de la personne sur ce poste ; il ne lit ni ne stocke aucun jeton.
// Références : code.claude.com/docs/en/agent-sdk/typescript (query, agent, createSdkMcpServer, tool),
// code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode.
const EVENEMENTS = ['UserPromptSubmit', 'PreToolUse', 'PostToolUseFailure', 'SubagentStart', 'SubagentStop', 'Stop'];

export async function creerMoteur({ role, identite, outils, dossier, surTexte, surActivite, surHook, boite = false }) {
  const { query, tool, createSdkMcpServer } = await import('@anthropic-ai/claude-agent-sdk');
  const { z } = await import('zod');
  const fs = await import('node:fs');
  const path = await import('node:path');
  // Le corps de .claude/agents/<rôle>.md est aussi ajouté au prompt système : avec la seule option agent,
  // les hooks portent bien agent_type, mais le modèle ne voyait pas son rôle (essai du 2 octobre 2026).
  const brut = fs.readFileSync(path.join(dossier, '.claude', 'agents', `${role}.md`), 'utf8');
  const fiche = brut.replace(/^---[\s\S]*?---\n/, '');
  // L'agent est aussi défini ici, d'après son fichier : avec --boite, ses outils reçoivent Bash
  // (les outils du fichier passeraient avant ceux de la session). Une définition passée à query()
  // l'emporte sur le fichier du même nom (code.claude.com/docs/en/agent-sdk/subagents).
  const champ = (nom) => new RegExp(`^${nom}: (.*)$`, 'm').exec(brut)?.[1].trim();
  const outilsAgent = [...(champ('tools') ?? 'Read, Grep, Glob, Agent, mcp__usine__*').split(',').map((t) => t.trim()), 'Skill', ...(boite ? ['Bash'] : [])];

  const serveur = createSdkMcpServer({
    name: 'usine',
    tools: outils.map((o) => tool(
      o.nom, o.description,
      Object.fromEntries(Object.entries(o.champs).map(([k, requis]) => [k, requis ? z.string() : z.string().optional()])),
      async (a) => {
        try { return { content: [{ type: 'text', text: JSON.stringify(await o.action(a)) }] }; }
        catch (e) { return { content: [{ type: 'text', text: `Refus : ${e.message}` }], isError: true }; }
      },
    )),
  });

  // File des messages à donner à l'agent : le terminal, le chat du monde et les autres agents.
  const attente = [];
  let reveil = null;
  async function* entree() {
    for (;;) {
      while (attente.length) yield { type: 'user', message: { role: 'user', content: attente.shift() }, parent_tool_use_id: null };
      await new Promise((ok) => { reveil = ok; });
    }
  }

  const session = query({
    prompt: entree(),
    options: {
      cwd: dossier,
      agent: role, // .claude/agents/<rôle>.md du messager
      agents: { [role]: { description: champ('description') ?? role, prompt: fiche, tools: outilsAgent, skills: ['brief'] } },
      skills: ['brief'], // la skill brief du messager (code.claude.com/docs/en/agent-sdk/skills)
      systemPrompt: { type: 'preset', preset: 'claude_code', append: `${fiche}\nVotre identifiant dans l'usine : ${identite}.` },
      settingSources: ['project'],
      mcpServers: { usine: serveur },
      tools: ['Read', 'Grep', 'Glob', 'Agent', 'Skill', ...(boite ? ['Bash'] : [])],
      allowedTools: ['Read', 'Grep', 'Glob', 'Agent', 'Skill', 'mcp__usine__*', ...(boite ? ['Bash'] : [])],
      permissionMode: 'dontAsk',
      // --boite : Bash est permis, mais seulement dans la sandbox de Claude Code (macOS, Linux, WSL2).
      // Sans sandbox disponible, la session ne démarre pas (failIfUnavailable).
      ...(boite ? { sandbox: { enabled: true, failIfUnavailable: true, allowUnsandboxedCommands: false, network: { allowedDomains: [], strictAllowlist: true } } } : {}),
      // Avec la sandbox active, les hooks HTTP vers 127.0.0.1 n'arrivent pas au relais (constaté le
      // 2 octobre 2026, Claude Code 2.1.287). En boîte, les mêmes événements passent donc par des hooks
      // du SDK, dans ce processus (code.claude.com/docs/en/agent-sdk/typescript, option hooks).
      ...(boite && surHook ? { hooks: Object.fromEntries(EVENEMENTS.map((ev) => [ev, [{ hooks: [async (h) => {
        surHook({ hook_event_name: h.hook_event_name, tool_name: h.tool_name, agent_type: h.agent_type });
        return {};
      }] }]])) } : {}),
      maxTurns: Number(process.env.USINE_TOURS ?? 20),
      maxBudgetUsd: Number(process.env.USINE_BUDGET ?? 2),
    },
  });
  (async () => {
    for await (const m of session) {
      if (m.type === 'assistant') for (const b of m.message.content ?? []) if (b.type === 'text' && b.text.trim()) surTexte(b.text);
      if (m.type === 'result') surActivite?.('pret');
    }
  })().catch((e) => surTexte(`Session arrêtée : ${e.message}`));

  return {
    nom: 'sdk',
    async envoyer(texte) { surActivite?.('occupe'); attente.push(texte); reveil?.(); },
    async fermer() { session.interrupt?.().catch(() => {}); },
  };
}
