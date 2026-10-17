import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TYPES,WEAPONS,createState,addUnit,start,step,scan,setLoadout,setDepth,setRoute,launchDeck,deckCompatible,requestRefuel,requestSupply,returnToBase,serialize,deserialize,fireCheck,sensorRange,removeUnit} from '../dist/engine.js?v=0.11.0';
import {MODEL_SOURCES,CATEGORIES,PAYLOAD_WEIGHTS} from '../dist/modern-catalog.js';
const models=Object.entries(TYPES).filter(([,t])=>t.model);
function setup(){const s=createState('modernlab');s.units=[];s.budget=s.redBudget=1000;return s;}
function add(s,type,side='blue',x=70,y=90){const r=addUnit(s,type,side,{x,y});assert.ok(r.ok,`${type}: ${r.error}`);return r.unit;}
function quiet(s){for(const u of s.units){u.autoEngage=false;u.autoDefense=false;u.radar=u.sonar=u.esm=false;u.speed=TYPES[u.type].domain==='air'&&!TYPES[u.type].rotary?TYPES[u.type].speed*.4:0;}}
function running(s){add(s,'frigate','red',195,105);quiet(s);assert.ok(start(s).ok);return s;}
function confirm(s){for(let i=0;i<5;i++){scan(s);s.time+=3;}}

test('188 真实现代型号都有国家、类别、公开来源、角色和合法挂载',()=>{
  assert.equal(models.length,188);assert.equal(new Set(models.map(([,t])=>t.name)).size,188);
  for(const [id,t] of models){assert.ok(t.country&&t.realRole&&t.realNote&&CATEGORIES[t.category],id);assert.ok(t.cost>0&&t.cost<=600,id);assert.ok(t.loadouts.length,id);
    for(const source of t.sourceIds)assert.match(MODEL_SOURCES[source].url,/^https:\/\//);
    for(const row of t.loadouts){for(const [k,n] of Object.entries(row.weapons))assert.ok(Object.hasOwn(WEAPONS,k)&&Number.isInteger(n)&&n>=0&&n<=t.weapons[k],`${id} ${row.id} ${k}`);
      if(t.payloadSlots)assert.ok(Object.entries(row.weapons).reduce((sum,[k,n])=>sum+n*(PAYLOAD_WEIGHTS[k]||1),0)<=t.payloadSlots,`${id} payload`);
      if(t.vlsCells)assert.ok(Object.entries(t.vlsWeapons).reduce((sum,[k,w])=>sum+(row.weapons[k]||0)*w,0)<=t.vlsCells,`${id} VLS`);
    }
    if(t.deck)for(const [key,count] of Object.entries(t.deck.wing)){assert.ok(deckCompatible(id,key),`${id} ${key} deck`);assert.ok(Number.isInteger(count)&&count>0);}
  }
});
test('专职制空、电子战、预警、护卫与新型舰艇没有继承不相干武器',()=>{
  for(const id of ['f15c','j20'])assert.equal(TYPES[id].weapons.asm+TYPES[id].weapons.cruise,0);
  for(const id of ['e2d','kj600','e7','kc46a'])assert.equal(Object.values(TYPES[id].weapons).reduce((a,b)=>a+b,0),0);
  assert.equal(TYPES.ea18g.weapons.asm,0);assert.equal(TYPES.mh60s.sonar,0);assert.equal(TYPES.ffg_f125.weapons.sam,0);assert.equal(TYPES.ddg_zumwalt.weapons.gun,0);assert.equal(TYPES.ddg_burke3.weapons.asm,0);
  assert.equal(TYPES.lhd075.deck.modes.includes('stovl'),false);assert.equal(TYPES.cor_k130.sonar,0);
});
test('任务挂载切换保持载荷与隐身取舍，开战后禁止凭空装弹',()=>{
  const s=setup(),u=add(s,'f35c');assert.equal(u.weapons.ir,0);assert.equal(TYPES.f35c.loadouts.find(l=>l.id===u.loadout).external,false);
  assert.ok(setLoadout(s,u.id,'strike').ok);assert.ok(u.weapons.pgm>0);assert.equal(u.weapons.ir,0);
  assert.ok(setLoadout(s,u.id,'external').ok);assert.equal(TYPES.f35c.loadouts.find(l=>l.id===u.loadout).external,true);
  running(s);u.weapons.aam=1;assert.equal(setLoadout(s,u.id,'air').ok,false);assert.equal(u.weapons.aam,1);
});
test('现代自由沙盘双方等额，撤回含航空队舰艇返还实际部署点',()=>{
  const s=createState('modernlab');assert.equal(s.budget+TYPES.cvn_ford.cost+TYPES.ddg_burke3.cost+TYPES.ffg_mogami.cost+TYPES.aor_supply.cost,600);
  const before=s.redBudget,u=add(s,'f16c50','red',220,70);assert.equal(s.redBudget,before-TYPES.f16c50.cost);assert.ok(removeUnit(s,u.id));assert.equal(s.redBudget,before);
});
test('甲板模式、库存、放飞间隔、在空容量、重伤与预算同时生效',()=>{
  assert.equal(deckCompatible('cv_fujian','j35'),true);assert.equal(deckCompatible('cv_liaoning','j35'),false);assert.equal(deckCompatible('cv_queen_elizabeth','f35c'),false);assert.equal(deckCompatible('cv_queen_elizabeth','f35b'),true);
  const s=setup(),base=add(s,'cvn_ford');running(s);const budget=s.budget;
  assert.equal(launchDeck(s,base.id,'f22a').ok,false);const r=launchDeck(s,base.id,'f35c','strike');assert.ok(r.ok);assert.equal(r.unit.weapons.pgm,2);assert.equal(base.airwing.f35c,1);assert.equal(s.budget,budget);
  assert.equal(launchDeck(s,base.id,'fa18e').ok,false);base.deckReady=0;
  while(s.units.filter(v=>v.home?.baseId===base.id).length<TYPES.cvn_ford.deck.capacity){const key=Object.keys(base.airwing).find(k=>base.airwing[k]>0);assert.ok(launchDeck(s,base.id,key).ok);base.deckReady=0;}
  assert.equal(launchDeck(s,base.id,'mh60r').ok,false);base.hp=10;assert.equal(launchDeck(s,base.id,'mh60r').ok,false);
  assert.ok(deserialize(serialize(s)));
});
test('舰载机回收跟随移动母舰，整备补给所选挂载并保持机体损伤',()=>{
  const s=setup(),base=add(s,'cvn_ford');running(s);const air=launchDeck(s,base.id,'fa18e','naval').unit;air.hp=31;air.weapons.asm=1;
  base.speed=8;assert.ok(setRoute(s,base.id,{x:80,y:90}).ok);assert.ok(returnToBase(s,air.id).ok);const supply=base.supply;step(s,1);assert.equal(air.flightState,'servicing');assert.equal(air.deckBased,true);assert.ok(base.supply<supply);step(s,240);
  assert.equal(air.flightState,'airborne');assert.equal(air.weapons.asm,TYPES.fa18e.loadouts.find(l=>l.id==='naval').weapons.asm);assert.equal(air.hp,31);assert.ok(Math.abs(air.x-base.x)<1);assert.equal(air.sorties,1);
  assert.ok(deserialize(serialize(s)));
});
test('补给不足停飞、舰沉使甲板飞机损失，不能无限生成航空队',()=>{
  const s=setup(),base=add(s,'cvn_ford');running(s);const air=launchDeck(s,base.id,'fa18e').unit;base.supply=0;returnToBase(s,air.id);step(s,1);assert.equal(air.flightState,'grounded');base.hp=0;step(s,1);assert.equal(air.hp,0);assert.equal(base.airwing.fa18e,2);
});
test('空中加油要求接口与会合并实际消耗供油，不能远距瞬间补满',()=>{
  const s=setup(),air=add(s,'f16v70'),probe=add(s,'rafale_m','blue',75,90),boom=add(s,'kc135r','blue',80,90),both=add(s,'kc46a','blue',85,90);running(s);
  air.fuel=2000;probe.fuel=2000;assert.equal(requestRefuel(s,probe.id,boom.id).ok,false);assert.ok(requestRefuel(s,air.id,boom.id).ok);const initial=air.fuel;step(s,1);assert.ok(air.fuel<initial);
  assert.ok(requestRefuel(s,probe.id,both.id).ok);air.x=boom.x;air.y=boom.y;air.altitude=boom.altitude;air.speed=boom.speed;const supply=boom.fuelSupply;step(s,5);assert.ok(air.fuel>initial);assert.ok(boom.fuelSupply<supply);
  const another=addUnit(s,'f16v70','blue',{x:100,y:90});assert.equal(another.ok,false);
  assert.ok(deserialize(serialize(s)));
});
test('取消受油航线会取消会合，不匹配或油量耗尽会中止',()=>{
  const s=setup(),air=add(s,'f16v70'),tanker=add(s,'kc46a','blue',80,90);running(s);air.fuel=1000;requestRefuel(s,air.id,tanker.id);assert.ok(setRoute(s,air.id,{x:100,y:95}).ok);assert.equal(air.refuelTarget,null);
  requestRefuel(s,air.id,tanker.id);tanker.fuelSupply=0;step(s,1);assert.equal(air.refuelTarget,null);
});
test('补给舰近距低速只转移有限航空库存，不改变舰载导弹弹药',()=>{
  const s=setup(),donor=add(s,'aor_supply'),base=add(s,'cvn_ford','blue',75,90);running(s);base.supply=60;
  assert.equal(requestSupply(s,donor.id,base.id).ok,false);base.x=71;donor.speed=base.speed=0;const sam=base.weapons.point,stores=donor.supply;assert.ok(requestSupply(s,donor.id,base.id).ok);step(s,30);
  assert.ok(Math.abs(base.supply-62)<1e-8);assert.ok(Math.abs(donor.supply-(stores-2))<1e-8);assert.equal(base.weapons.point,sam);base.speed=20;step(s,1);assert.equal(donor.supplyTarget,null);
});
test('现代潜艇可用本艇声呐搜索水面，深潜切断外部数据链',()=>{
  const s=setup(),sub=add(s,'ssn_virginia'),awacs=add(s,'e2d','blue',60,80),enemy=add(s,'frigate','red',100,90);quiet(s);start(s);sub.sonar=true;awacs.radar=true;confirm(s);
  assert.equal(s.contacts.blue[enemy.id].quality,'track');assert.ok(s.contacts.blue[enemy.id].observations[sub.id]);assert.ok(fireCheck(s,sub.id,enemy.id,'torpedo').error.includes('射程'));
  sub.sonar=false;confirm(s);assert.equal(fireCheck(s,sub.id,enemy.id,'asm').ok,false);assert.ok(setDepth(s,sub.id,'periscope').ok);assert.equal(fireCheck(s,sub.id,enemy.id,'asm').ok,true);
});
test('新式反潜直升机吊放声呐必须低空低速，巡逻机必须低空',()=>{
  for(const type of ['mh60r','p8a']){const s=setup(),air=add(s,type),sub=add(s,'ssk212a','red',82,90);quiet(s);start(s);air.sonar=true;air.altitude='high';scan(s);assert.equal(s.contacts.blue[sub.id],undefined);air.altitude='low';air.speed=type==='mh60r'?0:200;confirm(s);assert.equal(s.contacts.blue[sub.id].quality,'track');}
});
test('所有型号的所有挂载可保存载入，库存与支持状态不能伪造',()=>{
  for(const [type,t] of models)for(const row of t.loadouts){const s=setup(),u=add(s,type);assert.ok(setLoadout(s,u.id,row.id).ok);const back=deserialize(serialize(s)).units[0];assert.equal(back.loadout,row.id);assert.deepEqual(back.weapons,u.weapons);assert.deepEqual(back.airwing,u.airwing);}
  const s=setup(),base=add(s,'cvn_ford');running(s);launchDeck(s,base.id,'f35c');const original=JSON.parse(serialize(s));
  for(const mutate of [r=>r.units[0].airwing.f35c=20,r=>r.units[0].fuelSupply=1,r=>r.units[0].loadout='bad',r=>r.units.at(-1).originDeck='u999',r=>r.units[0].refuelTarget='u999']){const raw=structuredClone(original);mutate(raw);assert.throws(()=>deserialize(JSON.stringify(raw)));}
});
test('v3 存档缺少新武器与支持字段时安全迁移到 v7',()=>{
  const raw=JSON.parse(serialize(createState('strait')));raw.version=3;for(const u of raw.units){for(const key of ['gun','asroc','pgm','atgm'])delete u.weapons[key];for(const key of ['loadout','airwing','deckReady','deckBased','originDeck','fuelSupply','refuelTarget','supplyTarget','depth'])delete u[key];}
  const s=deserialize(JSON.stringify(raw));assert.equal(s.version,7);assert.equal(s.units[0].weapons.gun,0);assert.ok(s.paused);
});
test('现代沙盘长时间推演保持预算、库存与引用，红方自动放飞预警与战斗机',()=>{
  const s=createState('modernlab');start(s);const carrier=s.units.find(u=>u.type==='cvn_ford');launchDeck(s,carrier.id,'e2d');for(let i=0;i<6;i++)step(s,300);
  assert.ok(s.units.some(u=>u.side==='red'&&TYPES[u.type].role==='awacs'));assert.ok(s.units.some(u=>u.side==='red'&&u.originDeck&&TYPES[u.type].weapons.aam>0));assert.ok(s.units.some(u=>u.side==='red'&&u.loadout==='naval'));assert.ok(deserialize(serialize(s)));assert.ok(s.budget>=0&&s.redBudget>=0);
});
test('Su-33 的 R-27 类半主动弹不能仅依赖友军航迹发射',()=>{
  const s=setup(),fighter=add(s,'su33'),awacs=add(s,'e2d','blue',60,80),enemy=add(s,'fighter','red',110,90);quiet(s);start(s);awacs.radar=true;confirm(s);
  assert.equal(fireCheck(s,fighter.id,enemy.id,'aam').ok,false);assert.match(fireCheck(s,fighter.id,enemy.id,'aam').error,/雷达照射/);fighter.radar=true;confirm(s);assert.equal(fireCheck(s,fighter.id,enemy.id,'aam').ok,true);
});
test('现代潜艇深潜不发射雷达信号，潜望镜深度开雷达可被电子支援侦知',()=>{
  const s=setup(),sub=add(s,'ssn_virginia'),enemy=add(s,'fighter','red',110,90);quiet(s);start(s);sub.radar=true;enemy.esm=true;scan(s);assert.equal(s.contacts.red[sub.id],undefined);
  setDepth(s,sub.id,'periscope');scan(s);assert.equal(s.contacts.red[sub.id].source,'电子支援');assert.equal(s.contacts.red[sub.id].quality,'bearing');
});
test('飞机整备中换装在完成整备后生效，存档保留新任务且不超载',()=>{
  const s=setup(),base=add(s,'cvn_ford');running(s);const air=launchDeck(s,base.id,'fa18e','naval').unit;returnToBase(s,air.id);step(s,1);assert.equal(air.flightState,'servicing');assert.ok(setLoadout(s,air.id,'air').ok);assert.equal(air.weapons.asm,0);assert.ok(deserialize(serialize(s)));step(s,240);
  assert.equal(air.weapons.aam,TYPES.fa18e.loadouts.find(l=>l.id==='air').weapons.aam);assert.equal(air.weapons.asm,0);
});
