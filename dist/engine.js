import {AUTO_PRESETS,AI_DOCTRINES,populateAutoPreset,configureAutomation,beginAutomation,commandAutomation,hasCombatPlatform,updateAutoOutcome,finishAutomation,automationReport,restoreAutomation,recordAutoShot,recordAutoDamage,recordAutoIntercept,recordAutoSortie} from './auto-commander.js?v=0.6.1';
export {AUTO_PRESETS,AI_DOCTRINES};
import {buildModernCatalog} from './modern-catalog.js';
import {geographicMap,geoToWorld,REAL_MAPS} from './geography.js';
import {seaRoute} from './navigation.js';
import {getBattleTheatre,factionName,inDeploymentZone,nearestSeparationKm} from './battle-theatres.js?v=0.6.1';
export {getBattleTheatre,factionName};
import {HISTORICAL_SCENARIOS,initializeHistorical,historicalOrder,historicalObjectives,updateHistorical} from './historical-missions.js';
export {historicalObjectives};
// 原创确定性游戏模型。距离：海里；速度：节；推演时间：秒。
export const WORLD={width:240,height:170};
export const LAND=[
  [[0,0],[43,0],[40,15],[29,25],[35,37],[22,47],[25,60],[13,72],[18,88],[0,97]],
  [[240,126],[224,133],[217,146],[209,155],[213,170],[240,170]],
  [[117,17],[133,12],[149,19],[155,33],[146,45],[131,42],[121,31]],
  [[177,118],[184,115],[191,121],[188,130],[181,132],[176,126]],
];
export const ALTITUDES={low:{name:'低空',height:60},medium:{name:'中空',height:3500},high:{name:'高空',height:9000}};
export const WEAPONS={
  gun:{name:'舰炮（射击批次）',short:'GUN',range:8,minRange:.2,speed:1600,damage:18,hit:.68,targets:['surface','land'],guidance:'inertial',seeker:0,height:10,cooldown:12},
  asroc:{name:'火箭助飞反潜鱼雷（抽象）',short:'ASROC',range:22,minRange:2,speed:600,damage:90,hit:.74,targets:['sub'],guidance:'active',seeker:3,height:60,cooldown:25},
  pgm:{name:'精确对陆弹药（抽象）',short:'PGM',range:18,minRange:1,speed:500,damage:70,hit:.82,targets:['land'],guidance:'inertial',seeker:0,height:100,cooldown:12},
  atgm:{name:'轻型精确攻击导弹',short:'LGM',range:6,minRange:.3,speed:600,damage:32,hit:.80,targets:['surface','land'],guidance:'active',seeker:6,height:20,cooldown:12},
  asm:{name:'亚音速反舰导弹',short:'AShM',range:95,minRange:3,speed:550,damage:75,hit:.76,targets:['surface'],guidance:'active',seeker:12,height:5,cooldown:18},
  supersonic:{name:'超音速反舰导弹',short:'SSM',range:120,minRange:5,speed:1400,damage:100,hit:.70,targets:['surface'],guidance:'active',seeker:15,height:10,cooldown:28},
  aam:{name:'主动雷达空空导弹',short:'AAM',range:80,minRange:2,speed:2100,damage:52,hit:.78,targets:['air'],guidance:'active',seeker:15,height:3500,cooldown:10},
  sam:{name:'区域防空导弹',short:'SAM',range:75,minRange:3,speed:1850,damage:60,hit:.78,targets:['air','missile'],guidance:'semi',seeker:0,height:3500,cooldown:12},
  point:{name:'近程防空导弹',short:'SHORAD',range:18,minRange:.5,speed:1300,damage:55,hit:.74,targets:['air','missile'],guidance:'active',seeker:6,height:100,cooldown:6},
  torpedo:{name:'制导鱼雷',short:'TORP',range:24,minRange:.2,speed:65,damage:110,hit:.82,targets:['sub','surface'],guidance:'active',seeker:3,height:0,cooldown:25},
  arm:{name:'反辐射导弹',short:'ARM',range:85,minRange:3,speed:1300,damage:65,hit:.70,targets:['surface','land'],guidance:'passive',seeker:18,height:200,cooldown:20},
  ir:{name:'近程红外空空导弹',short:'IR-AAM',range:8,minRange:.3,speed:1500,damage:45,hit:.78,targets:['air'],guidance:'active',seeker:8,height:300,cooldown:7},
  bomb:{name:'自由落体炸弹（抽象）',short:'BOMB',range:1.8,minRange:.1,speed:400,damage:80,hit:.58,targets:['surface','land'],guidance:'inertial',seeker:0,height:100,cooldown:8},
  cruise:{name:'对陆巡航导弹',short:'LACM',range:145,minRange:8,speed:480,damage:90,hit:.82,targets:['land'],guidance:'inertial',seeker:0,height:40,cooldown:30},
};
const ammo=v=>Object.fromEntries(Object.keys(WEAPONS).map(k=>[k,v[k]||0]));
const platform=t=>({height:20,signature:1,channels:2,ciws:0,decoys:0,endurance:0,jammer:0,profiles:{},...t,weapons:ammo(t.weapons||{})});
export const TYPES={
  destroyer:platform({name:'防空驱逐舰',code:'DDG',domain:'surface',cost:28,hp:160,speed:30,radar:96,sonar:20,esm:125,channels:4,ciws:20,decoys:8,weapons:{asm:8,sam:20,point:8,torpedo:4},desc:'区域防空与近防双层保护；远海对舰射击需要航空侦察。'}),
  frigate:platform({name:'反潜护卫舰',code:'FFG',domain:'surface',cost:18,hp:110,speed:28,radar:74,sonar:28,esm:100,ciws:12,decoys:6,profiles:{sam:{range:35}},weapons:{asm:6,sam:10,point:4,torpedo:6},desc:'低速声呐搜索，兼顾编队近程防空与反舰。'}),
  submarine:platform({name:'攻击潜艇',code:'SSN',domain:'sub',cost:22,hp:95,speed:25,radar:0,sonar:38,esm:0,decoys:5,weapons:{torpedo:10},desc:'低速隐蔽、高速暴露；重型鱼雷受海岸与航程限制。'}),
  fighter:platform({name:'多用途战斗机',code:'MRF',domain:'air',cost:16,hp:45,speed:460,radar:130,sonar:0,esm:145,endurance:70,decoys:8,profiles:{aam:{range:65},asm:{range:65}},weapons:{asm:2,aam:6},desc:'兼顾空战与对舰，挂载有限，适合灵活护航。'}),
  interceptor:platform({name:'远程截击机',code:'INT',domain:'air',cost:19,hp:46,speed:650,radar:160,sonar:0,esm:160,endurance:55,decoys:6,profiles:{aam:{range:100,minRange:4}},weapons:{aam:6},desc:'高速、长射程，近距机动与续航较弱；远距射击命中率下降。'}),
  superiority:platform({name:'制空战斗机',code:'ASF',domain:'air',cost:21,hp:50,speed:560,radar:155,sonar:0,esm:150,endurance:80,decoys:12,evasion:.16,profiles:{aam:{range:85}},weapons:{aam:8},desc:'专注制空，机动与自卫强，不携带对海武器。'}),
  stealth:platform({name:'隐身战斗机',code:'LOF',domain:'air',cost:27,hp:42,speed:510,radar:125,sonar:0,esm:170,endurance:75,signature:.30,decoys:10,evasion:.12,weapons:{aam:4,asm:2},desc:'降低雷达发现距离；内置挂载少，开雷达仍暴露信号。'}),
  navalFighter:platform({name:'舰载战斗机',code:'CVF',domain:'air',cost:17,hp:46,speed:470,radar:125,sonar:0,esm:130,endurance:65,decoys:10,profiles:{aam:{range:60},asm:{range:70}},weapons:{aam:4,asm:4},desc:'偏重护航与海上打击，本版通过补给区抽象起降。'}),
  helicopter:platform({rotary:true,name:'反潜直升机',code:'ASW',domain:'air',cost:10,hp:35,speed:135,radar:55,sonar:34,esm:65,endurance:90,decoys:4,altitude:'low',weapons:{torpedo:4},desc:'低空悬停或低速时使用吊放声呐，高速无法持续搜索。'}),
  bomber:platform({name:'海上攻击机',code:'ATK',domain:'air',cost:20,hp:65,speed:380,radar:110,sonar:0,esm:135,endurance:100,decoys:6,profiles:{asm:{range:110}},weapons:{asm:6,aam:2},desc:'反舰挂载多，空战自卫弱，需要制空与预警支援。'}),
  awacs:platform({name:'空中预警机',code:'AEW',domain:'air',cost:24,hp:70,speed:310,radar:210,sonar:0,esm:190,endurance:180,decoys:4,channels:0,altitude:'high',support:true,weapons:{},desc:'高空提供远程航迹与数据链；无进攻武器，必须保护。'}),
  electronic:platform({name:'电子战／压制机',code:'EW',domain:'air',cost:22,hp:48,speed:420,radar:100,sonar:0,esm:180,endurance:95,decoys:8,jammer:45,weapons:{arm:4,aam:2},desc:'干扰降低敌雷达探测与数据链质量；反辐射武器压制雷达。'}),
  patrol:platform({name:'海上巡逻机',code:'MPA',domain:'air',cost:18,hp:60,speed:280,radar:170,sonar:25,esm:160,endurance:150,decoys:4,weapons:{torpedo:6,asm:2},desc:'低空声呐浮标抽象搜索与海面侦察，空战能力弱。'}),
  coastalAsm:platform({name:'岸基亚音速反舰连',code:'C-ASM',domain:'land',cost:18,hp:80,speed:0,radar:85,sonar:0,esm:110,height:25,profiles:{asm:{range:110}},weapons:{asm:8},desc:'只能部署在陆地；超视距反舰依赖侦察和数据链。'}),
  coastalSuper:platform({name:'岸基超音速反舰连',code:'C-SSM',domain:'land',cost:25,hp:85,speed:0,radar:95,sonar:0,esm:120,height:25,weapons:{supersonic:6},desc:'速度与威力强，部署昂贵、弹药少、发射间隔长。'}),
  samLong:platform({name:'岸基远程防空营',code:'L-SAM',domain:'land',cost:26,hp:90,speed:0,radar:190,sonar:0,esm:145,height:30,channels:3,profiles:{sam:{range:110,minRange:5}},weapons:{sam:16},desc:'威胁中高空目标；受低空地平线、雷达压制与通道限制。'}),
  samMedium:platform({name:'岸基中程防空连',code:'M-SAM',domain:'land',cost:18,hp:75,speed:0,radar:115,sonar:0,esm:100,profiles:{sam:{range:50}},weapons:{sam:12,point:6},desc:'区域与近程防空搭配，适合掩护岸基火力与机场。'}),
  samShort:platform({name:'岸基近程防空连',code:'S-SAM',domain:'land',cost:11,hp:65,speed:0,radar:45,sonar:0,esm:65,height:12,ciws:16,profiles:{point:{range:14}},weapons:{point:12},desc:'保护要点，用近程导弹与有限近防弹药拦截漏网目标。'}),
  landAttack:platform({name:'岸基对陆巡航导弹连',code:'LACM',domain:'land',cost:22,hp:75,speed:0,radar:0,sonar:0,esm:90,weapons:{cruise:6},desc:'依照已确认航迹打击固定陆地目标，不能攻击舰船与在空飞机。'}),
  airbase:platform({name:'前进航空补给基地',code:'BASE',domain:'land',cost:14,hp:180,speed:0,radar:0,sonar:0,esm:0,channels:0,support:true,weapons:{},desc:'有限补给库存；返航后四分钟加油装弹，基地被毁停止补给。'}),
  missileBoat:platform({name:'年代型导弹艇',code:'FAC-80',domain:'surface',cost:9,hp:48,speed:34,radar:35,sonar:0,esm:55,decoys:2,profiles:{asm:{range:22,damage:55,hit:.65}},weapons:{asm:4},desc:'历史任务使用的导弹艇近似，防空薄弱；不代表单一真实型号。'}),
  strikeHelicopter:platform({rotary:true,name:'年代型反舰直升机',code:'LYNX',domain:'air',cost:12,hp:35,speed:140,radar:38,sonar:0,esm:55,endurance:120,altitude:'low',decoys:2,channels:2,profiles:{asm:{name:'轻型半主动反舰导弹',range:8,minRange:.5,damage:36,speed:600,hit:.80,guidance:'semi',seeker:0,height:15,cooldown:15}},weapons:{asm:4},desc:'以携轻型反舰弹的直升机为原型，需要本机雷达持续照射。'}),
  strikeJet:platform({name:'年代型海上攻击机',code:'A6-ROLE',domain:'air',cost:18,hp:50,speed:450,radar:65,sonar:0,esm:85,endurance:100,decoys:6,profiles:{asm:{range:60}},weapons:{asm:2,bomb:4},desc:'承担 A-6 类海上攻击任务，挂载与性能是游戏近似。'}),
  lightAttack1982:platform({name:'年代型低空攻击机',code:'ATK-82',domain:'air',cost:12,hp:35,speed:480,radar:0,sonar:0,esm:60,endurance:70,altitude:'low',decoys:2,weapons:{bomb:4},desc:'以近距投弹为主要攻击方式，需要穿越防空掩护。'}),
  seaHarrier:platform({name:'海鹞任务型战斗机',code:'SHAR',domain:'air',cost:17,hp:40,speed:540,radar:40,sonar:0,esm:65,endurance:65,altitude:'low',decoys:8,evasion:.12,weapons:{ir:4},desc:'历史任务中的近程制空平台，使用红外弹，不配备现代主动雷达空空弹。'}),
  frigate1980:platform({name:'年代型近程防空护卫舰',code:'FFG-80',domain:'surface',cost:18,hp:110,speed:28,radar:60,sonar:20,esm:80,decoys:4,profiles:{asm:{range:35},point:{range:6,minRange:.2,hit:.60,seeker:3,cooldown:10}},weapons:{asm:4,point:12,torpedo:2},desc:'历史任务的合成护卫舰能力，用短程防空掩护近岸船队。'}),
  destroyer1980:platform({name:'年代型区域防空舰',code:'DDG-80',domain:'surface',cost:25,hp:145,speed:30,radar:90,sonar:10,esm:100,channels:2,decoys:6,profiles:{asm:{range:70},sam:{range:35,minRange:2,hit:.68,cooldown:15}},weapons:{asm:8,sam:18,torpedo:4},desc:'用年代型区域防空与反舰能力构建合成水面指挥舰。'}),
  transport:platform({name:'运输船群',code:'TRANS',domain:'surface',cost:12,hp:150,speed:18,radar:18,sonar:0,esm:0,support:true,weapons:{},desc:'护航目标；没有武器，运输船损失会导致护航任务失败。'}),

};
Object.assign(TYPES,buildModernCatalog(platform));
export const SCENARIOS={
  autobattle:{name:'AI 自动对战平台',subtitle:'美中编队 · 250 公里起始 · 双方自主指挥',brief:'美方（蓝）与中方（红）从相隔 250 公里的前沿阵位开始搜索。双方各 600 部署点，只可在各自后方部署本国舰机；自定义最近间距至少 250 公里。发现、识别和武器射程决定实际开火时机。虚构演习海域，按歼灭或时限内有效毁伤结算，观战信息不提供给 AI。',budget:600},
  modernlab:{name:'现代装备试验场',subtitle:'真实型号 · 航母航空 · 挂载与后勤',brief:'双方各 600 部署点，航母已包含缩编航空队。选择航母放飞舰载机，或打开装备库按任务选型。尝试制空、反舰、反潜、加油与补给，没有强制胜负。',budget:600},
  ...HISTORICAL_SCENARIOS,
  strait:{name:'海峡交锋',subtitle:'联合编队 · 侦察与防空',brief:'红方舰队与攻击机接近海峡。用空中雷达建立航迹，经数据链引导对舰打击；舰载雷达对水面目标受地平线限制。摧毁全部红方战斗单位获胜。',budget:100},
  hunt:{name:'深蓝猎潜',subtitle:'反潜搜索 · 静默接敌',brief:'两艘潜艇与一艘护卫舰进入海域。低速声呐搜索，直升机保持低空低速，待航迹确认后发射鱼雷。摧毁全部红方战斗单位获胜。',budget:110},
  littoral:{name:'近岸联合行动',subtitle:'预警支援 · 制空 · 岸基火力',brief:'岛屿设有反舰与防空阵地。护送预警机，结合制空、电子压制和对陆打击摧毁红方战斗单位。蓝方机场在西岸，红方机场在主岛；基地与预警机不计入歼灭目标。',budget:170},
  sandbox:{name:'自由沙盘',subtitle:'双方等额部署 · 机制实验',brief:'双方各有 200 部署点，遵守相同探测、弹药与交战规则。可试验预警支援、分层防空、电子压制与岸基火力，没有强制胜负。',budget:200},
};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const bearing=(a,b)=>(Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI+360)%360;
export const worldFor=s=>getBattleTheatre(s)||geographicMap(s)||WORLD;
export const landFor=s=>getBattleTheatre(s)?.land||geographicMap(s)?.land||LAND;
export function canDeployType(s,type,side){const t=TYPES[type],theatre=getBattleTheatre(s);return !!t&&['blue','red'].includes(side)&&(!theatre||t.country===theatre.factions[side].country||!t.model&&t.domain==='land');}
export const freeDeploy=s=>['sandbox','modernlab','autobattle'].includes(s.scenario);
export const isHistorical=s=>Object.hasOwn(HISTORICAL_SCENARIOS,s.scenario);
export function inLand(p,s){return landFor(s).some(poly=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)inside=!inside;}return inside;});}
export const inBounds=(p,s)=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=.25&&p.y>=.25&&p.x<=worldFor(s).width-.25&&p.y<=worldFor(s).height-.25;
export function clearPath(a,b,s){
  if(inLand(a,s)||inLand(b,s))return false;
  const cross=(ax,ay,bx,by,cx,cy)=>(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
  for(const poly of landFor(s))for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [cx,cy]=poly[j],[dx,dy]=poly[i];
    if(Math.max(a.x,b.x)<Math.min(cx,dx)||Math.min(a.x,b.x)>Math.max(cx,dx)||Math.max(a.y,b.y)<Math.min(cy,dy)||Math.min(a.y,b.y)>Math.max(cy,dy))continue;
    if(cross(a.x,a.y,b.x,b.y,cx,cy)*cross(a.x,a.y,b.x,b.y,dx,dy)<=1e-12&&cross(cx,cy,dx,dy,a.x,a.y)*cross(cx,cy,dx,dy,b.x,b.y)<=1e-12)return false;
  }return true;
}
export function missionRoute(s,from,to){
  if(TYPES[from.type]?.domain==='air')return [{x:to.x,y:to.y}];
  const w=worldFor(s);return seaRoute(from,to,{width:w.width,height:w.height,blocked:p=>inLand(p,s),clear:(a,b)=>clearPath(a,b,s)});
}
const autoAPI=()=>({spawn,types:TYPES,weapons:WEAPONS,world:worldFor,land:landFor,inLand,inBounds,clearPath,route:missionRoute,distance,bearing,unitById,airborne,weaponStats,maxSpeed,sensorRange,visibleContacts,usableContact,radioAvailable,fireCheck,fire,launchDeck,requestRefuel,requestSupply,returnToBase,scan,log,freeDeploy,validateDeployment:text=>{const initial=deserialize(text);if(!isAutoBattle(initial)||initial.phase!=='setup')throw Error('初始部署快照无效');}});
export const isAutoBattle=s=>s.automation?.enabled===true;
export const createAutoBattle=(preset='surface')=>createState('autobattle',preset);
export function configureAutoBattle(s,options={}){if(s.phase!=='setup'||!freeDeploy(s)||isHistorical(s))return {ok:false,error:'请在双方可部署的沙盘部署阶段配置 AI 对战'};return configureAutomation(s,options);}
export function startAutoBattle(s,options={}){const r=configureAutoBattle(s,options);return r.ok?start(s):r;}
export function stopAutoBattle(s){if(!isAutoBattle(s)||s.phase!=='running')return {ok:false,error:'当前没有进行中的 AI 对战'};finishAutomation(s,'用户结束对战，按已发生的有效毁伤结算',autoAPI());return {ok:true};}
export function getBattleReport(s){const report=automationReport(s);if(!report)return null;const theatre=getBattleTheatre(s);if(theatre){report.theatre={id:theatre.id,name:theatre.name,initialSeparationKm:theatre.initialSeparationKm,factions:{blue:theatre.factions.blue.name,red:theatre.factions.red.name}};const initial=s.automation.deployment?JSON.parse(s.automation.deployment).units:s.units;report.initialDistanceKm=nearestSeparationKm(initial);}return report;}
export function restartAutoBattle(s){if(!isAutoBattle(s))throw Error('当前不是自动对战');if(!s.automation.deployment){const copy=deserialize(serialize(s));copy.paused=true;return copy;}return deserialize(s.automation.deployment);}
const missionAPI=()=>({spawn,route:missionRoute,log,types:TYPES});
export const issueMissionOrder=(s,key)=>historicalOrder(s,key,missionAPI());
export function log(s,message,kind='info'){s.events.unshift({time:s.time,message,kind});s.events=s.events.slice(0,100);}
export const unitById=(s,id)=>s.units.find(u=>u.id===id);
export const airborne=u=>TYPES[u.type].domain==='air'&&!['servicing','grounded'].includes(u.flightState);
export const domainOf=u=>TYPES[u.type].domain==='air'&&!airborne(u)?u.deckBased?'surface':'land':TYPES[u.type].domain;
export const weaponStats=(u,key)=>({...WEAPONS[key],...TYPES[u.type].profiles[key]});
export const maxSpeed=u=>TYPES[u.type].speed*(u.hp<TYPES[u.type].hp*.4?.65:1);
const radioAvailable=u=>!(TYPES[u.type].model&&TYPES[u.type].domain==='sub'&&u.depth==='deep');
const radarWorking=(s,u)=>radioAvailable(u)&&u.hp>0&&!u.exited&&u.radar&&u.radarDisabledUntil<=s.time&&(!TYPES[u.type].endurance||airborne(u));
const heightOf=u=>airborne(u)?ALTITUDES[u.altitude]?.height||3500:domainOf(u)==='sub'?(u.depth==='periscope'?3:0):TYPES[u.type].height;
export const radarHorizon=(a,b)=>2.23*(Math.sqrt(heightOf(a))+Math.sqrt(heightOf(b)));
export function sensorRange(s,u,domain='air',altitude='medium'){
  return Math.min(TYPES[u.type].radar*(s.weather==='storm'?.78:1)*(u.hp<TYPES[u.type].hp*.4?.65:1),2.23*(Math.sqrt(heightOf(u))+Math.sqrt(domain==='air'?ALTITUDES[altitude].height:20)));
}
function makeUnit(s,type,side,x,y){const t=TYPES[type],n=++s.nextId;return {
  id:`u${n}`,type,side,name:`${getBattleTheatre(s)?side==='blue'?'美':'中':side==='blue'?'蓝':'红'}${t.code}-${String(n).padStart(2,'0')}`,x,y,hp:t.hp,
  speed:t.domain==='air'?(t.rotary?0:Math.round(t.speed*.65)):Math.round(t.speed*.55),heading:side==='blue'?90:270,
  radar:(side==='red'||t.role==='awacs'||type==='awacs')&&t.radar>0,sonar:t.sonar>0,esm:t.esm>0,datalink:true,jamming:false,altitude:t.altitude||'medium',
  autoDefense:true,autoEngage:side==='red',samReserve:Math.floor(t.weapons.sam*.25),loadout:t.loadouts?.[0].id||null,weapons:ammo(t.loadouts?.[0].weapons||t.weapons),ciws:t.ciws,decoys:t.decoys,
  missionRole:null,exited:false,route:[],leader:null,offset:null,cooldowns:{},defenseCooldown:0,radarDisabledUntil:0,fuel:t.endurance*60,flightState:'airborne',serviceUntil:0,home:null,sorties:0,supply:t.baseSupply||(type==='airbase'?30:0),airwing:{...(t.deck?.wing||{})},deckReady:0,deckBased:false,originDeck:null,fuelSupply:t.fuelSupply||0,refuelTarget:null,supplyTarget:null,depth:t.domain==='sub'?'deep':null,ai:null,trail:[],
};}
function spawn(s,type,side,x,y){const u=makeUnit(s,type,side,x,y);s.units.push(u);s[side==='blue'?'budget':'redBudget']-=TYPES[type].cost;return u;}
export function createState(scenario='strait',autoPreset='surface'){
  if(!Object.hasOwn(SCENARIOS,scenario))scenario='strait';
  const s={version:6,automation:null,mapId:scenario==='autobattle'?'uscn250':SCENARIOS[scenario].mapId||null,scenario,phase:'setup',paused:true,time:0,nextId:0,nextMissile:0,seed:712301,budget:SCENARIOS[scenario].budget,redBudget:SCENARIOS[scenario].budget,weather:'clear',units:[],missiles:[],contacts:{blue:{},red:{}},events:[],effects:[],result:null,sensorClock:0,aiClock:0};
  if(scenario==='autobattle'){populateAutoPreset(s,autoPreset,autoAPI());}
  else if(isHistorical(s)){initializeHistorical(s,missionAPI());}
  else if(scenario==='modernlab'){
    spawn(s,'cvn_ford','blue',65,100);spawn(s,'ddg_burke3','blue',75,90);spawn(s,'ffg_mogami','blue',57,112);spawn(s,'aor_supply','blue',50,105);
    spawn(s,'cv_fujian','red',173,88);spawn(s,'ddg052d','red',165,99);spawn(s,'ffg054b','red',181,99);spawn(s,'aor901','red',188,90);
  }else if(scenario==='strait'){
    spawn(s,'destroyer','blue',76,89);spawn(s,'frigate','blue',67,104);spawn(s,'fighter','blue',87,64);
    spawn(s,'destroyer','red',147,94);spawn(s,'frigate','red',165,108);spawn(s,'bomber','red',184,60);
  }else if(scenario==='hunt'){
    spawn(s,'frigate','blue',85,110);spawn(s,'submarine','blue',103,120);spawn(s,'helicopter','blue',114,99);
    spawn(s,'submarine','red',128,110);spawn(s,'submarine','red',147,130);spawn(s,'frigate','red',162,89);
  }else if(scenario==='littoral'){
    spawn(s,'airbase','blue',17,43);spawn(s,'destroyer','blue',67,89);spawn(s,'awacs','blue',59,75);
    spawn(s,'superiority','blue',82,68);spawn(s,'electronic','blue',77,107);spawn(s,'landAttack','blue',18,58);
    spawn(s,'airbase','red',137,28);spawn(s,'coastalSuper','red',145,31);spawn(s,'samLong','red',130,24);
    spawn(s,'samShort','red',136,36);spawn(s,'interceptor','red',166,59);spawn(s,'frigate','red',148,87);
  }else{spawn(s,'destroyer','blue',76,89);spawn(s,'frigate','red',149,92);}
  log(s,'海域已载入。先部署与开启侦察；航迹确认后交战。');return s;
}
function validPlacement(type,p,s){return inBounds(p,s)&&(TYPES[type].domain==='air'||(TYPES[type].domain==='land'?inLand(p,s):!inLand(p,s)));}
export function addUnit(s,type,side,p){
  if(s.phase!=='setup')return {ok:false,error:'只可在部署阶段添加单位'};
  if(isHistorical(s))return {ok:false,error:'历史任务使用固定兵力，不能额外部署'};
  if(!Object.hasOwn(TYPES,type)||!['blue','red'].includes(side))return {ok:false,error:'无效单位'};
  if(!canDeployType(s,type,side))return {ok:false,error:`${factionName(s,side)}只能部署本国型号或通用岸基设施`};
  if(getBattleTheatre(s)&&!inDeploymentZone(s,side,p||{}))return {ok:false,error:`请部署在本方前沿线后方，保持双方起始间距至少 ${getBattleTheatre(s).initialSeparationKm} 公里`};
  if(side==='red'&&!freeDeploy(s))return {ok:false,error:'本剧本仅支持部署蓝方'};
  if(s.units.length>=60)return {ok:false,error:'最多部署 60 个单位'};
  if(!validPlacement(type,p,s))return {ok:false,error:TYPES[type].domain==='land'?'岸基单位必须部署在陆地上':'请选择海域内的有效部署位置'};
  if(side==='blue'&&!freeDeploy(s)&&p.x>115)return {ok:false,error:'蓝方部署区位于海图西侧（115 海里以内）'};
  if(s.units.some(u=>distance(u,p)<3))return {ok:false,error:'单位间至少间隔 3 海里'};
  if(s[side==='blue'?'budget':'redBudget']<TYPES[type].cost)return {ok:false,error:'该方剩余部署点不足'};
  const u=spawn(s,type,side,p.x,p.y);log(s,`${u.name} 已部署`);return {ok:true,unit:u};
}
export function removeUnit(s,id){const u=unitById(s,id);if(!u||isHistorical(s)||s.phase!=='setup'||u.side==='red'&&!freeDeploy(s))return false;s.units=s.units.filter(v=>v.id!==id);s[u.side==='blue'?'budget':'redBudget']+=TYPES[u.type].cost;for(const v of s.units)if(v.leader===id)v.leader=null;log(s,`${u.name} 已撤回`);return true;}
function assignHome(s,u){
  const base=s.units.filter(v=>v.side===u.side&&(v.type==='airbase'||deckCompatible(v.type,u.type))&&v.hp>0).sort((a,b)=>distance(u,a)-distance(u,b))[0],w=worldFor(s);
  const fallback=isAutoBattle(s)?{x:u.side==='blue'?w.width*.05:w.width*.95,y:w.height*.5}:geographicMap(s)?{x:w.width*.8,y:w.height*.85}:{x:u.side==='blue'?12:229,y:u.side==='blue'?40:153};
  u.home=base?{x:base.x,y:base.y,baseId:base.id}:{...fallback,baseId:null};
}
export function start(s){
  if(s.phase==='ended')return {ok:false,error:'推演已结束'};
  if(isAutoBattle(s)&&s.phase!=='setup')return {ok:false,error:'请使用暂停或继续控制已开始的 AI 对战'};
  if(isAutoBattle(s))for(const side of ['blue','red'])if(!hasCombatPlatform(s,side,autoAPI()))return {ok:false,error:`请先部署至少一个${side==='blue'?'蓝':'红'}方战斗平台（支援机和基地不能单独参战）`};
  const autoDeployment=isAutoBattle(s)?serialize(s):null;
  for(const side of ['blue','red'])if(!(isHistorical(s)&&side==='red')&&!s.units.some(u=>u.side===side&&u.hp>0&&!u.exited&&!TYPES[u.type].support))return {ok:false,error:`请先部署至少一个${side==='blue'?'蓝':'红'}方战斗单位`};
  for(const u of s.units)if(TYPES[u.type].domain==='air'&&!u.home)assignHome(s,u);
  s.phase='running';s.paused=false;if(isAutoBattle(s))beginAutomation(s,autoDeployment,autoAPI());scan(s);log(s,'推演开始。双方遵循相同探测与交战规则。');return {ok:true};
}
const controllable=(s,u)=>u&&u.hp>0&&!u.exited&&s.phase!=='ended'&&!(isAutoBattle(s)&&s.phase==='running')&&(u.side==='blue'||s.phase==='setup'&&freeDeploy(s));
export function setRoute(s,id,p,append=false){
  const u=unitById(s,id);if(!controllable(s,u))return {ok:false,error:'请选择可用蓝方单位'};
  if(TYPES[u.type].domain==='land')return {ok:false,error:'岸基阵地为固定单位'};
  if(['returning','servicing','grounded'].includes(u.flightState))return {ok:false,error:'飞机正在返航或补给，暂不能更改航线'};
  if(!inBounds(p,s))return {ok:false,error:'航点超出海域'};
  const from=append&&u.route.length?u.route.at(-1):u;
  if(TYPES[u.type].domain!=='air'&&!clearPath(from,p,s))return {ok:false,error:'航线穿越陆地，请设置中间航点'};
  if(append&&u.route.length>=16)return {ok:false,error:'航线最多包含 16 个航点'};
  u.refuelTarget=null;u.leader=null;u.route=append?[...u.route,{...p}]:[{...p}];if(u.speed===0)u.speed=Math.round(TYPES[u.type].speed*.55);
  log(s,`${u.name}：${append?'追加':'更新'}航点 ${p.x.toFixed(0)}, ${p.y.toFixed(0)} nm`);return {ok:true};
}
export function setSpeed(s,id,value){
  const u=unitById(s,id);if(!controllable(s,u)||!Number.isFinite(value))return {ok:false,error:'速度无效'};
  if(TYPES[u.type].domain==='land'||['returning','servicing','grounded'].includes(u.flightState))return {ok:false,error:'当前单位不能调整速度'};
  const min=TYPES[u.type].domain==='air'&&!TYPES[u.type].rotary?Math.round(TYPES[u.type].speed*.4):0;u.speed=Math.max(min,Math.min(maxSpeed(u),value));return {ok:true};
}
export function setAltitude(s,id,value){const u=unitById(s,id);if(!controllable(s,u)||!airborne(u)||!Object.hasOwn(ALTITUDES,value)||!(TYPES[u.type].altitudes|| (TYPES[u.type].rotary?['low']:Object.keys(ALTITUDES))).includes(value))return {ok:false,error:'当前平台无法使用该高度'};u.altitude=value;log(s,`${u.name} 改为${ALTITUDES[value].name}`);return {ok:true};}
export function returnToBase(s,id){const u=unitById(s,id);if(!u||u.hp<=0||!airborne(u)||s.phase!=='running')return {ok:false,error:'只有推演中的在空飞机可以返航'};if(!u.home)assignHome(s,u);u.refuelTarget=null;u.flightState='returning';u.route=[{x:u.home.x,y:u.home.y}];u.speed=Math.round(TYPES[u.type].speed*.7);log(s,`${u.side==='blue'?u.name:'红方飞机'} 返航补给`);return {ok:true};}
export function formFleet(s,leaderId){
  const leader=unitById(s,leaderId);if(!controllable(s,leader)||leader.side!=='blue'||TYPES[leader.type].domain!=='surface')return {ok:false,error:'请选择蓝方水面舰作为旗舰'};
  let n=0;for(const u of s.units.filter(u=>u.side==='blue'&&u.hp>0&&!u.exited&&u.id!==leaderId&&TYPES[u.type].domain==='surface')){u.leader=leaderId;u.offset={x:(n%2===0?-1:1)*(6+Math.floor(n/2)*4),y:8+Math.floor(n/2)*5};u.route=[];u.speed=Math.min(leader.speed,maxSpeed(u));n++;}log(s,`${leader.name} 为旗舰，${n} 艘舰艇跟随`);return {ok:true};
}
function jammingAgainst(s,u){return s.units.some(v=>v.side!==u.side&&v.hp>0&&v.jamming&&airborne(v)&&distance(u,v)<=TYPES[v.type].jammer);}
function detection(s,observer,target){
  if(TYPES[observer.type].domain==='air'&&!airborne(observer))return null;
  const t=TYPES[observer.type],d=distance(observer,target),weather=s.weather==='storm'?.78:1,domain=domainOf(target);
  if(domain==='sub'||t.model&&t.domain==='sub'&&domain==='surface'){
    const flightOK=observer.type==='helicopter'||t.sonarMode==='dipping'?observer.altitude==='low'&&observer.speed<=40:observer.type==='patrol'||t.sonarMode==='buoy'?observer.altitude==='low':true;
    const noise=target.speed>18?1.2:target.speed<8?.72:1;
    const range=t.sonar*weather*(observer.speed>18&&t.domain!=='air'?.45:observer.speed>10&&t.domain!=='air'?.75:1)*noise*(TYPES[target.type].acoustic||1);
    if(observer.sonar&&flightOK&&d<=range&&clearPath(observer,target,s))return {source:'声呐',quality:d<5?'track':'search'};
    if(domain==='sub'){
      if(TYPES[target.type].model&&target.depth==='periscope'){
        if(radioAvailable(observer)&&observer.esm&&radarWorking(s,target)&&d<=t.esm*weather)return {source:'电子支援',quality:'bearing'};
        if(t.domain!=='sub'&&clearPath(observer,target,s)){if(d<2*weather)return {source:'目视',quality:'track'};if(radarWorking(s,observer)&&d<=Math.min(t.radar*.25,radarHorizon(observer,target)))return {source:'雷达',quality:'search'};}
      }return null;
    }
  }
  const range=Math.min(t.radar*weather*(observer.hp<t.hp*.4?.65:1)*(jammingAgainst(s,observer)?.58:1)*Math.pow(TYPES[target.type].signature*(TYPES[target.type].loadouts?.find(l=>l.id===target.loadout)?.external?2.5:1),.25),radarHorizon(observer,target));
  if(radarWorking(s,observer)&&t.radar>0&&d<=range&&!(isHistorical(s)&&domain==='air'&&target.altitude==='low'&&!airborne(observer)&&!clearPath(observer,target,s))&&((domain==='air'||airborne(observer)||domain==='land')||clearPath(observer,target,s)))return {source:'雷达',quality:'search'};
  if(d<(t.eoRange||5)*(s.weather==='storm'?.4:1)&&t.domain!=='sub'&&(airborne(observer)||clearPath(observer,target,s)||domain==='land'))return {source:'目视',quality:'track'};
  if(radioAvailable(observer)&&observer.esm&&(radarWorking(s,target)||target.jamming&&airborne(target))&&d<=t.esm*weather)return {source:'电子支援',quality:'bearing'};return null;
}
const domainName={air:'空中',sub:'水下',surface:'水面',land:'陆地'};
export function scan(s){
  for(const side of ['blue','red']){
    const own=s.units.filter(u=>u.side===side&&u.hp>0&&!u.exited);
    for(const target of s.units.filter(u=>u.side!==side&&u.hp>0&&!u.exited)){
      const observations={};for(const u of own){const found=detection(s,u,target);if(found)observations[u.id]={...found,time:s.time};}
      const found=Object.values(observations);if(!found.length)continue;
      const old=s.contacts[side][target.id],precise=found.filter(o=>o.quality!=='bearing'),best=found.find(o=>o.quality==='track')||precise[0]||found[0];
      const elapsed=old?Math.min(3,Math.max(0,s.time-old.time)):0;
      const progress=precise.length?(old&&old.quality!=='bearing'&&s.time-old.time<=6?old.progress||0:0)+elapsed*(precise.length>1?1.5:1):0;
      const quality=best.quality==='track'||progress>=(best.source==='声呐'?12:9)?'track':best.quality==='bearing'?'bearing':'search';
      const index=Number(target.id.slice(1)),error=quality==='bearing'?6:quality==='search'?1.5:0;
      s.contacts[side][target.id]={id:target.id,x:Math.max(1,Math.min(worldFor(s).width-.25,target.x+Math.sin(index*3)*error)),y:Math.max(1,Math.min(worldFor(s).height-.25,target.y+Math.cos(index*2)*error)),time:s.time,progress:Math.min(progress,30),quality,source:best.source,observations,domain:domainOf(target),altitude:target.altitude,emitting:radarWorking(s,target),label:`${domainName[domainOf(target)]}接触 ${String(index).padStart(2,'0')}`};
      if(!old&&side==='blue')log(s,`新接触：${s.contacts.blue[target.id].label} · ${best.source}`,'sensor');
      if(old?.quality!=='track'&&quality==='track'&&side==='blue')log(s,`${s.contacts.blue[target.id].label} 航迹已确认`,'sensor');
    }
    for(const [id,c] of Object.entries(s.contacts[side]))if(s.time-c.time>90)delete s.contacts[side][id];
  }
}
export function visibleContacts(s,side='blue'){return Object.values(s.contacts[side]).map(c=>({...c,stale:s.time-c.time>6}));}
function usableContact(s,u,c){
  if(!c||s.time-c.time>6)return false;
  const local=c.observations?.[u.id];if(local&&s.time-local.time<=6&&local.quality!=='bearing')return true;
  return radioAvailable(u)&&u.datalink&&!jammingAgainst(s,u)&&Object.entries(c.observations||{}).some(([id,o])=>{const v=unitById(s,id);return v?.hp>0&&radioAvailable(v)&&v.datalink&&!jammingAgainst(s,v)&&s.time-o.time<=6&&o.quality!=='bearing';});
}
const channelsUsed=(s,u)=>s.missiles.filter(m=>m.shooter===u.id&&m.guidance==='semi').length;
export function fireCheck(s,shooterId,targetId,weapon){
  const u=unitById(s,shooterId),target=unitById(s,targetId);
  if(s.phase!=='running')return {ok:false,error:'请先开始推演'};
  if(!u||!target||u.hp<=0||target.hp<=0||u.exited||target.exited||u.side===target.side||!Object.hasOwn(WEAPONS,weapon))return {ok:false,error:'目标不可用'};
  if(TYPES[u.type].domain==='air'&&(!airborne(u)||u.flightState==='returning'))return {ok:false,error:'飞机正在返航或补给'};
  if(!u.weapons[weapon])return {ok:false,error:'弹药耗尽或未配备'};
  const w=weaponStats(u,weapon),c=s.contacts[u.side][targetId];
  if(!c||!w.targets.includes(c.domain))return {ok:false,error:'武器不适用于此类目标或目标未被发现'};
  const passive=weapon==='arm'&&c.emitting&&s.time-c.time<=6;
  if(!passive&&(c.quality!=='track'||!usableContact(s,u,c)))return {ok:false,error:c.quality==='search'?'航迹正在建立，请等待确认':'需要本机或可用数据链的有效航迹'};
  if(passive&&!u.esm&&!usableContact(s,u,c))return {ok:false,error:'需要电子支援或有效数据链'};
  const d=distance(u,c);if(d>w.range||d<w.minRange)return {ok:false,error:d>w.range?'目标超出武器射程':'目标位于最小射程以内'};
  if(['torpedo','asroc','gun','atgm'].includes(weapon)&&!clearPath(u,c,s))return {ok:false,error:'近海武器航路受到陆地遮挡'};
  if(weapon==='atgm'&&(!c.observations?.[u.id]||c.observations[u.id].quality==='bearing'))return {ok:false,error:'轻型攻击武器需要本机有效观测'};
  if(TYPES[u.type].domain==='sub'&&['asm','supersonic','cruise'].includes(weapon)&&u.depth==='deep')return {ok:false,error:'潜射导弹需要上浮至潜望镜深度'};
  if(w.guidance==='semi'&&(!radarWorking(s,u)||c.observations?.[u.id]?.source!=='雷达'))return {ok:false,error:'该半主动武器需要本平台持续雷达照射'};
  if(w.guidance==='semi'&&channelsUsed(s,u)>=TYPES[u.type].channels)return {ok:false,error:'火控通道占满'};
  if(weapon==='sam'&&u.weapons.sam<=u.samReserve)return {ok:false,error:'已达到防空自卫保留弹药数'};
  if((u.cooldowns[weapon]||0)>s.time)return {ok:false,error:'该武器发射系统冷却中'};
  if(s.missiles.length>=200)return {ok:false,error:'在途武器已达上限'};return {ok:true};
}
function launch(s,u,target,key,targetKind='unit'){
  const w=weaponStats(u,key),c=targetKind==='unit'?s.contacts[u.side][target.id]:target;
  recordAutoShot(s,u,key);u.weapons[key]--;u.cooldowns[key]=s.time+w.cooldown*(u.hp<TYPES[u.type].hp*.4?1.5:1);
  const m={id:`m${++s.nextMissile}`,shooter:u.id,target:target.id,targetKind,side:u.side,weapon:key,x:u.x,y:u.y,travel:0,heading:bearing(u,c),trail:[],aim:{x:c.x,y:c.y},launchDistance:distance(u,c),range:w.range,guidance:w.guidance,guidanceTime:s.time,seekerLocked:false,decoyTried:false,ciwsTried:[]};
  s.missiles.push(m);return m;
}
export function fire(s,shooterId,targetId,weapon){const check=fireCheck(s,shooterId,targetId,weapon);if(!check.ok)return check;const u=unitById(s,shooterId);launch(s,u,unitById(s,targetId),weapon);log(s,`${u.side==='blue'?u.name:'红方单位'} 发射${weaponStats(u,weapon).name} → ${u.side==='blue'?s.contacts.blue[targetId].label:'蓝方接触'}`,u.side==='blue'?'combat':'warning');return {ok:true};}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function move(s,u,dt){
  const t=TYPES[u.type];if(t.domain==='land'||t.domain==='air'&&!airborne(u))return;
  let goal=u.route[0];if(u.leader){const leader=unitById(s,u.leader);if(leader?.hp>0){goal={x:leader.x+u.offset.x,y:leader.y+u.offset.y};if(distance(u,goal)<1.5)return;}else{u.leader=null;u.offset=null;}}
  if(!goal&&t.domain==='air'&&!TYPES[u.type].rotary){
    u.heading=(u.heading+dt*2)%360;const step=Math.min(u.speed,maxSpeed(u))*dt/3600,next={x:u.x+Math.sin(u.heading*Math.PI/180)*step,y:u.y-Math.cos(u.heading*Math.PI/180)*step};
    if(inBounds(next,s)){u.x=next.x;u.y=next.y;}else u.heading=(u.heading+180)%360;return;
  }
  if(!goal||u.speed===0)return;const d=distance(u,goal),step=Math.min(u.speed,maxSpeed(u))*dt/3600;u.heading=bearing(u,goal);
  const next={x:u.x+(goal.x-u.x)*Math.min(1,step/(d||1)),y:u.y+(goal.y-u.y)*Math.min(1,step/(d||1))};
  if(!inBounds(next,s)||t.domain!=='air'&&!clearPath(u,next,s)){u.route=[];u.leader=null;log(s,`${u.side==='blue'?u.name:'红方单位'} 航路受阻`,'warning');return;}
  if(s.time%5<dt){u.trail.push({x:u.x,y:u.y});u.trail=u.trail.slice(-80);}u.x=next.x;u.y=next.y;if(d<=step&&!u.leader)u.route.shift();
}
export function deckCompatible(shipType,airType){const deck=TYPES[shipType]?.deck,air=TYPES[airType];return !!deck&&air?.domain==='air'&&(air.carrierModes||[]).some(mode=>deck.modes.includes(mode));}
export function setLoadout(s,id,loadoutId){
  const u=unitById(s,id),t=TYPES[u?.type],row=t?.loadouts?.find(l=>l.id===loadoutId);
  if(!u||!controllable(s,u)||!row||s.phase!=='setup'&&u.flightState!=='servicing')return {ok:false,error:'部署阶段或飞机补给期间才可更换挂载'};
  u.loadout=row.id;u.weapons=s.phase==='setup'?ammo(row.weapons):ammo(Object.fromEntries(Object.entries(u.weapons).map(([k,n])=>[k,Math.min(n,row.weapons[k]||0)])));u.samReserve=Math.min(u.samReserve,u.weapons.sam);log(s,`${u.name} 选择${row.name}`);return {ok:true};
}
export function setDepth(s,id,depth){const u=unitById(s,id);if(!controllable(s,u)||TYPES[u.type].domain!=='sub'||!['deep','periscope'].includes(depth))return {ok:false,error:'请选择可用潜艇'};u.depth=depth;log(s,`${u.name} ${depth==='deep'?'深潜：无线电与数据链不可用':'潜望镜深度：可接收数据链与发射潜射导弹'}`);return {ok:true};}
const deckAirborne=(s,base)=>s.units.filter(v=>v.hp>0&&!v.exited&&v.home?.baseId===base.id&&TYPES[v.type].domain==='air'&&airborne(v)).length;
export function launchDeck(s,id,type,loadoutId){
  const base=unitById(s,id),t=TYPES[base?.type],deck=t?.deck;
  if(s.phase!=='running'||!base||base.hp<=0||base.exited||!deck)return {ok:false,error:'开始推演后才能放飞舰载机'};
  if(!deckCompatible(base.type,type)||!base.airwing[type])return {ok:false,error:'甲板不兼容或机库没有该型号'};
  if(base.hp<t.hp*.4)return {ok:false,error:'舰体重伤，甲板停止放飞'};
  if(base.deckReady>s.time)return {ok:false,error:`甲板准备中，剩余 ${Math.ceil(base.deckReady-s.time)} 秒`};
  if(deckAirborne(s,base)>=deck.capacity)return {ok:false,error:'已达本舰在空容量，请等待回收'};
  if(s.units.length>=60)return {ok:false,error:'战局单位数量已达 60 个上限'};
  const row=loadoutId?TYPES[type].loadouts.find(l=>l.id===loadoutId):TYPES[type].loadouts[0];if(!row)return {ok:false,error:'任务挂载无效'};
  const u=makeUnit(s,type,base.side,base.x,base.y);u.originDeck=base.id;u.home={x:base.x,y:base.y,baseId:base.id};u.loadout=row.id;u.weapons=ammo(row.weapons);u.speed=Math.round(TYPES[type].speed*.65);s.units.push(u);recordAutoSortie(s,u);base.airwing[type]--;base.deckReady=s.time+deck.cooldown*(s.weather==='storm'?1.5:1);log(s,`${base.side==='blue'?base.name:'红方航空舰'} 放飞${TYPES[type].name}`);return {ok:true,unit:u};
}
export function requestRefuel(s,id,tankerId){
  const u=unitById(s,id),donor=unitById(s,tankerId),t=TYPES[u?.type],dt=TYPES[donor?.type];
  if(s.phase!=='running'||!u||!donor||u===donor||u.side!==donor.side||u.hp<=0||donor.hp<=0||!airborne(u)||!airborne(donor)||donor.flightState!=='airborne'||t.tanker||!t.refuelSystem||!dt?.tanker||!dt.refuelSystems.includes(t.refuelSystem))return {ok:false,error:'需要同阵营、在空且受油接口兼容的加油机'};
  if(!donor.fuelSupply)return {ok:false,error:'加油机可供燃油已耗尽'};
  if(s.units.some(v=>v.id!==u.id&&v.refuelTarget===donor.id))return {ok:false,error:'加油机正在接待另一架受油机'};
  u.flightState='airborne';u.refuelTarget=donor.id;u.leader=null;log(s,`${u.name} 前往${donor.name}会合加油`);return {ok:true};
}
export function requestSupply(s,id,targetId){
  const u=unitById(s,id),target=unitById(s,targetId),cap=TYPES[target?.type]?.baseSupply||0;
  if(s.phase!=='running'||!u||!target||u.side!==target.side||u===target||u.hp<=0||target.hp<=0||!TYPES[u.type].supplyShip||!TYPES[target.type].deck||!u.supply||target.supply>=cap)return {ok:false,error:'需要有库存的补给舰与待补充航空舰'};
  if(distance(u,target)>1.5||u.speed>12||target.speed>12||!clearPath(u,target,s))return {ok:false,error:'两舰须在 1.5 海里内、航速不超过 12 节且无陆地阻挡'};
  u.supplyTarget=target.id;log(s,`${u.name} 开始向${target.name}转移航空补给`);return {ok:true};
}
function modernSupport(s,dt){
  for(const u of s.units){const t=TYPES[u.type];if(u.hp<=0||u.exited)continue;
    if(u.refuelTarget){const donor=unitById(s,u.refuelTarget),d=TYPES[donor?.type];
      if(!donor||donor.hp<=0||donor.exited||donor.flightState!=='airborne'||!airborne(u)||!donor.fuelSupply||!d?.refuelSystems?.includes(t.refuelSystem)){u.refuelTarget=null;u.route=[];continue;}
      u.altitude=donor.altitude;u.route=[{x:donor.x,y:donor.y}];u.speed=Math.min(maxSpeed(u),distance(u,donor)>1.2?t.speed*.9:donor.speed);
      if(distance(u,donor)<=1.2&&Math.abs(u.speed-donor.speed)<=70){const amount=Math.min(dt*(d.refuelRate||14),donor.fuelSupply,t.endurance*60-u.fuel);u.fuel+=amount;donor.fuelSupply-=amount;
        if(u.fuel>=t.endurance*60*.95||donor.fuelSupply<=0){u.refuelTarget=null;u.route=[];log(s,`${u.side==='blue'?u.name:'红方飞机'} 完成空中加油`);}}
    }
    if(u.supplyTarget){const target=unitById(s,u.supplyTarget),cap=TYPES[target?.type]?.baseSupply||0;
      if(!target||target.hp<=0||target.exited||distance(u,target)>1.5||u.speed>12||target.speed>12||!clearPath(u,target,s)){u.supplyTarget=null;continue;}
      const amount=Math.min(dt/15,u.supply,cap-target.supply);u.supply-=amount;target.supply+=amount;if(u.supply<=0||target.supply>=cap)u.supplyTarget=null;
    }
  }
}
function modernAI(s){
  for(const u of [...s.units]){if(u.side!=='red'||u.hp<=0||u.exited)continue;const t=TYPES[u.type];
    if(t.deck){
      const contacts=visibleContacts(s,'red').filter(c=>!c.stale),priority=key=>['awacs','heloAwacs'].includes(TYPES[key].role)?-3:TYPES[key].role==='sead'?-2:TYPES[key].sonar&&contacts.some(c=>c.domain==='sub')?-1:0;
      const keys=Object.keys(u.airwing).sort((a,b)=>priority(a)-priority(b));
      const cap=s.units.some(v=>v.side==='red'&&v.hp>0&&airborne(v)&&['fighter','navalAir'].includes(TYPES[v.type].category)&&v.weapons.aam>0);
      for(const key of keys)if(u.airwing[key]>0){const naval=cap&&contacts.some(c=>c.domain==='surface')&&TYPES[key].loadouts.find(l=>l.id==='naval');launchDeck(s,u.id,key,naval?.id);break;}
    }
    if(t.model&&t.domain==='sub'&&visibleContacts(s,'red').some(c=>c.domain==='surface'&&c.quality==='track'&&!c.stale))u.depth='periscope';
    if(t.refuelSystem&&u.flightState==='airborne'&&u.fuel<t.endurance*30&&!u.refuelTarget){const donor=s.units.find(v=>v.side===u.side&&v.hp>0&&TYPES[v.type].tanker&&TYPES[v.type].refuelSystems.includes(t.refuelSystem)&&v.fuelSupply>0&&distance(u,v)<50);if(donor)requestRefuel(s,u.id,donor.id);}
  }
}

function aviation(s,u,dt){
  const t=TYPES[u.type];if(!t.endurance)return;
  const homeBase=u.home?.baseId?unitById(s,u.home.baseId):null;
  if(homeBase&&TYPES[homeBase.type].deck){
    u.home.x=homeBase.x;u.home.y=homeBase.y;if(u.flightState==='returning')u.route=[{x:homeBase.x,y:homeBase.y}];
    if(!airborne(u)){u.x=homeBase.x;u.y=homeBase.y;if(homeBase.hp<=0){u.hp=0;return;}}
  }
  if(u.flightState==='servicing'){
    const base=u.home.baseId?unitById(s,u.home.baseId):null;
    if(u.home.baseId&&(!base||base.hp<=0)){u.flightState='grounded';log(s,`${u.side==='blue'?u.name:'红方飞机'} 补给基地损失，停飞`,'warning');return;}
    if(s.time>=u.serviceUntil&&(!base||!TYPES[base.type].deck||base.hp>=TYPES[base.type].hp*.4&&base.deckReady<=s.time&&deckAirborne(s,base)<TYPES[base.type].deck.capacity)){if(base&&TYPES[base.type].deck)base.deckReady=s.time+TYPES[base.type].deck.cooldown;u.deckBased=false;u.fuel=t.endurance*60;u.weapons=ammo(t.loadouts?.find(l=>l.id===u.loadout)?.weapons||t.weapons);u.decoys=t.decoys;u.flightState='airborne';u.sorties++;recordAutoSortie(s,u);u.altitude=t.altitude||'medium';u.speed=Math.min(maxSpeed(u),Math.round(t.speed*.65));log(s,`${u.side==='blue'?u.name:'红方飞机'} 补给完成，重新出动`);}return;
  }
  if(u.flightState==='grounded')return;
  u.fuel=Math.max(0,u.fuel-dt*(.7+.3*u.speed/(t.speed*.65)));
  if(u.fuel===0){u.hp=0;log(s,`${u.side==='blue'?u.name:'红方飞机'} 燃油耗尽，损失`,'warning');return;}
  if(!u.home)assignHome(s,u);const returnSpeed=Math.min(t.speed*.7,maxSpeed(u));
  const reserve=120+distance(u,u.home)/Math.max(1,returnSpeed)*3600*(.7+.3*returnSpeed/(t.speed*.65))*1.08;
  if(u.flightState==='airborne'&&!u.refuelTarget&&u.fuel<=reserve)returnToBase(s,u.id);
  if(u.flightState==='returning'&&distance(u,u.home)<.5){
    const base=u.home.baseId?unitById(s,u.home.baseId):null,cost=Math.max(2,Math.ceil(t.cost/4));
    u.deckBased=!!base&&!!TYPES[base.type].deck;
    if(u.home.baseId&&(!base||base.hp<=0||base.supply<cost)||!u.home.baseId&&u.sorties>=2){u.flightState='grounded';u.speed=0;u.route=[];log(s,`${u.side==='blue'?u.name:'红方飞机'} 已降落，补给不可用`,'warning');return;}
    u.deckBased=!!base&&!!TYPES[base.type].deck;if(base)base.supply-=cost;u.flightState='servicing';u.serviceUntil=s.time+240;u.speed=0;u.altitude='low';u.route=[];log(s,`${u.side==='blue'?u.name:'红方飞机'} 降落，四分钟后完成加油装弹`);
  }
}
function combatAI(s){
  for(const u of s.units.filter(u=>u.autoEngage&&u.hp>0&&!u.exited&&(TYPES[u.type].domain!=='air'||airborne(u)&&u.flightState!=='returning'))){
    if(TYPES[u.type].support)continue;
    if(!isAutoBattle(s)&&u.missionRole==='raider'&&!u.weapons.bomb){if(u.flightState==='airborne')returnToBase(s,u.id);continue;}
    const contacts=visibleContacts(s,u.side).filter(c=>!c.stale&&Object.keys(WEAPONS).some(key=>u.weapons[key]>0&&WEAPONS[key].targets.includes(c.domain))).sort((a,b)=>(!isAutoBattle(s)&&u.missionRole==='raider'?(unitById(s,a.id)?.missionRole==='transport'?0:1)-(unitById(s,b.id)?.missionRole==='transport'?0:1):0)||(a.domain==='air'?0:1)-(b.domain==='air'?0:1)||distance(u,a)-distance(u,b));
    for(const c of contacts){
      if(c.domain==='air'&&s.missiles.filter(m=>m.side===u.side&&m.targetKind==='unit'&&m.target===c.id).length>=2)continue;
      let fired=false;for(const key of ['ir','aam','sam','point','arm','supersonic','asm','asroc','torpedo','atgm','pgm','bomb','cruise','gun'])if(fireCheck(s,u.id,c.id,key).ok){fire(s,u.id,c.id,key);fired=true;break;}if(fired)break;
    }
    if(isAutoBattle(s)||u.side!=='red'||TYPES[u.type].domain==='land'||isHistorical(s)&&['escape','mainTarget'].includes(u.missionRole))continue;
    if(u.refuelTarget)continue;
    const target=contacts.find(c=>c.quality==='track'&&usableContact(s,u,c));if(!target)continue;
    const ranges=Object.keys(WEAPONS).filter(key=>u.weapons[key]>0&&WEAPONS[key].targets.includes(target.domain)).map(key=>weaponStats(u,key).range*.65),desired=Math.max(...ranges,.5),d=distance(u,target);
    if(d>desired&&(TYPES[u.type].domain==='air'||clearPath(u,target,s)))u.route=[{x:Math.max(1,Math.min(worldFor(s).width-.25,target.x)),y:Math.max(1,Math.min(worldFor(s).height-.25,target.y))}];
    else if(TYPES[u.type].domain==='air'&&d<desired*.45){const a=bearing(target,u)*Math.PI/180;u.route=[{x:Math.max(1,Math.min(worldFor(s).width-.25,u.x+Math.sin(a)*8)),y:Math.max(1,Math.min(worldFor(s).height-.25,u.y-Math.cos(a)*8))}];}else u.route=[];
  }
}
export const projectileStats=(s,m)=>weaponStats(unitById(s,m.shooter),m.weapon);
export function missileVisible(s,m,side='blue'){
  if(m.side===side)return true;if(m.weapon==='torpedo')return false;
  return s.units.some(u=>u.side===side&&u.hp>0&&!u.exited&&(distance(u,m)<2||radarWorking(s,u)&&distance(u,m)<=Math.min(TYPES[u.type].radar*(s.weather==='storm'?.78:1),2.23*(Math.sqrt(heightOf(u))+Math.sqrt(projectileStats(s,m).height)))));
}
function defend(s){
  const incoming=s.missiles.filter(m=>m.targetKind==='unit'&&!['torpedo','bomb','gun'].includes(m.weapon));
  for(const u of s.units.filter(u=>u.hp>0&&!u.exited&&u.autoDefense&&radarWorking(s,u)&&u.defenseCooldown<=s.time)){
    if(TYPES[u.type].domain==='air'||s.missiles.length>=200)continue;
    for(const m of incoming.filter(m=>m.side!==u.side).sort((a,b)=>distance(u,a)-distance(u,b))){
      if(!missileVisible(s,m,u.side))continue;
      const local=distance(u,m)<=Math.min(TYPES[u.type].radar,2.23*(Math.sqrt(heightOf(u))+Math.sqrt(projectileStats(s,m).height)));
      const network=u.datalink&&!jammingAgainst(s,u)&&s.units.some(v=>v.side===u.side&&v.datalink&&radarWorking(s,v)&&!jammingAgainst(s,v)&&distance(v,m)<=Math.min(TYPES[v.type].radar,2.23*(Math.sqrt(heightOf(v))+Math.sqrt(projectileStats(s,m).height))));
      if(!local&&!network||s.missiles.some(v=>v.targetKind==='missile'&&v.target===m.id&&v.side===u.side))continue;
      for(const key of ['sam','point']){const w=weaponStats(u,key),d=distance(u,m);
        if(!u.weapons[key]||d>w.range||d<w.minRange||(u.cooldowns[key]||0)>s.time||w.guidance==='semi'&&(!local||channelsUsed(s,u)>=TYPES[u.type].channels))continue;
        launch(s,u,m,key,'missile');u.defenseCooldown=s.time+3;log(s,`${u.side==='blue'?u.name:'红方防空系统'} 发射${w.name}拦截来袭武器`,u.side==='blue'?'combat':'warning');break;
      }if(u.defenseCooldown>s.time)break;
    }
  }
}
function interceptClose(s,m){
  if(m.targetKind==='missile'||['torpedo','bomb','gun'].includes(m.weapon))return false;
  for(const u of s.units.filter(u=>u.side!==m.side&&u.hp>0&&!u.exited&&u.autoDefense&&u.ciws>0&&u.defenseCooldown<=s.time&&distance(u,m)<1.8)){
    if(m.ciwsTried.includes(u.id))continue;m.ciwsTried.push(u.id);recordAutoShot(s,u,'ciws');u.ciws--;u.defenseCooldown=s.time+3;
    if(random(s)<(m.weapon==='supersonic'?.40:.60)){recordAutoIntercept(s,u.side);s.effects.push({x:m.x,y:m.y,time:s.time,kind:'intercept'});log(s,`${u.side==='blue'?u.name:'红方近防系统'} 近防拦截成功`,'combat');return true;}
  }return false;
}
function guidance(s,m,target){
  const shooter=unitById(s,m.shooter),w=projectileStats(s,m);
  if(m.targetKind==='missile'){
    const local=shooter&&radarWorking(s,shooter)&&distance(shooter,target)<=Math.min(TYPES[shooter.type].radar,2.23*(Math.sqrt(heightOf(shooter))+Math.sqrt(projectileStats(s,target).height)));
    if(local){m.aim={x:target.x,y:target.y};m.guidanceTime=s.time;}
  }else{
    const c=s.contacts[m.side][m.target],radarGuide=shooter&&radarWorking(s,shooter)&&c?.observations?.[shooter.id]?.source==='雷达';
    if(m.guidance!=='inertial'&&c?.quality==='track'&&shooter&&usableContact(s,shooter,c)&&(m.guidance!=='semi'||radarGuide)){m.aim={x:c.x,y:c.y};m.guidanceTime=s.time;}
  }
  // 末段导引头只有进入自身搜索范围，才可使用目标当前位置。
  if(w.seeker&&distance(m,target)<=w.seeker&&(m.guidance!=='passive'||radarWorking(s,target))&&(m.weapon!=='torpedo'||clearPath(m,target,s))){m.seekerLocked=true;m.aim={x:target.x,y:target.y};m.guidanceTime=s.time;}else m.seekerLocked=false;
  return m.guidance!=='semi'||s.time-m.guidanceTime<=6;
}
function hitChance(s,m,target){
  const w=projectileStats(s,m),ratio=m.launchDistance/m.range;let chance=w.hit*(ratio>.8?.64:ratio>.55?.85:1)*(s.weather==='storm'?.88:1);
  if(m.guidance==='semi'&&s.time-m.guidanceTime>3)chance*=.55;
  if(m.targetKind==='unit'){
    if(airborne(target))chance*=1-(TYPES[target.type].evasion||0)-(target.altitude==='low'?.07:0);
    if(jammingAgainst(s,m))chance*=.8;
    if(target.autoDefense&&target.decoys>0&&!m.decoyTried){target.decoys--;m.decoyTried=true;chance*=m.weapon==='torpedo'?.7:.65;}
    if(m.guidance==='passive'&&!radarWorking(s,target))chance*=.3;
  }return Math.max(.08,Math.min(.93,chance));
}
function damage(s,target,m){
  recordAutoDamage(s,target,unitById(s,m.shooter),Math.min(target.hp,projectileStats(s,m).damage),autoAPI());target.hp=Math.max(0,target.hp-projectileStats(s,m).damage);target.speed=Math.min(target.speed,maxSpeed(target));
  if(m.weapon==='arm'&&target.hp>0){target.radarDisabledUntil=s.time+180;log(s,`${target.side==='blue'?target.name:'红方雷达'} 受压制，三分钟内无法工作`,'combat');}
  if(target.hp===0){log(s,`${target.side==='blue'?target.name:'红方接触'} 被摧毁`,'combat');for(const side of ['blue','red'])delete s.contacts[side][target.id];}else log(s,`${projectileStats(s,m).name} 命中${target.side==='blue'?target.name:'红方接触'}`,'combat');
}
function updateMissiles(s,dt){
  const removed=new Set(),keep=[];
  for(const m of [...s.missiles].sort((a,b)=>(a.targetKind==='missile'?0:1)-(b.targetKind==='missile'?0:1))){
    if(removed.has(m.id))continue;
    const target=m.targetKind==='missile'?s.missiles.find(v=>v.id===m.target&&!removed.has(v.id)):unitById(s,m.target),w=projectileStats(s,m);
    if(!target||m.targetKind==='unit'&&(target.hp<=0||target.exited))continue;if(interceptClose(s,m))continue;
    const valid=guidance(s,m,target),travel=w.speed*dt/3600,d=distance(m,m.aim);m.heading=bearing(m,m.aim);
    if(s.time%2<dt){m.trail.push({x:m.x,y:m.y});m.trail=m.trail.slice(-30);}
    if(d<=travel+.25){
      const hit=valid&&distance(m,target)<=travel+.65&&random(s)<hitChance(s,m,target);s.effects.push({x:m.aim.x,y:m.aim.y,time:s.time,kind:hit?'hit':'miss'});
      if(hit&&m.targetKind==='unit')damage(s,target,m);else if(hit){recordAutoIntercept(s,m.side);removed.add(target.id);log(s,`${m.side==='blue'?'蓝方':'红方'} 防空导弹拦截成功`,'combat');}else log(s,`${w.name} ${valid?'未命中或目标已离开最后位置':'失去雷达照射，脱靶'}`,'combat');continue;
    }
    m.x+=(m.aim.x-m.x)*Math.min(1,travel/d);m.y+=(m.aim.y-m.y)*Math.min(1,travel/d);m.travel+=travel;
    if(m.travel<=m.range*1.15&&inBounds(m,s)&&(m.weapon!=='torpedo'||!inLand(m,s)))keep.push(m);else log(s,`${w.name} 航程耗尽或航路受阻`,'combat');
  }
  const keptIds=new Set(keep.filter(m=>!removed.has(m.id)).map(m=>m.id));
  s.missiles=keep.filter(m=>!removed.has(m.id)&&(m.targetKind!=='missile'||keptIds.has(m.target)));
}
export function checkOutcome(s){
  if(isAutoBattle(s)){updateAutoOutcome(s,autoAPI());return;}
  if(isHistorical(s)||freeDeploy(s)||s.phase!=='running')return;
  const combat=side=>s.units.some(u=>u.side===side&&u.hp>0&&!u.exited&&!TYPES[u.type].support),blue=combat('blue'),red=combat('red');
  if(!blue&&s.missiles.some(m=>m.side==='blue'&&m.targetKind==='unit')||!red&&s.missiles.some(m=>m.side==='red'&&m.targetKind==='unit'))return;
  if(!blue||!red){s.phase='ended';s.paused=true;s.result=!blue&&!red?'draw':!blue?'defeat':'victory';log(s,!blue&&!red?'双方战斗单位全部损失。':!blue?'蓝方战斗单位全部损失。':'红方战斗单位全部被摧毁，任务完成。','combat');}
}
export function step(s,seconds){
  if(s.paused||s.phase!=='running'||!Number.isFinite(seconds)||seconds<=0)return;let remaining=Math.min(seconds,600);
  if(isAutoBattle(s)){const total=remaining+(s.automation.tickRemainder||0);remaining=Math.floor(total+1e-9);s.automation.tickRemainder=Math.max(0,total-remaining);}
  while(remaining>0&&s.phase==='running'){const dt=Math.min(1,remaining);remaining-=dt;s.time+=dt;
    modernSupport(s,dt);
    for(const u of s.units)if(u.hp>0&&!u.exited){aviation(s,u,dt);if(u.hp>0)move(s,u,dt);}
    s.sensorClock+=dt;s.aiClock+=dt;if(s.sensorClock>=3){scan(s);s.sensorClock%=3;}if(s.aiClock>=8){if(isAutoBattle(s))commandAutomation(s,autoAPI());else modernAI(s);combatAI(s);s.aiClock%=8;}
    defend(s);updateMissiles(s,dt);s.effects=s.effects.filter(e=>s.time-e.time<18);if(isHistorical(s))updateHistorical(s,dt,missionAPI());checkOutcome(s);
  }
}
export const serialize=s=>JSON.stringify(s);
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
function number(v,min,max,fallback){if(v===undefined&&fallback!==undefined)return fallback;if(!finite(v,min,max))throw Error('战局数值无效');return v;}
function point(p,s){if(!inBounds(p,s))throw Error('战局坐标无效');return {x:p.x,y:p.y};}
export function deserialize(text){
  if(typeof text!=='string'||text.length>1000000)throw Error('战局文件过大');const raw=JSON.parse(text),legacy=raw.version===1;
  if(![1,2,3,4,5,6].includes(raw.version)||!Object.hasOwn(SCENARIOS,raw.scenario)||!['setup','running','ended'].includes(raw.phase)||!Array.isArray(raw.units)||raw.units.length>60)throw Error('战局格式无效');
  if(raw.version<5&&raw.scenario==='autobattle')throw Error('旧存档不支持自动对战');
  const s=createState(raw.scenario);s.units=[];s.events=[];s.contacts={blue:{},red:{}};s.missiles=[];
  const expectedMap=SCENARIOS[raw.scenario].mapId||null;
  if(!isHistorical(s)&&raw.mapId!=null&&raw.mapId!==expectedMap&&!(raw.version>=6&&raw.scenario==='autobattle'&&getBattleTheatre(raw)))throw Error('战局海域无效');
  s.mapId=raw.scenario==='autobattle'&&raw.version>=6?raw.mapId||null:expectedMap;
  s.time=number(raw.time,0,1e8);s.budget=number(raw.budget,0,1000);s.redBudget=number(raw.redBudget,0,1000,SCENARIOS[raw.scenario].budget);
  s.phase=raw.phase;s.paused=true;s.seed=number(raw.seed,0,4294967295,712301);s.weather=raw.weather==='storm'?'storm':'clear';s.sensorClock=number(raw.sensorClock,0,3,0);s.aiClock=number(raw.aiClock,0,8,0);s.result=['victory','defeat','draw'].includes(raw.result)?raw.result:null;
  const ids=new Set();
  for(const r of raw.units){
    if(!Object.hasOwn(TYPES,r.type)||!['blue','red'].includes(r.side)||!/^u\d{1,5}$/.test(r.id)||ids.has(r.id)||!validPlacement(r.type,r,s)||!Array.isArray(r.route)||r.route.length>16)throw Error('战局单位参数无效');
    if(!canDeployType(s,r.type,r.side)||s.phase==='setup'&&!inDeploymentZone(s,r.side,r))throw Error('美中对战阵营或初始部署区无效');
    if(raw.version<4&&TYPES[r.type].model)throw Error('旧存档不支持现代型号');
    ids.add(r.id);const t=TYPES[r.type],u=makeUnit(s,r.type,r.side,r.x,r.y);u.id=r.id;u.exited=r.exited===true;u.missionRole=['escape','transport','flagship','mainTarget','raider'].includes(r.missionRole)?r.missionRole:null;
    for(const [key,max] of [['hp',t.hp],['speed',t.speed],['heading',360]])u[key]=number(r[key],0,max);
    for(const key of ['radar','sonar','esm','autoDefense','datalink','autoEngage','jamming'])u[key]=legacy&&['datalink','autoEngage'].includes(key)?key==='datalink'||r.side==='red':r[key]===true;
    u.name=typeof r.name==='string'?r.name.slice(0,36):u.name;u.route=r.route.map(p=>point(p,s));if(t.domain==='land'&&u.route.length)throw Error('岸基单位不能拥有航线');
    for(const key of Object.keys(WEAPONS)){
      const oldAir=legacy&&t.domain==='air'&&key==='aam',value=oldAir?r.weapons?.sam:legacy&&t.domain==='air'&&key==='sam'?0:r.weapons?.[key];
      u.weapons[key]=number(value,0,t.weapons[key],legacy||raw.version<4&&['gun','asroc','pgm','atgm'].includes(key)||raw.version===2&&['bomb','ir'].includes(key)?0:undefined);if(!Number.isInteger(u.weapons[key]))throw Error('战局弹药无效');
    }
    for(const [key,max,fallback] of [['fuel',t.endurance*60,t.endurance*60],['ciws',t.ciws,t.ciws],['decoys',t.decoys,t.decoys],['samReserve',t.weapons.sam,0],['supply',t.baseSupply||30,u.supply],['sorties',100,0],['serviceUntil',1e8,0],['radarDisabledUntil',1e8,0],['defenseCooldown',1e8,0]])u[key]=number(r[key],0,max,legacy?fallback:undefined);
    if(!['airborne','returning','servicing','grounded'].includes(r.flightState)&&!legacy)throw Error('战局航空状态无效');u.flightState=legacy?'airborne':r.flightState;
    if(t.domain==='air'&&airborne(u)&&!t.rotary)u.speed=Math.max(Math.round(t.speed*.4),u.speed);
    if(!Object.hasOwn(ALTITUDES,r.altitude)&&!legacy)throw Error('战局高度无效');u.altitude=legacy?t.altitude||'medium':r.altitude;
    if(raw.version>=4){
      if(t.loadouts&&!t.loadouts.some(l=>l.id===r.loadout))throw Error('任务挂载无效');u.loadout=r.loadout||null;
      const cap=t.loadouts?.find(l=>l.id===u.loadout)?.weapons||t.weapons;for(const key of Object.keys(WEAPONS))if(u.weapons[key]>(cap[key]||0))throw Error('弹药超过所选挂载');
      u.depth=t.domain==='sub'&&['deep','periscope'].includes(r.depth)?r.depth:u.depth;
      u.airwing={};for(const [key,max] of Object.entries(t.deck?.wing||{})){u.airwing[key]=number(r.airwing?.[key],0,max);if(!Number.isInteger(u.airwing[key]))throw Error('航空队数量无效');}
      u.deckReady=number(r.deckReady,0,1e8);u.fuelSupply=number(r.fuelSupply,0,t.fuelSupply||0);
      u.originDeck=typeof r.originDeck==='string'?r.originDeck:null;u.deckBased=r.deckBased===true;u.refuelTarget=typeof r.refuelTarget==='string'?r.refuelTarget:null;u.supplyTarget=typeof r.supplyTarget==='string'?r.supplyTarget:null;
    }
    u.ai=raw.version>=5&&r.ai?JSON.parse(JSON.stringify(r.ai)):null;
    u.cooldowns={};for(const key of Object.keys(WEAPONS))u.cooldowns[key]=number(r.cooldowns?.[key],0,1e8,legacy?r.cooldown||0:0);
    u.leader=typeof r.leader==='string'?r.leader:null;u.offset=r.offset&&finite(r.offset.x,-50,50)&&finite(r.offset.y,-50,50)?{x:r.offset.x,y:r.offset.y}:null;u.home=r.home?{...point(r.home,s),baseId:typeof r.home.baseId==='string'?r.home.baseId:null}:null;s.units.push(u);
  }
  s.nextId=Math.max(0,...s.units.map(u=>Number(u.id.slice(1))));
  for(const u of s.units){const leader=unitById(s,u.leader);if(u.leader&&(!leader||leader.id===u.id||leader.leader||leader.side!==u.side||!u.offset||TYPES[leader.type].domain!=='surface'||TYPES[u.type].domain!=='surface')){u.leader=null;u.offset=null;}
    if(u.home?.baseId){const base=unitById(s,u.home.baseId);if(!base||base.side!==u.side||base.type!=='airbase'&&!deckCompatible(base.type,u.type))throw Error('航空基地引用无效');}if(TYPES[u.type].domain==='air'&&!u.home&&s.phase!=='setup')assignHome(s,u);
  }
  for(const u of s.units){
    if(u.originDeck){const origin=unitById(s,u.originDeck);if(!origin||origin.side!==u.side||!Object.hasOwn(TYPES[origin.type].deck?.wing||{},u.type))throw Error('舰载航空队引用无效');}
    if(u.deckBased&&(!u.home?.baseId||!TYPES[unitById(s,u.home.baseId)?.type]?.deck))throw Error('甲板停机引用无效');
    for(const key of ['refuelTarget','supplyTarget'])if(u[key]&&(!unitById(s,u[key])||unitById(s,u[key]).side!==u.side||u[key]===u.id))throw Error('补给目标引用无效');
    if(TYPES[u.type].deck)for(const [key,max] of Object.entries(TYPES[u.type].deck.wing))if((u.airwing[key]||0)+s.units.filter(v=>v.originDeck===u.id&&v.type===key).length>max)throw Error('航空队超过舰载数量');
  }
  if(!Array.isArray(raw.missiles)||raw.missiles.length>200)throw Error('战局武器数据无效');const missileIds=new Set();
  for(const r of raw.missiles){
    const shooter=unitById(s,r.shooter);if(!Object.hasOwn(WEAPONS,r.weapon)||!shooter||shooter.side!==r.side||!/^m\d{1,7}$/.test(r.id)||missileIds.has(r.id))throw Error('战局武器参数无效');missileIds.add(r.id);
    const key=legacy&&TYPES[shooter.type].domain==='air'&&r.weapon==='sam'?'aam':r.weapon,w=weaponStats(shooter,key),targetKind=legacy?'unit':r.targetKind;
    const legacyRange=legacy||r.legacyRange===true,oldRange={asm:95,sam:65,aam:65,torpedo:24}[key]||w.range,maxRange=legacyRange?Math.max(w.range,oldRange):w.range;
    if(!['unit','missile'].includes(targetKind))throw Error('武器目标类型无效');const target=unitById(s,r.target);if(targetKind==='unit'&&(!target||target.side===r.side))throw Error('武器目标引用无效');
    s.missiles.push({id:r.id,shooter:r.shooter,target:r.target,targetKind,side:r.side,weapon:key,...point(r,s),travel:number(r.travel,0,maxRange*1.15),heading:number(r.heading,0,360),range:legacy?oldRange:number(r.range,.1,maxRange),launchDistance:number(r.launchDistance,0,maxRange*1.2,legacy?Math.min(oldRange,distance(shooter,target)):undefined),aim:legacy?point(target,s):point(r.aim,s),guidance:w.guidance,guidanceTime:number(r.guidanceTime,0,s.time,legacy?s.time:undefined),legacyRange,seekerLocked:r.seekerLocked===true,decoyTried:r.decoyTried===true,ciwsTried:Array.isArray(r.ciwsTried)?r.ciwsTried.filter(id=>ids.has(id)).slice(0,60):[],trail:[]});
  }
  for(const m of s.missiles)if(m.targetKind==='missile'&&!s.missiles.some(v=>v.id===m.target&&v.side!==m.side&&v.targetKind==='unit'))throw Error('拦截目标引用无效');
  s.nextMissile=Math.max(number(raw.nextMissile,0,1e7,0),0,...s.missiles.map(m=>Number(m.id.slice(1))));
  // 保留失联位置和原始时间。载入不触发扫描，不恢复失去的目标。
  for(const side of ['blue','red'])for(const [id,c] of Object.entries(raw.contacts?.[side]||{})){
    const target=unitById(s,id);if(!target||target.side===side||!['track','search','bearing'].includes(c.quality)||!finite(c.x,-10,worldFor(s).width+10)||!finite(c.y,-10,worldFor(s).height+10)||!finite(c.time,0,s.time))continue;
    const observations={};for(const [observerId,o] of Object.entries(c.observations||{})){const observer=unitById(s,observerId);if(observer?.side===side&&finite(o.time,0,s.time)&&['track','search','bearing'].includes(o.quality)&&['雷达','声呐','目视','电子支援'].includes(o.source))observations[observerId]={quality:o.quality,source:o.source,time:o.time};}
    s.contacts[side][id]={id,x:c.x,y:c.y,time:c.time,progress:finite(c.progress,0,30)?c.progress:0,quality:c.quality,source:['雷达','声呐','目视','电子支援'].includes(c.source)?c.source:'电子支援',observations,domain:['air','land','sub','surface'].includes(c.domain)?c.domain:domainOf(target),altitude:Object.hasOwn(ALTITUDES,c.altitude)?c.altitude:'medium',emitting:c.emitting===true,label:`${domainName[c.domain]||'未知'}接触 ${id.slice(1).padStart(2,'0')}`};
  }
  if(isHistorical(s)){
    const m=raw.mission,spec=HISTORICAL_SCENARIOS[s.scenario];
    if(!m||m.id!==s.scenario||!Array.isArray(m.escaped)||!Array.isArray(m.waves)||!Array.isArray(m.orders))throw Error('历史任务状态无效');
    const waveIds=(spec.waves||[]).map(w=>w.id);
    if(m.escaped.some(id=>unitById(s,id)?.missionRole!=='escape')||m.waves.some(id=>!waveIds.includes(id))||new Set(m.waves).size!==m.waves.length)throw Error('历史任务引用无效');
    if(s.scenario==='mantis88'&&(!s.units.some(u=>u.missionRole==='flagship')||!s.units.some(u=>u.missionRole==='mainTarget'))||s.scenario==='sanCarlos82'&&s.units.filter(u=>u.missionRole==='transport').length!==2||s.scenario==='bubiyan91'&&s.units.filter(u=>u.missionRole==='escape').length!==4)throw Error('历史任务关键兵力缺失');
    s.mission={id:s.scenario,escaped:[...new Set(m.escaped)],secured:Array.isArray(m.secured)?m.secured.filter(id=>ids.has(id)):[],waves:[...m.waves],orders:m.orders.filter(k=>['intercept','strike','escort','withdraw'].includes(k)).slice(0,200),disabled:m.disabled===true,unload:number(m.unload,0,1e6),reason:typeof m.reason==='string'?m.reason.slice(0,120):'',score:number(m.score,0,100)};
  }
  if(raw.version>=5)restoreAutomation(raw.automation,s,autoAPI());else s.automation=null;
  if(s.scenario==='autobattle'&&!isAutoBattle(s))throw Error('自动对战配置缺失');
  log(s,legacy?'旧战局已升级：加入地平线、燃油与新武器分类，当前暂停。':'战局已载入，保留探测记录，当前暂停。');return s;
}
