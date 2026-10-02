// L'usine — client du monde pour le messager : rejoindre, écouter son flux, envoyer.
export function creerClient(usine) {
  let jeton = null;
  const entetes = () => ({ 'content-type': 'application/json', ...(jeton ? { authorization: `Bearer ${jeton}` } : {}) });
  async function envoyer(chemin, corps) {
    const r = await fetch(usine + chemin, { method: 'POST', headers: entetes(), body: JSON.stringify(corps) });
    const texte = await r.text();
    const donnees = texte ? JSON.parse(texte) : {};
    if (!r.ok) throw new Error(donnees.erreur ?? `HTTP ${r.status}`);
    return donnees;
  }
  return {
    get jeton() { return jeton; },
    // `jeton` : celui de la session précédente, pour reprendre son personnage après une reconnexion.
    async rejoindre({ code, role, nom, boite = false, jeton: precedent }) {
      const r = await envoyer('/api/rejoindre', { code, role, nom, boite, jeton: precedent });
      jeton = r.jeton;
      return r;
    },
    demander: (demande) => envoyer('/api/demandes', demande),
    deposerTicket: (ticket) => envoyer('/api/tickets', ticket),
    envoyerMessage: (a, texte, profondeur = 0) => envoyer('/api/messages', { a, texte, profondeur }),
    activite: (etat) => envoyer('/api/activite', { etat }),
    evenement: (ev) => envoyer('/api/evenements', ev),
    etat: async () => (await fetch(`${usine}/api/etat`)).json(),

    // Écoute le flux SSE de l'agent ; reprend après une coupure avec Last-Event-ID.
    ecouter(surEvenement, signal) {
      let dernier = 0;
      const boucle = async () => {
        while (!signal?.aborted) {
          try {
            const r = await fetch(`${usine}/api/flux`, { headers: { authorization: `Bearer ${jeton}`, ...(dernier ? { 'last-event-id': String(dernier) } : {}) }, signal });
            const lecteur = r.body.pipeThrough(new TextDecoderStream()).getReader();
            let tampon = '';
            for (;;) {
              const { value, done } = await lecteur.read();
              if (done) break;
              tampon += value;
              let fin;
              while ((fin = tampon.indexOf('\n\n')) >= 0) {
                const bloc = tampon.slice(0, fin); tampon = tampon.slice(fin + 2);
                const ev = { id: null, type: 'message', donnees: '' };
                for (const ligne of bloc.split('\n')) {
                  if (ligne.startsWith('id: ')) ev.id = Number(ligne.slice(4));
                  else if (ligne.startsWith('event: ')) ev.type = ligne.slice(7);
                  else if (ligne.startsWith('data: ')) ev.donnees += ligne.slice(6);
                }
                if (ev.id) dernier = ev.id;
                if (ev.donnees) surEvenement(ev.type, JSON.parse(ev.donnees));
              }
            }
          } catch { if (signal?.aborted) return; }
          await new Promise((ok) => setTimeout(ok, 1000));
        }
      };
      return boucle();
    },
  };
}
