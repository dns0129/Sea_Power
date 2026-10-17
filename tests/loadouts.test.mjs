import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.10.0';

const naval=(name='反舰与自卫')=>({name,mission:'naval',weapons:{aam:2,ir:2,asm:2}});
const raw=s=>JSON.parse(E.serialize(s));
const load=value=>E.deserialize(JSON.stringify(value));
function empty(){const s=E.createState('modernlab');s.units=[];s.budget=s.redBudget=1000;return s;}
function add(s,type,side='blue',x=70,y=90){const r=E.addUnit(s,type,side,{x,y});assert.ok(r.ok,`${type}: ${r.error}`);return r.unit;}
function apply(s,u,draft){const r=E.setCustomLoadout(s,u.id,draft);assert.ok(r.ok,r.error);return E.getLoadout(u);}
function quiet(s){for(const u of s.units){u.autoEngage=false;u.autoDefense=false;u.radar=u.sonar=u.esm=false;u.speed=E.TYPES[u.type].domain==='air'&&!E.TYPES[u.type].rotary?E.TYPES[u.type].speed*.4:0;}}
function begin(s){quiet(s);assert.ok(E.start(s).ok);return s;}
function advance(s,seconds){for(let n=seconds;n>0&&s.phase==='running';n-=Math.min(600,n))E.step(s,Math.min(600,n));return s;}

test('自定义挂载仅面向现代武装平台，预警加油机及通用历史型不开放',()=>{
  for(const type of ['fa18e','j16','ddg055','ssn_virginia'])assert.equal(E.supportsCustomLoadout(type),true,type);
  for(const type of ['e2d','kj500','kc46a','airbase','fighter','frigate','not-a-type']){
    assert.equal(E.supportsCustomLoadout(type),false,type);
    assert.equal(E.validateCustomLoadout(type,naval()).ok,false,type);
  }
  for(const mission of ['general','air','naval','asw','strike','sead','close'])assert.ok(E.CUSTOM_MISSIONS[mission]);
});

test('美中飞机可分别配置反舰自卫方案，方案不污染机型或其他单位',()=>{
  for(const type of ['fa18e','j16']){
    const s=empty(),a=add(s,type),b=add(s,type,'blue',80,90),catalog=structuredClone(E.TYPES[type]);
    const draft=naval(),row=apply(s,a,draft);
    assert.equal(a.loadout,'custom');assert.equal(row.mission,'naval');assert.equal(a.weapons.asm,2);assert.equal(a.weapons.aam,2);
    assert.deepEqual(E.TYPES[type],catalog);assert.equal(b.customLoadout,null);
    draft.weapons.asm=99;assert.equal(E.getLoadout(a).weapons.asm,2);
    assert.ok(load(raw(s)));assert.deepEqual(load(raw(s)).units[0].customLoadout,a.customLoadout);
  }
});

test('数量必须是已知武器的非负整数且不能超过该型兼容上限',()=>{
  for(const count of [-1,.5,NaN,Infinity,'2',null])assert.equal(E.validateCustomLoadout('fa18e',{mission:'naval',weapons:{asm:count}}).ok,false,String(count));
  for(const draft of [{weapons:{unknownMissile:1}},{weapons:{}},{weapons:{asm:5}},{mission:'unknown',weapons:{asm:1}},{name:'x'.repeat(37),weapons:{asm:1}},{name:'bad\nname',weapons:{asm:1}}])assert.equal(E.validateCustomLoadout('fa18e',draft).ok,false);
  assert.equal(E.validateCustomLoadout('j20',{mission:'naval',weapons:{asm:1}}).ok,false);
  const s=empty(),u=add(s,'fa18e'),before=E.serialize(s);
  assert.equal(E.setCustomLoadout(s,u.id,{weapons:{asm:99}}).ok,false);assert.equal(E.serialize(s),before);
});

test('飞机共享载荷与舰艇四联装垂发容量限制实际弹药组合',()=>{
  assert.deepEqual(E.loadoutUsage('fa18e',{aam:2,ir:2,asm:2}),{payloadUsed:8,payloadLimit:12,vlsUsed:0,vlsLimit:null});
  assert.equal(E.validateCustomLoadout('fa18e',{mission:'naval',weapons:{aam:8,ir:2,asm:2}}).ok,false);
  const weapons={sam:64,point:32,asroc:12,cruise:12,gun:48,torpedo:6};
  const accepted=E.validateCustomLoadout('ddg_burke3',{mission:'general',weapons});assert.ok(accepted.ok,accepted.error);
  assert.equal(accepted.usage.vlsUsed,96);assert.equal(accepted.usage.vlsLimit,96);assert.equal(accepted.usage.payloadLimit,null);
  assert.equal(E.validateCustomLoadout('ddg_burke3',{mission:'general',weapons:{...weapons,cruise:13}}).ok,false);
  assert.equal(E.loadoutUsage('ddg055',{sam:32,point:32,asm:12}).vlsUsed,44,'独立近防弹库不计入该型共享垂发');
});

test('任务必须有适用主武器，对陆巡航弹不能冒充反舰挂载',()=>{
  for(const draft of [{mission:'naval',weapons:{aam:2}},{mission:'asw',weapons:{asm:2}},{mission:'strike',weapons:{asm:2}},{mission:'sead',weapons:{aam:2}}])assert.equal(E.validateCustomLoadout('fa18e',draft).ok,false);
  assert.equal(E.validateCustomLoadout('ssn_virginia',{mission:'naval',weapons:{cruise:4}}).ok,false);
  assert.ok(E.validateCustomLoadout('ssn_virginia',{mission:'naval',weapons:{asm:4,torpedo:4}}).ok);
  assert.ok(E.validateCustomLoadout('ddg_burke3',{mission:'asw',weapons:{asroc:4}}).ok);
  const s=empty(),ship=add(s,'ddg_burke3'),target=add(s,'ddg055','red',100,90);apply(s,ship,{mission:'strike',weapons:{cruise:4}});begin(s);
  s.contacts.blue[target.id]={id:target.id,x:target.x,y:target.y,time:s.time,progress:30,quality:'track',source:'雷达',domain:'surface',altitude:'medium',emitting:true,label:'水面接触',observations:{[ship.id]:{quality:'track',source:'雷达',time:s.time}}};
  assert.equal(E.fireCheck(s,ship.id,target.id,'cruise').ok,false);
});

test('隐身外挂特征从实际武器计算，导入和编辑不能伪造',()=>{
  const internal=E.validateCustomLoadout('f35c',{mission:'air',weapons:{aam:4},external:true});assert.ok(internal.ok);assert.equal(internal.row.external,false);
  const external=E.validateCustomLoadout('f35c',{mission:'air',weapons:{aam:6,ir:2},external:false});assert.ok(external.ok);assert.equal(external.row.external,true);
  const s=empty(),u=add(s,'f35c');apply(s,u,{mission:'air',weapons:{aam:6,ir:2}});
  const value=raw(s);value.units[0].customLoadout.external=false;assert.equal(E.getLoadout(load(value).units[0]).external,true);
});

test('预设切换清除自定义状态，对海预设保留有效任务与额度',()=>{
  const s=empty(),u=add(s,'fa18e');apply(s,u,naval());assert.ok(E.setLoadout(s,u.id,'air').ok);
  assert.equal(u.customLoadout,null);assert.equal(E.getLoadout(u).id,'air');assert.equal(u.weapons.asm,0);
  assert.ok(E.TYPES.f2a.loadouts.some(r=>r.id==='navalEscort'));assert.ok(E.TYPES.fa18e.loadouts.some(r=>r.id==='navalHeavy'));
  for(const type of ['fa18e','j16','h6j'])for(const row of E.TYPES[type].loadouts.filter(r=>r.id.startsWith('naval'))){
    assert.ok((row.weapons.asm||0)+(row.weapons.supersonic||0)>0);assert.ok(E.loadoutUsage(type,row.weapons).payloadUsed<=E.TYPES[type].payloadSlots);
  }
  assert.ok(E.TYPES.ddg055.loadouts.some(r=>r.id==='naval'));assert.equal(E.TYPES.j20.loadouts.some(r=>r.id.startsWith('naval')),false);
});

test('在空换装和舰艇伪造整备均不能获得新弹药',()=>{
  const s=empty(),air=add(s,'fa18e'),ship=add(s,'ddg055','blue',80,90);add(s,'ssn093','red',195,70);begin(s);
  air.weapons.asm=1;const weapons=structuredClone(air.weapons);
  assert.equal(E.setCustomLoadout(s,air.id,naval()).ok,false);assert.deepEqual(air.weapons,weapons);
  ship.flightState='servicing';const ammo=structuredClone(ship.weapons);
  assert.equal(E.setCustomLoadout(s,ship.id,{mission:'naval',weapons:{asm:8}}).ok,false);assert.deepEqual(ship.weapons,ammo);
  assert.equal(E.setLoadout(s,ship.id,'naval').ok,false);assert.deepEqual(ship.weapons,ammo);
});

test('整备换装只减少现有弹药，完成后按自定义方案重装并消耗有限库存',()=>{
  const s=empty(),base=add(s,'cvn_ford'),air=add(s,'fa18e','blue',75,90);add(s,'ssn093','red',195,70);apply(s,air,naval());begin(s);
  air.weapons.asm=0;air.weapons.aam=1;air.hp=31;air.x=base.x;air.y=base.y;
  const stores=base.supply;assert.ok(E.returnToBase(s,air.id).ok);E.step(s,1);assert.equal(air.flightState,'servicing');assert.ok(base.supply<stores);
  apply(s,air,{name:'下一架次',mission:'naval',weapons:{asm:4,aam:2}});assert.equal(air.weapons.asm,0);assert.equal(air.weapons.aam,1);
  E.step(s,239);assert.equal(air.weapons.asm,0);E.step(s,1);
  assert.equal(air.flightState,'airborne');assert.equal(air.weapons.asm,4);assert.equal(air.weapons.aam,2);assert.equal(air.hp,31);assert.equal(air.sorties,1);
  assert.ok(load(raw(s)));
  base.supply=0;air.weapons.asm=0;air.x=base.x;air.y=base.y;E.returnToBase(s,air.id);E.step(s,1);
  assert.equal(air.flightState,'grounded');assert.equal(air.weapons.asm,0);assert.equal(E.getLoadout(air).weapons.asm,4);
});

test('舰载机出动方案可在部署时配置、清除和保存，放飞沿用且不改机库总量',()=>{
  const s=empty(),base=add(s,'cvn_ford');add(s,'ssn093','red',195,70);
  assert.ok(E.setDeckLoadout(s,base.id,'fa18e',naval('舰载反舰')).ok);
  assert.ok(E.setDeckLoadout(s,base.id,'f35c','strike').ok);assert.equal(base.wingLoadouts.f35c.id,'strike');
  assert.ok(E.setDeckLoadout(s,base.id,'f35c',null).ok);assert.equal(Object.hasOwn(base.wingLoadouts,'f35c'),false);
  assert.deepEqual(load(raw(s)).units[0].wingLoadouts,base.wingLoadouts);
  const inventory=base.airwing.fa18e,budget=s.budget;begin(s);
  const launched=E.launchDeck(s,base.id,'fa18e');assert.ok(launched.ok,launched.error);assert.equal(launched.unit.loadout,'custom');assert.equal(E.getLoadout(launched.unit).mission,'naval');assert.equal(launched.unit.weapons.asm,2);
  assert.equal(base.airwing.fa18e,inventory-1);assert.equal(s.budget,budget);assert.equal(launched.unit.originDeck,base.id);
  assert.equal(E.launchDeck(s,base.id,'fa18e').ok,false);assert.equal(base.airwing.fa18e,inventory-1);
  base.deckReady=0;const override=E.launchDeck(s,base.id,'fa18e','air');assert.ok(override.ok);assert.equal(override.unit.customLoadout,null);assert.equal(override.unit.weapons.asm,0);assert.equal(base.wingLoadouts.fa18e.mission,'naval');
  assert.ok(load(raw(s)));
});

test('出动方案拒绝甲板不兼容与无武装自定义，错误配置不消耗资源',()=>{
  const s=empty(),base=add(s,'cvn_ford'),before=E.serialize(s);
  for(const [type,selection] of [['f22a',naval()],['e2d',naval()],['fa18e','unknown'],['fa18e',{mission:'naval',weapons:{asm:99}}]]){
    assert.equal(E.setDeckLoadout(s,base.id,type,selection).ok,false);assert.equal(E.serialize(s),before);
  }
  add(s,'ssn093','red',195,70);begin(s);assert.ok(E.setDeckLoadout(s,base.id,'fa18e',naval()).ok);assert.ok(E.setDeckLoadout(s,base.id,'fa18e',null).ok);
  const stock=base.airwing.fa18e;assert.equal(E.launchDeck(s,base.id,'fa18e',{mission:'naval',weapons:{asm:99}}).ok,false);assert.equal(base.airwing.fa18e,stock);assert.equal(base.deckReady,0);
  const launch=E.launchDeck(s,base.id,'fa18e',naval('临时出动'));assert.ok(launch.ok);assert.equal(launch.unit.customLoadout.name,'临时出动');assert.deepEqual(base.wingLoadouts,{});
});

test('v7 导入校验自定义任务弹药、挂载引用和舰载机方案',()=>{
  const s=empty(),air=add(s,'fa18e'),base=add(s,'cvn_ford','blue',80,90);apply(s,air,naval());assert.ok(E.setDeckLoadout(s,base.id,'fa18e',naval()).ok);
  const original=raw(s);assert.equal(original.version,7);
  for(const mutate of [
    r=>r.units[0].customLoadout=null,
    r=>r.units[0].weapons.asm=3,
    r=>r.units[0].customLoadout.mission='strike',
    r=>r.units[0].customLoadout.weapons.asm=9,
    r=>r.units[0].customLoadout.weapons.unknown=1,
    r=>r.units[0].loadout='air',
    r=>r.units[1].wingLoadouts.f22a=r.units[1].wingLoadouts.fa18e,
    r=>r.units[1].wingLoadouts.fa18e.weapons.asm=9,
    r=>r.units[1].wingLoadouts.fa18e.id='nonexistent',
  ]){const value=structuredClone(original);mutate(value);assert.throws(()=>load(value));}
});

test('v6 旧存档升级补齐挂载字段并保留 250 公里原阵位',()=>{
  const s=E.createAutoBattle('surface'),value=raw(s);value.version=6;
  for(const u of value.units){delete u.customLoadout;delete u.wingLoadouts;}
  const back=load(value);assert.equal(back.version,7);assert.equal(back.mapId,'uscn250');
  assert.deepEqual(back.units.map(u=>[u.id,u.type,u.x,u.y,u.weapons]),s.units.map(u=>[u.id,u.type,u.x,u.y,u.weapons]));
  for(const u of back.units){assert.equal(u.customLoadout,null);assert.deepEqual(u.wingLoadouts,{});}
});

test('AI 保留双方自定义任务，反舰弹耗尽而自卫弹尚存也会返航',()=>{
  const s=empty(),a=add(s,'fa18e'),b=add(s,'j16','red',170,90);add(s,'ddg_burke3','blue',75,100);add(s,'ddg055','red',165,100);
  apply(s,a,naval('美方对海'));apply(s,b,naval('中方对海'));assert.ok(E.configureAutoBattle(s,{timeLimit:600}).ok);assert.ok(E.startAutoBattle(s).ok);
  for(const u of [a,b]){assert.equal(E.getLoadout(u).mission,'naval');u.weapons.asm=0;assert.ok(u.weapons.aam>0);}
  advance(s,8);for(const u of [a,b]){assert.equal(u.flightState,'returning');assert.equal(u.customLoadout.mission,'naval');assert.ok(u.weapons.aam>0);}
  const home=a.home;a.x=home.x;a.y=home.y;E.step(s,1);assert.equal(a.flightState,'servicing');advance(s,8);assert.equal(a.customLoadout.mission,'naval');assert.equal(a.weapons.asm,0);
  assert.equal(E.setCustomLoadout(s,a.id,naval()).ok,false);assert.ok(load(raw(s)));
});

test('双方 AI 放飞都执行机库指定自定义挂载且运行期间不能改方案',()=>{
  const s=empty(),blue=add(s,'cvn_ford'),red=add(s,'cv_fujian','red',195,90);
  assert.ok(E.setDeckLoadout(s,blue.id,'fa18e',naval('美方出动')).ok);assert.ok(E.setDeckLoadout(s,red.id,'j15t',naval('中方出动')).ok);
  assert.ok(E.configureAutoBattle(s,{timeLimit:600}).ok);assert.ok(E.startAutoBattle(s).ok);advance(s,240);
  for(const [base,type] of [[blue,'fa18e'],[red,'j15t']]){
    const sortie=s.units.find(u=>u.originDeck===base.id&&u.type===type);assert.ok(sortie,`${type} 应按机库计划出动`);assert.equal(sortie.customLoadout.mission,'naval');assert.equal(E.getLoadout(sortie).weapons.asm,2);
    assert.equal(E.setDeckLoadout(s,base.id,type,null).ok,false);
  }
  assert.ok(load(raw(s)));
});

test('自动战局续跑与同编组重赛保留自定义方案和初始航空出动计划',()=>{
  const s=empty(),base=add(s,'cvn_ford'),air=add(s,'fa18e','blue',80,90);add(s,'ddg055','red',195,90);
  apply(s,air,naval('原始对海'));assert.ok(E.setDeckLoadout(s,base.id,'fa18e',naval('甲板方案')).ok);
  assert.ok(E.configureAutoBattle(s,{timeLimit:600,seed:0}).ok);const original=s.units.map(u=>[u.id,u.weapons,u.customLoadout,u.wingLoadouts]);
  assert.ok(E.startAutoBattle(s).ok);advance(s,16);const resumed=load(raw(s));assert.equal(E.getLoadout(resumed.units.find(u=>u.id===air.id)).mission,'naval');
  const invalid=raw(s),snapshot=JSON.parse(invalid.automation.deployment);snapshot.units.find(u=>u.id===air.id).customLoadout.weapons.asm=99;invalid.automation.deployment=JSON.stringify(snapshot);assert.throws(()=>load(invalid));
  E.stopAutoBattle(resumed);const restarted=E.restartAutoBattle(resumed);assert.equal(restarted.phase,'setup');assert.deepEqual(restarted.units.map(u=>[u.id,u.weapons,u.customLoadout,u.wingLoadouts]),original);assert.ok(E.startAutoBattle(restarted).ok);
});
