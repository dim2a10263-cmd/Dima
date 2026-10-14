'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, 'public');
const requestedPort = process.env.PORT || '10000';
const port = Number(requestedPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function sendText(response, status, message, method) {
  const body = Buffer.from(message, 'utf8');
  response.writeHead(status, {
    ...securityHeaders,
    'Cache-Control': 'no-store',
    'Content-Length': body.length,
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(method === 'HEAD' ? undefined : body);
}

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    request.resume();
    sendText(response, 405, 'Method not allowed.', request.method);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    sendText(response, 400, 'Invalid request path.', request.method);
    return;
  }

  const relativePath = pathname.replace(/^\/+/, '') || 'index.html';
  let filePath = path.resolve(publicRoot, relativePath);
  const relativeToRoot = path.relative(publicRoot, filePath);

  if (relativeToRoot === '..' || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
    sendText(response, 404, 'Not found.', request.method);
    return;
  }

  try {
    let fileInfo = await fs.promises.stat(filePath);
    if (fileInfo.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fileInfo = await fs.promises.stat(filePath);
    }

    if (!fileInfo.isFile()) {
      sendText(response, 404, 'Not found.', request.method);
      return;
    }

    response.writeHead(200, {
      ...securityHeaders,
      'Cache-Control': 'no-cache',
      'Content-Length': fileInfo.size,
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!response.headersSent) {
        sendText(response, 500, 'Unable to serve this file.', request.method);
      } else {
        response.destroy();
      }
    });
    stream.pipe(response);
  } catch {
    sendText(response, 404, 'Not found.', request.method);
  }
});

server.listen(port, '0.0.0.0');
