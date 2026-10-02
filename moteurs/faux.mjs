// L'usine — moteur scripté du messager, sans modèle (tests et répétition à sec).
// « /outil <nom> <json> » appelle un outil usine ; un message d'un autre agent reçoit un simple accusé.
export function creerMoteur({ outils, surTexte, surActivite }) {
  const parNom = Object.fromEntries(outils.map((o) => [o.nom, o]));
  return {
    nom: 'faux',
    async envoyer(texte) {
      surActivite?.('occupe');
      try {
        const m = /^\/outil (\S+)\s*(.*)$/s.exec(texte.trim());
        if (m) {
          const outil = parNom[m[1]];
          if (!outil) return surTexte(`Outil inconnu : ${m[1]}`);
          try { surTexte(JSON.stringify(await outil.action(m[2] ? JSON.parse(m[2]) : {}))); }
          catch (e) { surTexte(`Refus : ${e.message}`); }
          return;
        }
        surTexte(texte.startsWith("Message d'un autre agent") ? 'Message lu.' : `Bien reçu : ${texte.slice(0, 60)}`);
      } finally { surActivite?.('pret'); }
    },
    async fermer() {},
  };
}
