import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';

const KM_PER_NM=1.852;
const presets=['surface','carrier','asw'];
const raw=s=>JSON.parse(E.serialize(s));
const load=value=>E.deserialize(JSON.stringify(value));
const country=side=>side==='blue'?'美国':'中国';
function nearestKm(s){
  const pairs=s.units.filter(u=>u.side==='blue').flatMap(blue=>s.units.filter(u=>u.side==='red').map(red=>E.distance(blue,red)*KM_PER_NM));
  return pairs.length?Math.min(...pairs):null;
}
function add(s,type,side,x,y){const result=E.addUnit(s,type,side,{x,y});assert.ok(result.ok,result.error);return result.unit;}
function advance(s,seconds){for(let remaining=seconds;remaining>0&&s.phase==='running';){const dt=Math.min(600,remaining);E.step(s,dt);remaining-=dt;}return s;}

test('美中完整预案在扩展海图上从最近 250 公里阵位开始',()=>{
  for(const preset of presets){
    const s=E.createAutoBattle(preset),theatre=E.getBattleTheatre(s),world=E.worldFor(s);
    assert.equal(s.mapId,'uscn250');assert.equal(s.version,6);
    assert.equal(world.width,440);assert.equal(world.height,260);
    assert.equal(theatre.initialSeparationKm,250);
    assert.ok(Math.abs(theatre.initialSeparationNm-250/KM_PER_NM)<1e-9);
    assert.equal(E.factionName(s,'blue'),'美方');assert.equal(E.factionName(s,'red'),'中方');
    assert.ok(Math.abs(E.distance(theatre.anchors.blue,theatre.anchors.red)*KM_PER_NM-250)<1e-9);
    assert.ok(Math.abs(nearestKm(s)-250)<1e-9,`${preset}: nearest starting units must be 250 km apart`);
    assert.equal(s.automation.timeLimit,7200);
    for(const unit of s.units){
      assert.ok(E.inBounds(unit,s));
      if(E.TYPES[unit.type].domain!=='air')assert.equal(E.inLand(unit,s),false);
      assert.ok(unit.side==='blue'?unit.x<=theatre.anchors.blue.x+1e-9:unit.x>=theatre.anchors.red.x-1e-9);
    }
    assert.equal(load(raw(s)).mapId,s.mapId);
  }
});

test('完整预案的主力及甲板航空队分别来自美国和中国，预算保持有限',()=>{
  for(const preset of presets){
    const s=E.createAutoBattle(preset);
    for(const side of ['blue','red']){
      const units=s.units.filter(u=>u.side===side);
      assert.ok(units.length>0);
      for(const unit of units){
        const type=E.TYPES[unit.type];assert.equal(type.country,country(side),`${preset}: ${unit.type}`);
        assert.equal(E.canDeployType(s,unit.type,side),true);
        for(const [airType,count] of Object.entries(unit.airwing)){
          assert.equal(E.TYPES[airType].country,country(side),`${unit.type}: ${airType}`);
          assert.ok(Number.isInteger(count)&&count>=0);
        }
      }
      const spent=units.reduce((n,u)=>n+E.TYPES[u.type].cost,0),budget=s[side==='blue'?'budget':'redBudget'];
      assert.ok(budget>=0&&budget<=600);assert.equal(budget+spent,600);
    }
  }
});

test('新海域按国家筛选部署，保留双方通用岸基阵地',()=>{
  const s=E.createAutoBattle('empty');
  assert.equal(E.canDeployType(s,'fa18e','blue'),true);assert.equal(E.canDeployType(s,'j16','red'),true);
  for(const [type,side] of [['j16','blue'],['fa18e','red'],['ffg_mogami','blue'],['ffg_mogami','red'],['fighter','blue'],['destroyer','red']]){
    assert.equal(E.canDeployType(s,type,side),false,`${side}: ${type}`);
    const before=E.serialize(s),result=E.addUnit(s,type,side,{x:side==='blue'?70:370,y:130});
    assert.equal(result.ok,false);assert.match(result.error,/本国|阵营/);assert.equal(E.serialize(s),before);
  }
  for(const side of ['blue','red'])for(const type of ['airbase','coastalAsm','samLong'])assert.equal(E.canDeployType(s,type,side),true);
  add(s,'airbase','blue',17,43);add(s,'airbase','red',431,244);
  assert.ok(load(raw(s)));
});

test('部署线拒绝靠近敌方的初始阵位，边界上可部署且能撤回返还预算',()=>{
  const s=E.createAutoBattle('empty'),theatre=E.getBattleTheatre(s);
  for(const [type,side,anchor] of [['fa18e','blue',theatre.anchors.blue],['j16','red',theatre.anchors.red]]){
    const before=E.serialize(s),result=E.addUnit(s,type,side,{x:anchor.x+(side==='blue'?.01:-.01),y:anchor.y});
    assert.equal(result.ok,false);assert.match(result.error,/250|部署|前沿/);assert.equal(E.serialize(s),before);
    add(s,type,side,anchor.x,anchor.y);
  }
  assert.ok(Math.abs(nearestKm(s)-250)<1e-9);
  for(const unit of [...s.units])assert.equal(E.removeUnit(s,unit.id),true);
  assert.equal(s.budget,600);assert.equal(s.redBudget,600);
});

test('战报记录实际开战间距，行进和重开不改写最初 250 公里',()=>{
  const s=E.createAutoBattle('surface'),initial=raw(s).units;
  assert.ok(E.startAutoBattle(s).ok);advance(s,60);
  assert.ok(nearestKm(s)<250);
  const report=E.getBattleReport(s);
  assert.equal(report.theatre.id,'uscn250');assert.equal(report.theatre.initialSeparationKm,250);
  assert.deepEqual(report.theatre.factions,{blue:'美方',red:'中方'});
  assert.ok(Math.abs(report.initialDistanceKm-250)<1e-9);
  const saved=load(raw(s));assert.ok(Math.abs(E.getBattleReport(saved).initialDistanceKm-250)<1e-9);
  E.stopAutoBattle(saved);const restarted=E.restartAutoBattle(saved);
  assert.equal(restarted.mapId,'uscn250');assert.equal(restarted.phase,'setup');assert.equal(restarted.time,0);
  assert.deepEqual(restarted.units.map(u=>[u.id,u.type,u.side,u.x,u.y,u.weapons]),initial.map(u=>[u.id,u.type,u.side,u.x,u.y,u.weapons]));
  assert.ok(Math.abs(nearestKm(restarted)-250)<1e-9);
});

test('自定义阵位大于 250 公里时，战报保留实际间距',()=>{
  const s=E.createAutoBattle('empty');add(s,'fa18e','blue',60,130);add(s,'j16','red',380,130);
  const actual=320*KM_PER_NM;assert.ok(actual>250);assert.ok(E.startAutoBattle(s).ok);
  assert.ok(Math.abs(E.getBattleReport(s).initialDistanceKm-actual)<1e-9);
});

test('扩展海图载入保留旧边界之外的航迹、返航点与 AI 计划',()=>{
  const s=E.createAutoBattle('empty'),blue=add(s,'fa18e','blue',70,130),red=add(s,'j16','red',370,130);
  assert.ok(E.startAutoBattle(s).ok);
  red.route=[{x:400,y:200}];red.home={x:419,y:205,baseId:null};
  red.ai.anchor={x:370,y:130};red.ai.goal={x:400,y:200};
  s.contacts.blue[red.id]={id:red.id,x:420,y:240,time:s.time,progress:30,quality:'track',source:'雷达',domain:'air',altitude:'high',emitting:true,label:'空中接触',observations:{[blue.id]:{quality:'track',source:'雷达',time:s.time}}};
  const saved=load(raw(s)),restored=saved.units.find(u=>u.id===red.id);
  assert.equal(E.worldFor(saved).width,440);assert.equal(E.worldFor(saved).height,260);
  assert.deepEqual(restored.route,red.route);assert.deepEqual(restored.home,red.home);assert.deepEqual(restored.ai,red.ai);
  assert.equal(saved.contacts.blue[red.id].x,420);assert.equal(saved.contacts.blue[red.id].y,240);
  assert.deepEqual(saved.contacts.blue[red.id].observations,s.contacts.blue[red.id].observations);
});

test('存档拒绝未知海域、错误国家和非法初始部署区',()=>{
  const source=raw(E.createAutoBattle('surface'));
  for(const mutate of [r=>r.mapId='unknown-theatre',r=>r.units.find(u=>u.side==='blue').type='ffg_mogami',r=>r.units.find(u=>u.side==='red').x=220]){
    const value=structuredClone(source);mutate(value);assert.throws(()=>load(value),/海域|阵营|部署/);
  }
});

test('此前 v6 的 500 公里美中存档载入、继续和重赛保持原阵位与间距',()=>{
  const legacy=raw(E.createAutoBattle('surface'));
  // Restore the previous preset geometry without changing its equipment or resources.
  const shift=(500-250)/(2*KM_PER_NM);legacy.mapId='uscn500';
  for(const unit of legacy.units)unit.x+=unit.side==='blue'?-shift:shift;
  const initial=legacy.units.map(u=>[u.id,u.type,u.side,u.x,u.y,u.weapons]);
  const loaded=load(legacy);
  assert.equal(loaded.version,6);assert.equal(loaded.mapId,'uscn500');
  assert.equal(E.getBattleTheatre(loaded).initialSeparationKm,500);
  assert.ok(Math.abs(nearestKm(loaded)-500)<1e-9);
  assert.equal(E.getBattleReport(loaded).theatre.id,'uscn500');
  assert.ok(Math.abs(E.getBattleReport(loaded).initialDistanceKm-500)<1e-9);
  assert.ok(E.startAutoBattle(loaded).ok);advance(loaded,60);
  const resumed=load(raw(loaded));
  assert.equal(resumed.phase,'running');assert.equal(resumed.mapId,'uscn500');
  assert.equal(E.getBattleReport(resumed).theatre.initialSeparationKm,500);
  assert.ok(Math.abs(E.getBattleReport(resumed).initialDistanceKm-500)<1e-9);
  E.stopAutoBattle(resumed);const restarted=E.restartAutoBattle(resumed);
  assert.equal(restarted.phase,'setup');assert.equal(restarted.mapId,'uscn500');
  assert.ok(Math.abs(nearestKm(restarted)-500)<1e-9);
  assert.deepEqual(restarted.units.map(u=>[u.id,u.type,u.side,u.x,u.y,u.weapons]),initial);
  assert.ok(E.startAutoBattle(load(raw(restarted))).ok);
});

test('v5 自动对战继续使用原地图，升级后重赛仍保留原部署',()=>{
  const s=E.createState('sandbox');s.units=[];s.budget=s.redBudget=600;
  assert.ok(E.configureAutoBattle(s).ok);add(s,'fighter','blue',70,90);add(s,'fighter','red',170,90);
  const legacy=raw(s);legacy.version=5;legacy.scenario='autobattle';legacy.mapId=null;
  const loaded=load(legacy);
  assert.equal(loaded.version,6);assert.equal(loaded.mapId,null);assert.equal(E.getBattleTheatre(loaded),null);
  assert.equal(E.worldFor(loaded).width,240);assert.equal(E.worldFor(loaded).height,170);
  assert.equal(E.factionName(loaded,'blue'),'蓝方');assert.equal(E.factionName(loaded,'red'),'红方');
  assert.deepEqual(loaded.units.map(u=>[u.type,u.x,u.y,u.weapons]),legacy.units.map(u=>[u.type,u.x,u.y,u.weapons]));
  assert.ok(E.startAutoBattle(loaded).ok);advance(loaded,20);E.stopAutoBattle(loaded);
  const restarted=E.restartAutoBattle(loaded);
  assert.equal(restarted.mapId,null);assert.equal(E.worldFor(restarted).width,240);
  assert.deepEqual(restarted.units.map(u=>[u.type,u.x,u.y]),legacy.units.map(u=>[u.type,u.x,u.y]));
});

test('250 公里开局遵守原有射程，双方能自主搜索并实际交火',()=>{
  const s=E.createAutoBattle('surface');assert.ok(E.configureAutoBattle(s,{seed:712301}).ok);
  assert.ok(E.startAutoBattle(s).ok);
  assert.equal(E.getBattleReport(s).blue.shots,0);assert.equal(E.getBattleReport(s).red.shots,0);
  assert.equal(s.missiles.length,0);
  advance(s,3600);
  const report=E.getBattleReport(s);
  for(const side of ['blue','red'])assert.ok(report[side].shots>0,`${side} did not engage after searching from 250 km`);
  assert.ok(report.timeline.length>0);
  assert.ok(load(raw(s)));
});

test('250 公里反潜预案在默认两小时内搜索接敌并由双方实际发射鱼雷',()=>{
  const s=E.createAutoBattle('asw');
  assert.equal(s.automation.timeLimit,7200);assert.ok(E.startAutoBattle(s).ok);
  advance(s,7200);
  assert.equal(s.phase,'ended');assert.equal(s.time,7200);
  const report=E.getBattleReport(s);
  assert.match(report.reason,/时限/);
  for(const side of ['blue','red'])assert.ok(report[side].spent.torpedo>0,`${side} did not acquire and attack a submarine`);
  const saved=load(raw(s));
  assert.equal(saved.mapId,'uscn250');assert.equal(saved.phase,'ended');
  assert.deepEqual(E.getBattleReport(saved),report);
});
