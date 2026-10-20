import {missionControlled} from './unit-orders.js?v=0.13.1';
import {playerSide,playerOutcome} from './factions.js?v=0.13.1';
import {WW2_SCENARIOS,isWW2Scenario} from './ww2-data.js?v=0.13.1';
import {geographicMap,geoToWorld} from './geography.js?v=0.13.1';
import {AI_LEVELS,aiLevel} from './tactical-rules.js?v=0.13.1';

import {isSurfaceWW2,initializeSurfaceWW2,surfaceWW2Order,commandSurfaceWW2,updateSurfaceWW2,surfaceWW2Objectives,restoreSurfaceWW2} from './ww2-surface.js?v=0.13.1';

export const ww2Zone=s=>{if(s.scenario==='ww2sandbox')return {x:120,y:85,radius:12,name:'公共演练海域'};const z=WW2_SCENARIOS[s.scenario].zone;return {...geoToWorld(geographicMap(s),z.lon,z.lat),radius:z.radius,name:z.name};};
export const ww2Search=s=>s.scenario==='ww2sandbox'?{x:120,y:85}:geoToWorld(geographicMap(s),...WW2_SCENARIOS[s.scenario].search);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const live=u=>u.hp>0&&!u.exited;
const carrier=(u,api)=>api.types[u.type].ww2Role==='carrier';
const operational=(u,api)=>live(u)&&u.hp>=api.types[u.type].hp*.4;

function searchRoute(s,u){
  const n=Number(u.id.slice(1))%3;
  if(s.scenario==='ww2sandbox')return [[120,55],[u.side==='blue'?175:65,90],[120,130],[u.side==='blue'?165:75,110]].map(([x,y])=>({x,y}));
  // Intelligence sectors are scenario knowledge, never enemy unit coordinates.
  const legs=u.side==='blue'?
    n===0?[[120,150],[65,115],[100,70],[165,95],[180,170]]:
    n===1?[[150,125],[80,95],[50,150],[115,185],[190,180]]:
    [[185,95],[125,70],[65,120],[120,165],[210,145]]:
    n===0?[[210,65],[300,65],[310,120],[230,150],[150,140]]:
    n===1?[[225,90],[300,90],[325,165],[250,185],[155,145]]:
    [[200,130],[285,135],[320,75],[245,50],[150,95]];
  return legs.map(([x,y])=>({x,y}));
}

export function initializeWW2(s,api){
  if(isSurfaceWW2(s))return initializeSurfaceWW2(s,api);
  s.mission={id:s.scenario,escaped:[],secured:[],waves:[],orders:[],disabled:false,unload:0,reason:'',score:0,
    stage:'等待指挥 · PBY 已开始搜索',disabledCarriers:0,operationalCarriers:3,midwayHealth:100};
  const place=(type,side,name,x,y)=>{
    const u=api.spawn(s,type,side,x,y);Object.assign(u,{name,radar:api.types[type].radar>0,esm:false,sonar:false,datalink:true,autoEngage:false,speed:api.types[type].domain==='land'?0:23});return u;
  };
  const blue=[place('ww2_yorktown','blue','企业号 CV-6',278,70),place('ww2_yorktown','blue','大黄蜂号 CV-8',288,80),place('ww2_yorktown','blue','约克城号 CV-5',268,87)];
  place('ww2_us_cruiser','blue','北安普顿号 CA-26',282,59);place('ww2_us_cruiser','blue','阿斯托里亚号 CA-34',259,79);place('ww2_us_destroyer','blue','哈曼号 DD-412',272,96);
  const red=[place('ww2_akagi','red','赤城号',88,112),place('ww2_kaga','red','加贺号',78,123),place('ww2_soryu','red','苍龙号',99,123),place('ww2_hiryu','red','飞龙号',99,103)];
  place('ww2_jp_cruiser','red','利根号',110,111);place('ww2_jp_cruiser','red','筑摩号',87,98);place('ww2_jp_destroyer','red','岚号',69,116);place('ww2_jp_destroyer','red','野分号',91,134);
  const p=geoToWorld(geographicMap(s),-177.389,28.209),base=place('ww2_midway','blue','中途岛守军与航空基地',p.x,p.y);
  for(const u of s.units.filter(v=>api.types[v.type].domain==='surface')){
    u.route=u.side==='blue'?[{x:u.x-12,y:u.y+8},{x:u.x+7,y:u.y+5}]:[{x:u.x+30,y:u.y+17},{x:u.x+15,y:u.y-4}];
  }
  const flight=(base,type,name)=>{
    const u=api.spawn(s,type,base.side,base.x+1,base.y);base.airwing[type]--;
    Object.assign(u,{name,originDeck:base.id,home:{x:base.x,y:base.y,baseId:base.id},radar:false,esm:false,sonar:false,datalink:true,autoEngage:!api.types[type].support,speed:Math.round(api.types[type].speed*.8)});
    if(api.types[type].ww2Role==='scout')u.route=searchRoute(s,u);
    return u;
  };
  blue.forEach(b=>{const u=flight(b,'ww2_f4f',`${b.name.split(' ')[0]}战斗巡逻小队`);u.ai={ww2Task:'cap'};});
  red.slice(0,2).forEach(b=>flight(b,'ww2_a6m',`${b.name}战斗巡逻小队`));
  flight(base,'ww2_pby','PBY 西北搜索小队');flight(base,'ww2_pby','PBY 北侧搜索小队');
  s.budget=s.redBudget=0;
  api.log(s,'中途岛任务：敌航母位置未知。PBY 开始扇面搜索；可执行航空作战计划，或逐舰手动放飞。');
}

export function ww2Order(s,key,api){
  if(!isWW2Scenario(s)||s.phase!=='running')return {ok:false,error:'请先开始二战任务'};
  if(isSurfaceWW2(s))return surfaceWW2Order(s,key,api);
  if(!['plan','search','cap','strike','manual'].includes(key))return {ok:false,error:'无效的二战作战指令'};
  if(key==='strike'&&!strikeReports(s,playerSide(s),api).some(c=>c.domain==='surface'))return {ok:false,error:'尚无可用敌舰报告，请先派侦察机搜索'};
  if(key==='manual')s.mission.orders=[];
  else s.mission.orders=[...new Set([...s.mission.orders,key])];
  const labels={plan:s.scenario==='ww2sandbox'?'作战计划已启用：编队搜索 → 接敌 → 舰炮、鱼雷与反潜协同':'航空作战计划已启用：搜索 → 战斗巡逻 → 发现后组织攻击波',search:'展开 PBY 与舰载侦察搜索',cap:'组织航母战斗巡逻与目视截击',strike:'根据最近敌舰报告组织舰载攻击波',manual:'已转为手动指挥，保留已下达航线'};
  api.log(s,labels[key]);commandWW2(s,api);return {ok:true};
}

function strikeReports(s,side,api){
  return api.visibleContacts(s,side).filter(c=>c.domain==='surface'&&(s.scenario==='ww2sandbox'||c.classification==='carrier')&&!c.disabled&&s.time-c.time<=900);
}
function targetReport(s,u,api){
  const reports=strikeReports(s,u.side,api).sort((a,b)=>a.id.localeCompare(b.id));
  return reports.length?reports[Number(u.id.slice(1))%reports.length]:null;
}
function capRoute(base,n){const d=9+n%3;return [{x:base.x-d,y:base.y-d},{x:base.x+d,y:base.y-d},{x:base.x+d,y:base.y+d},{x:base.x-d,y:base.y+d}];}

export function commandWW2(s,api){
  if(!isWW2Scenario(s)||s.phase!=='running')return;
  if(isSurfaceWW2(s))return commandSurfaceWW2(s,api);
  const orders=s.mission.orders,plan=orders.includes('plan');
  for(const base of [...s.units].filter(u=>live(u)&&missionControlled(u)&&api.types[u.type].deck)){
    if(s.time<(base.nextDeckDecision||0))continue;const level=aiLevel(s,base.side);base.nextDeckDecision=s.time+level.reaction;
    const red=base.side==='red',autonomous=base.side!==playerSide(s),search=autonomous||plan||orders.includes('search'),cap=autonomous||plan||orders.includes('cap'),strike=autonomous||plan||orders.includes('strike');
    const reports=strikeReports(s,base.side,api);
    const candidates=Object.keys(base.airwing).filter(type=>base.airwing[type]>0).sort((a,b)=>{
      const priority=type=>({scout:0,fighter:1,dive:2,torpedo:3}[api.types[type].ww2Role]??9);return priority(a)-priority(b);
    });
    for(const type of candidates){
      const role=api.types[type].ww2Role;
      // Only Akagi/Kaga send one preliminary bombing group against Midway;
      // the remaining attack groups wait for a carrier sighting.
      const islandRaid=s.scenario==='midway42'&&red&&role==='dive'&&['ww2_akagi','ww2_kaga'].includes(base.type)&&base.airwing[type]===2;
      if(!(role==='scout'&&search||role==='fighter'&&cap||['dive','torpedo'].includes(role)&&strike&&(reports.length||islandRaid)))continue;
      const r=api.launchDeck(s,base.id,type);
      if(r.ok){r.unit.autoEngage=role!=='scout';r.unit.radar=false;r.unit.esm=false;if(level.coordination&&role==='fighter')r.unit.ai={ww2Task:'escort'};}
      break;
    }
  }
  for(const u of s.units.filter(u=>live(u)&&missionControlled(u)&&api.types[u.type].domain==='air'&&api.airborne(u)&&u.flightState!=='returning')){
    const t=api.types[u.type],role=t.ww2Role,red=u.side==='red';
    if(!missionControlled(u)||s.time<(u.nextDecision||0))continue;const level=aiLevel(s,u.side);u.nextDecision=s.time+level.reaction;
    if(u.side===playerSide(s)&&!plan&&!orders.includes(role==='scout'?'search':role==='fighter'?'cap':'strike'))continue;
    if(u.hp/t.hp<level.retreat||u.aircraft<=Math.floor(t.squadronSize*(level===AI_LEVELS.ace?.5:level===AI_LEVELS.professional?.25:0))){api.returnToBase(s,u.id);continue;}
    if(role==='scout'){
      const report=strikeReports(s,u.side,api).sort((a,b)=>distance(u,a)-distance(u,b))[0];
      if(report){
        // Shadow at visual stand-off distance. Radio fixes remain observations;
        // losing this report does not magically update the carrier's position.
        const angle=Math.atan2(u.x-report.x,u.y-report.y)+.25,radius=t.eoRange-.8;
        u.route=[{x:Math.max(1,Math.min(s.scenario==='ww2sandbox'?239:364,report.x+Math.sin(angle)*radius)),y:Math.max(1,Math.min(s.scenario==='ww2sandbox'?169:299,report.y+Math.cos(angle)*radius))}];
      }else if(!u.route.length)u.route=searchRoute(s,u);
      u.speed=Math.round(t.speed*.85);continue;
    }
    const ammo=role==='fighter'?u.weapons.ir:role==='torpedo'?u.weapons.torpedo:u.weapons.bomb;
    if(!ammo){api.returnToBase(s,u.id);continue;}
    u.autoEngage=true;u.speed=Math.round(t.speed*.88);
    if(role==='fighter'){
      const home=api.unitById(s,u.home?.baseId)||u;
      const attack=level.coordination&&u.ai?.ww2Task==='escort'?s.units.filter(v=>v.side===u.side&&v.originDeck===u.originDeck&&live(v)&&api.airborne(v)&&v.flightState==='airborne'&&['dive','torpedo'].includes(api.types[v.type].ww2Role)&&(v.weapons.bomb>0||v.weapons.torpedo>0)).sort((a,b)=>(a.route[0]?distance(a,a.route[0]):999)-(b.route[0]?distance(b,b.route[0]):999))[0]:null;
      const anchor=attack||home;
      const c=api.visibleContacts(s,u.side).filter(c=>c.domain==='air'&&s.time-c.time<=30&&distance(anchor,c)<(attack?35:48)).sort((a,b)=>(attack?(a.classification==='fighter'?0:1)-(b.classification==='fighter'?0:1):0)||distance(u,a)-distance(u,b))[0];
      if(c){u.route=[{x:c.x,y:c.y}];u.altitude=c.altitude==='low'?'low':'medium';}
      else if(attack){u.route=[{x:attack.x+1.5,y:attack.y-1.5}];u.altitude=attack.altitude;}
      else if(!u.route.length)u.route=capRoute(home,Number(u.id.slice(1)));
      continue;
    }
    const origin=api.unitById(s,u.originDeck),islandRaid=s.scenario==='midway42'&&red&&role==='dive'&&u.sorties===0&&['ww2_akagi','ww2_kaga'].includes(origin?.type);
    const c=targetReport(s,u,api),goal=c||islandRaid&&ww2Zone(s);
    u.aiTarget=c?.id||null;
    if(goal){const flank=level===AI_LEVELS.ace&&distance(u,goal)>15?(Number(u.id.slice(1))%2?4:-4):0;u.route=[{x:goal.x,y:goal.y+flank}];u.altitude=distance(u,goal)<12?'low':'medium';}
  }
  for(const u of s.units.filter(u=>live(u)&&['surface','sub'].includes(api.types[u.type].domain)&&api.types[u.type].weapons.gun>0&&(u.side!==playerSide(s)||plan)&&missionControlled(u))){
    if(s.time<(u.nextDecision||0))continue;const level=aiLevel(s,u.side);u.nextDecision=s.time+level.reaction;
    const c=api.visibleContacts(s,u.side).filter(c=>!c.stale&&c.quality==='track'&&['surface','sub'].includes(c.domain)&&api.usableContact(s,u,c)).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(!c){if(s.scenario==='ww2sandbox'&&!u.route.length)u.route=api.route(s,u,{x:120,y:85})||[];continue;}
    if(api.types[u.type].domain==='sub'&&u.depth==='deep'&&u.battery>120)u.depth='periscope';
    const w=c.domain==='sub'?{range:.65}:api.types[u.type].domain==='sub'?api.types[u.type].profiles.torpedo:api.types[u.type].profiles.gun,d=distance(u,c)||1,retreat=u.hp/api.types[u.type].hp<level.retreat,desired=retreat?w.range*1.2:w.range*(level===AI_LEVELS.amateur?.85:.65);
    const point={x:c.x+(u.x-c.x)/d*desired,y:c.y+(u.y-c.y)/d*desired},route=api.route(s,u,point);if(route)u.route=route;u.autoEngage=true;u.speed=Math.round((api.types[u.type].domain==='sub'?api.types[u.type].submergedSpeed:api.types[u.type].speed)*.7);
  }
  const reports=strikeReports(s,playerSide(s),api);
  s.mission.stage=s.scenario==='ww2sandbox'?(plan||orders.length?reports.length?'敌舰报告已建立 · 编队接敌':'编队搜索中 · 声呐与目视搜索目标':'自由指挥 · 下达航线或执行作战计划'):plan||orders.length?reports.length?'敌舰报告已建立 · 航空攻击波接敌':'搜索中 · 先侦察，再组织攻击':'等待指挥 · 侦察机正在搜索';
}

export function ww2Objectives(s){
  if(isSurfaceWW2(s))return surfaceWW2Objectives(s);
  const m=s.mission;if(s.scenario==='ww2sandbox')return [];
  if(playerSide(s)==='red')return [{text:`保持至少两艘可作战航母 ${4-m.disabledCarriers} / 2`,failed:m.disabledCarriers>=3},{text:'压制中途岛或使美军航母全部失能；亦可阻止对方达成任务至时限',done:s.phase==='ended'&&s.result==='victory'}];
  return [{text:`日军航母失去航空作战能力 ${m.disabledCarriers} / 3`,done:m.disabledCarriers>=3},
    {text:`美军可作战航母 ${m.operationalCarriers} / 至少 1`,failed:m.operationalCarriers<1,done:s.phase==='ended'&&s.result==='victory'},
    {text:`中途岛基地完整度 ${m.midwayHealth}%`,failed:m.midwayHealth<=0,done:s.phase==='ended'&&s.result==='victory'}];
}
export function updateWW2(s,dt,api){
  if(s.phase!=='running'||s.scenario==='ww2sandbox')return;
  if(isSurfaceWW2(s))return updateSurfaceWW2(s,dt,api);
  const m=s.mission,carriers=s.units.filter(u=>carrier(u,api)),base=s.units.find(u=>u.type==='ww2_midway');
  m.disabledCarriers=carriers.filter(u=>u.side==='red'&&!operational(u,api)).length;
  m.operationalCarriers=carriers.filter(u=>u.side==='blue'&&operational(u,api)).length;
  m.midwayHealth=Math.ceil(base.hp/api.types[base.type].hp*100);
  const finish=(result,reason)=>{
    s.phase='ended';s.paused=true;s.result=playerOutcome(s,result);m.reason=playerSide(s)==='red'?`美方任务：${reason}`:reason;
    m.score=Math.max(0,Math.min(100,Math.round(m.disabledCarriers*17+m.operationalCarriers*6+m.midwayHealth*.12+(result==='victory'?6:0))));
    if(playerSide(s)==='red')m.score=100-m.score;
    api.log(s,reason,s.result==='victory'?'combat':'warning');
  };
  if(base.hp<=0)return finish('defeat','中途岛守军与航空设施损失，防御任务失败。');
  if(m.operationalCarriers===0)return finish('defeat','美军航母均失去航空作战能力。');
  if(m.disabledCarriers>=3)return finish('victory','至少三艘日军航母失去航空作战能力，美军保住中途岛与可作战航母。');
  if(s.time>=WW2_SCENARIOS[s.scenario].duration)return finish('defeat','四小时作战窗口结束，未完成航母压制目标。');
}

export function restoreWW2Mission(s,raw,api){
  const m=raw.mission;
  if(isSurfaceWW2(s))return restoreSurfaceWW2(s,raw,api);
  if(!m||m.id!==s.scenario||!Array.isArray(m.orders)||m.orders.some(k=>!['plan','search','cap','strike'].includes(k)))throw Error('二战任务指令无效');
  if(s.units.some(u=>api.types[u.type].era!=='ww2')||s.units.filter(u=>carrier(u,api)&&u.side==='blue').length!==3||s.units.filter(u=>carrier(u,api)&&u.side==='red').length!==4||s.units.filter(u=>u.type==='ww2_midway').length!==1)throw Error('中途岛关键兵力缺失或年代不符');
  if(!Number.isFinite(m.score)||m.score<0||m.score>100)throw Error('二战任务评分无效');
  s.mission={id:s.scenario,escaped:[],secured:[],waves:[],orders:[...new Set(m.orders)],disabled:false,unload:0,
    reason:typeof m.reason==='string'?m.reason.slice(0,120):'',score:m.score,stage:typeof m.stage==='string'?m.stage.slice(0,80):'等待指挥',
    disabledCarriers:s.units.filter(u=>u.side==='red'&&carrier(u,api)&&!operational(u,api)).length,
    operationalCarriers:s.units.filter(u=>u.side==='blue'&&carrier(u,api)&&operational(u,api)).length,
    midwayHealth:Math.ceil(s.units.find(u=>u.type==='ww2_midway').hp/api.types.ww2_midway.hp*100)};
}
