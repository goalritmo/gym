import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'https://entrenar-backend.railway.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS para permitir peticiones desde entrenar.app
  res.setHeader('Access-Control-Allow-Origin', 'https://entrenar.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';
    
    // Construir la URL del backend
    const backendUrl = `${BACKEND_URL}/api/${apiPath}`;
    
    // Preparar headers para el backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Copiar headers de autorización si existen
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Hacer la petición al backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    // Obtener la respuesta del backend
    const data = await response.json();

    // Devolver la respuesta con el mismo status code
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
