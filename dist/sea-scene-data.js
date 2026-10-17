import {TYPES,ALTITUDES,SCENARIOS,airborne,visibleContacts,freeDeploy,isAutoBattle,landFor,worldFor,factionName,weaponStats} from './engine.js?v=0.7.0';

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
  facility:{name:'通用岸基设施',length:34,size:2.8}
});

export function modelFor(type){
  const t=TYPES[type];
  if(!t)return 'frigate';
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
    x:u.x,y:u.y,heading:u.heading,speed:u.speed,hp:u.hp,maxHp:t.hp,
    altitude:inAir?ALTITUDES[u.altitude]?.height||3500:0,
    altitudeName:inAir?ALTITUDES[u.altitude]?.name:'停场',
    height:inAir?({low:1.6,medium:4.5,high:8}[u.altitude]||4.5):0,
    inAir,depth:u.depth,flightState:u.flightState,
    fuel:t.domain==='air'?Math.max(0,Math.min(100,u.fuel/(t.endurance*60)*100)):null,
    radar:u.radar,sonar:u.sonar,esm:u.esm,datalink:u.datalink,
    description:t.desc,role:t.realRole||t.category||'',
    weapons:Object.entries(u.weapons).filter(([,n])=>n>0).map(([id,count])=>({id,count,name:weaponStats(u,id).name})),
    airwing:Object.entries(u.airwing||{}).filter(([,n])=>n>0).map(([id,count])=>({name:TYPES[id]?.name||id,count})),
    contact:false
  };
}

// This is the only boundary through which simulation data reaches the 3D view.
// Never resolve a contact ID to an enemy unit: its position is an observation,
// and neither its real position, loadout nor health belongs in an observer view.
export function seaSnapshot(state,{side='blue',all=false}={}){
  const global=isAutoBattle(state)&&all;
  const reveal=global||state.phase==='setup'&&freeDeploy(state);
  const units=state.units.filter(u=>(reveal||u.side===side)&&u.hp>0&&!u.exited).map(sceneUnit);
  const ids=new Set(units.map(u=>u.id));
  const contacts=global?[]:visibleContacts(state,side).filter(c=>!ids.has(c.id)).map(c=>({
    id:c.id,name:c.label,x:c.x,y:c.y,domain:c.domain,
    side:side==='blue'?'red':'blue',height:c.domain==='air'?4.5:0,
    source:c.source,quality:c.quality,stale:c.stale,age:Math.max(0,state.time-c.time),contact:true
  }));
  return {units,contacts,world:worldFor(state),land:landFor(state),weather:state.weather,
    scenario:state.scenario,title:SCENARIOS[state.scenario].name,phase:state.phase,
    paused:state.paused,time:state.time,side,global,
    sideName:factionName(state,side),observer:global?'全局观察':`${factionName(state,side)}视角`};
}
