---
name: brief
description: Utiliser pour écrire une demande au chantier de l'usine (demander_au_chantier).
---

# Écrire une demande au chantier

Une demande contient, dans cet ordre :

1. **Objectif** : une phrase qu'on peut vérifier à l'écran ou par un test.
2. **Limites** : les fichiers concernés, dans la zone de votre rôle ; aucune dépendance nouvelle ; 5 fichiers et 150 lignes au plus.
3. **Contrôle** : la commande qui prouve le résultat.
4. **Le test qui doit passer** : `test/demandes/<nom>.test.mjs`, écrit avec `node:test`. Il échoue avant le changement ; le chantier refuse un test qui passe déjà.

Exemple de test :

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('le chat est affiché', () => {
  assert.match(fs.readFileSync(new URL('../../web/flags.js', import.meta.url), 'utf8'), /chat: true/);
});
```

Le chantier répond « livrée » ou « refusée » avec la raison. Une demande refusée se corrige et se renvoie.
