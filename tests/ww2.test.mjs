import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.13.1';
import {scenarioChoices,missionGoals,briefingChart} from '../dist/scenario-flow.js?v=0.13.1';
import {seaSnapshot,modelFor} from '../dist/sea-scene-data.js?v=0.13.1';

function quiet(){const s=E.createState('midway42');E.start(s);for(const u of s.units){u.autoEngage=false;u.autoDefense=false;u.radar=false;}return s;}
function run(s,seconds){while(seconds>0&&s.phase==='running'){const n=Math.min(300,seconds);E.step(s,n);seconds-=n;}}

test('二战入口独立于现代历史任务与沙盘，简报覆盖目标且不泄露敌舰阵位',()=>{
  assert.deepEqual(new Set(scenarioChoices('ww2').map(c=>c.id)),new Set(['midway42','denmark41','guadalcanal42','samar44','ww2sandbox']));
  assert.ok(![...scenarioChoices('history'),...scenarioChoices('sandbox')].some(c=>c.id==='midway42'));
  const s=E.createState('midway42');assert.equal(E.isHistorical(s),true);assert.equal(E.freeDeploy(s),false);
  assert.match(JSON.stringify(missionGoals(s)),/三艘/);
  for(const u of s.units.filter(u=>u.side==='red'))for(const key of ['x','y'])Object.defineProperty(u,key,{get(){throw Error('读取未侦察敌舰位置');}});
  assert.doesNotThrow(()=>briefingChart(s,{deployment:true}));assert.doesNotThrow(()=>seaSnapshot(s));
});

test('中途岛采用年代专属单位、有限航空队和目视／早期雷达，没有现代武器',()=>{
  const s=E.createState('midway42');
  const cv=side=>s.units.filter(u=>u.side===side&&E.TYPES[u.type].ww2Role==='carrier');
  assert.equal(cv('blue').length,3);assert.equal(cv('red').length,4);
  assert.equal(Object.keys(s.contacts.blue).length,0);
  for(const u of s.units){const t=E.TYPES[u.type];assert.equal(t.era,'ww2');assert.equal(t.esm,0);assert.equal(t.ciws,0);assert.equal(t.decoys,0);for(const key of ['asm','supersonic','aam','sam','cruise','pgm','arm','asroc'])assert.equal(u.weapons[key],0,`${u.type} ${key}`);}
  assert.equal(E.addUnit(s,'cvn_ford','blue',{x:250,y:70}).ok,false);
  assert.equal(E.addUnit(E.createState('sandbox'),'ww2_yorktown','blue',{x:75,y:100}).ok,false);
  assert.equal(modelFor('ww2_yorktown'),'ww2-carrier');assert.equal(modelFor('ww2_f4f'),'ww2-fighter');
});

test('早期雷达只能建立概略搜索报告，低空受地平线限制，进入目视距离后才可交战',()=>{
  const s=quiet(),ship=s.units[0],enemy=s.units.find(u=>u.type==='ww2_a6m');
  for(const u of s.units.filter(u=>u.side==='blue'&&u.type!=='ww2_midway')){u.x=210;u.y=70;}
  ship.radar=true;enemy.x=245;enemy.y=70;enemy.altitude='medium';
  E.scan(s);s.time=30;E.scan(s);
  assert.equal(s.contacts.blue[enemy.id].source,'雷达');assert.equal(s.contacts.blue[enemy.id].quality,'search');
  assert.match(E.fireCheck(s,ship.id,enemy.id,'point').error,/目视/);
  s.contacts.blue={};enemy.altitude='low';E.scan(s);assert.equal(s.contacts.blue[enemy.id],undefined);
  enemy.x=211;E.scan(s);assert.equal(s.contacts.blue[enemy.id].source,'目视');
  assert.equal(E.fireCheck(s,ship.id,enemy.id,'point').ok,true);
  E.fire(s,ship.id,enemy.id,'point');assert.equal(s.missiles.at(-1).guidance,'inertial');assert.equal(E.projectileStats(s,s.missiles.at(-1)).seeker,0);
});

test('舰炮可造成舰艇毁伤，空投鱼雷按观测航向超前瞄准且不进行末段追踪',()=>{
  const s=quiet(),cruiser=s.units.find(u=>u.type==='ww2_us_cruiser'),target=s.units.find(u=>u.type==='ww2_jp_destroyer');
  target.x=cruiser.x+6;target.y=cruiser.y;target.route=[];target.speed=0;s.seed=2000;E.scan(s);
  assert.equal(E.fire(s,cruiser.id,target.id,'gun').ok,true);const hp=target.hp;run(s,20);assert.ok(target.hp<hp);
  const base=s.units[0];base.deckReady=0;const launched=E.launchDeck(s,base.id,'ww2_tbd');assert.equal(launched.ok,true);
  const plane=launched.unit;plane.x=220;plane.y=80;target.x=221;target.y=80;target.heading=90;target.speed=23;target.route=[{x:280,y:80}];
  plane.altitude='medium';E.scan(s);assert.match(E.fireCheck(s,plane.id,target.id,'torpedo').error,/低空/);
  plane.altitude='low';assert.equal(E.fire(s,plane.id,target.id,'torpedo').ok,true);
  const round=s.missiles.at(-1),aim={...round.aim};assert.ok(aim.x>target.x);assert.equal(round.guidance,'inertial');assert.equal(E.projectileStats(s,round).seeker,0);
  target.x=250;E.step(s,1);assert.deepEqual(round.aim,aim);
});

test('舰载机按年代和甲板适配放飞，库存扣减，重伤关闭甲板，回收整备消耗补给',()=>{
  const s=quiet(),base=s.units[0],before=base.airwing.ww2_sbd;
  assert.equal(E.launchDeck(s,base.id,'ww2_a6m').ok,false);
  const r=E.launchDeck(s,base.id,'ww2_sbd');assert.equal(r.ok,true);assert.equal(base.airwing.ww2_sbd,before-1);
  assert.equal(E.launchDeck(s,base.id,'ww2_sbd').ok,false);
  r.unit.x=base.x;r.unit.y=base.y;const supply=base.supply;E.returnToBase(s,r.unit.id);E.step(s,1);
  assert.equal(r.unit.flightState,'servicing');assert.equal(r.unit.serviceUntil,s.time+600);assert.ok(base.supply<supply);
  const saved=E.deserialize(E.serialize(s));assert.equal(saved.units.find(u=>u.id===r.unit.id).originDeck,base.id);
  base.hp=E.TYPES[base.type].hp*.3;base.deckReady=0;assert.equal(E.launchDeck(s,base.id,'ww2_sbd').ok,false);
});

test('作战计划必须先侦察，双方指挥不从隐藏敌舰位置生成蓝方航线',()=>{
  const a=quiet(),b=quiet();
  assert.match(E.issueMissionOrder(a,'strike').error,/侦察/);
  for(const u of b.units.filter(u=>u.side==='red'&&E.TYPES[u.type].domain==='surface')){u.x+=20;u.y+=20;}
  E.issueMissionOrder(a,'plan');E.issueMissionOrder(b,'plan');
  const blue=s=>s.units.filter(u=>u.side==='blue').map(u=>({id:u.id,type:u.type,route:u.route,airwing:u.airwing}));
  assert.deepEqual(blue(a),blue(b));
  assert.equal(E.issueMissionOrder(a,'manual').ok,true);assert.deepEqual(a.mission.orders,[]);
});

test('二战无线电报告保留原始位置、时间、分类与观测航向，继续存档不触发重新侦察',()=>{
  const s=quiet(),enemy=s.units.find(u=>u.side==='red'&&E.TYPES[u.type].ww2Role==='carrier');
  s.time=600;E.issueMissionOrder(s,'plan');s.contacts.blue[enemy.id]={id:enemy.id,x:140,y:110,time:300,progress:20,quality:'track',source:'目视',observations:{},domain:'surface',altitude:'medium',classification:'carrier',disabled:false,course:90,speed:23,label:'航母接触'};
  const loaded=E.deserialize(E.serialize(s)),c=loaded.contacts.blue[enemy.id];
  assert.deepEqual([c.x,c.y,c.time,c.classification,c.course,c.speed],[140,110,300,'carrier',90,23]);
  assert.equal(loaded.paused,true);assert.ok(loaded.mission.orders.includes('plan'));assert.equal(E.visibleContacts(loaded)[0].stale,true);
  const bad=JSON.parse(E.serialize(s));bad.units[0].type='cvn_ford';assert.throws(()=>E.deserialize(JSON.stringify(bad)));
});

test('3D 目视识别只生成通用年代外形，使用最后报告，不反查真实敌舰参数',()=>{
  const s=quiet(),enemy=s.units.find(u=>u.side==='red');
  s.time=100;s.contacts.blue[enemy.id]={id:enemy.id,x:135,y:115,time:70,quality:'track',source:'目视',domain:'surface',classification:'carrier',course:90,observations:{},label:'航母接触'};
  for(const key of ['x','y','type','hp','weapons'])Object.defineProperty(enemy,key,{get(){throw Error('3D 读取了真实敌舰参数');}});
  const c=seaSnapshot(s).contacts[0];assert.equal(c.model,'ww2-carrier');assert.deepEqual([c.x,c.y,c.age],[135,115,30]);
  for(const key of ['type','hp','weapons','airwing'])assert.equal(Object.hasOwn(c,key),false);
});

test('胜败和时限按中途岛目标结算，不使用现代歼灭规则',()=>{
  for(const kind of ['victory','base','carriers','time']){
    const s=quiet();
    if(kind==='victory')s.units.filter(u=>u.side==='red'&&E.TYPES[u.type].ww2Role==='carrier').slice(0,3).forEach(u=>u.hp=E.TYPES[u.type].hp*.39);
    if(kind==='base')s.units.find(u=>u.type==='ww2_midway').hp=0;
    if(kind==='carriers')s.units.filter(u=>u.side==='blue'&&E.TYPES[u.type].ww2Role==='carrier').forEach(u=>u.hp=E.TYPES[u.type].hp*.39);
    if(kind==='time')s.time=E.SCENARIOS.midway42.duration-1;
    E.step(s,1);assert.equal(s.phase,'ended',kind);assert.equal(s.result,kind==='victory'?'victory':'defeat',kind);assert.ok(s.mission.score>=0&&s.mission.score<=100);
  }
});

test('低命中规则下的可重复战局能执行搜索、空袭、回收并获胜，战局可重新载入',()=>{
  const s=E.createState('midway42');s.seed=1972;E.start(s);E.issueMissionOrder(s,'plan');
  run(s,E.SCENARIOS.midway42.duration);
  assert.equal(s.phase,'ended');assert.equal(s.result,'victory');assert.ok(s.time<=14400);assert.ok(s.units.length>30&&s.units.length<=60);
  assert.ok(s.units.some(u=>u.type==='ww2_sbd'&&u.weapons.bomb<E.TYPES[u.type].weapons.bomb));
  assert.ok(s.units.some(u=>u.type==='ww2_d3a'&&u.weapons.bomb<E.TYPES[u.type].weapons.bomb));
  assert.ok(s.units.some(u=>E.TYPES[u.type].domain==='air'&&u.hp<E.TYPES[u.type].hp));
  assert.ok(s.units.some(u=>u.sorties>0));assert.equal(E.deserialize(E.serialize(s)).result,s.result);
});

test('低命中空袭会产生不同战果，默认种子按实际目标进度结算',()=>{
  const s=E.createState('midway42');E.start(s);E.issueMissionOrder(s,'plan');run(s,E.SCENARIOS.midway42.duration);
  assert.equal(s.phase,'ended');assert.equal(s.result,'defeat');assert.ok(s.mission.disabledCarriers<3);assert.equal(s.time,14400);
  assert.ok(s.units.some(u=>u.criticalHits.length));assert.equal(E.deserialize(E.serialize(s)).mission.disabledCarriers,s.mission.disabledCarriers);
});
