# Projet final · L'usine d'agents (60 à 90 min)

*Après le Jour 2. Toute la salle construit un même monde, servi depuis le poste du formateur.*

**Mission.** Votre agent tient un rôle dans l'usine. Il lit le code du monde, écrit aux autres agents et envoie au chantier des demandes précises. Le chantier, la session Claude Code du formateur, applique chaque demande si elle passe la porte : tests verts, fichiers de votre zone, petit changement.

**Départ.** Votre copie du repo du messager (https://github.com/mwamedacen/claude-code-workshop-agentic-factory-fr, bouton **Use this template**, ou un simple clone), `npm install` fait, votre compte Claude Code connecté.

## Parcours principal · 60 min

### 1. L'usine ouvre · 15 min

Lancez votre messager (voir le README), puis ouvrez le monde dans votre navigateur.

> Lis le code du monde, puis dis-moi en trois lignes ce que ma zone contient.

**Pendant la réponse :** regardez votre personnage. Quand votre agent confie une recherche à un sous-agent, un événement `SubagentStart` part vers le monde.

Votre première mission, selon votre rôle :

| Rôle | Première mission |
|---|---|
| Responsable produit | Cinq tickets avec `deposer_ticket` : salles, drones pour les sous-agents, enveloppes qui volent, tableau des scores, jour et nuit |
| Backend | La messagerie entre agents : `server/messages.mjs` et le drapeau `messages` |
| Frontend | Le chat du monde : le drapeau `chat` de `web/flags.js` |
| Testeur | Une première série de tests dans `test/` |
| Relecteur | Les défauts laissés dans le code de départ, avec une preuve pour chacun |
| Déployeur | Le retour arrière : `ops/retour.mjs` ne marche pas |

Dans un second terminal, ouvrez `claude` dans un worktree de votre copie du monde et faites écrire le test qui doit passer. Votre agent l'envoie avec le brief (skill `brief`).

**Vérifiez :** la caisse de votre demande avance sur le tapis du chantier, puis la réponse arrive dans votre terminal : « livrée » ou « refusée » avec la raison.

### 2. Premières fonctions · 15 min

Le chat et la messagerie sont ouverts. Le responsable produit fait passer ses tickets aux agents backend et frontend ; les binômes d'un même rôle préparent chacun une proposition. Le relecteur et le testeur commentent chaque livraison ; le déployeur publie les versions.

**Vérifiez :** un ticket livré, visible dans le monde.

### 3. Des murs sur vos demandes · 15 min

Ajoutez à votre messager un hook `PreToolUse` sur `mcp__usine__demander_au_chantier`. Il refuse une demande sans test, hors de votre zone ou trop grosse. Testez-le avec un exemple JSON, puis commitez-le pour votre binôme. Vérifiez dans `/hooks` avant de lui faire confiance.

**Vérifiez :** une demande incomplète est refusée sur votre poste, avec sa raison.

### 4. Sorties structurées · 15 min

Votre rôle en une commande : `claude -p` avec `--json-schema`, un plafond de tours et de dépense. Envoyez le résultat au monde avec un petit script : `POST /api/x/rapports` avec votre jeton. Le messager écrit l'adresse du monde et ce jeton dans `.usine/session.json`.

**Vérifiez :** un rapport JSON lisible par une machine.

## À montrer à la fin

- [ ] Votre personnage dans le monde, et votre première demande livrée ou refusée avec sa raison
- [ ] Un message échangé avec un autre agent
- [ ] Votre hook sur les demandes, commité
- [ ] Un rapport JSON produit par `claude -p`

## Pour aller plus loin

**Niveau 2 · Des agents en boîte.** Lancez une seconde instance avec `--boite` (macOS, Linux ou WSL2) : elle tourne dans la sandbox de Claude Code, avec Bash. Donnez-lui une tâche longue et regardez ce que la sandbox refuse. Chaque commande refusée part vers le monde comme un événement `PostToolUseFailure`.

**Niveau 3 · Livraison.** Le déployeur publie la version finale, puis le formateur pose le tag `v-finale`. Toute l'équipe vérifie le retour arrière vers ce tag. Le tableau des coûts (`node ops/couts.mjs`) montre ce que chaque rôle a dépensé.
