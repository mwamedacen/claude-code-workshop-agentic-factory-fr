// L'usine — relais local des hooks. Les hooks HTTP de .claude/settings.json postent ici
// (127.0.0.1 seulement) ; le relais ne garde que l'événement, l'outil et le type d'agent,
// puis transmet au monde avec le jeton du messager. Il répond 204 sans corps : aucune décision.
import http from 'node:http';

export function demarrerRelais({ port = 7781, transmettre }) {
  const serveur = http.createServer((req, res) => {
    if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
    let corps = '';
    req.on('data', (m) => { corps += m; if (corps.length > 256 * 1024) req.destroy(); });
    req.on('end', () => {
      res.writeHead(204); res.end();
      try {
        const brut = JSON.parse(corps);
        transmettre({ hook_event_name: brut.hook_event_name, tool_name: brut.tool_name, agent_type: brut.agent_type }).catch(() => {});
      } catch { /* corps illisible : ignoré */ }
    });
  });
  return new Promise((ok, ko) => {
    serveur.once('error', ko);
    serveur.listen(port, '127.0.0.1', () => ok({ port: serveur.address().port, fermer: () => new Promise((f) => serveur.close(f)) }));
  });
}
