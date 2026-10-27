const $=selector=>document.querySelector(selector);
const pins=[...Array.from({length:10},(_,i)=>`D${i+2}`),...Array.from({length:5},(_,i)=>`A${i+1}`)];
let state=null,dirty=false,built=false,requestBusy=false;
function message(text){$('#configMessage').textContent=text}
function pinSelect(id,value){const select=document.createElement('select');select.id=id;for(const pin of pins)select.add(new Option(pin,pin));select.value=value;select.onchange=()=>{dirty=true;render()};return select}
function label(text,control){const el=document.createElement('label');el.append(document.createTextNode(text),control);return el}
function build(){
  if(built)return;built=true;
  const config=state.hardware.config;
  for(const [id,pin] of Object.entries(config.sensors)){
    const row=document.createElement('div');row.className='config-row';row.id=`row-${id}`;
    const info=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('small');
    title.textContent=id;description.textContent=state.sensors[id].description;info.append(title,description);
    row.append(info,label('Pino de sinal',pinSelect(`pin-${id}`,pin)));$('#sensorRows').append(row);
  }
  for(const [id,servo] of Object.entries(config.servos)){
    const row=document.createElement('div');row.className='config-row servo-row';row.id=`row-${id}`;
    const title=document.createElement('strong');title.textContent=id;row.append(title,label('Pino de sinal',pinSelect(`pin-${id}`,servo.pin)));
    for(const [key,title] of [['normal','Normal (°)'],['reverse','Reversa (°)']]){
      const input=document.createElement('input');input.type='number';input.id=`${key}-${id}`;input.min=0;input.max=180;input.step=1;input.value=servo[key];input.oninput=()=>{dirty=true;render()};row.append(label(title,input));
    }
    const actions=document.createElement('div');actions.className='servo-buttons';
    for(const [key,title] of [['normal','Testar Normal'],['reverse','Testar Reversa']]){
      const button=document.createElement('button');button.textContent=title;button.dataset.servoTest='1';button.onclick=()=>testServo(id,state.hardware.config.servos[id][key]);actions.append(button);
    }
    row.append(actions);$('#servoRows').append(row);
  }
  document.querySelectorAll('.sensor-node,.turnout').forEach(node=>{
    const id=node.id.startsWith('sensor-')?node.id.slice(7):node.dataset.switch;
    node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',`Configurar ${id}`);
    const select=()=>{document.querySelectorAll('.config-row').forEach(row=>row.classList.remove('flash'));const row=$(`#row-${id}`);row.classList.add('flash');row.scrollIntoView({behavior:'smooth',block:'center'});$('#mapSelection').textContent=`${id} · pino selecionado ${$(`#pin-${id}`).value}`};
    node.onclick=select;node.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select()}};
  });
}
function render(){
  if(!state)return;build();const setup=state.hardware_setup,hardware=state.hardware;
  $('#configEmergency').textContent=state.emergency?'Rearmar emergência':'Parada de emergência';
  $('#modeStatus').textContent=setup.active?'Modo de configuração · locomotivas bloqueadas':'Configuração encerrada';
  $('#hardwareStatus').textContent=hardware.message+(setup.active&&!setup.firmware_active?' · aguardando confirmação do modo de ajuste':'');
  $('#dirtyStatus').textContent=dirty?'Alterações ainda não salvas':'Configuração salva';
  $('#enterSetup').hidden=setup.active;
  const test=setup.test,busy=Boolean(test?.busy),activeSensor=Object.values(state.sensors).some(sensor=>sensor.active);
  $('#servoStatus').textContent=test?`${test.id} · ${test.angle}° · ${test.message}`:'Os testes movimentam somente um servo por vez.';
  const locked=!setup.active||requestBusy;
  document.querySelectorAll('#sensorRows select,#servoRows select,#servoRows input').forEach(el=>el.disabled=locked||busy);
  document.querySelectorAll('[data-servo-test],#minusAngle,#plusAngle,#testAngleButton').forEach(button=>button.disabled=locked||busy||dirty||!hardware.ready||!setup.firmware_active||activeSensor||state.emergency);
  $('#saveHardware').disabled=locked||busy;
  $('#backToCCO').disabled=requestBusy||busy;
  $('#inputMonitor').replaceChildren();
  for(const pin of Object.values(hardware.config.sensors)){
    const entry=hardware.inputs[pin],chip=document.createElement('span');chip.className='input-chip'+(entry?.active?' active':'');chip.textContent=`${pin} · ${entry?(entry.active?'detectou':'livre'):'aguardando'}`;$('#inputMonitor').append(chip);
  }
  $('#lastInput').textContent=hardware.last_input?`Última entrada acionada: ${hardware.last_input.pin} às ${new Date(hardware.last_input.time).toLocaleTimeString('pt-BR')}`:'Nenhuma entrada acionada nesta configuração.';
  for(const id of Object.keys(state.sensors)){
    const pin=$(`#pin-${id}`).value;
    $(`#sensor-${id}`).classList.toggle('active',Boolean(hardware.inputs[pin]?.active));
  }
}
async function api(body){
  requestBusy=true;render();
  try{
    const response=await fetch('/api/hardware',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível configurar');
    state=result.state;return result;
  }finally{requestBusy=false;render()}
}
async function enter(){try{await api({action:'START'});message('Passe um objeto diante de um sensor para identificar a entrada.')}catch(error){message(error.message)}}
$('#enterSetup').onclick=enter;
$('#saveHardware').onclick=async()=>{
  const config={sensors:{},servos:{}};
  for(const id of Object.keys(state.hardware.config.sensors))config.sensors[id]=$(`#pin-${id}`).value;
  for(const id of Object.keys(state.hardware.config.servos))config.servos[id]={pin:$(`#pin-${id}`).value,normal:Number($(`#normal-${id}`).value),reverse:Number($(`#reverse-${id}`).value)};
  if([...document.querySelectorAll('#servoRows input')].some(input=>input.value.trim()==='')){message('Preencha os dois ângulos de cada servo.');return}
  try{await api({action:'SAVE',config});dirty=false;message('Ligações salvas. Aguarde a confirmação do Arduino antes de testar.');render()}catch(error){message(error.message)}
};
async function testServo(id,angle){
  if(dirty){message('Salve as ligações e os ângulos antes de testar.');return}
  $('#testServo').value=id;$('#testAngle').value=angle;
  try{await api({action:'TEST',id,angle});message('Teste solicitado. Observe somente a chave selecionada.')}catch(error){message(error.message)}
}
$('#testAngleButton').onclick=()=>testServo($('#testServo').value,Number($('#testAngle').value));
$('#minusAngle').onclick=()=>testServo($('#testServo').value,Math.max(0,Number($('#testAngle').value)-5));
$('#plusAngle').onclick=()=>testServo($('#testServo').value,Math.min(180,Number($('#testAngle').value)+5));
$('#backToCCO').onclick=async()=>{
  if(dirty&&!confirm('As alterações não salvas serão descartadas. Voltar ao CCO?'))return;
  try{if(state.hardware_setup.active)await api({action:'END'});location.href='/'}catch(error){message(error.message)}
};
(async()=>{
  try{
    const response=await fetch('/api/state');if(!response.ok)throw new Error('Servidor indisponível');state=await response.json();render();
    const events=new EventSource('/api/events');events.onmessage=event=>{state=JSON.parse(event.data);render()};events.onerror=()=>message('Reconectando ao serviço local…');
    if(!state.hardware_setup.active)await enter();
  }catch(error){message(error.message)}
})();

$('#configEmergency').onclick=async()=>{
  if(!state)return;
  try{const response=await fetch('/api/emergency',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!state.emergency})});const result=await response.json();if(!response.ok)throw new Error(result.error);state=result.state;render();message(state.emergency?'Emergência acionada. Testes bloqueados.':'Emergência rearmada.')}catch(error){message(error.message)}
};
