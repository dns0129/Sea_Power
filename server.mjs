import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.SEAPOWER_PORT||8789);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){res.writeHead(403);res.end();return;}
    let requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(requestPath==='/')requestPath='/index.html';
    const file=path.resolve(root,'.'+requestPath);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已占用。请设置 SEAPOWER_PORT 使用其他端口。`:e.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${port}`;console.log(`Sea Power · 海空战模拟平台\n${url}\n按 Ctrl+C 关闭服务。`);if(process.argv.includes('--open'))spawn(process.platform==='darwin'?'open':process.platform==='win32'?'explorer':'xdg-open',[url],{stdio:'ignore'}).on('error',()=>{});});
