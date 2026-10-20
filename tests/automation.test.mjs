import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../dist/engine.js?v=0.13.0';

const {TYPES,addUnit,removeUnit,freeDeploy,step,serialize,deserialize,fireCheck}=engine;
const clone=value=>structuredClone(value);
function empty(options={}){
  // Generic close-range fixtures retain the original 240 × 170 nm sandbox.
  const s=engine.createState('sandbox');
  s.units=[];s.budget=s.redBudget=600;
  const result=engine.configureAutoBattle(s,{timeLimit:3600,seed:123456,...options});
  assert.ok(result.ok,result.error);
  return s;
}
function add(s,type,side,x,y){
  const result=addUnit(s,type,side,{x,y});
  assert.ok(result.ok,`${side} ${type}: ${result.error}`);
  return result.unit;
}
function pair(options={}){
  const s=empty(options);
  add(s,'fighter','blue',70,90);
  add(s,'fighter','red',110,90);
  return s;
}
function begin(s,options={}){
  const result=engine.startAutoBattle(s,options);
  assert.ok(result.ok,result.error);
  return s;
}
function advance(s,seconds){
  for(let remaining=seconds;remaining>0&&s.phase==='running';remaining-=Math.min(600,remaining))step(s,Math.min(600,remaining));
  return s;
}
// Rendering trails, events and the intentional pause on import do not affect simulation.
function comparable(s){
  const value=JSON.parse(serialize(s));
  delete value.events;delete value.effects;delete value.paused;
  for(const unit of value.units){delete unit.trail;for(const key of Object.keys(engine.WEAPONS))unit.cooldowns[key]??=0;}
  for(const missile of value.missiles){delete missile.trail;missile.legacyRange??=false;}
  return value;
}
function navigation(u){return {x:u.x,y:u.y,speed:u.speed,heading:u.heading,route:clone(u.route),ai:clone(u.ai)};}

test('自动作战预案可独立部署双方，预算与撤回遵循相同规则',()=>{
  assert.deepEqual(new Set(engine.AUTO_PRESETS.map(p=>p.id)),new Set(['surface','carrier','asw','empty']));
  for(const p of engine.AUTO_PRESETS){
    assert.ok(p.name&&p.description);
    const s=engine.createAutoBattle(p.id);
    assert.equal(s.scenario,'autobattle');assert.equal(s.version,9);
    assert.equal(s.phase,'setup');assert.equal(s.paused,true);
    assert.equal(freeDeploy(s),true);assert.equal(engine.isAutoBattle(s),true);
    assert.equal(s.automation.enabled,true);
    for(const side of ['blue','red']){
      const spent=s.units.filter(u=>u.side===side).reduce((total,u)=>total+TYPES[u.type].cost,0);
      assert.equal(s[side==='blue'?'budget':'redBudget']+spent,600);
    }
    assert.ok(deserialize(serialize(s)));
  }
  const s=empty(),blue=add(s,'f16c50','blue',70,90),red=add(s,'j10c','red',170,90);
  assert.ok(removeUnit(s,blue.id));assert.ok(removeUnit(s,red.id));
  assert.equal(s.budget,600);assert.equal(s.redBudget,600);
});

test('开始前验证双方战斗兵力；只有支援单位或单边部署不能运行',()=>{
  for(const supportOnly of [false,true]){
    const s=empty();
    if(supportOnly){add(s,'e2d','blue',70,90);add(s,'kj500','red',170,90);}
    assert.equal(engine.startAutoBattle(s).ok,false);
    assert.equal(s.phase,'setup');assert.equal(s.paused,true);
  }
  const s=empty();add(s,'fighter','blue',70,90);
  assert.equal(engine.startAutoBattle(s).ok,false);
  add(s,'fighter','red',170,90);assert.ok(engine.startAutoBattle(s).ok);
});

test('自动作战配置拒绝无效策略、时长、种子，开战后冻结配置',()=>{
  for(const key of ['balanced','aggressive','cautious'])assert.ok(engine.AI_DOCTRINES[key].name&&engine.AI_DOCTRINES[key].description);
  const s=pair();
  for(const invalid of [{blueDoctrine:'unknown'},{redDoctrine:'unknown'},{timeLimit:299},{timeLimit:14401},{timeLimit:NaN},{seed:-1},{seed:4294967296},{seed:1.5}]){
    const before=serialize(s),result=engine.configureAutoBattle(s,invalid);
    assert.equal(result.ok,false,JSON.stringify(invalid));assert.equal(serialize(s),before);
  }
  assert.ok(engine.configureAutoBattle(s,{blueDoctrine:'aggressive',redDoctrine:'cautious',timeLimit:300,seed:0}).ok);
  assert.ok(engine.configureAutoBattle(s,{timeLimit:14400,seed:4294967295}).ok);
  begin(s);assert.equal(engine.configureAutoBattle(s,{timeLimit:300}).ok,false);
});

test('积极与谨慎策略实际改变接敌速度和防空保留弹药',()=>{
  function doctrine(blueDoctrine){
    const s=empty({blueDoctrine}),ship=add(s,'frigate','blue',70,95);
    add(s,'submarine','red',195,70);begin(s);return {speed:ship.speed,reserve:ship.samReserve};
  }
  const aggressive=doctrine('aggressive'),cautious=doctrine('cautious');
  assert.ok(aggressive.speed>cautious.speed);assert.ok(aggressive.reserve<cautious.reserve);
});

test('两方 AI 均可自主开传感器、规划航线与发射武器，无需玩家下令',()=>{
  const s=pair(),initial=Object.fromEntries(s.units.map(u=>[u.id,{x:u.x,y:u.y}]));
  begin(s);advance(s,30);
  const report=engine.getBattleReport(s);
  for(const side of ['blue','red']){
    const u=s.units.find(v=>v.side===side);
    assert.equal(u.autoEngage,true);assert.equal(u.autoDefense,true);
    assert.ok(u.radar||u.sonar||u.esm);
    assert.ok(Math.hypot(u.x-initial[u.id].x,u.y-initial[u.id].y)>.01,`${side} did not navigate`);
    assert.ok(Object.keys(s.contacts[side]).length>0,`${side} has no contacts`);
    assert.ok(report[side].shots>0,`${side} did not fire`);
  }
});

test('航母对抗预案双方都自主放飞，出动受原有甲板库存约束',()=>{
  const s=engine.createAutoBattle('carrier');
  assert.ok(engine.configureAutoBattle(s,{seed:8877,timeLimit:1800}).ok);
  const initial=new Map(s.units.filter(u=>TYPES[u.type].deck).map(u=>[u.id,clone(u.airwing)]));
  begin(s);advance(s,240);
  for(const side of ['blue','red']){
    const launched=s.units.filter(u=>u.side===side&&u.originDeck);
    assert.ok(launched.length>0,`${side} did not launch`);
    for(const base of s.units.filter(u=>u.side===side&&initial.has(u.id)))for(const [type,count] of Object.entries(initial.get(base.id))){
      assert.equal((base.airwing[type]||0)+s.units.filter(u=>u.originDeck===base.id&&u.type===type).length,count);
    }
    assert.ok(engine.getBattleReport(s)[side].sorties>0);
  }
  assert.ok(deserialize(serialize(s)));
});

test('任务弹药耗尽的飞机自主返航，以有限机场库存完成下一架次',()=>{
  const s=empty(),base=add(s,'airbase','blue',17,43),air=add(s,'fighter','blue',23,43);
  add(s,'submarine','red',195,70);begin(s);
  for(const key of Object.keys(air.weapons))air.weapons[key]=0;
  advance(s,8);assert.equal(air.flightState,'returning');
  const supplies=base.supply;air.x=base.x;air.y=base.y;air.hp=22;
  step(s,1);assert.equal(air.flightState,'servicing');assert.ok(base.supply<supplies);
  advance(s,240);assert.equal(air.flightState,'airborne');assert.equal(air.weapons.aam,TYPES.fighter.weapons.aam);
  assert.equal(air.hp,22);assert.equal(air.sorties,1);assert.equal(engine.getBattleReport(s).blue.sorties,2);
  assert.ok(deserialize(serialize(s)));
});

test('相同部署与种子重复推演产生相同战局和战报',()=>{
  const a=begin(pair({seed:908172})),b=begin(pair({seed:908172}));
  advance(a,240);advance(b,240);
  assert.deepEqual(comparable(a),comparable(b));
  assert.deepEqual(engine.getBattleReport(a),engine.getBattleReport(b));
});

test('中途保存载入保留 AI 决策、统计与在途武器，继续后结果一致',()=>{
  const original=begin(pair({seed:339911}));advance(original,37);
  const resumed=deserialize(serialize(original));
  assert.equal(resumed.paused,true);assert.equal(resumed.version,9);
  assert.deepEqual(comparable(resumed),comparable(original));
  resumed.paused=false;advance(original,203);advance(resumed,203);
  assert.deepEqual(comparable(resumed),comparable(original));
  assert.deepEqual(engine.getBattleReport(resumed),engine.getBattleReport(original));
});

test('暂停冻结自动决策、作战计时、弹药与战报',()=>{
  const s=begin(pair());advance(s,19);s.paused=true;
  const before=serialize(s),report=engine.getBattleReport(s);
  step(s,600);assert.equal(serialize(s),before);assert.deepEqual(engine.getBattleReport(s),report);
  s.paused=false;step(s,1);assert.equal(s.time,20);
});

test('隐藏敌舰位置不影响未获航迹的本方搜索航线',()=>{
  function hidden(redPosition){
    const s=empty({seed:554433}),blue=add(s,'ssn_virginia','blue',60,95);
    add(s,'ssn093','red',redPosition.x,redPosition.y);
    begin(s);advance(s,8);assert.deepEqual(s.contacts.blue,{});
    return navigation(blue);
  }
  assert.deepEqual(hidden({x:195,y:70}),hidden({x:170,y:65}));
});

test('深潜潜艇不可仅凭友军的水面航迹发射潜射反舰弹',()=>{
  const s=empty(),sub=add(s,'ssn_virginia','blue',60,95);
  add(s,'e2d','blue',65,80);const target=add(s,'frigate','red',115,95);
  begin(s);
  // 生成外部有效航迹，不给本艇虚构本地观测。
  const observer=s.units.find(u=>u.type==='e2d');
  sub.depth='deep';sub.sonar=false;sub.radar=false;sub.esm=false;
  s.contacts.blue[target.id]={id:target.id,x:target.x,y:target.y,time:s.time,progress:30,quality:'track',source:'雷达',domain:'surface',altitude:'medium',emitting:true,label:'水面接触',observations:{[observer.id]:{quality:'track',source:'雷达',time:s.time}}};
  const result=fireCheck(s,sub.id,target.id,'asm');
  assert.equal(result.ok,false);assert.match(result.error,/数据链|潜望镜|航迹/);
  assert.equal(s.missiles.filter(m=>m.shooter===sub.id).length,0);
});

test('作战达到时限自动结束并形成双方可核对的有限战报',()=>{
  const s=empty({timeLimit:300});add(s,'submarine','blue',60,95);add(s,'submarine','red',195,70);
  begin(s);advance(s,299);assert.equal(s.phase,'running');advance(s,2);
  assert.equal(s.time,300);assert.equal(s.phase,'ended');assert.equal(s.paused,true);
  const report=engine.getBattleReport(s);
  assert.equal(report.status,'ended');assert.equal(report.time,300);assert.equal(report.timeLimit,300);
  assert.ok(['blue','red','draw'].includes(report.winner));assert.ok(report.reason);
  for(const side of ['blue','red']){
    for(const key of ['deployed','surviving','lost','damageDealt','shots','interceptions','sorties','score'])assert.ok(Number.isFinite(report[side][key])&&report[side][key]>=0,`${side} ${key}`);
    assert.equal(report[side].surviving+report[side].lost,report[side].deployed);
  }
  assert.ok(Array.isArray(report.timeline));for(const entry of report.timeline)assert.ok(Number.isFinite(entry.time)&&typeof entry.message==='string');
  const frozen=serialize(s);step(s,600);assert.equal(serialize(s),frozen);
});

test('已失去最后战斗单位的一方仍有在途攻击时，等待攻击结算后判定胜负',()=>{
  const s=empty(),blue=add(s,'destroyer','blue',70,95),red=add(s,'frigate','red',90,95);
  begin(s);red.autoDefense=false;
  s.contacts.blue[red.id]={id:red.id,x:red.x,y:red.y,time:s.time,progress:30,quality:'track',source:'雷达',domain:'surface',altitude:'medium',emitting:true,label:'水面接触',observations:{[blue.id]:{quality:'track',source:'雷达',time:s.time}}};
  assert.ok(engine.fire(s,blue.id,red.id,'asm').ok);blue.hp=0;
  step(s,1);assert.equal(s.phase,'running');assert.ok(s.missiles.some(m=>m.side==='blue'&&m.targetKind==='unit'));
  advance(s,240);assert.equal(s.phase,'ended');assert.equal(engine.getBattleReport(s).winner,'red');
});

test('双方无可用攻击弹药与待结算武器时自动停止，避免无限空转',()=>{
  const s=empty();add(s,'frigate','blue',70,95);add(s,'frigate','red',170,95);
  begin(s);
  for(const u of s.units){for(const key of Object.keys(u.weapons))u.weapons[key]=0;u.ciws=0;}
  advance(s,32);
  assert.equal(s.phase,'ended');assert.ok(s.time<300);assert.ok(engine.getBattleReport(s).reason);
});

test('AI 接敌距离忽略已达到自卫保留量的远程防空弹',()=>{
  const s=empty(),ship=add(s,'destroyer','blue',70,90),target=add(s,'bomber','red',128,90);
  ship.weapons.sam=3;ship.weapons.asm=ship.weapons.torpedo=0;ship.weapons.point=8;
  // 无攻击弹药的靶机返航，让测试独立于来袭导弹的自卫消耗。
  for(const key of Object.keys(target.weapons))target.weapons[key]=0;
  begin(s);advance(s,16);
  const contact=s.contacts.blue[target.id];assert.equal(contact.quality,'track');
  assert.equal(ship.weapons.sam,ship.samReserve);assert.ok(ship.ai.goal);
  assert.ok(engine.distance(ship.ai.goal,contact)<=engine.WEAPONS.point.range,'AI should approach within its usable point-defence weapon range');
});

test('仅经预警机发现的低空目标，半主动弹接敌距离受本舰照射视距限制',()=>{
  const s=empty(),ship=add(s,'destroyer','blue',70,90),awacs=add(s,'awacs','blue',64,70),target=add(s,'bomber','red',128,90);
  target.altitude='low';for(const key of Object.keys(target.weapons))target.weapons[key]=0;
  begin(s);advance(s,16);
  const contact=s.contacts.blue[target.id],range=engine.sensorRange(s,ship,'air','low');
  assert.equal(contact.quality,'track');assert.equal(contact.observations[awacs.id].source,'雷达');
  assert.notEqual(contact.observations[ship.id]?.source,'雷达');assert.ok(engine.distance(ship,contact)>range);
  assert.ok(ship.ai.goal);assert.ok(engine.distance(ship.ai.goal,contact)<range,'AI should close enough for local radar illumination');
  assert.equal(fireCheck(s,ship.id,target.id,'sam').ok,false);
});

test('双方飞机停飞且燃油耗尽时，剩余挂载不能使推演无限继续',()=>{
  const s=begin(pair());
  for(const u of s.units){assert.ok(u.weapons.aam>0);u.flightState='grounded';u.fuel=0;u.speed=0;u.route=[];}
  advance(s,16);assert.equal(s.phase,'ended');assert.ok(s.time<300);
  assert.match(engine.getBattleReport(s).reason,/弹药|架次/);
});

test('载入拒绝运行中的结束时间与不一致的胜负记录',()=>{
  const s=begin(pair());advance(s,20);
  const running=JSON.parse(serialize(s));running.automation.finishedAt=running.time;
  assert.throws(()=>deserialize(JSON.stringify(running)),/结束时间|阶段/);
  engine.stopAutoBattle(s);const ended=JSON.parse(serialize(s));
  assert.ok(deserialize(JSON.stringify(ended)));
  ended.result=ended.result==='victory'?'defeat':'victory';
  assert.throws(()=>deserialize(JSON.stringify(ended)),/胜负|结果/);
});

test('手动结束保留统计，重开恢复开战前部署和配置而非残血残弹',()=>{
  const s=pair({seed:668899,blueDoctrine:'cautious',redDoctrine:'aggressive'});
  const setupUnits=s.units.map(u=>({id:u.id,type:u.type,side:u.side,x:u.x,y:u.y,hp:u.hp,weapons:clone(u.weapons)}));
  begin(s);advance(s,40);
  const before=engine.getBattleReport(s);engine.stopAutoBattle(s);
  assert.equal(s.phase,'ended');assert.equal(s.paused,true);
  const report=engine.getBattleReport(s);assert.ok(report.reason);assert.equal(report.blue.shots,before.blue.shots);assert.equal(report.red.shots,before.red.shots);
  const restarted=engine.restartAutoBattle(s);
  assert.equal(restarted.phase,'setup');assert.equal(restarted.time,0);assert.equal(restarted.paused,true);
  assert.equal(engine.isAutoBattle(restarted),true);
  assert.deepEqual(restarted.units.map(u=>({id:u.id,type:u.type,side:u.side,x:u.x,y:u.y,hp:u.hp,weapons:u.weapons})),setupUnits);
  assert.equal(engine.getBattleReport(restarted).blue.shots,0);assert.equal(engine.getBattleReport(restarted).red.shots,0);
  begin(restarted);assert.ok(restarted.units.every(u=>u.autoEngage));
});

test('v4 现代装备战局升级后保留资源且不会自动启用 AI 对战',()=>{
  const raw=JSON.parse(serialize(engine.createState('modernlab')));raw.version=4;delete raw.automation;for(const u of raw.units)delete u.ai;
  const loaded=deserialize(JSON.stringify(raw));assert.equal(loaded.version,9);assert.equal(engine.isAutoBattle(loaded),false);assert.equal(engine.getBattleReport(loaded),null);
  assert.deepEqual(loaded.units.map(u=>[u.id,u.type,u.weapons,u.airwing,u.supply,u.fuel]),raw.units.map(u=>[u.id,u.type,u.weapons,u.airwing,u.supply,u.fuel]));assert.equal(loaded.budget,raw.budget);assert.equal(loaded.redBudget,raw.redBudget);
});

test('启用当前双方部署不重置单位挂载，历史任务拒绝转换',()=>{
  const s=engine.createState('modernlab'),air=add(s,'f35c','blue',80,50);assert.ok(engine.setLoadout(s,air.id,'strike').ok);const before=clone(s.units);
  assert.ok(engine.configureAutoBattle(s,{blueDoctrine:'cautious',timeLimit:600,seed:0}).ok);assert.equal(s.scenario,'modernlab');assert.deepEqual(s.units,before);begin(s);assert.equal(s.automation.seed,0);assert.ok(s.units.every(u=>u.autoEngage));
  const historical=engine.createState('bubiyan91'),saved=serialize(historical);assert.equal(engine.configureAutoBattle(historical).ok,false);assert.equal(serialize(historical),saved);
});

test('AI 海上搜索避开公共海岸，每段绕岛航线均可航行',()=>{
  const s=empty(),sub=add(s,'ssn_virginia','blue',150,3);add(s,'ssn093','red',30,130);assert.equal(engine.clearPath(sub,{x:120,y:170*.53},s),false);begin(s);assert.ok(sub.route.length>=2);
  let from=sub;for(const point of sub.route){assert.ok(engine.clearPath(from,point,s));from=point;}
});

test('AI 反潜直升机低空吊放搜索能实际建立水下航迹',()=>{
  const s=empty(),helo=add(s,'mh60r','blue',70,90),sub=add(s,'ssn093','red',90,90);begin(s);advance(s,16);assert.equal(helo.altitude,'low');assert.ok(helo.speed<=40);assert.equal(helo.sonar,true);assert.equal(s.contacts.blue[sub.id].quality,'track');assert.equal(s.contacts.blue[sub.id].observations[helo.id].source,'声呐');
});

test('自动对战固定步长使帧率与倍速分片不改变同种子结果，存档保留不足一秒余量',()=>{
  const a=begin(pair({seed:451234})),b=begin(pair({seed:451234}));advance(a,240);for(let i=0;i<1200&&b.phase==='running';i++)step(b,.2);
  assert.deepEqual(comparable(a),comparable(b));assert.deepEqual(engine.getBattleReport(a),engine.getBattleReport(b));
  const c=begin(pair({seed:912345}));step(c,.3);assert.equal(c.time,0);assert.ok(Math.abs(c.automation.tickRemainder-.3)<1e-9);const resumed=deserialize(serialize(c));resumed.paused=false;step(c,.7);step(resumed,.7);assert.equal(c.time,1);assert.deepEqual(comparable(c),comparable(resumed));
});
