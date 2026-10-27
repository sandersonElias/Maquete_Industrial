const sensorCoordinates={S01:[330,330],S02:[260,330],S03:[305,85],S04:[420,85],S05:[430,135],S06:[570,330],S07:[570,380]};
let state=null,selectedLoco='L01';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

const REFRESH_MS=250;
let renderTimer=null,lastRendered=0;

async function api(path,body={}){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Falha no comando');if(result.state){state=result.state;scheduleRender(true)}return result}
function notice(message,type='ok'){const el=$('#systemMessage');el.textContent=message;el.style.color=type==='error'?'var(--red)':type==='warning'?'var(--yellow)':'var(--green)'}
function bars(percent){const value=Number(percent??0),on=Math.max(0,Math.min(4,Math.ceil(value/25))),tone=value<=15?'critical':value<=40?'low':'';return `<span class="battery ${tone}" aria-label="Bateria ${value}%">${[0,1,2,3].map(i=>`<i class="${i<on?'on':''}"></i>`).join('')}</span>`}
function formatState(value){return String(value||'--').replaceAll('_',' ')}
function scheduleRender(immediate=false){if(immediate){if(renderTimer){clearTimeout(renderTimer);renderTimer=null}render();return}if(renderTimer)return;const wait=Math.max(0,REFRESH_MS-(performance.now()-lastRendered));renderTimer=setTimeout(()=>{renderTimer=null;render()},wait)}

function render(){if(!state)return;lastRendered=performance.now();$('#operatorName').textContent=state.operator?`Operador: ${state.operator}`:'Operador não identificado';$('#arduinoHealth').textContent=state.arduino.connected?`Arduino ${state.arduino.port||'online'}`:'Arduino offline';$('#arduinoHealth').classList.toggle('bad',!state.arduino.connected);$('#systemMode').textContent=state.mode;$('#emergency').classList.toggle('active',state.emergency);$('#emergency').textContent=state.emergency?'REARMAR EMERGÊNCIA':'PARADA DE EMERGÊNCIA';$('#startSession').textContent=state.session.active?'Encerrar turno':'Iniciar turno';
  renderLocomotives();renderControls();renderSwitches();renderSensors();renderSignals();renderEvents();renderMapLocomotives();
}

function renderLocomotives(){
  const list=$('#locomotiveList');const ids=Object.keys(state.locomotives);
  if(ids.length&&!state.locomotives[selectedLoco])selectedLoco=ids[0];
  for(const id of ids){
    let card=document.getElementById(`loco-card-${id}`);
    if(!card){
      card=document.createElement('button');card.id=`loco-card-${id}`;card.className='loco-card';
      card.innerHTML='<strong class="loco-id"></strong><span><strong class="loco-state"></strong><small class="loco-meta"></small></span><span><span class="loco-bars"></span><small class="loco-pct"></small></span>';
      card.querySelector('.loco-id').textContent=id;
      card.onclick=()=>{selectedLoco=id;render()};
      list.append(card);
    }
    const loco=state.locomotives[id];
    card.classList.toggle('selected',id===selectedLoco);
    card.querySelector('.loco-state').textContent=formatState(loco.operational_state);
    card.querySelector('.loco-meta').textContent=`${loco.connected?'Wi-Fi '+(loco.rssi??'')+' dBm':'OFFLINE'} · ${loco.confidence}${loco.last_seen?' · '+new Date(loco.last_seen).toLocaleTimeString('pt-BR'):''}`;
    card.querySelector('.loco-bars').innerHTML=bars(loco.battery_pct);
    card.querySelector('.loco-pct').textContent=`${loco.battery_pct??'?'}%`;
  }
}

function renderControls(){
  const loco=state.locomotives[selectedLoco];if(!loco)return;
  $('#selectedTitle').textContent=`Comandos ${selectedLoco}`;
  if($('#routeSelect').value!==loco.route)$('#routeSelect').value=loco.route;
  if($('#prioritySelect').value!==loco.priority)$('#prioritySelect').value=loco.priority;
  if(loco.last_sensor&&$('#positionSelect').value!==loco.last_sensor)$('#positionSelect').value=loco.last_sensor;
  $('#positionHint').textContent=loco.last_sensor?`Confirmada em ${loco.last_sensor} · próxima leitura ${loco.next_sensor}`:'Confirme a posição antes de movimentar';
  $('#confirmPosition').disabled=loco.motion!=='STOP';
  $$('[data-action]').forEach(button=>button.disabled=state.emergency&&button.dataset.action!=='STOP');
}

function renderSwitches(){
  const root=$('#switchControls');
  for(const [id,position] of Object.entries(state.switches)){
    let row=document.getElementById(`switch-${id}`);
    if(!row){
      row=document.createElement('div');row.id=`switch-${id}`;row.className='switch-row';
      row.innerHTML='<span></span><button data-pos="NORMAL">Normal</button><button data-pos="REVERSA">Reversa</button><strong></strong>';
      row.querySelector('span').textContent=id;
      row.querySelectorAll('button').forEach(button=>button.onclick=()=>run(()=>api(`/api/switches/${id}`,{position:button.dataset.pos}),`${id} comandada`));
      root.append(row);
    }
    row.querySelector('strong').textContent=position;
    row.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.pos===position));
  }
}

function renderSensors(){
  const summary=$('#sensorSummary'),details=$('#sensorDiagnostics');
  for(const [id,sensor] of Object.entries(state.sensors)){
    let chip=document.getElementById(`chip-${id}`);
    if(!chip){chip=document.createElement('span');chip.id=`chip-${id}`;chip.className='sensor-chip';chip.textContent=id;summary.append(chip)}
    chip.className=`sensor-chip ${sensor.health==='FALHA'?'failed':sensor.health==='SUSPEITO'?'suspect':''}`;
    let row=document.getElementById(`diag-${id}`);
    if(!row){row=document.createElement('div');row.id=`diag-${id}`;row.className='diag-row';row.innerHTML='<strong></strong><span class="diag-health"></span><span class="diag-miss"></span>';row.querySelector('strong').textContent=id;details.append(row)}
    row.querySelector('.diag-health').textContent=`${sensor.health} · ${sensor.hits} leituras`;
    row.querySelector('.diag-miss').textContent=`${sensor.misses} falhas`;
    const node=document.getElementById(`sensor-${id}`);
    if(node){node.classList.toggle('active',sensor.active);node.classList.toggle('suspect',sensor.health==='SUSPEITO');node.classList.toggle('failed',sensor.health==='FALHA')}
  }
}

function renderSignals(){
  const root=$('#signalControls');
  if(!root.dataset.built){
    root.dataset.built='1';
    const row=document.createElement('div');row.className='signal-row';
    row.innerHTML='<span>INTERNO + EXTERNO</span><button data-color="RED">Vermelho</button><button data-color="YELLOW">Amarelo</button><button data-color="GREEN">Verde</button>';
    row.querySelectorAll('button').forEach(button=>button.onclick=()=>run(()=>api('/api/signals/F1_EXTERNO',{color:button.dataset.color}),'Semáforos atualizados'));
    root.append(row);
  }
  const color=state.signals.F1_EXTERNO||'RED';
  ['F1_EXTERNO','F2_INTERNO'].forEach(id=>{const node=document.getElementById(`signal-${id}`);if(node)node.querySelectorAll('circle').forEach(lamp=>lamp.classList.toggle('on',lamp.dataset.color===color))});
}

let eventsSignature='';
function renderEvents(){
  const events=state.events||[];
  $('#eventCount').textContent=`${events.length} registros`;
  const signature=events.map(event=>`${event.time}|${event.category}|${event.message}`).join('~');
  if(signature===eventsSignature)return;
  eventsSignature=signature;
  $('#events').innerHTML=events.map(event=>{const time=new Date(event.time).toLocaleTimeString('pt-BR');return `<li><time>${time}</time><code>${event.category}</code><span class="${event.severity.toLowerCase()}">${event.locomotive?event.locomotive+' · ':''}${event.message}</span></li>`}).join('');
}

const pathMetrics=new Map();
function pathInfo(path){let info=pathMetrics.get(path.id);if(!info){info={total:path.getTotalLength(),lengths:new Map()};pathMetrics.set(path.id,info)}return info}
function routePath(route){if(route.startsWith('ELEVADO'))return $('#path-ELEVADO');if(route==='OFICINA')return $('#path-OFICINA');return $('#path-PLANO')}
function closestLength(path,coord){const info=pathInfo(path),key=coord.join(',');if(info.lengths.has(key))return info.lengths.get(key);let best=0,bestDistance=Infinity;for(let i=0;i<=300;i++){const length=info.total*i/300,p=path.getPointAtLength(length),distance=(p.x-coord[0])**2+(p.y-coord[1])**2;if(distance<bestDistance){bestDistance=distance;best=length}}info.lengths.set(key,best);return best}
function pointForLoco(loco,index){const path=routePath(loco.route),total=pathInfo(path).total,fallback=[260+index*28,85];if(!loco.last_sensor&&!loco.next_sensor)return fallback;const start=sensorCoordinates[loco.last_sensor]||sensorCoordinates[loco.next_sensor]||fallback,end=sensorCoordinates[loco.next_sensor]||start;let a=closestLength(path,start),b=closestLength(path,end),progress=loco.progress||0,reverse=loco.route.endsWith('_RE');if(reverse){if(b>a)b-=total;return path.getPointAtLength((a+(b-a)*progress+total)%total)}if(b<a)b+=total;return path.getPointAtLength((a+(b-a)*progress)%total)}

function renderMapLocomotives(){Object.entries(state.locomotives).forEach(([id,loco],index)=>{const marker=document.getElementById(`map-${id}`);if(!marker)return;const point=pointForLoco(loco,index);marker.setAttribute('transform',`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);marker.classList.toggle('estimated',loco.confidence==='ESTIMADA');marker.classList.toggle('uncertain',loco.confidence==='INCERTA');marker.style.display=loco.operational_state==='FORA_DA_MALHA'||loco.confidence==='DESCONHECIDA'?'none':''})}

async function run(action,success){const el=document.activeElement&&document.activeElement.tagName==='BUTTON'?document.activeElement:null;if(el)el.classList.add('busy');notice('Processando...','warning');try{await action();notice(success)}catch(error){notice(error.message,'error')}finally{if(el)el.classList.remove('busy')}}

$$('[data-action]').forEach(button=>button.onclick=()=>run(()=>api(`/api/locomotives/${selectedLoco}/command`,{action:button.dataset.action}),`${selectedLoco}: comando enviado`));
$('#routeSelect').onchange=event=>run(()=>api(`/api/locomotives/${selectedLoco}/route`,{route:event.target.value}),`Rota ${event.target.value} preparada`);
$('#prioritySelect').onchange=event=>run(()=>api(`/api/locomotives/${selectedLoco}/priority`,{priority:event.target.value}),`Prioridade de ${selectedLoco} atualizada`);
$('#confirmPosition').onclick=()=>run(()=>api(`/api/locomotives/${selectedLoco}/position`,{sensor:$('#positionSelect').value}),`${selectedLoco}: posição confirmada`);
$('#batterySwap').onclick=()=>run(()=>api(`/api/locomotives/${selectedLoco}/maintenance`,{action:'BATTERY_SWAP'}),`${selectedLoco}: troca de bateria registrada`);
$('#correctiveStop').onclick=()=>run(()=>api(`/api/locomotives/${selectedLoco}/maintenance`,{action:'CORRECTIVE_STOP'}),`${selectedLoco}: parada corretiva registrada`);
$('#emergency').onclick=()=>{if(!state){notice('Aguardando o serviço local...','warning');return}run(()=>api('/api/emergency',{active:!state.emergency}),state.emergency?'Sistema rearmado':'Emergência acionada')};
$('#changeOperator').onclick=()=>{$('#operatorInput').value=state?.operator||'';$('#operatorDialog').showModal()};
$('#saveOperator').onclick=event=>{event.preventDefault();run(async()=>{await api('/api/operator',{name:$('#operatorInput').value});$('#operatorDialog').close()},'Operador identificado')};
$('#startSession').onclick=()=>{if(!state){notice('Aguardando o serviço local...','warning');return}if(!state.operator){$('#operatorDialog').showModal();return}run(()=>api(state.session.active?'/api/session/end':'/api/session/start'),state.session.active?'Turno encerrado':'Turno iniciado')};

function connect(){const events=new EventSource('/api/events');events.onmessage=event=>{state=JSON.parse(event.data);scheduleRender()};events.onerror=()=>notice('Reconectando ao serviço local...','warning')}
function updateClock(){const now=new Date();$('#clock').textContent=now.toLocaleTimeString('pt-BR');$('#date').textContent=now.toLocaleDateString('pt-BR')}setInterval(updateClock,1000);updateClock();connect();
