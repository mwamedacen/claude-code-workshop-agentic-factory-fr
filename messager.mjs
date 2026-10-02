#!/usr/bin/env node
// L'usine — votre messager : un agent Agent SDK qui tient votre rôle dans l'usine.
//   npm start -- --role backend --nom Alex --usine http://<adresse donnée par le formateur>:7777 --code <code>
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { creerClient } from './lib/usine.mjs';
import { demarrerRelais } from './lib/relais.mjs';
import { definirOutils } from './lib/outils.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const usine = opt('--usine', 'http://127.0.0.1:7777');

const client = creerClient(usine);
// .usine/session.json (ignoré par git) garde l'adresse du monde et votre jeton : le messager le renvoie
// pour reprendre votre personnage, et vos scripts (phase 4) s'en servent.
const SESSION = path.join(ICI, '.usine', 'session.json');
let precedente = {};
try { precedente = JSON.parse(fs.readFileSync(SESSION, 'utf8')); } catch { /* première session */ }
const { agentId } = await client.rejoindre({ code: opt('--code'), role: opt('--role'), nom: opt('--nom'), boite: a.includes('--boite'), jeton: precedente.usine === usine ? precedente.jeton : undefined });
fs.mkdirSync(path.dirname(SESSION), { recursive: true });
fs.writeFileSync(SESSION, JSON.stringify({ usine, agentId, jeton: client.jeton }), { mode: 0o600 });
process.env.USINE_ROLE = opt('--role'); // lu par vos hooks si agent_type manque
const relais = await demarrerRelais({ port: Number(opt('--relais', 7781)), transmettre: client.evenement });
const outils = definirOutils({ client, usine, dossierMonde: path.join(ICI, 'monde') });

const ecrire = (texte) => console.log(`\n${agentId} > ${texte}\n`);
const { creerMoteur } = await import(a.includes('--faux') ? './moteurs/faux.mjs' : './moteurs/sdk.mjs');
const moteur = await creerMoteur({ role: opt('--role'), identite: agentId, outils, dossier: ICI, boite: a.includes('--boite'), surTexte: ecrire, surActivite: (e) => client.activite(e).catch(() => {}), surHook: (e) => client.evenement(e).catch(() => {}) });

// Les messages reçus (chat du monde, autres agents, chantier) passent dans l'entrée de l'agent, avec leur cadre.
client.ecouter((type, d) => {
  if (type !== 'boite-reception') return;
  console.log(`\n[${d.de}] ${d.texte}`);
  if (d.de !== 'chantier') moteur.envoyer(d.cadre ?? d.texte);
});

console.log(`Vous êtes ${agentId}. Écrivez à votre agent ci-dessous (Ctrl+C pour quitter). Relais des hooks : 127.0.0.1:${relais.port}.`);
const terminal = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
terminal.prompt();
terminal.on('line', (ligne) => { if (ligne.trim()) moteur.envoyer(ligne.trim()); terminal.prompt(); });
terminal.on('close', async () => { await moteur.fermer(); await relais.fermer(); process.exit(0); });
