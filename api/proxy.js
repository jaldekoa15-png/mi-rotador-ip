export const config = {
  runtime: 'edge',
  // 1. Añadimos múltiples regiones (América, Europa, Asia, Oceanía).
  // Esto le dice a Vercel que la función PUEDE ejecutarse en estos lugares.
  regions: ['iad1', 'fra1', 'hnd1', 'syd1', 'gru1'],
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro "url"' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // 2. Rompedor de caché (Cache-Buster): 
  // Añadimos un parámetro aleatorio a la URL final para engañar a los servidores
  // y forzarles a procesar la petición como si fuera totalmente nueva.
  const urlToFetch = new URL(targetUrl);
  urlToFetch.searchParams.append('nocache', Math.random().toString(36).substring(7));

  try {
    const response = await fetch(urlToFetch.toString(), {
      method: request.method,
      headers: {
        // Pasamos el User-Agent del usuario real si existe, o usamos uno por defecto
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        // 3. Forzamos a que no se use ninguna caché intermedia
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      // 4. Evitamos mantener la conexión viva para intentar que use una conexión nueva
      keepalive: false,
    });

    // Clonamos las cabeceras de la respuesta
    const responseHeaders = new Headers(response.headers);
    // Le decimos a tu navegador que tampoco guarde esto en caché
    responseHeaders.set('Cache-Control', 'no-store, max-age=0');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al conectar', message: error.message }), {
      status: 500,
    });
  }
}
