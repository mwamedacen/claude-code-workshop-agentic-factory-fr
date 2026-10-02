// L'usine — les outils « usine » du messager, communs aux deux moteurs.
// Chaque outil : nom, description, champs (texte obligatoire ou facultatif), action.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const gitAsync = (args, cwd) => promisify(execFile)('git', args, { cwd }).then((r) => r.stdout.trim());

export function definirOutils({ client, usine, dossierMonde }) {
  return [
    {
      nom: 'demander_au_chantier',
      description: "Envoie une demande de changement au chantier. Brief : objectif, limites, contrôle. Joindre le test qui doit passer (fichier test/demandes/<nom>.test.mjs) et, si vous l'avez, un patch au format git diff.",
      champs: { objectif: true, limites: true, controle: true, fichier_test: true, contenu_test: true, patch: false, ticket: false },
      action: async (a) => client.demander({
        brief: { objectif: a.objectif, limites: a.limites, controle: a.controle },
        verification: { fichier: a.fichier_test, contenu: a.contenu_test },
        patch: a.patch || undefined, ticket: a.ticket || undefined,
      }),
    },
    {
      nom: 'deposer_ticket',
      description: 'Responsable produit seulement : dépose un ticket (titre, but, contrôle, rôles concernés séparés par des virgules).',
      champs: { titre: true, but: true, controle: true, roles: false },
      action: (a) => client.deposerTicket({ titre: a.titre, but: a.but, controle: a.controle, roles: String(a.roles ?? '').split(',').map((r) => r.trim()).filter(Boolean) }),
    },
    {
      nom: 'envoyer_message',
      description: "Envoie un court message à un autre agent (identifiant visible dans etat_usine). Répondez au plus une fois à un message reçu.",
      champs: { a: true, texte: true },
      action: (a) => client.envoyerMessage(a.a, a.texte),
    },
    {
      nom: 'etat_usine',
      description: "Lit l'état du monde : agents, demandes au chantier, tickets, version.",
      champs: {},
      action: () => client.etat(),
    },
    {
      nom: 'synchroniser_monde',
      description: 'Met à jour la copie locale du code du monde (dossier monde/), en lecture seule pour vous.',
      champs: {},
      action: async () => {
        const depot = `${usine}/monde.git`;
        if (fs.existsSync(path.join(dossierMonde, '.git'))) await gitAsync(['pull', '-q', '--ff-only'], dossierMonde);
        else await gitAsync(['clone', '-q', depot, dossierMonde]);
        return { dossier: 'monde/', commit: await gitAsync(['rev-parse', '--short', 'HEAD'], dossierMonde) };
      },
    },
  ];
}
