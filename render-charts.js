// Renders the two 7-day charts from the Performance board into PNGs for the staff report.
// Run by the GitHub Action whenever the weekly turnout/training data updates.
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.cwd(), PORT=8099;
const server=http.createServer((req,res)=>{
  let p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0]));
  if(p.endsWith('/'))p+='index.html';
  fs.readFile(p,(e,d)=>{ if(e){res.statusCode=404;res.end('nf');return;}
    const ext=path.extname(p).toLowerCase();
    const ct=ext==='.csv'?'text/csv':ext==='.html'?'text/html':ext==='.js'?'application/javascript':'application/octet-stream';
    res.setHeader('Content-Type',ct); res.end(d); });
});
(async()=>{
  await new Promise(r=>server.listen(PORT,r));
  const b=await chromium.launch({args:['--no-sandbox']});
  const pg=await b.newPage({viewport:{width:1160,height:820},deviceScaleFactor:2});
  await pg.goto('http://localhost:'+PORT+'/',{waitUntil:'networkidle'});
  await pg.waitForFunction(()=>typeof DATA!=='undefined'&&DATA.turnout&&DATA.turnout['7']&&typeof DATA.turnout['7'].n!=='undefined',{timeout:25000});
  await pg.click('#segWindow button[data-w="7"]').catch(()=>{});
  await pg.waitForTimeout(700);
  if(!fs.existsSync('charts')) fs.mkdirSync('charts');
  const turn=await pg.$('xpath=//h3[contains(.,"Turnout by Unit")]/ancestor::div[contains(concat(" ",@class," ")," card ")][1]');
  await turn.screenshot({path:'charts/turnout-7day.png'});
  await pg.click('.tab[data-tab="training"]'); await pg.waitForTimeout(800);
  const train=await pg.$('xpath=//h3[contains(.,"Training Hours by Station")]/ancestor::div[contains(concat(" ",@class," ")," card ")][1]');
  await train.screenshot({path:'charts/training-7day.png'});
  await b.close(); server.close();
  console.log('rendered charts/turnout-7day.png and charts/training-7day.png');
})().catch(e=>{console.error(e);process.exit(1);});
