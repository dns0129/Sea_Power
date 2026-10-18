import {missionControlled} from './unit-orders.js?v=0.12.0';
// Deterministic arena commander. Decisions use friendly state, public terrain and usable contacts.
import {getBattleTheatre,factionName} from './battle-theatres.js?v=0.12.0';
export const AI_DOCTRINES={
  balanced:{name:'均衡协同',description:'兼顾搜索、支援和适中距离交战。',standoff:.72,speed:.65},
  aggressive:{name:'积极进攻',description:'更快接敌，接近后再集中火力。',standoff:.60,speed:.85},
  cautious:{name:'谨慎防御',description:'优先支援与较远距离交战，保留较多防空弹。',standoff:.86,speed:.5},
};
export const AUTO_PRESETS=[
  {id:'surface',name:'美中海空编队',description:'250 公里起始：伯克级对 055／052DL，配备本国制空、反舰、电子战、预警与加油机。'},
  {id:'carrier',name:'美中航母航空',description:'250 公里起始：福特级对福建舰，包含各自舰载航空队、护航舰、加油机与补给舰。'},
  {id:'asw',name:'美中反潜搜索',description:'250 公里起始：弗吉尼亚级对 093 型，搭配本国反潜舰、巡逻机与反潜直升机。'},
  {id:'empty',name:'美中空白部署',description:'双方各 600 点，在各自前沿线后方选择本国舰机与通用岸基设施，保持至少 250 公里起始距离。'},
];
// [type, distance behind the side's leading station, lateral offset, optional loadout].
// The leading pair uses the theatre's separation; every other station is behind it.
const FORCES={
  surface:{
    blue:[['ddg_burke3',0,0],['ddg_burke2a',8,16],['f22a',6,-22],['fa18e',9,27,'naval'],['ea18g',18,32,'sead'],['e7',28,-30],['kc46a',38,-13],['p8a',16,43]],
    red:[['ddg055',0,0],['ddg052dl',8,16],['j20',6,-22],['j16',9,27,'naval'],['j16d',18,32,'sead'],['kj500',28,-30],['yy20',38,-13],['kq200',16,43]],
  },
  carrier:{
    blue:[['ddg_burke3',0,0],['cvn_ford',16,0],['ddg_burke2a',8,20],['aor_supply',28,12],['kc46a',38,-22],['fa18e',8,30,'naval']],
    red:[['ddg055',0,0],['cv_fujian',16,0],['ddg052dl',8,20],['aor901',28,12],['yy20',38,-22],['j16',8,30,'naval']],
  },
  asw:{
    blue:[['ddg_burke2a',0,0],['ssn_virginia',8,12],['p8a',6,-20,'asw'],['mh60r',10,28,'asw']],
    red:[['ffg054b',0,0],['ssn093',8,12],['kq200',6,-20,'asw'],['z20f',10,28,'asw']],
  },
  empty:{blue:[],red:[]},
};
const clone=value=>JSON.parse(JSON.stringify(value));
const blankStats=()=>({shots:0,damageDealt:0,damagePoints:0,interceptions:0,sorties:0,spent:{}});
export function automationSettings(preset='surface'){return {enabled:true,preset,blueDoctrine:'balanced',redDoctrine:'balanced',timeLimit:3600,seed:712301,started:false,startedAt:0,tickRemainder:0,finishedAt:null,winner:null,reason:'',deployment:null,stats:{blue:blankStats(),red:blankStats()},timeline:[]};}
export function populateAutoPreset(s,preset,api){
  if(!Object.hasOwn(FORCES,preset))preset='surface';s.automation=automationSettings(preset);
  const theatre=getBattleTheatre(s);s.automation.timeLimit=7200;
  for(const side of ['blue','red'])for(const [type,behind,lateral,loadout] of FORCES[preset][side]){
    const anchor=theatre.anchors[side],u=api.spawn(s,type,side,anchor.x+(side==='blue'?-behind:behind),anchor.y+lateral);
    const row=api.types[type].loadouts?.find(l=>l.id===loadout);if(row){u.loadout=row.id;for(const key of Object.keys(u.weapons))u.weapons[key]=row.weapons[key]||0;}
  }
}
export function configureAutomation(s,options={}){
  if(!options||typeof options!=='object'||Array.isArray(options))return {ok:false,error:'AI 设置无效'};
  const old=s.automation||automationSettings('custom'),next={...old};
  for(const key of ['blueDoctrine','redDoctrine'])if(options[key]!==undefined){if(!Object.hasOwn(AI_DOCTRINES,options[key]))return {ok:false,error:'请选择有效 AI 作战风格'};next[key]=options[key];}
  if(options.timeLimit!==undefined){if(!Number.isInteger(options.timeLimit)||options.timeLimit<300||options.timeLimit>14400)return {ok:false,error:'对战时限应为 5–240 分钟'};next.timeLimit=options.timeLimit;}
  if(options.seed!==undefined){if(!Number.isInteger(options.seed)||options.seed<0||options.seed>4294967295)return {ok:false,error:'随机种子应为 0–4294967295 的整数'};next.seed=options.seed;}
  s.automation=next;return {ok:true};
}
const event=(s,side,message)=>{const a=s.automation;if(!a?.started)return;a.timeline.push({time:s.time-a.startedAt,side,message});if(a.timeline.length>400)a.timeline.shift();};
function order(s,u,text,api){if(!u.ai)u.ai={anchor:{x:u.x,y:u.y},order:'',searchIndex:0,goal:null,goalTime:0,dipUntil:0,nextDip:0};if(u.ai.order!==text){u.ai.order=text;event(s,u.side,`${u.name}：${text}`);api.log(s,`${u.name} · AI ${text}`,'info');}}
export function hasCombatPlatform(s,side,api){return s.units.some(u=>u.side===side&&u.hp>0&&!u.exited&&!api.types[u.type].support&&(Object.entries(api.types[u.type].weapons).some(([key,n])=>n>0&&api.weapons[key].targets.some(d=>d!=='missile'))||Object.keys(api.types[u.type].deck?.wing||{}).length));}
export function beginAutomation(s,deployment,api){
  const a=s.automation;a.started=true;a.startedAt=s.time;a.tickRemainder=0;a.finishedAt=null;a.reason='';a.winner=null;a.deployment=deployment;a.stats={blue:blankStats(),red:blankStats()};a.timeline=[];s.seed=a.seed;
  for(const u of s.units){u.ai={anchor:{x:u.x,y:u.y},order:'',searchIndex:0,goal:null,goalTime:0,dipUntil:0,nextDip:0};u.leader=null;u.offset=null;if(api.types[u.type].domain==='air'&&api.airborne(u))a.stats[u.side].sorties++;}
  event(s,'both','双方 AI 已接管；仅依照本方有效航迹决策。');commandAutomation(s,api);api.scan(s);
}
function prepare(s,u,api){const t=api.types[u.type];u.autoEngage=true;u.autoDefense=true;u.datalink=true;u.sonar=t.sonar>0;u.esm=t.esm>0;u.jamming=t.jammer>0&&api.airborne(u);u.radar=t.radar>0&&t.domain!=='sub';
  if(t.domain==='sub'){
    const ownSurface=Object.values(s.contacts[u.side]).some(c=>s.time-c.time<=6&&c.domain==='surface'&&c.observations?.[u.id]?.source==='声呐');
    const cycle=(s.time+Number(u.id.slice(1))*19)%180;
    if(cycle<24||ownSurface&&(u.weapons.asm||u.weapons.supersonic))u.ai.dipUntil=Math.max(u.ai.dipUntil,s.time+16);
    u.depth=s.time<u.ai.dipUntil?'periscope':'deep';u.radar=false;
  }
  const reserve=t.weapons.sam*(AI_DOCTRINES[s.automation[u.side+'Doctrine']].standoff>.8?.35:.15);u.samReserve=Math.min(u.weapons.sam,Math.floor(reserve));
}
function knownContacts(s,u,api){return api.visibleContacts(s,u.side).filter(c=>!c.stale&&api.usableContact(s,u,c));}
function inWorld(s,p,api){const w=api.world(s);return {x:Math.max(1,Math.min(w.width-1,p.x)),y:Math.max(1,Math.min(w.height-1,p.y))};}
function seaGoal(s,from,point,api){const p=inWorld(s,point,api);if(!api.inLand(p,s))return p;const candidates=[];for(const r of [2,5,10,18,30])for(let n=0;n<16;n++){const q=inWorld(s,{x:p.x+Math.cos(n*Math.PI/8)*r,y:p.y+Math.sin(n*Math.PI/8)*r},api);if(!api.inLand(q,s))candidates.push(q);}return candidates.sort((a,b)=>api.distance(from,a)-api.distance(from,b))[0]||{x:from.x,y:from.y};}
// Sparse visibility graph is enough for the arena's public polygon coastlines.
function arenaRoute(s,u,goal,api){
  if(api.clearPath(u,goal,s))return [{...goal}];const nodes=[{x:u.x,y:u.y},{...goal}];
  for(const poly of api.land(s)){const center={x:poly.reduce((n,p)=>n+p[0],0)/poly.length,y:poly.reduce((n,p)=>n+p[1],0)/poly.length};for(const p of poly){const d=Math.hypot(p[0]-center.x,p[1]-center.y)||1,q=inWorld(s,{x:p[0]+(p[0]-center.x)/d*1.5,y:p[1]+(p[1]-center.y)/d*1.5},api);if(!api.inLand(q,s))nodes.push(q);}}
  const costs=nodes.map(()=>Infinity),prev=[],done=new Set();costs[0]=0;
  while(done.size<nodes.length){let current=-1;for(let n=0;n<nodes.length;n++)if(!done.has(n)&&(current<0||costs[n]<costs[current]))current=n;if(current<0||!Number.isFinite(costs[current]))break;if(current===1){const result=[];for(let n=1;n!==0;n=prev[n])result.unshift(nodes[n]);if(result.length<=16)return result;break;}done.add(current);
    for(let n=0;n<nodes.length;n++){if(done.has(n))continue;const cost=costs[current]+api.distance(nodes[current],nodes[n]);if(cost<costs[n]&&api.clearPath(nodes[current],nodes[n],s)){costs[n]=cost;prev[n]=current;}}
  }
  const fallback=api.route(s,u,goal);return fallback&&fallback.length<=16?fallback:null;
}
function navigate(s,u,point,speed,text,api){
  const t=api.types[u.type],air=t.domain==='air',goal=air?inWorld(s,point,api):seaGoal(s,u,point,api);order(s,u,text,api);u.speed=Math.min(api.maxSpeed(u),Math.max(air&&!t.rotary?t.speed*.4:0,speed));
  if(api.distance(u,goal)<1){u.route=[];if(!air||t.rotary)u.speed=0;return;}
  if(u.ai.goal&&api.distance(u.ai.goal,goal)<4&&u.route.length&&s.time-u.ai.goalTime<60)return;
  const route=air?[goal]:arenaRoute(s,u,goal,api);u.ai.goal={...goal};u.ai.goalTime=s.time;if(route)u.route=route;else{u.route=[];order(s,u,'航路受阻，等待重新规划',api);}
}
function searchPoint(s,u,api){
  const w=api.world(s),deepSearch=getBattleTheatre(s)&&api.types[u.type].domain==='air'&&api.types[u.type].sonar>0;
  // Public search sectors, mirrored by side; no enemy coordinates are used.
  const forward=u.side==='blue'?.80:.20,points=deepSearch?[[.5,.53],[forward,.54],[forward,.38],[.5,.65]]:[[.5,.53],[.64,.58],[.38,.66],[.65,.32],[.36,.40]],p=points[u.ai.searchIndex%points.length],goal={x:w.width*p[0],y:w.height*p[1]};
  if(api.distance(u,goal)<4){u.ai.searchIndex++;const next=points[u.ai.searchIndex%points.length];return {x:w.width*next[0],y:w.height*next[1]};}return goal;
}
function ownAnchor(s,u,api){const own=s.units.filter(v=>v.side===u.side&&v.hp>0&&!v.exited&&api.types[v.type].domain==='surface'&&!api.types[v.type].support&&!api.types[v.type].deck);if(!own.length)return u.ai.anchor;return {x:own.reduce((n,v)=>n+v.x,0)/own.length,y:own.reduce((n,v)=>n+v.y,0)/own.length};}
function behind(s,u,anchor,nm,api){const w=api.world(s),dx=anchor.x-w.width/2,dy=anchor.y-w.height/2,d=Math.hypot(dx,dy)||1;return inWorld(s,{x:anchor.x+dx/d*nm,y:anchor.y+dy/d*nm},api);}
function selectLoadout(s,type,contacts,own,api){const t=api.types[type],hasCAP=own.some(v=>v.hp>0&&api.airborne(v)&&['fighter','navalAir'].includes(api.types[v.type].category)&&v.weapons.aam>0&&v.loadout!=='naval');
  const preferred=t.role==='sead'?'sead':t.sonar&&contacts.some(c=>c.domain==='sub')?'asw':hasCAP&&contacts.some(c=>c.domain==='surface')?'naval':contacts.some(c=>c.domain==='land')&&!t.weapons.aam?'strike':null;
  return t.loadouts?.find(l=>l.id===preferred)||t.loadouts?.[0];
}
function deckOperations(s,u,contacts,own,api){const t=api.types[u.type];if(!t.deck)return;
  const priority=key=>['awacs','heloAwacs'].includes(api.types[key].role)?-4:api.types[key].role==='sead'?-3:api.types[key].sonar&&contacts.some(c=>c.domain==='sub')?-2:0;
  for(const key of Object.keys(u.airwing).filter(k=>u.airwing[k]>0).sort((a,b)=>priority(a)-priority(b))){const row=u.wingLoadouts[key]||selectLoadout(s,key,contacts,own,api),r=api.launchDeck(s,u.id,key,row);if(r.ok){const air=r.unit;air.ai={anchor:{...u.ai.anchor},order:'',searchIndex:0,goal:null,goalTime:0,dipUntil:0,nextDip:0};prepare(s,air,api);order(s,air,'起飞，加入编队任务',api);}break;}
}
function engagementWeapons(s,u,c,api){
  const t=api.types[u.type];return Object.keys(api.weapons).filter(key=>u.weapons[key]>0&&api.weapons[key].targets.includes(c.domain)&&!(key==='sam'&&u.weapons.sam<=u.samReserve)&&!(t.domain==='sub'&&u.depth==='deep'&&['asm','supersonic','cruise'].includes(key)));
}
function engagementRange(s,u,c,key,api){
  const w=api.weaponStats(u,key);if(w.guidance!=='semi')return w.range;
  const local=c.observations?.[u.id],illuminating=local?.source==='雷达'&&s.time-local.time<=6;
  // A shared track cannot guarantee local illumination; keep closing until it is acquired.
  return Math.min(w.range,api.sensorRange(s,u,c.domain,c.altitude||'medium')*.9,illuminating?Infinity:api.distance(u,c)*.75);
}
function missionAmmoEmpty(u,t,api){const row=api.getLoadout(u),mission=row?.mission||u.loadout,keys=api.missionWeaponKeys(mission)||Object.keys(row?.weapons||t.weapons).filter(k=>(row?.weapons||t.weapons)[k]>0);return keys.length>0&&keys.every(k=>!u.weapons[k]);}
export function commandAutomation(s,api){
  if(!s.automation?.started||s.phase!=='running')return;
  for(const u of [...s.units]){
    if(!missionControlled(u))continue;
    if(u.hp<=0||u.exited)continue;const t=api.types[u.type],air=t.domain==='air';if(!u.ai)order(s,u,'接收任务',api);prepare(s,u,api);
    const own=s.units.filter(v=>v.side===u.side&&v.hp>0&&!v.exited),contacts=knownContacts(s,u,api),doctrine=AI_DOCTRINES[s.automation[u.side+'Doctrine']];
    if(air&&u.flightState==='servicing'){
      const row=u.loadout==='custom'?api.getLoadout(u):api.unitById(s,u.originDeck)?.wingLoadouts[u.type]||selectLoadout(s,u.type,contacts,own,api);if(row&&row.id!==u.loadout){u.loadout=row.id;u.customLoadout=row.id==='custom'?clone(row):null;for(const key of Object.keys(u.weapons))u.weapons[key]=Math.min(u.weapons[key],row.weapons[key]||0);}order(s,u,'整备，准备下一架次',api);continue;
    }
    if(air&&!api.airborne(u)){order(s,u,'停飞，补给不可用',api);continue;}
    if(u.flightState==='returning'){order(s,u,'返航加油装弹',api);continue;}
    if(u.refuelTarget){order(s,u,'会合空中加油',api);continue;}
    if(u.supplyTarget){order(s,u,'转移航空补给',api);continue;}
    if(air&&!t.support&&missionAmmoEmpty(u,t,api)){api.returnToBase(s,u.id);order(s,u,'任务弹药耗尽，返航整备',api);continue;}
    if(air&&t.refuelSystem&&u.fuel<t.endurance*30){const donor=own.filter(v=>api.types[v.type].tanker&&api.airborne(v)&&v.flightState==='airborne'&&api.types[v.type].refuelSystems.includes(t.refuelSystem)&&v.fuelSupply>0&&api.distance(u,v)<60).sort((a,b)=>api.distance(u,a)-api.distance(u,b))[0];if(donor&&api.requestRefuel(s,u.id,donor.id).ok){order(s,u,'前往兼容加油机会合',api);continue;}}
    deckOperations(s,u,contacts,own,api);
    if(t.domain==='land'){order(s,u,'阵地警戒与自动交战',api);continue;}
    if(own.some(v=>v.supplyTarget===u.id)){u.speed=0;u.route=[];order(s,u,'低速接收航空补给',api);continue;}
    if(t.supplyShip){
      const base=own.filter(v=>api.types[v.type].deck&&v.supply<api.types[v.type].baseSupply*.7).sort((a,b)=>api.distance(u,a)-api.distance(u,b))[0];
      if(base&&u.supply>0){if(api.distance(u,base)<1.4){u.speed=base.speed=0;u.route=base.route=[];api.requestSupply(s,u.id,base.id);order(s,u,'低速会合补充航空库存',api);}else navigate(s,u,base,Math.min(t.speed,16),'跟随待补给航空舰',api);continue;}
    }
    if(t.support||t.deck&&['carrier','amphibious'].includes(t.category)){
      const anchor=ownAnchor(s,u,api),offset=t.tanker?30:t.supplyShip?15:air?18:14;let goal=behind(s,u,anchor,offset,api);
      const threat=contacts.filter(c=>['air','surface'].includes(c.domain)&&api.distance(u,c)<(air?55:20)).sort((a,b)=>api.distance(u,a)-api.distance(u,b))[0];
      if(threat){const d=api.distance(u,threat)||1;goal=inWorld(s,{x:u.x+(u.x-threat.x)/d*18,y:u.y+(u.y-threat.y)/d*18},api);}
      if(air)u.altitude=t.rotary?'medium':'high';navigate(s,u,goal,air?t.speed*.55:Math.min(12,t.speed*.5),threat?'规避已发现威胁':'后方支援与编队协同',api);continue;
    }
    if(air&&t.sonar){u.altitude='low';if(t.sonarMode==='dipping'||t.rotary){if(s.time>=u.ai.nextDip){u.ai.dipUntil=s.time+48;u.ai.nextDip=s.time+138;}if(s.time<u.ai.dipUntil&&!contacts.some(c=>c.domain==='sub'&&c.quality==='track')){u.speed=0;u.route=[];order(s,u,'低空悬停，吊放声呐搜索',api);continue;}}}
    const candidates=contacts.filter(c=>c.quality==='track'&&engagementWeapons(s,u,c,api).length);
    candidates.sort((a,b)=>((air&&!t.sonar&&u.weapons.aam>0?a.domain==='air':a.domain==='sub')?0:1)-((air&&!t.sonar&&u.weapons.aam>0?b.domain==='air':b.domain==='sub')?0:1)||api.distance(u,a)-api.distance(u,b));
    const passive=!candidates.length&&u.weapons.arm&&u.esm&&api.radioAvailable(u)?api.visibleContacts(s,u.side).find(c=>!c.stale&&c.emitting&&['surface','land'].includes(c.domain)):null,target=candidates[0]||passive;
    if(target){
      const keys=engagementWeapons(s,u,target,api),ranges=keys.map(k=>engagementRange(s,u,target,k,api)),range=Math.max(...ranges,1),longest=keys[ranges.indexOf(Math.max(...ranges))],desired=Math.max(1,(longest?api.weaponStats(u,longest).minRange:0)*1.3,range*doctrine.standoff),d=api.distance(u,target)||1;
      const goal={x:target.x+(u.x-target.x)/d*desired,y:target.y+(u.y-target.y)/d*desired};
      const speed=t.domain==='sub'?8:air?t.rotary?target.domain==='sub'?35:Math.min(100,t.speed):t.speed*.75:t.sonar>=30?10:t.speed*doctrine.speed;
      navigate(s,u,goal,speed,`${target.domain==='sub'?'反潜':target.domain==='air'?'拦截':'接敌'} · ${target.label||'已发现目标'}`,api);
    }else{
      const speed=t.domain==='sub'?7:air?t.rotary?80:t.speed*.65:t.sonar>=30?10:t.speed*doctrine.speed;
      navigate(s,u,searchPoint(s,u,api),speed,t.domain==='sub'?'低速声呐搜索':air&&t.sonar?'转场反潜搜索':'按公共海区搜索',api);
    }
  }
}
export function recordAutoShot(s,u,key){if(!s.automation?.started)return;const stat=s.automation.stats[u.side];stat.shots++;stat.spent[key]=(stat.spent[key]||0)+1;}
export function recordAutoSortie(s,u){if(!s.automation?.started)return;s.automation.stats[u.side].sorties++;event(s,u.side,`${u.name} 出动`);}
export function recordAutoIntercept(s,side){if(!s.automation?.started)return;s.automation.stats[side].interceptions++;}
export function recordAutoDamage(s,target,shooter,amount,api){if(!s.automation?.started||!shooter)return;const stat=s.automation.stats[shooter.side],t=api.types[target.type];stat.damageDealt+=amount;stat.damagePoints+=amount/t.hp*t.cost;event(s,shooter.side,`${shooter.name} 命中${target.name}，有效毁伤 ${Math.round(amount)}`);}
function canStillAttack(s,side,api){return s.units.some(u=>{
  const t=api.types[u.type];if(u.side!==side||u.hp<=0||u.exited)return false;
  if(t.deck&&u.hp>=t.hp*.4&&Object.entries(u.airwing||{}).some(([k,n])=>n>0&&!api.types[k].support))return true;
  if(t.domain==='air'&&!api.airborne(u)&&u.flightState!=='servicing')return false;
  if(Object.entries(u.weapons).some(([k,n])=>n>0&&!(k==='sam'&&n<=u.samReserve)&&api.weapons[k].targets.some(d=>d!=='missile')))return true;
  if(t.domain==='air'&&u.flightState!=='grounded'&&t.endurance>0&&u.fuel>0&&!t.support){const base=u.home?.baseId?api.unitById(s,u.home.baseId):null;return base?base.hp>0&&base.supply>=Math.max(2,Math.ceil(t.cost/4)):u.sorties<2;}
  return false;
});}
export function finishAutomation(s,reason,api,winner=null){const a=s.automation;if(!a?.started||s.phase==='ended')return;
  if(!winner){const delta=a.stats.blue.damagePoints-a.stats.red.damagePoints;winner=Math.abs(delta)<.5?'draw':delta>0?'blue':'red';}
  a.winner=winner;a.reason=reason;a.finishedAt=s.time;s.phase='ended';s.paused=true;s.result=winner==='blue'?'victory':winner==='red'?'defeat':'draw';event(s,'both',`${winner==='draw'?'双方平局':factionName(s,winner)+'获胜'}：${reason}`);api.log(s,a.timeline.at(-1).message,'combat');
}
export function updateAutoOutcome(s,api){if(!s.automation?.started||s.phase!=='running')return;const a=s.automation;
  if(s.time-a.startedAt>=a.timeLimit){finishAutomation(s,'达到对战时限，按实际有效毁伤部署点结算',api);return;}
  const blue=hasCombatPlatform(s,'blue',api),red=hasCombatPlatform(s,'red',api),pending=s.missiles.some(m=>m.targetKind==='unit'&&api.unitById(s,m.target)?.hp>0);
  if((!blue||!red)&&!pending){finishAutomation(s,'一方或双方战斗平台已全部损失',api,!blue&&!red?'draw':blue?'blue':'red');return;}
  if(!pending&&!canStillAttack(s,'blue',api)&&!canStillAttack(s,'red',api))finishAutomation(s,'双方已无可用攻击弹药或后续作战架次',api);
}
export function automationReport(s){const a=s.automation;if(!a?.enabled)return null;const result={status:s.phase,winner:a.winner,reason:a.reason,time:Math.max(0,(a.finishedAt??s.time)-a.startedAt),timeLimit:a.timeLimit,seed:a.seed,blueDoctrine:a.blueDoctrine,redDoctrine:a.redDoctrine,preset:a.preset,timeline:clone(a.timeline)};
  for(const side of ['blue','red']){const units=s.units.filter(u=>u.side===side),surviving=units.filter(u=>u.hp>0&&!u.exited).length,stats=a.stats[side];result[side]={deployed:units.length,surviving,lost:units.length-surviving,damageDealt:Math.round(stats.damageDealt*10)/10,shots:stats.shots,interceptions:stats.interceptions,sorties:stats.sorties,score:Math.round(stats.damagePoints*10)/10,spent:{...stats.spent}};}
  return result;
}
const validNumber=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
export function restoreAutomation(raw,s,api){
  if(raw===undefined||raw===null){s.automation=null;return;}
  if(typeof raw!=='object'||raw.enabled!==true||!api.freeDeploy(s))throw Error('自动对战配置无效');
  const holder={automation:automationSettings(typeof raw.preset==='string'?raw.preset.slice(0,30):'custom')};const valid=configureAutomation(holder,raw);if(!valid.ok)throw Error(valid.error);const a=holder.automation;
  if(typeof raw.started!=='boolean'||raw.started!==(s.phase!=='setup')||!validNumber(raw.startedAt,0,s.time))throw Error('自动对战阶段无效');a.started=raw.started;a.startedAt=raw.startedAt;
  if(raw.tickRemainder!==undefined&&(!validNumber(raw.tickRemainder,0,1)||raw.tickRemainder>=1))throw Error('AI 时间步余量无效');a.tickRemainder=raw.tickRemainder??0;
  if(![null,'blue','red','draw'].includes(raw.winner)||s.phase==='ended'&&!raw.winner||s.phase!=='ended'&&raw.winner!==null)throw Error('对战结果无效');a.winner=raw.winner;
  if(raw.finishedAt!==null&&!validNumber(raw.finishedAt,a.startedAt,s.time))throw Error('对战结束时间无效');a.finishedAt=raw.finishedAt;if(s.phase==='ended'&&a.finishedAt!==s.time||s.phase!=='ended'&&a.finishedAt!==null)throw Error('对战结束时间与阶段不一致');
  if(s.phase==='ended'&&s.result!==(a.winner==='blue'?'victory':a.winner==='red'?'defeat':'draw')||s.phase!=='ended'&&s.result!==null)throw Error('对战胜负记录不一致');a.reason=typeof raw.reason==='string'?raw.reason.slice(0,160):'';
  if(raw.deployment!==null){if(typeof raw.deployment!=='string'||raw.deployment.length>450000)throw Error('初始部署快照无效');const saved=JSON.parse(raw.deployment);if(saved.phase!=='setup'||saved.scenario!==s.scenario||(saved.mapId||null)!==(s.mapId||null)||saved.automation?.started!==false||saved.automation.deployment!==null)throw Error('初始部署快照无效');api.validateDeployment(raw.deployment);a.deployment=raw.deployment;}else if(a.started)throw Error('自动对战缺少初始部署');
  for(const side of ['blue','red']){const st=raw.stats?.[side];if(!st)throw Error('对战统计缺失');for(const key of ['shots','damageDealt','damagePoints','interceptions','sorties']){if(!validNumber(st[key],0,1e8)||!['damageDealt','damagePoints'].includes(key)&&!Number.isInteger(st[key]))throw Error('对战统计无效');a.stats[side][key]=st[key];}a.stats[side].spent={};for(const [key,n] of Object.entries(st.spent||{})){if(!Object.hasOwn(api.weapons,key)&&key!=='ciws'||!Number.isInteger(n)||n<0||n>1e8)throw Error('弹药统计无效');a.stats[side].spent[key]=n;}}
  if(!Array.isArray(raw.timeline)||raw.timeline.length>400)throw Error('对战记录无效');a.timeline=raw.timeline.map(e=>{if(!['blue','red','both'].includes(e.side)||typeof e.message!=='string'||e.message.length>200||!validNumber(e.time,0,Math.max(0,s.time-a.startedAt)))throw Error('对战记录无效');return {time:e.time,side:e.side,message:e.message};});
  for(const u of s.units){if(!u.ai)continue;const v=u.ai;if(typeof v.order!=='string'||v.order.length>160||!api.inBounds(v.anchor,s)||v.goal!==null&&!api.inBounds(v.goal,s)||!Number.isInteger(v.searchIndex)||!validNumber(v.searchIndex,0,1e8)||!validNumber(v.goalTime,0,s.time)||!validNumber(v.dipUntil,0,1e8)||!validNumber(v.nextDip,0,1e8))throw Error('AI 指令状态无效');u.ai={anchor:{x:v.anchor.x,y:v.anchor.y},order:v.order,searchIndex:v.searchIndex,goal:v.goal?{x:v.goal.x,y:v.goal.y}:null,goalTime:v.goalTime,dipUntil:v.dipUntil,nextDip:v.nextDip};}
  s.automation=a;
}
