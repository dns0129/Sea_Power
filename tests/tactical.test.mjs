import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.13.0';
import {dogfightSolution,airCombatProfile} from '../dist/tactical-rules.js?v=0.13.0';

function quiet(){
  const s=E.createState('midway42');E.start(s);
  for(const u of s.units){u.autoEngage=u.autoDefense=u.radar=false;u.commandMode='independent';u.route=[];u.speed=E.TYPES[u.type].domain==='air'?E.TYPES[u.type].speed*.4:0;u.deckReady=1e8;}
  return s;
}
function gunners(){
  const s=quiet(),u=s.units.find(u=>u.type==='ww2_us_cruiser'),target=s.units.find(u=>u.type==='ww2_jp_destroyer');
  target.x=u.x+3;target.y=u.y;E.scan(s);return {s,u,target};
}
function flights(){
  const s=quiet(),u=s.units.find(u=>u.type==='ww2_f4f'),target=s.units.find(u=>u.type==='ww2_a6m');
  u.x=220;u.y=80;target.x=220.4;target.y=80;E.scan(s);return {s,u,target};
}
function advance(s,seconds){while(seconds>0&&s.phase==='running'){const dt=Math.min(600,seconds);E.step(s,dt);seconds-=dt;}}

test('舰炮精度分别受天气、可见程度、测距仪和昼夜影响，组合条件继续降低精度',()=>{
  const {s,u,target}=gunners(),base=E.gunAccuracy(s,u.id,target.id).chance,c=s.contacts.blue[target.id];
  s.weather='rain';assert.ok(E.gunAccuracy(s,u.id,target.id).chance<base);
  s.weather='clear';c.observations[u.id].visibility=.1;assert.ok(E.gunAccuracy(s,u.id,target.id).chance<base);
  c.observations[u.id].visibility=1;u.rangefinder=.2;const damaged=E.gunAccuracy(s,u.id,target.id).chance;assert.ok(damaged<base);
  u.rangefinder=1;s.timeOfDay='night';const night=E.gunAccuracy(s,u.id,target.id).chance;assert.ok(night<base);
  u.rangefinder=.2;s.weather='storm';assert.ok(E.gunAccuracy(s,u.id,target.id).chance<Math.min(damaged,night));
});

test('夜间浓雾缩短目视搜索，失联报告不能支持二战炮击',()=>{
  const {s,u,target}=gunners();assert.ok(E.fireCheck(s,u.id,target.id,'gun').ok);
  E.setBattleConditions(s,{weather:'fog',timeOfDay:'night'});s.time=9;E.scan(s);
  assert.equal(E.fireCheck(s,u.id,target.id,'gun').ok,false);
  assert.equal(s.contacts.blue[target.id].x,target.x);assert.equal(s.contacts.blue[target.id].time,0);
});

test('炮弹保存发射时的精度，环境改变或存档续跑不会重算已发射齐射',()=>{
  const {s,u,target}=gunners();assert.ok(E.fire(s,u.id,target.id,'gun').ok);
  const chance=s.missiles[0].fireChance;E.setBattleConditions(s,{weather:'storm',timeOfDay:'night'});u.rangefinder=0;
  assert.equal(s.missiles[0].fireChance,chance);assert.equal(E.deserialize(E.serialize(s)).missiles[0].fireChance,chance);
});

test('炮击可损坏目标测距仪，降低其后续炮击精度且整备不修复',()=>{
  const {s,u,target}=gunners();s.seed=2000;assert.ok(E.fire(s,u.id,target.id,'gun').ok);advance(s,8);
  assert.ok(target.hp<E.TYPES[target.type].hp);assert.ok(target.rangefinder<1);
  assert.equal(E.deserialize(E.serialize(s)).units.find(v=>v.id===target.id).rangefinder,target.rangefinder);
});

test('机炮空战比较机动、防御、火力和飞机数量，数量损失降低后续火力',()=>{
  const {u,target}=flights(),a=airCombatProfile(u,E.TYPES[u.type]),b=airCombatProfile(target,E.TYPES[target.type]),w=E.weaponStats(u,'ir'),full=dogfightSolution(a,b,w);
  assert.ok(dogfightSolution({...a,maneuver:a.maneuver*1.5},b,w).chance>full.chance);
  assert.ok(dogfightSolution(a,{...b,defense:b.defense*1.5},w).chance<full.chance);
  assert.ok(dogfightSolution({...a,firepower:a.firepower*1.5},b,w).damageScale>full.damageScale);
  assert.equal(dogfightSolution({...a,count:a.count/2},b,w).damageScale,full.damageScale/2);
});

test('双方相遇后均可用机炮交战，损失飞机持久化，轰炸机也具备有限自卫机枪',()=>{
  const {s,u,target}=flights();s.seed=1;
  assert.ok(E.fire(s,u.id,target.id,'ir').ok);assert.ok(E.fire(s,target.id,u.id,'ir').ok);advance(s,1);
  assert.ok(target.aircraft<E.TYPES[target.type].squadronSize);
  assert.equal(E.deserialize(E.serialize(s)).units.find(v=>v.id===target.id).aircraft,target.aircraft);
  for(const type of ['ww2_sbd','ww2_tbd','ww2_d3a','ww2_b5n'])assert.ok(E.TYPES[type].weapons.ir>0);
});

test('护航持续跟随指定舰船，作战计划不能覆盖手动命令，返航会退出跟随',()=>{
  const s=quiet(),ship=s.units[0],air=s.units.filter(u=>u.type==='ww2_f4f').slice(0,2);
  for(const u of air){u.x=ship.x+10;u.y=ship.y;}
  const ids=air.map(u=>u.id);assert.ok(E.commandUnits(s,ids,{kind:'escort',leaderId:ship.id}).ok);
  assert.ok(E.issueMissionOrder(s,'plan').ok);const before=E.distance(air[0],ship);advance(s,60);
  for(const u of air){assert.equal(u.leader,ship.id);assert.equal(u.commandMode,'escort');}
  assert.ok(E.distance(air[0],ship)<before);
  assert.ok(E.commandUnits(s,[air[0].id],{kind:'return'}).ok);assert.equal(air[0].leader,null);assert.equal(air[0].flightState,'returning');
});

test('协同机群向领队下航点，跟随机群保持编组，可解散为独立行动',()=>{
  const s=quiet(),air=s.units.filter(u=>u.type==='ww2_f4f').slice(0,2),ids=air.map(u=>u.id),[leader,wing]=air;
  assert.ok(E.commandUnits(s,ids,{kind:'group',leaderId:leader.id}).ok);
  assert.ok(E.commandUnits(s,[wing.id,leader.id],{kind:'route',point:{x:240,y:70}}).ok);
  assert.equal(wing.leader,leader.id);assert.equal(wing.route.length,0);assert.deepEqual(leader.route,[{x:240,y:70}]);
  const copy=E.deserialize(E.serialize(s));assert.equal(copy.units.find(u=>u.id===wing.id).leader,leader.id);
  assert.ok(E.commandUnits(s,[leader.id],{kind:'independent'}).ok);assert.equal(wing.leader,null);assert.equal(wing.commandMode,'independent');
});

test('多单位航点逐个校验并报告无法移动的单位，非法航点不会伪报编组成功',()=>{
  const s=quiet(),ship=s.units[0],base=s.units.find(u=>u.type==='ww2_midway'),air=s.units.filter(u=>u.type==='ww2_f4f').slice(0,2);
  const r=E.commandUnits(s,[ship.id,base.id],{kind:'route',point:{x:280,y:75}});
  assert.ok(r.ok);assert.deepEqual(r.applied,[ship.id]);assert.equal(r.skipped[0].id,base.id);
  assert.ok(E.commandUnits(s,air.map(u=>u.id),{kind:'group',leaderId:air[0].id}).ok);
  const bad=E.commandUnits(s,air.map(u=>u.id),{kind:'route',point:{x:-1,y:10}});assert.equal(bad.ok,false);assert.equal(bad.applied.length,0);assert.equal(bad.skipped.length,2);
});

test('最大 60 单位护航编队仍可保存载入，更换旗舰不会产生循环引用',()=>{
  const s=E.createState('sandbox');s.units=[];s.budget=600;
  const leader=E.addUnit(s,'destroyer','blue',{x:50,y:100}).unit;
  for(let n=0;n<59;n++)assert.ok(E.addUnit(s,'missileBoat','blue',{x:60+n%12*4,y:70+Math.floor(n/12)*4}).ok);
  assert.ok(E.commandUnits(s,s.units.map(u=>u.id),{kind:'escort',leaderId:leader.id}).ok);assert.equal(E.deserialize(E.serialize(s)).units.length,60);
  assert.ok(E.formFleet(s,s.units[1].id).ok);const restored=E.deserialize(E.serialize(s));assert.equal(restored.units[1].leader,null);assert.equal(restored.units[0].leader,s.units[1].id);
});

test('群体命令拒绝敌方、跨阵营、自跟随与嵌套编组，领队损失后解除跟随',()=>{
  const s=quiet(),ship=s.units[0],air=s.units.filter(u=>u.type==='ww2_f4f').slice(0,2),enemy=s.units.find(u=>u.side==='red');
  assert.equal(E.commandUnits(s,[ship.id,enemy.id],{kind:'stop'}).ok,false);
  assert.equal(E.commandUnits(s,[ship.id],{kind:'escort',leaderId:ship.id}).ok,false);
  assert.ok(E.commandUnits(s,air.map(u=>u.id),{kind:'group',leaderId:air[0].id}).ok);
  assert.equal(E.commandUnits(s,[air[0].id],{kind:'escort',leaderId:ship.id}).ok,false);
  air[0].hp=0;advance(s,1);assert.equal(air[1].leader,null);assert.equal(air[1].commandMode,'independent');
});

test('集中攻击使用本方有效报告，失联后不会取得目标真实位置',()=>{
  const {s,u,target}=flights();assert.ok(E.commandUnits(s,[u.id],{kind:'attack',targetId:target.id}).ok);
  assert.equal(u.manualTarget,target.id);const point={...u.route[0]};
  target.x=100;target.y=200;s.time=9;s.contacts.blue[target.id].time=0;
  assert.equal(E.commandUnits(s,[u.id],{kind:'attack',targetId:target.id}).ok,false);assert.deepEqual(u.route[0],point);
});

function autoPair(level,hp=1){
  const s=E.createState('sandbox');s.units=[];s.budget=s.redBudget=600;
  E.addUnit(s,'fighter','blue',{x:70,y:90});E.addUnit(s,'fighter','red',{x:160,y:90});s.units[0].hp*=hp;
  assert.ok(E.configureAutoBattle(s,{blueDifficulty:level,redDifficulty:level}).ok);assert.ok(E.start(s).ok);return s;
}

test('三种 AI 强度采用不同反应间隔，专业在受损时返航，业余继续接敌',()=>{
  for(const [level,reaction] of [['amateur',24],['professional',8],['ace',4]]){
    const s=autoPair(level);assert.equal(s.units[0].nextDecision,reaction);advance(s,reaction);assert.equal(s.units[0].nextDecision,reaction*2);
    assert.equal(E.getBattleReport(s).blueDifficulty,level);assert.equal(E.deserialize(E.serialize(s)).automation.redDifficulty,level);
  }
  assert.equal(autoPair('professional',.25).units[0].flightState,'returning');assert.equal(autoPair('amateur',.25).units[0].flightState,'airborne');
});

test('三档二战指挥均仅根据报告搜索，改变未发现敌舰坐标不改变蓝方计划',()=>{
  for(const level of Object.keys(E.AI_LEVELS)){
    const a=quiet(),b=quiet();a.aiDifficulty=b.aiDifficulty=level;
    for(const u of b.units.filter(u=>u.side==='red'&&E.TYPES[u.type].domain==='surface')){u.x+=20;u.y+=20;}
    a.contacts.blue={};b.contacts.blue={};E.issueMissionOrder(a,'plan');E.issueMissionOrder(b,'plan');
    const own=s=>s.units.filter(u=>u.side==='blue').map(u=>({id:u.id,route:u.route,airwing:u.airwing}));assert.deepEqual(own(a),own(b));
  }
});

test('环境与强度校验、自动对战控制锁及编组存档引用校验',()=>{
  const s=quiet();assert.equal(E.setBattleConditions(s,{weather:'bad'}).ok,false);assert.equal(E.setBattleConditions(s,{aiDifficulty:'bad'}).ok,false);
  const auto=autoPair('ace');assert.equal(E.setBattleConditions(auto,{weather:'fog'}).ok,false);assert.equal(E.commandUnits(auto,[auto.units[0].id],{kind:'stop'}).ok,false);
  for(const mutate of [r=>r.units[0].rangefinder=2,r=>r.units[0].aircraft=1,r=>r.units[0].leader=r.units[0].id,r=>r.aiDifficulty='bad']){
    const raw=JSON.parse(E.serialize(s));mutate(raw);assert.throws(()=>E.deserialize(JSON.stringify(raw)));
  }
});

test('v7 存档迁移保留原有兵力并初始化环境、测距仪、飞机数量和 AI 强度',()=>{
  const s=quiet(),raw=JSON.parse(E.serialize(s));raw.version=7;delete raw.timeOfDay;delete raw.aiDifficulty;
  for(const u of raw.units)for(const key of ['rangefinder','aircraft','commandMode','manualTarget','nextDecision','nextCombat'])delete u[key];
  const restored=E.deserialize(JSON.stringify(raw));assert.equal(restored.version,9);assert.equal(restored.timeOfDay,'day');assert.equal(restored.aiDifficulty,'professional');assert.equal(restored.units[0].rangefinder,1);
  for(const u of restored.units.filter(u=>E.TYPES[u.type].squadronSize))assert.equal(u.aircraft,E.TYPES[u.type].squadronSize);
});
