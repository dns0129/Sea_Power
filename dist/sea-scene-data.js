import {playerSide,aiControlLocked} from './factions.js?v=0.13.0';
import {metresToScene} from './scene-coordinates.js?v=0.13.0';
import {TYPES,ALTITUDES,SCENARIOS,airborne,visibleContacts,freeDeploy,isAutoBattle,isWW2,landFor,worldFor,factionName,weaponStats,historicalObjectives,effectiveSpeed,airCombatProfile,WEATHER,aiLevel} from './engine.js?v=0.13.0';

// A visual library, independent of simulation types. Replace these GLBs to
// change the art without changing platform statistics or saved games.
export const MODEL_PROFILES=Object.freeze({
  carrier:{name:'通用航空母舰',length:310,size:6.7},
  destroyer:{name:'通用驱逐舰',length:158,size:3.8},
  frigate:{name:'通用护卫舰',length:128,size:3.2},
  supply:{name:'通用补给舰',length:190,size:4.6},
  submarine:{name:'通用攻击潜艇',length:106,size:2.8},
  fighter:{name:'通用多用途战机',length:19,size:1.65},
  bomber:{name:'通用攻击机',length:39,size:2.4},
  awacs:{name:'通用预警机',length:39,size:2.6},
  helicopter:{name:'通用舰载直升机',length:18,size:1.35},
  facility:{name:'通用岸基设施',length:34,size:2.8},
  'ww2-carrier':{name:'二战直通甲板航母',length:250,size:6.7,source:'ww2-fleet.blend'},
  'ww2-battleship':{name:'二战通用战列舰',length:250,size:5.8,source:'ww2-fleet.blend'},
  'ww2-cruiser':{name:'二战重巡洋舰',length:188,size:4.2,source:'ww2-fleet.blend'},
  'ww2-destroyer':{name:'二战驱逐舰',length:119,size:3.1,source:'ww2-fleet.blend'},
  'ww2-fighter':{name:'二战螺旋桨战斗机',length:9,size:1.4,source:'ww2-fleet.blend'},
  'ww2-dive':{name:'二战俯冲轰炸机',length:10.6,size:1.65,source:'ww2-fleet.blend'},
  'ww2-torpedo':{name:'二战鱼雷攻击机',length:12.4,size:1.8,source:'ww2-fleet.blend'},
  'ww2-scout':{name:'二战水上侦察机',length:21,size:2.4,source:'ww2-fleet.blend'},
  'ww2-airfield':{name:'二战航空基地',length:80,size:3.5,source:'ww2-fleet.blend'}
});

export function modelFor(type){
  const t=TYPES[type];
  if(!t)return 'frigate';
  if(t.era==='ww2'){
    if(t.domain==='sub')return 'submarine';
    if(t.ww2Model)return t.ww2Model;
    if(t.ww2Role==='battleship'||t.category==='battleship')return 'ww2-battleship';
    if(t.domain==='land')return 'ww2-airfield';
    if(t.ww2Role==='carrier')return 'ww2-carrier';
    if(t.domain==='surface')return ['cruiser','battleship'].includes(t.category)?'ww2-cruiser':'ww2-destroyer';
    if(t.ww2Role==='scout')return type==='ww2_sbd_scout'?'ww2-dive':'ww2-scout';
    return `ww2-${t.ww2Role}`;
  }
  if(t.domain==='sub')return 'submarine';
  if(t.domain==='land')return 'facility';
  if(t.domain==='air'){
    if(t.rotary)return 'helicopter';
    if(t.category==='awacs'||type==='awacs')return 'awacs';
    if(['strike','patrol','tanker'].includes(t.category)||['bomber','patrol'].includes(type))return 'bomber';
    return 'fighter';
  }
  if(['carrier','amphibious'].includes(t.category)||type==='carrier')return 'carrier';
  if(t.supplyShip||t.category==='supply'||type==='transport')return 'supply';
  if(t.category==='destroyer'||/destroyer/.test(type))return 'destroyer';
  return 'frigate';
}

export function sceneUnit(u){
  const t=TYPES[u.type],model=modelFor(u.type),inAir=airborne(u);
  return {
    id:u.id,name:u.name,type:u.type,typeName:t.name,side:u.side,domain:t.domain,model,
    modelCode:t.category==='battleship'?'BB':t.era==='ww2'&&t.domain==='sub'?'SS':null,
    lengthMetres:t.lengthMetres||MODEL_PROFILES[model].length,beamMetres:t.beamMetres,
    x:u.x,y:u.y,heading:u.heading,speed:effectiveSpeed(u),requestedSpeed:u.speed,hp:u.hp,maxHp:t.hp,
    commandMode:u.commandMode,commandStatus:u.commandStatus,lockedTarget:u.lockedTarget,dogfightWith:u.dogfightWith,criticalHits:u.criticalHits,
    altitude:inAir?ALTITUDES[u.altitude]?.height||3500:0,
    altitudeName:inAir?ALTITUDES[u.altitude]?.name:'停场',
    height:inAir?metresToScene(ALTITUDES[u.altitude]?.height||3500):t.domain==='sub'&&u.depth!=='surfaced'?metresToScene(u.depth==='deep'?-35:-4):0,
    inAir,depth:u.depth,flightState:u.flightState,
    fuel:t.domain==='air'?Math.max(0,Math.min(100,u.fuel/(t.endurance*60)*100)):null,
    radar:u.radar,sonar:u.sonar,esm:u.esm,datalink:u.datalink,
    smoke:t.smoke?{charges:u.smokeCharges,until:u.smokeUntil,ready:u.smokeReady}:null,radarFireControl:!!t.radarFireControl,
    description:t.desc,role:t.realRole||t.category||'',ww2:t.era==='ww2',deck:!!t.deck,deckReady:u.deckReady,launchInterval:t.deck?.cooldown||0,supply:u.supply,
    weapons:Object.entries(u.weapons).filter(([,n])=>n>0).map(([id,count])=>({id,count,name:weaponStats(u,id).name})),
    airwing:Object.entries(u.airwing||{}).filter(([,n])=>n>0).map(([id,count])=>({id,name:TYPES[id]?.name||id,count})),
    aaPriority:u.aaPriority,battery:u.battery,rangefinder:u.rangefinder,airCombat:t.squadronSize?airCombatProfile(u,t):null,commandMode:u.commandMode,
    contact:false
  };
}

// This is the only boundary through which simulation data reaches the 3D view.
// Never resolve a contact ID to an enemy unit: its position is an observation,
// and neither its real position, loadout nor health belongs in an observer view.
export function seaSnapshot(state,{side=playerSide(state),all=false}={}){
  const global=isAutoBattle(state)&&state.automation.control!=='player'&&all;
  const reveal=global||state.phase==='setup'&&freeDeploy(state);
  const units=state.units.filter(u=>(reveal||u.side===side)&&u.hp>0&&!u.exited).map(sceneUnit);
  const ids=new Set(units.map(u=>u.id));
  const contacts=global?[]:visibleContacts(state,side).filter(c=>!ids.has(c.id)).map(c=>({
    id:c.id,name:c.label,x:c.x,y:c.y,domain:c.domain,
    side:side==='blue'?'red':'blue',height:c.domain==='air'?metresToScene(ALTITUDES[c.altitude]?.height||3500):0,
    source:c.source,quality:c.quality,stale:c.stale,age:Math.max(0,state.time-c.time),contact:true,
    ...(isWW2(state)&&c.classification?{model:({carrier:'ww2-carrier',battleship:'ww2-battleship',surface:'ww2-cruiser',fighter:'ww2-fighter',dive:'ww2-dive',torpedo:'ww2-torpedo',scout:'ww2-scout',sub:'submarine',land:'ww2-airfield'})[c.classification],heading:c.course||0}:{})
  }));
  const projectiles=isWW2(state)?state.missiles.filter(m=>m.side===side||global||m.weapon!=='torpedo'&&units.some(u=>Math.hypot(u.x-m.x,u.y-m.y)<3)).map(m=>({
    id:m.id,x:m.x,y:m.y,heading:m.heading,side:m.side,weapon:m.weapon,
    progress:Math.min(1,m.travel/Math.max(.1,m.launchDistance)),height:units.find(u=>u.id===m.shooter)?.height||0
  })):[];
  const effects=isWW2(state)?state.effects.filter(e=>units.some(u=>Math.hypot(u.x-e.x,u.y-e.y)<12)).map(e=>({x:e.x,y:e.y,time:e.time,kind:e.kind})):[];
  return {units,contacts,world:worldFor(state),modelScale:state.modelScale||'realistic',playerSide:playerSide(state),land:landFor(state),weather:state.weather,weatherName:WEATHER[state.weather]?.name,timeOfDay:state.timeOfDay,aiStrength:aiLevel(state,side).name,
    scenario:state.scenario,title:SCENARIOS[state.scenario].name,phase:state.phase,
    paused:state.paused,time:state.time,side,global,canCommand:!aiControlLocked(state)&&side===playerSide(state)&&state.phase!=='ended',
    sideName:factionName(state,side),observer:global?'全局观察':`${factionName(state,side)}视角`,
    projectiles,effects,night:state.timeOfDay==='night',
    smoke:isWW2(state)?(state.smoke||[]).filter(c=>c.until>state.time&&units.some(u=>Math.hypot(u.x-c.x,u.y-c.y)<18)).map(c=>({x:c.x,y:c.y,radius:c.radius,born:c.born,until:c.until})):[],
    ww2:isWW2(state),task:isWW2(state)?{custom:state.scenario==='ww2sandbox',stage:state.mission.stage,objectives:historicalObjectives(state),order:SCENARIOS[state.scenario].order||'执行作战计划',actions:SCENARIOS[state.scenario].actions||[['search','搜索'],['cap','防空'],['strike','攻击波']],plan:state.mission.orders.includes('plan'),result:state.result,score:state.mission.score,reason:state.mission.reason}:null};
}
