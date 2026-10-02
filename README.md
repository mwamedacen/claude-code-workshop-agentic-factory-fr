# Le messager de l'usine d'agents

Votre agent dans le projet final. Il tient un rôle dans l'usine, parle avec vous dans le terminal, avec les autres agents, et envoie ses demandes au chantier du formateur. Seul le chantier modifie le code du monde.

## Avant de commencer

0. Récupérez le code : sur https://github.com/mwamedacen/claude-code-workshop-agentic-factory-fr, cliquez sur **Use this template** pour créer votre propre repo, puis clonez-le. Vous pouvez aussi cloner directement ce repo.
1. Node.js 22 ou plus récent, et git.
2. Claude Code installé et connecté avec votre propre compte (`claude`, puis `/login`). Le messager utilise cette connexion ; il ne lit ni ne stocke aucun jeton.
3. `ANTHROPIC_API_KEY` ne doit pas être définie dans votre terminal : elle passerait avant votre connexion.
4. `npm install` dans ce dossier.

## Lancer votre messager

```
npm start -- --role <rôle> --nom <prénom> --usine http://<adresse donnée par le formateur>:7777 --code <code de la salle>
```

Rôles : `produit`, `backend`, `frontend`, `testeur`, `relecteur`, `deployeur`.

Ouvrez la même adresse dans votre navigateur : votre personnage apparaît dans la zone de votre rôle.

## Ce que contient ce repo

| Chemin | Rôle |
|---|---|
| `messager.mjs` | le programme : rejoindre l'usine, écouter, parler à votre agent |
| `moteurs/sdk.mjs` | la session Claude Code, avec l'Agent SDK |
| `lib/outils.mjs` | les outils de l'usine donnés à l'agent |
| `lib/relais.mjs` | le relais local des hooks vers le monde |
| `.claude/agents/<rôle>.md` | votre agent de rôle |
| `.claude/skills/brief/` | comment écrire une demande au chantier |
| `.claude/settings.json` | les permissions du messager et ses hooks |
| `ateliers/projet-final.md` | le déroulé du projet |
| `.usine/session.json` | écrit au lancement : l'adresse du monde et votre jeton, pour vos scripts (ignoré par git) |

## Si quelque chose bloque

- « Code de la salle incorrect » : vérifiez le code au tableau.
- « … est déjà pris pour le rôle … » : quelqu'un a déjà ce rôle et ce prénom. Prenez un autre prénom. Pour reprendre votre propre session, relancez le messager depuis le même dossier : il renvoie le jeton gardé dans `.usine/session.json`.
- Pas de réponse de l'usine : vérifiez l'adresse, puis le proxy ou le VPN de votre poste.
- Sous Windows, le messager tourne tel quel ; la phase « Des agents en boîte » demande WSL2 ou un binôme sous macOS ou Linux.
