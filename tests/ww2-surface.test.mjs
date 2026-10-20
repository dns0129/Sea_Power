import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.13.1';
import {scenarioChoices,missionGoals,briefingChart} from '../dist/scenario-flow.js?v=0.13.1';
import {seaSnapshot,modelFor} from '../dist/sea-scene-data.js?v=0.13.1';
import {missionZone} from '../dist/historical-missions.js?v=0.13.1';

const ids=['denmark41','guadalcanal42','samar44'];
function run(s,seconds){while(seconds>0&&s.phase==='running'){const dt=Math.min(seconds,300);E.step(s,dt);seconds-=dt;}}
function battle(id){const s=E.createState(id);assert.equal(E.start(s).ok,true);return s;}

test('三个新剧本具有独立海域、历史简报与任务目标，固定兵力和阵营可存档',()=>{
  assert.ok(ids.every(id=>scenarioChoices('ww2').some(c=>c.id===id)));
  assert.equal(new Set(ids.map(id=>E.createState(id).mapId)).size,3);
  for(const id of ids){
    const s=E.createState(id);assert.equal(E.freeDeploy(s),false);
    assert.ok(s.units.every(u=>E.inBounds(u,s)&&(E.TYPES[u.type].domain==='land'?E.inLand(u,s):!E.inLand(u,s))));
    assert.equal(missionGoals(s).length,3);assert.ok(E.SCENARIOS[id].history.length>100);
    assert.ok(E.SCENARIOS[id].sourceURL.startsWith('https://'));
    const loaded=E.deserialize(E.serialize(s));assert.equal(loaded.units.length,s.units.length);
    assert.equal(E.addUnit(s,'destroyer','blue',{x:40,y:30}).ok,false);
  }
  assert.equal(E.factionName(E.createState('denmark41'),'blue'),'英军');
  assert.equal(E.canDeployType(E.createState('denmark41'),'ww2_yorktown','blue'),false);
  assert.equal(modelFor('ww2_washington'),'ww2-battleship');
});

test('新简报与 3D 视角只使用本方兵力和已报告接触，不读取隐藏敌舰',()=>{
  for(const id of ids){
    const s=E.createState(id);
    for(const u of s.units.filter(u=>u.side==='red'))for(const key of ['x','y','type','hp','weapons'])Object.defineProperty(u,key,{get(){throw Error(`读取敌舰 ${key}`);}});
    assert.doesNotThrow(()=>briefingChart(s,{deployment:true}));
    assert.doesNotThrow(()=>seaSnapshot(s,{all:true}));
  }
});

test('夜间仅炮瞄雷达连续跟踪可用于舰炮射击，停止雷达后失去盲射资格',()=>{
  const s=battle('guadalcanal42'),ship=s.units[0],target=s.units.find(u=>u.type==='ww2_kirishima');
  s.units=[ship,target];Object.assign(ship,{x:30,y:22,radar:true});Object.assign(target,{x:41,y:22});s.contacts={blue:{},red:{}};
  E.scan(s);assert.equal(s.contacts.blue[target.id].source,'雷达');assert.equal(s.contacts.blue[target.id].quality,'search');
  assert.equal(E.fireCheck(s,ship.id,target.id,'gun').ok,false);
  for(const time of [3,6,9]){s.time=time;E.scan(s);}
  assert.equal(s.contacts.blue[target.id].quality,'track');assert.equal(s.contacts.blue[target.id].classification,null);
  assert.equal(E.fireCheck(s,ship.id,target.id,'gun').ok,true);
  ship.radar=false;assert.equal(E.fireCheck(s,ship.id,target.id,'gun').ok,false);
});

test('黑暗缩短目视，炮口焰暂时暴露开火舰艇，暴露结束后报告失联',()=>{
  const s=battle('guadalcanal42'),target=s.units[1],observer=s.units.find(u=>u.type==='ww2_kirishima');
  s.units=[observer,target];Object.assign(observer,{x:30,y:22,radar:false});Object.assign(target,{x:36,y:22,radar:false});s.contacts={blue:{},red:{}};
  E.scan(s);assert.equal(s.contacts.red[target.id],undefined);
  target.lastGunAt=0;target.cooldowns.gun=E.weaponStats(target,'gun').cooldown;E.scan(s);
  assert.equal(s.contacts.red[target.id].source,'目视');
  s.time=25;E.scan(s);assert.equal(E.visibleContacts(s,'red')[0].stale,true);
});

test('烟幕立即遮断光学射击，雷达保留概略报告，库存、冷却与烟迹可恢复',()=>{
  const s=battle('samar44'),ship=s.units.find(u=>u.type==='ww2_fletcher'),smoker=s.units.find(u=>u.type==='ww2_destroyer_escort'),target=s.units.find(u=>u.type==='ww2_jp_torpedo_dd');
  Object.assign(ship,{x:70,y:70});Object.assign(smoker,{x:72,y:70});Object.assign(target,{x:74,y:70});E.scan(s);
  assert.equal(E.fireCheck(s,ship.id,target.id,'gun').ok,true);
  const charges=smoker.smokeCharges;assert.equal(E.deploySmoke(s,smoker.id).ok,true);assert.equal(smoker.smokeCharges,charges-1);
  assert.match(E.fireCheck(s,ship.id,target.id,'gun').error,/烟幕/);assert.equal(E.deploySmoke(s,smoker.id).ok,false);
  s.time=3;E.scan(s);const o=s.contacts.blue[target.id].observations[ship.id];assert.equal(o.source,'雷达');assert.equal(o.quality,'search');
  const loaded=E.deserialize(E.serialize(s));assert.deepEqual(loaded.smoke,s.smoke);assert.equal(loaded.units.find(u=>u.id===smoker.id).smokeCharges,charges-1);
  const bad=JSON.parse(E.serialize(s));bad.smoke[0].radius=99;assert.throws(()=>E.deserialize(JSON.stringify(bad)),/烟幕/);
  s.time=180;E.scan(s);assert.equal(s.contacts.blue[target.id].observations[ship.id].source,'目视');
});

test('水面舰可发射直航鱼雷，无空投高度限制，也没有末段制导',()=>{
  const s=battle('samar44'),ship=s.units.find(u=>u.type==='ww2_fletcher'),target=s.units.find(u=>u.type==='ww2_jp_torpedo_dd');
  Object.assign(ship,{x:70,y:70,altitude:'medium'});Object.assign(target,{x:74,y:70,heading:90,speed:25,route:[{x:90,y:70}]});E.scan(s);
  assert.equal(E.fire(s,ship.id,target.id,'torpedo').ok,true);
  const round=s.missiles.at(-1);assert.equal(round.guidance,'inertial');assert.equal(E.projectileStats(s,round).seeker,0);assert.ok(round.aim.x>target.x);
});

test('战列舰装甲降低小口径舰炮毁伤，大口径主炮能够有效破坏主力舰',()=>{
  const shot=type=>{
    const s=battle('denmark41'),ship=s.units.find(u=>u.type===type),target=s.units.find(u=>u.type==='ww2_bismarck');
    for(const u of s.units){u.autoEngage=false;u.autoDefense=false;u.route=[];}
    Object.assign(ship,{x:40,y:30,heading:0});Object.assign(target,{x:44,y:30,heading:0,speed:0});s.seed=2000;E.scan(s);
    const hp=target.hp;assert.equal(E.fire(s,ship.id,target.id,'gun').ok,true);run(s,9);return hp-target.hp;
  };
  const light=shot('ww2_uk_cruiser'),heavy=shot('ww2_prince_wales');assert.ok(light>0&&light<20);assert.ok(heavy>light*3);
});

test('二战舰炮能轰击已观测岸上目标，水面鱼雷仍被海岸阻挡',()=>{
  const s=battle('guadalcanal42'),ship=s.units.find(u=>u.type==='ww2_kirishima'),base=s.units.find(u=>u.type==='ww2_henderson');
  Object.assign(ship,{x:base.x,y:base.y-7,route:[]});E.scan(s);
  assert.equal(s.contacts.red[base.id].observations[ship.id].source,'目视');
  assert.equal(E.fire(s,ship.id,base.id,'gun').ok,true);
  assert.equal(s.missiles.at(-1).target,base.id);
});

test('任务按有效跟踪、机场防御和真实撤离结算，损失及时限会导致失败',()=>{
  const a=battle('denmark41');a.units.find(u=>u.type==='ww2_bismarck').hp=400;a.mission.tracking=119;run(a,1);assert.equal(a.result,'victory');
  const lost=battle('denmark41');lost.units.find(u=>u.type==='ww2_bismarck').hp=400;lost.mission.tracking=119;lost.contacts.blue={};run(lost,1);assert.equal(lost.mission.tracking,0);
  const b=battle('guadalcanal42');b.units.find(u=>u.type==='ww2_kirishima').hp=200;run(b,1);assert.equal(b.result,'victory');
  const base=battle('guadalcanal42');base.units.find(u=>u.type==='ww2_henderson').hp=290;run(base,1);assert.equal(base.result,'defeat');
  const c=battle('samar44'),gate=missionZone(c),carriers=c.units.filter(u=>u.type==='ww2_escort_carrier');
  carriers.slice(0,4).forEach(u=>Object.assign(u,{x:gate.x,y:gate.y}));run(c,1);assert.equal(c.result,'victory');assert.equal(c.mission.secured.length,4);assert.equal(E.deserialize(E.serialize(c)).mission.escapedCarriers,4);
  const sunk=battle('samar44');sunk.units.filter(u=>u.type==='ww2_escort_carrier').slice(0,3).forEach(u=>u.hp=0);run(sunk,1);assert.equal(sunk.result,'defeat');
  for(const id of ids){const s=battle(id);s.time=E.SCENARIOS[id].duration-1;run(s,1);assert.equal(s.result,'defeat');}
});

test('自主计划只根据本方报告生成航线，存档恢复保留报告及计划',()=>{
  for(const id of ids){
    const a=battle(id),b=battle(id);a.contacts.blue={};b.contacts.blue={};
    for(const u of b.units.filter(u=>u.side==='red')){u.x+=.5;u.y+=.5;}
    E.issueMissionOrder(a,'plan');E.issueMissionOrder(b,'plan');
    const own=s=>s.units.filter(u=>u.side==='blue').map(u=>({id:u.id,route:u.route,airwing:u.airwing}));
    assert.deepEqual(own(a),own(b));
    run(a,91);const saved=E.deserialize(E.serialize(a));assert.equal(saved.time,a.time);assert.ok(saved.mission.orders.includes('plan'));
    assert.deepEqual(saved.smoke,a.smoke);assert.equal(saved.paused,true);
    assert.equal(E.issueMissionOrder(a,'manual').ok,true);assert.deepEqual(a.mission.orders,[]);
  }
});

test('三个完整战局可进行炮战、夜战和航空掩护，历史结局不按时间强制发生',()=>{
  for(const id of ids){
    const s=battle(id);E.issueMissionOrder(s,'plan');run(s,E.SCENARIOS[id].duration);
    assert.equal(s.phase,'ended');assert.ok(s.time<=E.SCENARIOS[id].duration);
    assert.ok(s.units.some(u=>u.side==='blue'&&u.weapons.gun<E.TYPES[u.type].weapons.gun));
    assert.ok(s.units.some(u=>u.side==='red'&&u.weapons.gun<E.TYPES[u.type].weapons.gun));
    assert.equal(E.deserialize(E.serialize(s)).result,s.result);
    if(id==='samar44'){
      assert.ok(s.units.some(u=>E.TYPES[u.type].domain==='air'&&u.weapons.bomb<E.TYPES[u.type].weapons.bomb));
      assert.ok(s.units.some(u=>u.side==='blue'&&E.TYPES[u.type].domain==='surface'&&u.weapons.torpedo<E.TYPES[u.type].weapons.torpedo));
      assert.ok(s.units.some(u=>u.smokeCharges<E.TYPES[u.type].smoke));
      assert.equal(s.result,'victory');
    }
    else assert.equal(s.result,'victory');
  }
});
