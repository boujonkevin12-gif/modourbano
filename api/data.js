// Almacenamiento en memoria volátil (Vercel serverless)
// En producción usarías Redis/MongoDB, pero esto funciona para un uso básico
let store = {
  appointments: [],
  blocks: [],
};

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.json(store);
  }

  if (req.method === 'POST') {
    const { appointments, blocks } = req.body;
    if (appointments) store.appointments = appointments;
    if (blocks) store.blocks = blocks;
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
