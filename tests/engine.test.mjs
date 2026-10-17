import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,start,step,scan,visibleContacts,fire,fireCheck,setRoute,setSpeed,setAltitude,returnToBase,addUnit,removeUnit,formFleet,serialize,deserialize,checkOutcome,unitById,TYPES,WEAPONS,inLand,clearPath,radarHorizon,sensorRange,missileVisible,maxSpeed} from '../dist/engine.js?v=0.11.0';

function quiet(s){for(const u of s.units){u.autoEngage=false;u.autoDefense=false;u.radar=u.sonar=u.esm=false;u.route=[];}return s;}
function confirm(s,seconds=12){for(let t=0;t<seconds;t+=3){s.time+=3;scan(s);}return s;}
function pair(blue='destroyer',red='frigate',positions=[{x:90,y:90},{x:105,y:90}]){
  const s=createState('sandbox');s.units=[];s.budget=s.redBudget=200;
  const a=addUnit(s,blue,'blue',positions[0]),b=addUnit(s,red,'red',positions[1]);assert.ok(a.ok,a.error);assert.ok(b.ok,b.error);
  quiet(s);a.unit.speed=b.unit.speed=0;start(s);return {s,blue:a.unit,red:b.unit};
}
test('部署点计费返还、双方限制与非法类型',()=>{
  const s=createState();assert.equal(s.budget,38);assert.equal(addUnit(s,'frigate','blue',{x:12,y:12}).ok,false);
  assert.equal(addUnit(s,'frigate','blue',{x:150,y:80}).ok,false);assert.equal(addUnit(s,'frigate','red',{x:180,y:80}).ok,false);
  assert.equal(addUnit(s,'__proto__','blue',{x:80,y:80}).ok,false);
  const a=addUnit(s,'frigate','blue',{x:50,y:130});assert.ok(a.ok);assert.equal(s.budget,20);assert.ok(removeUnit(s,a.unit.id));assert.equal(s.budget,38);
  start(s);assert.equal(addUnit(s,'fighter','blue',{x:90,y:70}).ok,false);
});
test('自由沙盘双方都收费，红方不能无限部署',()=>{
  const s=createState('sandbox'),before=s.redBudget;const a=addUnit(s,'fighter','red',{x:180,y:70});assert.ok(a.ok);assert.equal(s.redBudget,before-TYPES.fighter.cost);
  assert.ok(removeUnit(s,a.unit.id));assert.equal(s.redBudget,before);s.redBudget=0;assert.equal(addUnit(s,'fighter','red',{x:180,y:70}).ok,false);
});
test('岸基部署只允许陆地，阵地不可移动，航空可以跨陆地',()=>{
  const s=createState('sandbox');assert.ok(inLand({x:135,y:25}));
  assert.equal(addUnit(s,'samLong','blue',{x:100,y:90}).ok,false);const a=addUnit(s,'samLong','blue',{x:135,y:25});assert.ok(a.ok);
  assert.equal(setRoute(s,a.unit.id,{x:130,y:20}).ok,false);assert.equal(setSpeed(s,a.unit.id,20).ok,false);
  assert.equal(addUnit(s,'frigate','blue',{x:135,y:25}).ok,false);
});
test('雷达地平线阻止水面舰超视距直接锁定',()=>{
  const {s,blue,red}=pair('destroyer','frigate',[{x:70,y:90},{x:145,y:90}]);blue.radar=true;red.radar=true;blue.esm=true;scan(s);confirm(s);
  assert.ok(radarHorizon(blue,red)<21);assert.equal(s.contacts.blue[red.id].quality,'bearing');assert.equal(fireCheck(s,blue.id,red.id,'asm').ok,false);
});
test('雷达需要连续确认，重复同一时刻扫描不能跳过确认',()=>{
  const {s,blue,red}=pair();blue.radar=true;scan(s);assert.equal(s.contacts.blue[red.id].quality,'search');
  for(let i=0;i<10;i++)scan(s);assert.equal(s.contacts.blue[red.id].quality,'search');assert.equal(fireCheck(s,blue.id,red.id,'asm').ok,false);
  confirm(s,9);assert.equal(s.contacts.blue[red.id].quality,'track');assert.ok(fireCheck(s,blue.id,red.id,'asm').ok);
});
test('预警机数据链让舰艇使用远方航迹，关闭链路即禁止发射',()=>{
  const s=createState('sandbox');s.units=[];s.budget=s.redBudget=200;
  const ship=addUnit(s,'destroyer','blue',{x:70,y:90}).unit,awacs=addUnit(s,'awacs','blue',{x:60,y:70}).unit,enemy=addUnit(s,'frigate','red',{x:145,y:90}).unit;
  quiet(s);awacs.radar=true;start(s);confirm(s);assert.equal(s.contacts.blue[enemy.id].quality,'track');assert.ok(fireCheck(s,ship.id,enemy.id,'asm').ok);
  ship.datalink=false;assert.equal(fireCheck(s,ship.id,enemy.id,'asm').ok,false);ship.datalink=true;awacs.datalink=false;assert.equal(fireCheck(s,ship.id,enemy.id,'asm').ok,false);
});
test('失联航迹冻结、过期，并在保存载入后仍保持原位置与时效',()=>{
  const {s,blue,red}=pair();blue.radar=true;scan(s);confirm(s);const c={...s.contacts.blue[red.id]};blue.radar=false;red.x+=20;s.time+=9;scan(s);
  assert.equal(s.contacts.blue[red.id].x,c.x);assert.ok(visibleContacts(s)[0].stale);assert.equal(fireCheck(s,blue.id,red.id,'asm').ok,false);
  const loaded=deserialize(serialize(s));assert.equal(loaded.contacts.blue[red.id].x,c.x);assert.equal(loaded.contacts.blue[red.id].time,c.time);assert.ok(visibleContacts(loaded)[0].stale);
  s.time+=100;scan(s);assert.equal(s.contacts.blue[red.id],undefined);
});
test('飞机高度改变低空雷达视距，隐身会缩短发现距离',()=>{
  const {s,blue,red}=pair('destroyer','stealth',[{x:70,y:90},{x:155,y:90}]);blue.radar=true;red.altitude='low';scan(s);assert.equal(s.contacts.blue[red.id],undefined);
  red.altitude='high';scan(s);assert.equal(s.contacts.blue[red.id],undefined); // 隐身折减后小于85海里。
  red.type='fighter';scan(s);assert.equal(s.contacts.blue[red.id].quality,'search');
  assert.ok(sensorRange(s,blue,'air','high')>sensorRange(s,blue,'air','low'));
});
test('开雷达的隐身飞机仍可由电子支援粗略发现',()=>{
  const {s,blue,red}=pair('fighter','stealth',[{x:60,y:90},{x:165,y:90}]);blue.esm=true;red.radar=true;scan(s);
  assert.equal(s.contacts.blue[red.id].quality,'bearing');assert.equal(fireCheck(s,blue.id,red.id,'aam').ok,false);
});
test('电子战干扰阻断远方数据链，不能阻断本机已建立的航迹',()=>{
  const s=createState('sandbox');s.units=[];s.budget=s.redBudget=200;
  const blue=addUnit(s,'destroyer','blue',{x:70,y:90}).unit,awacs=addUnit(s,'awacs','blue',{x:60,y:60}).unit,red=addUnit(s,'frigate','red',{x:145,y:90}).unit,jammer=addUnit(s,'electronic','red',{x:90,y:80}).unit;
  quiet(s);awacs.radar=true;start(s);confirm(s);assert.ok(fireCheck(s,blue.id,red.id,'asm').ok);jammer.jamming=true;assert.equal(fireCheck(s,blue.id,red.id,'asm').ok,false);
  red.x=80;blue.radar=true;scan(s);confirm(s);assert.ok(fireCheck(s,blue.id,red.id,'asm').ok);
});
test('声呐航迹确认后才能开火，雷达不能代替声呐',()=>{
  const {s,blue,red}=pair('helicopter','submarine',[{x:100,y:90},{x:114,y:90}]);blue.radar=true;scan(s);assert.equal(s.contacts.blue[red.id],undefined);
  blue.sonar=true;scan(s);assert.equal(s.contacts.blue[red.id].quality,'search');assert.equal(fireCheck(s,blue.id,red.id,'torpedo').ok,false);confirm(s);
  assert.equal(s.contacts.blue[red.id].quality,'track');assert.ok(fireCheck(s,blue.id,red.id,'torpedo').ok);
});
test('吊放声呐需要低空低速，巡逻机需低空浮标搜索',()=>{
  const {s,blue,red}=pair('helicopter','submarine');blue.sonar=true;blue.speed=80;scan(s);assert.equal(s.contacts.blue[red.id],undefined);
  blue.speed=0;scan(s);assert.ok(s.contacts.blue[red.id]);s.contacts.blue={};blue.altitude='medium';scan(s);assert.equal(s.contacts.blue[red.id],undefined);
  blue.type='patrol';blue.altitude='medium';scan(s);assert.equal(s.contacts.blue[red.id],undefined);blue.altitude='low';scan(s);assert.ok(s.contacts.blue[red.id]);
});
test('舰艇高速与风暴降低声呐探测范围',()=>{
  const {s,blue,red}=pair('frigate','submarine',[{x:90,y:90},{x:110,y:90}]);blue.sonar=true;red.speed=12;scan(s);assert.ok(s.contacts.blue[red.id]);
  s.contacts.blue={};blue.speed=25;scan(s);assert.equal(s.contacts.blue[red.id],undefined);blue.speed=0;red.x=114;s.weather='storm';scan(s);assert.equal(s.contacts.blue[red.id],undefined);
});
test('移动换算、暂停、陆地航路与追加航点',()=>{
  const {s,blue}=pair();blue.speed=30;assert.ok(setRoute(s,blue.id,{x:120,y:90}).ok);const x=blue.x;s.paused=true;step(s,600);assert.equal(blue.x,x);s.paused=false;step(s,360);assert.ok(Math.abs(blue.x-x-3)<1e-8);
  assert.equal(clearPath(blue,{x:135,y:25}),false);assert.equal(setRoute(s,blue.id,{x:135,y:25}).ok,false);assert.ok(setRoute(s,blue.id,{x:110,y:100}).ok);assert.ok(setRoute(s,blue.id,{x:120,y:110},true).ok);assert.equal(blue.route.length,2);
});
test('固定翼不能设置零速，保持盘旋并消耗燃油；直升机可以悬停',()=>{
  const {s,blue}=pair('fighter','frigate');assert.ok(setSpeed(s,blue.id,0).ok);assert.equal(blue.speed,TYPES.fighter.speed*.4);const fuel=blue.fuel,x=blue.x;step(s,30);assert.ok(blue.fuel<fuel);assert.notEqual(blue.x,x);
  blue.type='helicopter';assert.ok(setSpeed(s,blue.id,0).ok);assert.equal(blue.speed,0);assert.equal(setAltitude(s,blue.id,'high').ok,false);
});
test('平台专用射程、最小射程、弹药与武器独立冷却',()=>{
  const {s,blue,red}=pair();blue.radar=true;scan(s);confirm(s);assert.equal(fireCheck(s,blue.id,red.id,'sam').ok,false);assert.ok(fire(s,blue.id,red.id,'asm').ok);
  assert.equal(blue.weapons.asm,7);assert.equal(fire(s,blue.id,red.id,'asm').ok,false);assert.ok(fire(s,blue.id,red.id,'torpedo').ok);
  blue.cooldowns.asm=0;red.x=91;scan(s);assert.equal(fireCheck(s,blue.id,red.id,'asm').ok,false);blue.weapons.asm=0;assert.equal(fireCheck(s,blue.id,red.id,'asm').ok,false);
  assert.equal(TYPES.frigate.profiles.sam.range,35);assert.equal(TYPES.interceptor.profiles.aam.range,100);
});
test('远距离无侦察的主动导弹飞向最后位置，不追踪真实移动',()=>{
  const {s,blue,red}=pair('bomber','frigate',[{x:60,y:90},{x:140,y:90}]);blue.radar=true;scan(s);confirm(s);assert.ok(fire(s,blue.id,red.id,'asm').ok);
  const last={...s.missiles[0].aim};blue.radar=false;blue.esm=false;s.contacts.blue={};red.y=130;step(s,100);
  assert.deepEqual(s.missiles[0].aim,last);assert.equal(s.missiles[0].seekerLocked,false);for(let i=0;i<9;i++)step(s,60);assert.equal(red.hp,TYPES.frigate.hp);
});
test('主动末段导引头可在自身范围内继续跟踪，与发射平台损失独立',()=>{
  const {s,blue,red}=pair();blue.radar=true;scan(s);confirm(s);assert.ok(fire(s,blue.id,red.id,'asm').ok);blue.hp=0;red.x=100;s.contacts.blue={};step(s,1);
  assert.equal(s.missiles[0].seekerLocked,true);assert.equal(s.missiles[0].aim.x,red.x);
});
test('区域防空导弹需要本机雷达照射，关闭后不再追踪飞机',()=>{
  const {s,blue,red}=pair('destroyer','bomber',[{x:90,y:90},{x:130,y:90}]);blue.radar=true;scan(s);confirm(s);assert.ok(fire(s,blue.id,red.id,'sam').ok);const aim={...s.missiles[0].aim};
  blue.radar=false;red.y=120;step(s,15);assert.deepEqual(s.missiles[0].aim,aim);step(s,100);assert.equal(red.hp,TYPES.bomber.hp);
});
test('有限火控通道和自卫弹药保留限制主动射击',()=>{
  const {s,blue,red}=pair('destroyer','bomber',[{x:90,y:90},{x:130,y:90}]);blue.radar=true;scan(s);confirm(s);
  for(let i=0;i<TYPES.destroyer.channels;i++){blue.cooldowns.sam=0;assert.ok(fire(s,blue.id,red.id,'sam').ok);}blue.cooldowns.sam=0;assert.match(fireCheck(s,blue.id,red.id,'sam').error,/通道/);
  s.missiles=[];blue.weapons.sam=blue.samReserve;assert.match(fireCheck(s,blue.id,red.id,'sam').error,/保留/);
});
test('防空发射实际在途拦截弹，自卫可使用保留弹药',()=>{
  const {s,blue,red}=pair();blue.radar=red.radar=true;blue.autoDefense=true;scan(s);confirm(s);blue.weapons.sam=blue.samReserve;
  assert.ok(fire(s,red.id,blue.id,'asm').ok);const ammo=blue.weapons.sam;step(s,2);
  assert.equal(blue.weapons.sam,ammo-1);assert.ok(s.missiles.some(m=>m.targetKind==='missile'));assert.ok(s.missiles.some(m=>m.weapon==='asm')); // 不瞬间判定拦截。
  const saved=deserialize(serialize(s));assert.ok(saved.missiles.some(m=>m.targetKind==='missile'));
  step(s,90);assert.ok(s.events.some(e=>e.message.includes('拦截')));assert.ok(blue.weapons.sam<ammo);
});
test('掠海导弹在地平线外对舰艇隐藏，预警机能提前发现',()=>{
  const {s,blue,red}=pair('destroyer','bomber',[{x:70,y:90},{x:140,y:90}]);red.radar=true;blue.radar=true;scan(s);confirm(s);assert.ok(fire(s,red.id,blue.id,'asm').ok);const m=s.missiles[0];
  assert.equal(missileVisible(s,m,'blue'),false);blue.type='awacs';blue.altitude='high';assert.equal(missileVisible(s,m,'blue'),true);
});
test('近防与诱饵按攻击消耗且不会无限重试',()=>{
  const {s,blue,red}=pair('destroyer','frigate',[{x:90,y:90},{x:96,y:90}]);red.radar=true;blue.autoDefense=true;blue.weapons.sam=blue.weapons.point=0;scan(s);confirm(s);assert.ok(fire(s,red.id,blue.id,'asm').ok);
  s.seed=1;const ciws=blue.ciws;step(s,60);assert.equal(blue.ciws,ciws-1);assert.equal(s.missiles.length,0);
});
test('反辐射导弹可以从电子支援信号发射，命中压制雷达',()=>{
  const {s,blue,red}=pair('electronic','samLong',[{x:90,y:25},{x:130,y:24}]);blue.esm=true;red.radar=true;scan(s);
  assert.equal(s.contacts.blue[red.id].quality,'bearing');assert.ok(fire(s,blue.id,red.id,'arm').ok);s.seed=1;step(s,150);
  assert.equal(red.hp,TYPES.samLong.hp-WEAPONS.arm.damage);assert.ok(red.radarDisabledUntil>s.time);s.contacts.blue={};scan(s);assert.equal(s.contacts.blue[red.id],undefined);
});
test('对陆巡航导弹与反舰弹不能互换目标',()=>{
  const s=createState('littoral');quiet(s);s.units.find(u=>u.type==='awacs').radar=true;start(s);confirm(s);
  const land=s.units.find(u=>u.type==='landAttack'),target=s.units.find(u=>u.type==='samLong'),ship=s.units.find(u=>u.side==='red'&&u.type==='frigate');
  assert.ok(fireCheck(s,land.id,target.id,'cruise').ok);assert.equal(fireCheck(s,land.id,ship.id,'cruise').ok,false);
  const ddg=s.units.find(u=>u.type==='destroyer');assert.equal(fireCheck(s,ddg.id,target.id,'asm').ok,false);
});
test('低油自动返航，补给延迟、库存消耗与结构损伤保留',()=>{
  const s=createState('sandbox');s.units=[];s.budget=s.redBudget=200;
  const base=addUnit(s,'airbase','blue',{x:17,y:43}).unit,air=addUnit(s,'fighter','blue',{x:22,y:43}).unit;addUnit(s,'frigate','red',{x:160,y:100});quiet(s);start(s);
  air.fuel=170;air.weapons.aam=1;air.hp=30;step(s,1);assert.equal(air.flightState,'returning');assert.equal(setRoute(s,air.id,{x:50,y:80}).ok,false);
  step(s,60);assert.equal(air.flightState,'servicing');assert.equal(base.supply,26);assert.equal(air.weapons.aam,1);const until=air.serviceUntil;step(s,until-s.time+1);
  assert.equal(air.flightState,'airborne');assert.equal(air.weapons.aam,6);assert.ok(air.fuel>TYPES.fighter.endurance*60-2);assert.equal(air.hp,30);
});
test('基地被毁或库存不足时，飞机停飞且不能凭空补给',()=>{
  const s=createState('sandbox');s.units=[];s.budget=s.redBudget=200;const base=addUnit(s,'airbase','blue',{x:17,y:43}).unit,air=addUnit(s,'fighter','blue',{x:22,y:43}).unit;
  addUnit(s,'frigate','red',{x:160,y:100});quiet(s);start(s);assert.ok(returnToBase(s,air.id).ok);base.supply=0;step(s,60);assert.equal(air.flightState,'grounded');assert.equal(fireCheck(s,air.id,s.units[2].id,'asm').ok,false);
});
test('重伤限制速度，补给不会修复结构',()=>{
  const {s,blue}=pair();blue.hp=50;assert.ok(maxSpeed(blue)<TYPES.destroyer.speed);setSpeed(s,blue.id,30);assert.equal(blue.speed,maxSpeed(blue));
});
test('舰队编队只让同侧水面舰跟随有效旗舰',()=>{
  const s=createState(),leader=s.units[0],escort=s.units[1],air=s.units[2];assert.ok(formFleet(s,leader.id).ok);assert.equal(escort.leader,leader.id);assert.equal(air.leader,null);
  setRoute(s,leader.id,{x:100,y:90});quiet(s);formFleet(s,leader.id);setRoute(s,leader.id,{x:100,y:90});start(s);step(s,60);assert.ok(escort.x>67);assert.equal(formFleet(s,air.id).ok,false);leader.hp=0;assert.equal(formFleet(s,leader.id).ok,false);
});
test('AI无法用未发现单位的真实坐标行动，蓝方自动交战保留航线',()=>{
  const {s,blue,red}=pair('destroyer','frigate',[{x:70,y:90},{x:145,y:90}]);red.autoEngage=true;step(s,30);assert.equal(red.route.length,0);assert.equal(s.missiles.length,0);
  blue.radar=true;red.x=85;scan(s);confirm(s);blue.autoEngage=true;setRoute(s,blue.id,{x:90,y:110});const route=JSON.stringify(blue.route);step(s,8);assert.equal(JSON.stringify(blue.route),route);assert.ok(s.missiles.some(m=>m.side==='blue'));
});
test('固定种子重复推演，高倍率固定子步长与单秒结果一致',()=>{
  const a=quiet(createState('sandbox')),b=quiet(createState('sandbox'));for(const s of [a,b]){s.units[0].radar=true;start(s);setRoute(s,s.units[0].id,{x:115,y:90});}
  step(a,120);for(let i=0;i<120;i++)step(b,1);assert.equal(serialize(a),serialize(b));
});
test('所有剧本和全类型单位均可保存载入，保留燃油弹药和引用',()=>{
  for(const scenario of ['strait','hunt','littoral','sandbox']){const s=createState(scenario);start(s);step(s,20);const loaded=deserialize(serialize(s));assert.equal(loaded.paused,true);assert.equal(loaded.units.length,s.units.length);assert.equal(loaded.time,s.time);assert.deepEqual(loaded.units.map(u=>[u.type,u.fuel,u.weapons]),s.units.map(u=>[u.type,u.fuel,u.weapons]));}
  for(const [type,t] of Object.entries(TYPES).filter(([,t])=>t.era!=='ww2')){const s=createState('sandbox');s.units=[];s.budget=s.redBudget=1000;assert.ok(addUnit(s,type,'blue',t.domain==='land'?{x:17,y:43}:{x:75,y:100}).ok);assert.equal(deserialize(serialize(s)).units[0].type,type);}
});
test('格式、越界、弹药、燃油、原型类型与坏引用不能导入',()=>{
  const original=JSON.parse(serialize(createState()));assert.throws(()=>deserialize('{bad'));
  for(const mutate of [r=>r.version=99,r=>r.units[0].weapons.asm=99,r=>r.units[0].x=999,r=>r.units[0].type='__proto__',r=>r.units[2].fuel=-1,r=>r.units[2].home={x:17,y:43,baseId:'u2'}]){const raw=structuredClone(original);mutate(raw);assert.throws(()=>deserialize(JSON.stringify(raw)));}
});
test('旧版战局迁移空空弹药与在途武器，保留预算并暂停',()=>{
  const fixture=readFileSync(new URL('./fixtures/legacy-v1.json',import.meta.url),'utf8'),s=deserialize(fixture);
  assert.equal(s.version,7);assert.equal(s.paused,true);assert.equal(s.budget,38);const fighter=s.units.find(u=>u.type==='fighter');assert.equal(fighter.weapons.aam,6);assert.equal(fighter.weapons.sam,0);assert.ok(fighter.fuel>0);assert.ok(s.missiles.length);assert.ok(s.missiles[0].aim);
});
test('旧版远距机载反舰弹升级后可二次保存载入，不受新挂载射程截断',()=>{
  const raw=JSON.parse(readFileSync(new URL('./fixtures/legacy-v1.json',import.meta.url),'utf8'));
  raw.missiles[0].shooter=raw.units.find(u=>u.type==='fighter').id;raw.missiles[0].travel=80;
  const upgraded=deserialize(JSON.stringify(raw));assert.equal(upgraded.missiles[0].range,95);
  const loaded=deserialize(serialize(upgraded));assert.equal(loaded.missiles[0].range,95);assert.equal(loaded.missiles[0].travel,80);
});
test('等待敌方在途武器后结算，支持单位不阻止胜利',()=>{
  const {s,blue,red}=pair();s.scenario='strait';blue.radar=red.radar=true;scan(s);confirm(s);assert.ok(fire(s,red.id,blue.id,'asm').ok);red.hp=0;checkOutcome(s);assert.equal(s.phase,'running');step(s,120);assert.equal(s.result,'victory');
  const t=createState('littoral');start(t);for(const u of t.units)if(u.side==='red'&&!TYPES[u.type].support)u.hp=0;checkOutcome(t);assert.equal(t.result,'victory');
});
