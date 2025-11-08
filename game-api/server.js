const http = require('http');
const port = process.env.PORT || 8080;
http.createServer((req,res)=>{
  if (req.url === '/health') {
    res.writeHead(200, {'content-type':'application/json'});
    return res.end(JSON.stringify({ ok:true, ts: Date.now() }));
  }
  res.writeHead(200, {'content-type':'text/plain'});
  res.end('Impious API says hi.\n');
}).listen(port, ()=> console.log('API up on', port));
