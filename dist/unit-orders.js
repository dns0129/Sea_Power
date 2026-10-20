import {freeFireEnabled} from './fire-control.js?v=0.13.1';
// Unit commands use received observations and public geography. Enemy unit
// coordinates are never used to choose a course or an interception point.
export const missionControlled=u=>!u.commandMode||['mission','auto'].includes(u.commandMode);
const live=u=>u.hp>0&&!u.exited;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const fighterType=t=>t.domain==='air'&&!t.rotary&&!t.support&&(t.ww2Role==='fighter'||t.era!=='ww2'&&(['fighter','navalAir'].includes(t.category)||['MRF','INT','ASF','LOF','CVF'].includes(t.code)));
const point=(s,p,api)=>({x:Math.max(.5,Math.min(api.world(s).width-.5,p.x)),y:Math.max(.5,Math.min(api.world(s).height-.5,p.y))});
function reports(s,u,api){return api.visibleContacts(s,u.side).filter(c=>api.hasReport(s,u,c));}
function navigate(s,u,p,api){
  if(api.types[u.type].domain==='land')return;
  let goal=point(s,p,api);
  if(api.types[u.type].domain!=='air'&&api.inLand(goal,s)){
    let sea={x:u.x,y:u.y},land=goal;
    for(let i=0;i<15;i++){const mid={x:(sea.x+land.x)/2,y:(sea.y+land.y)/2};if(api.inLand(mid,s))land=mid;else sea=mid;}
    const d=dist(u,sea)||1;goal={x:sea.x-(sea.x-u.x)/d*.3,y:sea.y-(sea.y-u.y)/d*.3};
  }
  const path=api.route(s,u,goal);if(path){u.route=path;u.leader=null;}
  u.speed=api.cruiseMaxSpeed(u);
}
function follow(s,u,c,api){
  const t=api.types[u.type],d=dist(u,c),age=Math.max(0,s.time-c.time);
  if(t.domain==='air'&&c.domain==='air'&&(t.altitudes||['low','medium','high']).includes(c.altitude))u.altitude=c.altitude;
  if(t.ww2Role==='torpedo'&&c.domain==='surface')u.altitude=d<14?'low':'medium';
  const a=(c.course||0)*Math.PI/180,lead=Math.min(20,age+8)/3600;
  let goal={x:c.x+Math.sin(a)*(c.speed||0)*lead,y:c.y-Math.cos(a)*(c.speed||0)*lead};
  if(t.domain!=='air'){
    const ranges=Object.keys(u.weapons).filter(k=>u.weapons[k]>0&&api.weaponStats(u,k).targets.includes(c.domain)).map(k=>(api.weaponStats(u,k).releaseRange||api.weaponStats(u,k).range)*.65);
    const stand=Math.max(.6,Math.min(u.weapons.torpedo?3.5:12,...(ranges.length?ranges:[3])));
    const length=dist(u,goal)||1;goal={x:goal.x+(u.x-goal.x)/length*stand,y:goal.y+(u.y-goal.y)/length*stand};
  }else if(t.ww2Role==='scout'&&d<(t.eoRange||15)*.8){
    const a=Math.atan2(u.y-c.y,u.x-c.x)+.3,r=(t.eoRange||15)*.65;goal={x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r};
  }
  navigate(s,u,goal,api);
  u.commandStatus=age>6?'追踪最后报告 · 等待重新发现':fighterType(t)&&c.domain==='air'?'拦截目标机群':t.domain==='land'?'固定阵地跟踪目标':'锁定目标 · 跟随接敌';
}
function patrol(s,u,api){
  const t=api.types[u.type];if(t.domain==='land'){u.commandStatus='AI 警戒与防御';return;}
  if(u.route.length){u.commandStatus=t.support?'AI 搜索／支援':'AI 巡逻警戒';return;}
  const search=t.ww2Role==='scout'||t.role==='awacs'||t.category==='awacs'||t.category==='patrol';
  const anchor=search&&api.publicSearch(s)||u.home||u.commandAnchor||u,r=Math.min(t.domain==='air'?22:6,api.world(s).width*.15,api.world(s).height*.15);
  const n=(u.searchLeg||0)%4,offset=[[-1,-1],[1,-1],[1,1],[-1,1]][n];u.searchLeg=(u.searchLeg||0)+1;
  navigate(s,u,{x:anchor.x+offset[0]*r,y:anchor.y+offset[1]*r},api);u.commandStatus=search?'AI 扇面搜索':'AI 巡逻警戒';
  if(t.domain==='sub')u.speed=Math.min(8,api.cruiseMaxSpeed(u));
}
function launchOwnWing(s,u,intel,api){
  if(!api.types[u.type].deck)return;
  const candidates=Object.keys(u.airwing).filter(k=>u.airwing[k]>0).sort((a,b)=>{
    const rank=k=>{const t=api.types[k];return t.ww2Role==='scout'||t.role==='awacs'?-2:fighterType(t)?-1:0;};return rank(a)-rank(b);
  });
  for(const type of candidates){
    const t=api.types[type];if(!t.support&&!fighterType(t)&&!intel.some(c=>Object.keys(t.weapons).some(k=>t.weapons[k]>0&&api.weaponStats({type},k).targets.includes(c.domain))))continue;
    const r=api.launchDeck(s,u.id,type);if(r.ok){r.unit.commandMode='ai';r.unit.commandAnchor={x:u.x,y:u.y};r.unit.autoEngage=!t.support;}break;
  }
}

export function commandUnits(s,api){
  for(const u of [...s.units].filter(u=>live(u)&&['ai','follow'].includes(u.commandMode))){
    const t=api.types[u.type];
    if(t.domain==='air'&&(!api.airborne(u)||u.flightState==='returning')){u.commandStatus=u.flightState==='returning'?'返航补给中':'整备待命';continue;}
    const intel=reports(s,u,api);u.autoEngage=!t.support;
    if(u.refuelTarget||u.supplyTarget){u.commandStatus='AI 补给会合中';continue;}
    if(u.missionRole==='transport'&&api.publicGoal(s)){navigate(s,u,api.publicGoal(s),api);u.commandStatus='AI 运输舰驶向任务区';continue;}
    if(t.smoke&&u.autoDefense&&u.hp<t.hp*.45&&intel.some(c=>c.domain==='surface'&&dist(u,c)<12))api.deploySmoke(s,u.id);
    if(u.commandMode==='follow'){
      const c=intel.find(c=>c.id===u.lockedTarget);
      if(c)follow(s,u,c,api);else{u.route=[];u.commandStatus='目标报告失效 · 等待重新发现';}
      continue;
    }
    if(t.domain==='air'&&!t.support&&Object.values(u.weapons).every(n=>!n)){api.returnToBase(s,u.id);continue;}
    launchOwnWing(s,u,intel,api);
    if(t.ww2Role==='carrier'||t.category==='carrier'||t.category==='amphibious'){
      if(s.scenario==='samar44')navigate(s,u,api.publicGoal(s),api);else patrol(s,u,api);
      u.commandStatus='AI 航空调度与舰队自卫';continue;
    }
    const c=intel.filter(c=>s.time-c.time<=30&&(t.support&&['surface','land'].includes(c.domain)||Object.keys(u.weapons).some(k=>u.weapons[k]>0&&api.weaponStats(u,k).targets.includes(c.domain))))
      .sort((a,b)=>(fighterType(t)?(a.domain==='air'?0:1)-(b.domain==='air'?0:1):0)||dist(u,a)-dist(u,b))[0];
    u.aiTarget=c?.id||null;
    if(c)follow(s,u,c,api);else patrol(s,u,api);
  }
}

// Speed penalties are derived anew each tick. They never overwrite a unit's
// requested cruise speed, and disappear as soon as close combat breaks off.
export function updateDogfights(s,api){
  for(const u of s.units){u.combatSlow=1;u.dogfightWith=[];u.combatGoal=null;}
  for(const u of s.units.filter(u=>live(u)&&api.airborne(u)&&u.flightState!=='returning'&&fighterType(api.types[u.type])&&(freeFireEnabled(u)||u.fireAtWill!==false&&u.lockedTarget))){
    const t=api.types[u.type],radius=t.era==='ww2'?1.8:2.5;
    const local=reports(s,u,api).filter(c=>c.domain==='air'&&s.time-c.time<=6&&c.observations?.[u.id]&&s.time-c.observations[u.id].time<=6&&(t.era!=='ww2'||c.observations[u.id].source==='目视'));
    const c=u.lockedTarget?local.find(c=>c.id===u.lockedTarget):local.find(c=>c.id===u.aiTarget)||local.sort((a,b)=>dist(u,a)-dist(u,b))[0];
    if(!c||dist(u,c)>radius||u.altitude!==c.altitude)continue;
    const target=api.unitById(s,c.id);
    // Actual proximity is a physical condition, not information for navigation.
    if(!target||!live(target)||!api.airborne(target)||dist(u,target)>radius+.25)continue;
    u.combatSlow=Math.min(u.combatSlow,.72);target.combatSlow=Math.min(target.combatSlow,fighterType(api.types[target.type])?.64:.72);
    if(!u.dogfightWith.includes(target.id))u.dogfightWith.push(target.id);if(!target.dogfightWith.includes(u.id))target.dogfightWith.push(u.id);
    const angle=s.time*.12+Number(u.id.slice(1))*2.4;
    if(u.commandMode!=='manual')u.combatGoal=point(s,{x:c.x+Math.cos(angle)*.28,y:c.y+Math.sin(angle)*.28},api);
    if(['ai','follow'].includes(u.commandMode))u.commandStatus='近距缠斗 · 机群减速';
  }
}
