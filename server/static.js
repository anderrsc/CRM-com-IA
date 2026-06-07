import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'dist');
const port = Number(process.env.WEB_PORT || 5173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const syncSnippet = `
<script>
(function () {
  var apiBase = 'http://127.0.0.1:8787';
  var storageKey = 'marquinhos-os-storage';
  var collections = ['leads', 'visits', 'measurementSheets', 'budgets', 'productions', 'installations', 'knowledgeBase'];

  function readState() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}').state || {}; } catch (_) { return {}; }
  }

  function writeState(nextState) {
    var current = {};
    try { current = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
    localStorage.setItem(storageKey, JSON.stringify({ state: Object.assign({}, current.state || {}, nextState), version: current.version || 0 }));
  }

  function request(method, path, body) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open(method, apiBase + path, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(body ? JSON.stringify(body) : null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) return JSON.parse(xhr.responseText);
    } catch (_) {}
    return null;
  }

  function asyncRequest(method, path, body) {
    fetch(apiBase + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).catch(function () {});
  }

  function loadFromApi() {
    var nextState = {};
    collections.forEach(function (collection) {
      var rows = request('GET', '/api/data/' + encodeURIComponent(collection));
      if (Array.isArray(rows) && rows.length) nextState[collection] = rows;
    });
    var subscriptions = request('GET', '/api/data/subscriptions');
    if (Array.isArray(subscriptions) && subscriptions.length) nextState.subscription = subscriptions[0];
    if (Object.keys(nextState).length) writeState(nextState);
  }

  function byId(items) {
    return (Array.isArray(items) ? items : []).reduce(function (map, item) {
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function syncCollection(collection, beforeItems, afterItems) {
    var before = byId(beforeItems);
    var after = byId(afterItems);
    Object.keys(after).forEach(function (id) {
      if (JSON.stringify(before[id]) !== JSON.stringify(after[id])) {
        asyncRequest('PUT', '/api/data/' + encodeURIComponent(collection) + '/' + encodeURIComponent(id), after[id]);
      }
    });
    Object.keys(before).forEach(function (id) {
      if (!after[id]) asyncRequest('DELETE', '/api/data/' + encodeURIComponent(collection) + '/' + encodeURIComponent(id));
    });
  }

  loadFromApi();

  var originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    var before = key === storageKey ? readState() : null;
    originalSetItem.apply(this, arguments);
    if (key !== storageKey) return;
    var after = readState();
    collections.forEach(function (collection) { syncCollection(collection, before && before[collection], after[collection]); });
    if (after.subscription) asyncRequest('PUT', '/api/data/subscriptions/main', Object.assign({ id: 'main' }, after.subscription));
  };
})();
</script>`;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const requested = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.normalize(path.join(root, requested));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let content = await fs.readFile(filePath);
    if (path.basename(filePath) === 'index.html') {
      content = Buffer.from(content.toString('utf8').replace('<script type="module"', `${syncSnippet}\n    <script type="module"`));
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  } catch {
    let content = await fs.readFile(path.join(root, 'index.html'));
    content = Buffer.from(content.toString('utf8').replace('<script type="module"', `${syncSnippet}\n    <script type="module"`));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  }
});

server.listen(port, () => {
  console.log(`Marquinhos OS aberto em http://127.0.0.1:${port}`);
});
