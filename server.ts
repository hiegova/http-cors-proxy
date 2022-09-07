import * as UrlLib from 'https://deno.land/std/node/url.ts';


/** ================ Config ================ */
/** Specify the URL of your real server API */
const REAL_API_ROOT = 'https://some-api.com';
/** Port the server will listen on */
const LOCAL_PORT = 8080;
/** The IP address or host on the local network on which the server is running */
const LOCAL_HOST = 'http://192.168.3.34';
/** ================ Config ================ */


const server = Deno.listenTls({ port: LOCAL_PORT });
console.log(`HTTP webserver running. Access it at: ${LOCAL_HOST}:${LOCAL_PORT}`);

for await (const conn of server) {
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const requestEvent of httpConn) {
    const parsedUrl = UrlLib.parse(requestEvent.request.url, true, true);
    const apiUrl = [
      REAL_API_ROOT,
      parsedUrl.pathname || '',
      parsedUrl.search || '',
    ].join('');


    // Just logging
    console.log(requestEvent.request.method, apiUrl);

    const requestHeaders = new Headers(requestEvent.request.headers);
    requestHeaders.set('origin', REAL_API_ROOT);

    const apiRes = await fetch(apiUrl, {
      method: requestEvent.request.method,
      body: requestEvent.request.body,
      headers: requestHeaders,
    });

    const fakeHeaders = new Headers(apiRes.headers);
    const fakeOrigin = requestEvent.request.headers.get('origin') || '*';

    fakeHeaders.set('access-control-allow-origin', fakeOrigin);

    requestEvent.respondWith(
      new Response(apiRes.body, {
        status: apiRes.status,
        headers: fakeHeaders,
      }),
    );
  }
}
