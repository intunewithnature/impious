const http = require("http");
const port = 3000;
const server = http.createServer((req, res) => {
  if (req.url === "/healthz") { res.writeHead(200, {"Content-Type":"text/plain"}); return res.end("ok"); }
  res.writeHead(200, {"Content-Type":"application/json"});
  res.end(JSON.stringify({ service:"werewolf-game", status:"ok", time:new Date().toISOString() }));
});
server.listen(port);
