const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.CCO_TEST_URL||'http://127.0.0.1:18082';
 const state=await(await page.request.get(base+'/api/state')).json();assert.equal(state.arduino.port,'SIMULADO');
 await page.request.post(base+'/api/mock/reset');await page.goto(base);await page.locator('#switch-C3').waitFor();
 for(const id of ['C1','C2','C3'])for(const position of ['REVERSA','NORMAL']){
   await page.locator(`#switch-${id} button[data-pos=${position}]`).click();
   await page.waitForFunction(({id,position})=>document.querySelector(`#switch-${id} strong`).textContent===position,{id,position});
   assert.match(await page.locator(`#switch-${id} .switch-feedback`).innerText(),/Arduino confirmou/);
 }
 await page.request.post(base+'/api/mock/sensor/S06',{data:{active:true}});
 await page.waitForFunction(()=>document.querySelector('#switch-C1 button').disabled);
 assert.match(await page.locator('#switch-C1 .switch-feedback').innerText(),/S06/);
 assert.equal(await page.locator('#switch-C2 button').first().isEnabled(),true);
 await page.request.post(base+'/api/mock/sensor/S06',{data:{active:false}});
 await page.locator('#emergency').click();await page.waitForFunction(()=>document.querySelector('#switch-C2 button').disabled);
 assert.match(await page.locator('#switch-C2 .switch-feedback').innerText(),/Emergência/);
 await page.screenshot({path:process.env.TEMP+'/cco-servo-check.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Servos: C1/C2/C3 Normal e Reversa, confirmação e bloqueios na interface OK');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
