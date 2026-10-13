// 独立于界面的确定性沙盘。坐标单位：海里；速度：节；时间：秒。
export const WORLD = { width: 240, height: 170 };
export const LAND = [
  [[0,0],[43,0],[40,15],[29,25],[35,37],[22,47],[25,60],[13,72],[18,88],[0,97]],
  [[240,126],[224,133],[217,146],[209,155],[213,170],[240,170]],
  [[117,17],[133,12],[149,19],[155,33],[146,45],[131,42],[121,31]],
  [[177,118],[184,115],[191,121],[188,130],[181,132],[176,126]],
];
export const TYPES = {
  destroyer:{name:'防空驱逐舰',code:'DDG',domain:'surface',cost:28,hp:160,speed:30,radar:96,sonar:20,esm:125,weapons:{asm:8,sam:20,torpedo:4},desc:'舰队防空核心，具备远程对海打击能力。'},
  frigate:{name:'多用途护卫舰',code:'FFG',domain:'surface',cost:18,hp:110,speed:28,radar:74,sonar:28,esm:100,weapons:{asm:6,sam:10,torpedo:6},desc:'均衡的对海、防空与反潜平台。'},
  submarine:{name:'攻击潜艇',code:'SSN',domain:'sub',cost:22,hp:95,speed:25,radar:0,sonar:38,esm:0,weapons:{asm:0,sam:0,torpedo:10},desc:'潜航接敌，低速航行有利于声呐探测。'},
  fighter:{name:'多用途战斗机',code:'FTR',domain:'air',cost:16,hp:45,speed:460,radar:130,sonar:0,esm:145,weapons:{asm:2,sam:6,torpedo:0},desc:'快速侦察、空中拦截和对海攻击。'},
  helicopter:{name:'反潜直升机',code:'ASW',domain:'air',cost:10,hp:35,speed:135,radar:55,sonar:34,esm:65,weapons:{asm:0,sam:0,torpedo:4},desc:'搭载吊放声呐和轻型鱼雷，可悬停搜索。'},
  bomber:{name:'海上攻击机',code:'ATK',domain:'air',cost:20,hp:65,speed:380,radar:110,sonar:0,esm:135,weapons:{asm:6,sam:2,torpedo:0},desc:'携带多枚反舰导弹，适合远距离打击。'},
};
export const WEAPONS = {
  asm:{name:'反舰导弹',short:'AShM',range:95,speed:540,damage:75,hit:.88,targets:['surface']},
  sam:{name:'防空导弹',short:'SAM',range:65,speed:1700,damage:55,hit:.86,targets:['air','missile']},
  torpedo:{name:'鱼雷',short:'TORP',range:24,speed:65,damage:110,hit:.9,targets:['sub','surface']},
};
export const SCENARIOS = {
  strait:{name:'海峡交锋',subtitle:'联合编队 · 对海与防空',brief:'红方编队正在接近海峡。开启雷达，建立目标航迹，运用反舰导弹与防空系统夺取制海权。歼灭全部敌方单位即可获胜。',budget:100},
  hunt:{name:'深蓝猎潜',subtitle:'反潜搜索 · 静默接敌',brief:'海域中有两艘潜艇与一艘护卫舰。利用低速声呐和反潜直升机搜索，进入鱼雷射程后攻击。歼灭全部敌方单位即可获胜。',budget:110},
  sandbox:{name:'自由沙盘',subtitle:'自定义编队 · 自由推演',brief:'在部署阶段可添加蓝方和红方单位。开启推演后，红方按探测结果自主接敌。沙盘没有强制胜负，适合实验传感器和武器。',budget:200},
};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const bearing=(a,b)=>(Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI+360)%360;
export function inLand(p){return LAND.some(poly=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)inside=!inside;}return inside;});}
export const inBounds=p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=1&&p.x<=239&&p.y>=1&&p.y<=169;
export function clearPath(a,b){const n=Math.ceil(distance(a,b)*3);for(let i=0;i<=n;i++)if(inLand({x:a.x+(b.x-a.x)*i/(n||1),y:a.y+(b.y-a.y)*i/(n||1)}))return false;return true;}
export function log(s,message,kind='info'){s.events.unshift({time:s.time,message,kind});s.events=s.events.slice(0,100);}
function makeUnit(s,type,side,x,y){const t=TYPES[type],n=++s.nextId;return {id:`u${n}`,type,side,name:`${side==='blue'?'蓝':'红'}${t.code}-${String(n).padStart(2,'0')}`,x,y,hp:t.hp,speed:type==='helicopter'?0:Math.round(t.speed*.55),heading:side==='blue'?90:270,radar:side==='red'&&t.radar>0,sonar:t.sonar>0,esm:true,autoDefense:true,weapons:{...t.weapons},route:[],leader:null,offset:null,cooldown:0,defenseCooldown:0,trail:[]};}
export function createState(scenario='strait'){
  if(!SCENARIOS[scenario])scenario='strait';
  const s={version:1,scenario,phase:'setup',paused:true,time:0,nextId:0,nextMissile:0,seed:712301,budget:SCENARIOS[scenario].budget,weather:'clear',units:[],missiles:[],contacts:{blue:{},red:{}},events:[],effects:[],result:null,sensorClock:0,aiClock:0};
  const spawn=(type,side,x,y)=>{const u=makeUnit(s,type,side,x,y);s.units.push(u);if(side==='blue')s.budget-=TYPES[type].cost;return u;};
  if(scenario==='strait'){
    spawn('destroyer','blue',76,89);spawn('frigate','blue',67,104);spawn('fighter','blue',87,64);
    spawn('destroyer','red',147,94);spawn('frigate','red',165,108);spawn('bomber','red',184,60);
  }else if(scenario==='hunt'){
    spawn('frigate','blue',85,110);spawn('submarine','blue',103,120);spawn('helicopter','blue',114,99);
    spawn('submarine','red',128,110);spawn('submarine','red',147,130);spawn('frigate','red',162,89);
  }else{spawn('destroyer','blue',76,89);spawn('frigate','red',149,92);}
  log(s,'作战海域已载入。调整编队后，点击“开始推演”。');return s;
}
export const unitById=(s,id)=>s.units.find(u=>u.id===id);
export function addUnit(s,type,side,p){
  if(s.phase!=='setup')return {ok:false,error:'只可在部署阶段添加单位'};
  if(!TYPES[type]||!['blue','red'].includes(side))return {ok:false,error:'无效单位'};
  if(side==='red'&&s.scenario!=='sandbox')return {ok:false,error:'本剧本仅支持部署蓝方'};
  if(s.units.length>=60)return {ok:false,error:'最多部署 60 个单位'};
  if(!inBounds(p)||TYPES[type].domain!=='air'&&inLand(p))return {ok:false,error:'请选择海域内的有效部署位置'};
  if(side==='blue'&&s.scenario!=='sandbox'&&p.x>115)return {ok:false,error:'蓝方部署区位于海图西侧（115 海里以内）'};
  if(s.units.some(u=>distance(u,p)<3))return {ok:false,error:'单位间至少间隔 3 海里'};
  if(side==='blue'&&s.budget<TYPES[type].cost)return {ok:false,error:'剩余部署点不足'};
  const u=makeUnit(s,type,side,p.x,p.y);s.units.push(u);if(side==='blue')s.budget-=TYPES[type].cost;
  log(s,`${u.name} 已部署`);return {ok:true,unit:u};
}
export function removeUnit(s,id){const u=unitById(s,id);if(!u||s.phase!=='setup'||u.side==='red'&&s.scenario!=='sandbox')return false;s.units=s.units.filter(x=>x.id!==id);if(u.side==='blue')s.budget+=TYPES[u.type].cost;for(const v of s.units)if(v.leader===id)v.leader=null;log(s,`${u.name} 已撤回`);return true;}
export function start(s){if(s.phase==='ended')return {ok:false,error:'推演已结束'};if(!s.units.some(u=>u.side==='blue'&&u.hp>0))return {ok:false,error:'请先部署至少一个蓝方单位'};if(!s.units.some(u=>u.side==='red'&&u.hp>0))return {ok:false,error:'请先部署至少一个红方单位'};s.phase='running';s.paused=false;scan(s);log(s,'推演开始。传感器工作，红方自主行动。');return {ok:true};}
export function setRoute(s,id,p,append=false){const u=unitById(s,id);if(!u||u.side!=='blue'&&!(s.phase==='setup'&&s.scenario==='sandbox')||u.hp<=0||s.phase==='ended')return {ok:false,error:'请选择可用蓝方单位'};if(!inBounds(p))return {ok:false,error:'航点超出海域'};const from=append&&u.route.length?u.route.at(-1):u;if(TYPES[u.type].domain!=='air'&&!clearPath(from,p))return {ok:false,error:'航线穿越陆地，请在海域中设置中间航点'};if(append&&u.route.length>=16)return {ok:false,error:'航线最多包含 16 个航点'};u.leader=null;u.route=append?[...u.route,{...p}]:[{...p}];if(u.speed===0)u.speed=Math.round(TYPES[u.type].speed*.55);log(s,`${u.name}：${append?'追加':'更新'}航点 ${p.x.toFixed(0)}, ${p.y.toFixed(0)} nm`);return {ok:true};}
export function formFleet(s,leaderId){const leader=unitById(s,leaderId);if(!leader||leader.side!=='blue'||TYPES[leader.type].domain!=='surface'||s.phase==='ended')return {ok:false,error:'请选择一艘蓝方水面舰作为旗舰'};let n=0;for(const u of s.units.filter(u=>u.side==='blue'&&u.hp>0&&u.id!==leaderId&&TYPES[u.type].domain==='surface')){u.leader=leaderId;u.offset={x:(n%2===0?-1:1)*(6+Math.floor(n/2)*4),y:8+Math.floor(n/2)*5};u.route=[];u.speed=Math.min(leader.speed,TYPES[u.type].speed);n++;}log(s,`${leader.name} 被指定为旗舰，${n} 艘舰艇跟随编队`);return {ok:true};}
// 接触记录只保存探测时的位置；信号中断后不会泄漏真实移动位置。
function detection(s,observer,target){
  const t=TYPES[observer.type],d=distance(observer,target),weather=s.weather==='storm'?.78:1,domain=TYPES[target.type].domain;
  if(domain==='sub'){
    const range=t.sonar*weather*(observer.speed>18?.45:observer.speed>10?.75:1);
    if(observer.sonar&&d<=range&&(t.domain==='sub'||t.domain==='air'||clearPath(observer,target)))return {source:'声呐',quality:'track'};
    return null;
  }
  if(observer.radar&&t.radar>0&&d<=t.radar*weather*(domain==='air'?1.15:1)&&((domain==='air'||t.domain==='air')||clearPath(observer,target)))return {source:'雷达',quality:'track'};
  if(d<7&&t.domain!=='sub')return {source:'目视',quality:'track'};
  if(observer.esm&&target.radar&&d<=t.esm*weather)return {source:'电子支援',quality:'bearing'};
  return null;
}
export function scan(s){
  for(const side of ['blue','red']){
    const own=s.units.filter(u=>u.side===side&&u.hp>0);
    for(const target of s.units.filter(u=>u.side!==side&&u.hp>0)){
      let best=null;for(const u of own){const d=detection(s,u,target);if(d&&(!best||d.quality==='track'))best=d;if(best?.quality==='track')break;}
      if(best){const old=s.contacts[side][target.id];const fuzzy=best.quality==='bearing';const jitter=fuzzy?6:0;const index=Number(target.id.slice(1));s.contacts[side][target.id]={id:target.id,x:target.x+Math.sin(index*3)*jitter,y:target.y+Math.cos(index*2)*jitter,time:s.time,quality:best.quality,source:best.source,domain:TYPES[target.type].domain,label:`${TYPES[target.type].domain==='air'?'空中':TYPES[target.type].domain==='sub'?'水下':'水面'}接触 ${String(index).padStart(2,'0')}`};if(!old&&side==='blue')log(s,`新接触：${s.contacts.blue[target.id].label} · ${best.source}`, 'sensor');}
    }
    for(const [id,c] of Object.entries(s.contacts[side]))if(s.time-c.time>90)delete s.contacts[side][id];
  }
}
export function visibleContacts(s,side='blue'){return Object.values(s.contacts[side]).map(c=>({...c,stale:s.time-c.time>6}));}
export function fireCheck(s,shooterId,targetId,weapon){
  const u=unitById(s,shooterId),target=unitById(s,targetId),w=WEAPONS[weapon];
  if(s.phase!=='running')return {ok:false,error:'请先开始推演'};
  if(!u||!target||u.hp<=0||target.hp<=0||u.side===target.side||!w)return {ok:false,error:'目标不可用'};
  if(!u.weapons[weapon])return {ok:false,error:'弹药耗尽或未配备'};
  if(!w.targets.includes(TYPES[target.type].domain))return {ok:false,error:'武器不适用于此类目标'};
  const c=s.contacts[u.side][targetId];if(!c||c.quality!=='track'||s.time-c.time>6)return {ok:false,error:'需要雷达、声呐或目视的有效航迹'};
  if(distance(u,c)>w.range)return {ok:false,error:'目标超出武器射程'};
  if(weapon==='torpedo'&&!clearPath(u,c))return {ok:false,error:'鱼雷航路受到陆地遮挡'};
  if(u.cooldown>s.time)return {ok:false,error:'发射系统冷却中'};return {ok:true};
}
export function fire(s,shooterId,targetId,weapon){const check=fireCheck(s,shooterId,targetId,weapon);if(!check.ok)return check;const u=unitById(s,shooterId),target=unitById(s,targetId),w=WEAPONS[weapon];u.weapons[weapon]--;u.cooldown=s.time+12;const m={id:`m${++s.nextMissile}`,shooter:shooterId,target:targetId,side:u.side,weapon,x:u.x,y:u.y,travel:0,heading:bearing(u,target),trail:[]};s.missiles.push(m);log(s,`${u.side==='blue'?u.name:'红方单位'} 发射${w.name} → ${u.side==='blue'?s.contacts.blue[targetId].label:target.name}`,u.side==='blue'?'combat':'warning');return {ok:true};}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function move(s,u,dt){
  let goal=u.route[0];if(u.leader){const leader=unitById(s,u.leader);if(leader?.hp>0){goal={x:leader.x+u.offset.x,y:leader.y+u.offset.y};if(distance(u,goal)<1.5)return;}else{u.leader=null;u.offset=null;}}
  if(!goal||u.speed===0)return;const d=distance(u,goal),step=u.speed*dt/3600;u.heading=bearing(u,goal);
  const next={x:u.x+(goal.x-u.x)*Math.min(1,step/(d||1)),y:u.y+(goal.y-u.y)*Math.min(1,step/(d||1))};
  if(!inBounds(next)||TYPES[u.type].domain!=='air'&&!clearPath(u,next)){u.route=[];u.leader=null;log(s,`${u.side==='blue'?u.name:'红方单位'} 航路受阻，停止航行`,'warning');return;}
  u.trail.push({x:u.x,y:u.y});u.trail=u.trail.slice(-80);u.x=next.x;u.y=next.y;if(d<=step&&!u.leader)u.route.shift();
}
function enemyAI(s){
  for(const u of s.units.filter(u=>u.side==='red'&&u.hp>0)){
    const targets=visibleContacts(s,'red').filter(c=>c.quality==='track'&&!c.stale&&unitById(s,c.id)?.hp>0&&Object.entries(WEAPONS).some(([w,stats])=>u.weapons[w]>0&&stats.targets.includes(c.domain))).sort((a,b)=>distance(u,a)-distance(u,b));
    const target=targets[0];if(!target)continue;let fired=false;for(const candidate of targets){for(const w of ['asm','sam','torpedo'])if(fireCheck(s,u.id,candidate.id,w).ok){fire(s,u.id,candidate.id,w);fired=true;break;}if(fired)break;}
    const domain=TYPES[u.type].domain,desired=Math.min(...Object.entries(WEAPONS).filter(([w,stats])=>u.weapons[w]>0&&stats.targets.includes(target.domain)).map(([,stats])=>stats.range*.75));
    if(distance(u,target)>desired&&(domain==='air'||clearPath(u,target)))u.route=[{x:target.x,y:target.y}];else u.route=[];
  }
}
function defend(s,m){if(m.weapon==='torpedo')return false;
  for(const u of s.units.filter(u=>u.side!==m.side&&u.hp>0&&u.autoDefense&&u.radar&&u.weapons.sam>0&&u.defenseCooldown<=s.time)){
    const d=distance(u,m);if(d>Math.min(TYPES[u.type].radar,WEAPONS.sam.range,22))continue;
    u.weapons.sam--;u.defenseCooldown=s.time+18;if(random(s)<.62){s.effects.push({x:m.x,y:m.y,time:s.time,kind:'intercept'});log(s,`${u.side==='blue'?u.name:'红方防空系统'} 拦截来袭导弹`,'combat');return true;}
    if(u.side==='blue')log(s,`${u.name} 防空拦截未命中`,'warning');
  }return false;
}
export function checkOutcome(s){if(s.scenario==='sandbox'||s.phase!=='running')return;
  const blue=s.units.some(u=>u.side==='blue'&&u.hp>0),red=s.units.some(u=>u.side==='red'&&u.hp>0);
  // 发射平台被摧毁后，在途武器仍可能命中；结算前等待其威胁消失。
  if(!blue&&s.missiles.some(m=>m.side==='blue')||!red&&s.missiles.some(m=>m.side==='red'))return;
  if(!blue||!red){s.phase='ended';s.paused=true;s.result=!blue&&!red?'draw':!blue?'defeat':'victory';log(s,!blue&&!red?'双方作战单位全部损失，推演结束。':!blue?'蓝方编队损失全部作战单位，推演结束。':'红方全部作战单位被摧毁，任务完成。','combat');}
}
export function step(s,seconds){if(s.paused||s.phase!=='running'||!Number.isFinite(seconds)||seconds<=0)return;
  // 固定子步长避免高倍率下的导弹穿越与传感器漏检。
  let remaining=Math.min(seconds,600);while(remaining>0&&s.phase==='running'){const dt=Math.min(1,remaining);remaining-=dt;s.time+=dt;for(const u of s.units)if(u.hp>0)move(s,u,dt);
    s.sensorClock+=dt;s.aiClock+=dt;if(s.sensorClock>=3){scan(s);s.sensorClock=0;}if(s.aiClock>=8){enemyAI(s);s.aiClock=0;}
    const keep=[];for(const m of s.missiles){const target=unitById(s,m.target),w=WEAPONS[m.weapon];if(!target||target.hp<=0)continue;if(defend(s,m))continue;const d=distance(m,target),travel=w.speed*dt/3600;m.heading=bearing(m,target);m.trail.push({x:m.x,y:m.y});m.trail=m.trail.slice(-30);
      if(d<=travel+.3){const hit=random(s)<w.hit;s.effects.push({x:target.x,y:target.y,time:s.time,kind:hit?'hit':'miss'});if(hit){target.hp=Math.max(0,target.hp-w.damage);if(target.hp===0){log(s,`${target.side==='blue'?target.name:'红方接触'} 被摧毁`,'combat');for(const side of ['blue','red'])delete s.contacts[side][target.id];}else log(s,`${w.name} 命中${target.side==='blue'?target.name:'红方接触'}`,'combat');}else log(s,`${w.name} 未命中`,'combat');continue;}
      m.x+=(target.x-m.x)*travel/d;m.y+=(target.y-m.y)*travel/d;m.travel+=travel;if(m.travel<=w.range*1.15&&(m.weapon!=='torpedo'||!inLand(m)))keep.push(m);else log(s,`${w.name} 航程耗尽`,'combat');
    }s.missiles=keep;s.effects=s.effects.filter(e=>s.time-e.time<18);checkOutcome(s);
  }
}
export function serialize(s){return JSON.stringify(s);}
function finite(n,min,max){return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;}
export function deserialize(text){
  if(typeof text!=='string'||text.length>250000)throw Error('战局文件过大');const raw=JSON.parse(text);
  if(raw.version!==1||!Object.hasOwn(SCENARIOS,raw.scenario)||!['setup','running','ended'].includes(raw.phase)||!Array.isArray(raw.units)||raw.units.length>60||!finite(raw.time,0,1e8)||!finite(raw.budget,0,1000))throw Error('战局格式无效');
  const s=createState(raw.scenario);s.units=[];const ids=new Set();
  for(const r of raw.units){if(!Object.hasOwn(TYPES,r.type)||!['blue','red'].includes(r.side)||!/^u\d{1,5}$/.test(r.id)||ids.has(r.id)||!inBounds(r)||TYPES[r.type].domain!=='air'&&inLand(r)||!finite(r.hp,0,TYPES[r.type].hp)||!finite(r.speed,0,TYPES[r.type].speed)||!finite(r.heading,0,360)||!Array.isArray(r.route)||r.route.length>16||r.route.some(p=>!inBounds(p)))throw Error('战局单位参数无效');ids.add(r.id);const u=makeUnit(s,r.type,r.side,r.x,r.y);u.id=r.id;for(const key of ['hp','speed','heading'])u[key]=r[key];for(const key of ['radar','sonar','esm','autoDefense'])u[key]=r[key]===true;u.name=typeof r.name==='string'?r.name.slice(0,36):u.name;u.route=r.route.map(p=>({x:p.x,y:p.y}));for(const w of Object.keys(WEAPONS)){if(!finite(r.weapons?.[w],0,TYPES[r.type].weapons[w])||!Number.isInteger(r.weapons[w]))throw Error('战局弹药无效');u.weapons[w]=r.weapons[w];}for(const key of ['cooldown','defenseCooldown'])u[key]=finite(r[key],0,1e8)?r[key]:0;u.leader=typeof r.leader==='string'?r.leader:null;u.offset=r.offset&&finite(r.offset.x,-50,50)&&finite(r.offset.y,-50,50)?{x:r.offset.x,y:r.offset.y}:null;s.units.push(u);}
  for(const u of s.units)if(u.leader&&(!ids.has(u.leader)||u.leader===u.id||unitById(s,u.leader).leader||unitById(s,u.leader).side!==u.side||!u.offset)){u.leader=null;u.offset=null;}
  if(!Array.isArray(raw.missiles)||raw.missiles.length>200)throw Error('战局武器数据无效');s.missiles=raw.missiles.map(r=>{if(!Object.hasOwn(WEAPONS,r.weapon)||!ids.has(r.target)||!ids.has(r.shooter)||!['blue','red'].includes(r.side)||unitById(s,r.shooter).side!==r.side||unitById(s,r.target).side===r.side||!inBounds(r)||!finite(r.travel,0,WEAPONS[r.weapon].range*1.15)||!finite(r.heading,0,360))throw Error('战局武器参数无效');return {id:`m${++s.nextMissile}`,shooter:r.shooter,target:r.target,side:r.side,weapon:r.weapon,x:r.x,y:r.y,travel:r.travel,heading:r.heading,trail:[]};});
  s.time=raw.time;s.phase=raw.phase;s.paused=true;s.budget=raw.budget;s.seed=finite(raw.seed,0,4294967295)?raw.seed:712301;s.nextId=Math.max(0,...s.units.map(u=>Number(u.id.slice(1))));s.weather=raw.weather==='storm'?'storm':'clear';s.result=['victory','defeat','draw'].includes(raw.result)?raw.result:null;s.contacts={blue:{},red:{}};s.events=[];if(s.phase!=='setup')scan(s);log(s,'战局已载入，当前暂停。');return s;
}
