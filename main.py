from flask import Flask, request, Response
import requests
import os

app = Flask(__name__)

# Cabeceras que eliminamos para total anonimato
BANNED_HEADERS = [
    'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 
    'x-real-ip', 'x-render-origin-hostname', 'x-cloud-trace-context',
    'via', 'host', 'connection'
]

@app.route('/')
def health_check():
    return "Proxy activo", 200

@app.route('/proxy')
def proxy():
    target_url = request.args.get('url')
    if not target_url:
        return {"error": "Falta parametro url"}, 400

    # 1. Limpieza de cabeceras de SALIDA (Hacia el objetivo)
    headers = {k: v for k, v in request.headers if k.lower() not in BANNED_HEADERS}
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    try:
        # 2. Realizar petición
        resp = requests.get(target_url, headers=headers, stream=True, timeout=15)
        
        # 3. Limpieza de cabeceras de ENTRADA (Hacia tu Kali)
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie']
        headers_to_return = [(name, value) for (name, value) in resp.raw.headers.items()
                             if name.lower() not in excluded_headers]

        return Response(resp.content, resp.status_code, headers_to_return)

    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    # Render asigna un puerto dinámico mediante la variable PORT
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
