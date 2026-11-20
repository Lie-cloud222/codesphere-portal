'use strict';
/*
 * PM-08 Integrated Formative Assessment: supplied server
 *
 * Run:   npm install   then   npm start
 * Serves the files in this folder (or the folder you pass as an argument) at http://localhost:3000
 *
 * Endpoints
 *   GET  /employees.json     static file (use it in Task 11)
 *   POST /api/employees      accepts JSON with a name (name or firstName) and an email; replies 201, or 400 if invalid
 *   GET  /api/fail           always replies 500 (use it to test error handling in Task 11)
 *   WS   ws://localhost:3000 notification feed (Task 13)
 *        Server to client: { type: "info" | "alert" | "training", text, department, time }
 *        Client to server: { type: "subscribe", department: "Engineering" | "Human Resources" | "Finance" | "Operations" | "All" }
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(process.argv[2] || process.cwd());
const DEPARTMENTS = ['Engineering', 'Human Resources', 'Finance', 'Operations'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.vtt': 'text/vtt; charset=utf-8'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function handleRegistration(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 100000) req.destroy();
  });
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      return sendJson(res, 400, { message: 'The request body is not valid JSON.' });
    }
    const name = data.name || data.firstName;
    const hasName = typeof name === 'string' && name.trim().length > 0;
    const hasEmail = typeof data.email === 'string' && data.email.includes('@');
    if (!hasName || !hasEmail) {
      return sendJson(res, 400, { message: 'A name and a valid email address are required.' });
    }
    return sendJson(res, 201, {
      message: 'Employee received by the CodeSphere server.',
      employee: Object.assign({ id: Math.floor(Math.random() * 90000) + 10000 }, data)
    });
  });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = path.join(ROOT, path.normalize(requested));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found: ' + pathname);
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (req.method === 'POST' && url.pathname === '/api/employees') return handleRegistration(req, res);
  if (url.pathname === '/api/fail') return sendJson(res, 500, { message: 'Simulated server error.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { message: 'Method not allowed.' });
  return serveStatic(req, res, url.pathname);
});

/* WebSocket notification feed */
const wss = new WebSocketServer({ server });

const NOTIFICATIONS = [
  { type: 'info', text: 'The monthly payroll report is available.' },
  { type: 'alert', text: 'Server maintenance starts tonight at 22:00.' },
  { type: 'training', text: 'Secure coding workshop is open for registration.' },
  { type: 'info', text: 'The staff meeting starts at 14:00 in the main boardroom.' },
  { type: 'alert', text: 'Please update your emergency contact details.' },
  { type: 'training', text: 'First aid refresher course is scheduled for Friday.' }
];

function send(socket, message) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(Object.assign({ time: new Date().toISOString() }, message)));
  }
}

wss.on('connection', (socket) => {
  socket.department = 'All';
  send(socket, { type: 'info', text: 'Connected to the CodeSphere notification service.', department: 'All' });

  socket.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (error) {
      return send(socket, { type: 'alert', text: 'Messages must be valid JSON.', department: 'All' });
    }
    if (message.type === 'subscribe' && (message.department === 'All' || DEPARTMENTS.includes(message.department))) {
      socket.department = message.department;
      return send(socket, { type: 'info', text: 'Subscribed to ' + message.department + ' notifications.', department: message.department });
    }
    return send(socket, { type: 'alert', text: 'Unknown message type or department.', department: 'All' });
  });
});

let counter = 0;
setInterval(() => {
  const notification = NOTIFICATIONS[counter % NOTIFICATIONS.length];
  const department = DEPARTMENTS[counter % DEPARTMENTS.length];
  counter += 1;
  wss.clients.forEach((socket) => {
    if (socket.department === 'All' || socket.department === department) {
      send(socket, Object.assign({}, notification, { department }));
    }
  });
}, 4000);

server.listen(PORT, () => {
  console.log('CodeSphere server running at http://localhost:' + PORT + ' (serving ' + ROOT + ')');
});
