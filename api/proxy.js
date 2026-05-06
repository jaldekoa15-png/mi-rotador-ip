// api/proxy.js
export const config = {
  runtime: 'edge', // Esto lo hace funcionar como un Cloudflare Worker
};

export default async function handler(request) {
  // 1. Obtener la URL de destino desde los parámetros (ej: ?url=https://google.com)
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro "url"' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // 2. Hacer la petición a la web de destino
    // Aquí es donde Vercel usará una de sus IPs de salida
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // 3. Devolver la respuesta al usuario
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al conectar', message: error.message }), {
      status: 500,
    });
  }
}
