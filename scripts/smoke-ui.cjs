// Run after npm run build. Uses a disposable database and never changes real data.
const {chromium} = require('@playwright/test');
const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname,'..');
const data = fs.mkdtempSync(path.join(os.tmpdir(),'mt9-smoke-'));
const password='smoke-test-password-123';
const backend = spawn(process.env.PYTHON || 'python3',['backend/app.py'], {cwd:root,
  env:{...process.env,DATA_DIR:data,SECRET_KEY:'s'.repeat(48),INTERNAL_TOKEN:'t'.repeat(48),ADMIN_PASSWORD:password},stdio:['ignore','pipe','pipe']});
let logs='';backend.stderr.on('data',chunk=>logs+=chunk.toString());
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.otf':'font/otf','.json':'application/json'};
const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
    const proxy=http.request({hostname:'127.0.0.1',port:8000,path:req.url,method:req.method,headers:req.headers}, response=>{
      res.writeHead(response.statusCode,response.headers);response.pipe(res);
    });proxy.on('error',()=>{res.writeHead(502);res.end();});req.pipe(proxy);return;
  }
  const relative=decodeURIComponent(req.url.split('?')[0]);
  let target=path.join(root,'build',relative);
  if(!target.startsWith(path.join(root,'build'))){res.writeHead(404);res.end();return;}
  if(!fs.existsSync(target) || fs.statSync(target).isDirectory()) target=path.join(root,'build/index.html');
  res.setHeader('Content-Type',types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
let browser;
async function ready(){for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:8000/api/health');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw new Error('Backend did not start: '+logs);}
async function main(){
  await ready();await new Promise(resolve=>server.listen(8080,'127.0.0.1',resolve));
  const args={headless:true};
  if(process.env.CHROMIUM_PATH)args.executablePath=process.env.CHROMIUM_PATH;
  if(process.env.CHROMIUM_ARGS)args.args=JSON.parse(process.env.CHROMIUM_ARGS);
  browser=await chromium.launch(args);
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await page.goto('http://127.0.0.1:8080/admin');
  await page.getByLabel('Пароль',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Войти',exact:true}).click();
  await page.getByRole('heading',{name:'Управление сайтом'}).waitFor();
  await page.getByRole('button',{name:'+ Добавить материал'}).click();
  await page.getByLabel('Заголовок',{exact:true}).fill('UI smoke publication');
  await page.getByRole('textbox',{name:'Текст',exact:true}).fill('Текст создан через админку');
  await page.getByLabel('Публикация').selectOption('published');
  await page.getByRole('button',{name:'Сохранить изменения',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Сохранено'}).waitFor();
  const publicPage=await browser.newPage();
  await publicPage.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  for(const route of ['/','/news','/team','/cases','/announcements','/educations','/about','/contacts','/stepInFuture','/disciplines','/schedule','/documents']){
    await publicPage.goto('http://127.0.0.1:8080'+route);
    await publicPage.getByRole('navigation').waitFor();
    if(route==='/news')await publicPage.getByRole('heading',{name:'UI smoke publication'}).waitFor();
    assert(!await publicPage.getByRole('alert').count(),'Public error on '+route);
  }
  await page.getByRole('button',{name:'Файлы',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:'smoke.txt',mimeType:'text/plain',buffer:Buffer.from('smoke file data')});
  await page.getByRole('link',{name:'smoke.txt',exact:true}).waitFor();
  await page.getByRole('button',{name:'Резервные копии',exact:true}).click();
  await page.getByRole('button',{name:'Создать резервную копию',exact:true}).click();
  await page.locator('.backup-list a').first().waitFor();
  if(process.env.SMOKE_SCREENSHOTS){fs.mkdirSync(process.env.SMOKE_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SMOKE_SCREENSHOTS,'admin-desktop.png'),fullPage:true});}
  await page.setViewportSize({width:390,height:844});
  if(process.env.SMOKE_SCREENSHOTS)await page.screenshot({path:path.join(process.env.SMOKE_SCREENSHOTS,'admin-mobile.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'Admin overflows mobile viewport');
  assert.deepEqual(errors,[]);
  console.log('UI smoke passed: login, publish, 12 public routes, file upload, full backup, mobile layout.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(browser)await browser.close();server.close();backend.kill();fs.rmSync(data,{recursive:true,force:true});
});
