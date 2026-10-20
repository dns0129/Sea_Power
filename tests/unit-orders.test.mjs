import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.13.0';
import {seaSnapshot} from '../dist/sea-scene-data.js?v=0.13.0';
import {unitCommandCard} from '../dist/unit-command-ui.js?v=0.13.0';

function running(id='midway42'){const s=E.createState(id);E.start(s);return s;}
function aircraftPair(){
  const s=running(),a=s.units.find(u=>u.type==='ww2_f4f'),b=s.units.find(u=>u.type==='ww2_a6m');
  for(const u of s.units){u.autoEngage=false;u.autoDefense=false;u.commandMode='manual';u.route=[];}
  Object.assign(a,{x:210,y:60,altitude:'medium',speed:250});Object.assign(b,{x:210.5,y:60,altitude:'medium',speed:250});E.scan(s);return {s,a,b};
}

test('逐单位接管不接管其他单位，单独手动航线优先于全队计划',()=>{
  const s=running(),ship=s.units[0],other=s.units[1],plane=s.units.find(u=>u.type==='ww2_f4f');
  assert.equal(E.setUnitControl(s,ship.id,'ai').ok,true);assert.equal(ship.commandMode,'ai');assert.equal(other.commandMode,'mission');
  assert.equal(E.setRoute(s,plane.id,{x:270,y:65}).ok,true);const route=structuredClone(plane.route);
  E.issueMissionOrder(s,'plan');E.step(s,8);assert.equal(plane.commandMode,'manual');assert.deepEqual(plane.route,route);
  assert.equal(E.setUnitControl(s,plane.id,'mission').ok,true);assert.equal(plane.commandMode,'mission');
});

test('舰船、飞机和固定基地均可独立 AI 接管或锁定，固定基地保持位置',()=>{
  const s=running(),enemy=s.units.find(u=>u.side==='red'&&u.type==='ww2_akagi');
  s.contacts.blue[enemy.id]={id:enemy.id,x:200,y:120,time:0,domain:'surface',source:'目视',quality:'track',observations:{},label:'航母报告'};
  const units=[s.units[0],s.units.find(u=>u.type==='ww2_f4f'),s.units.find(u=>u.type==='ww2_midway')];
  for(const u of units){const before={x:u.x,y:u.y};assert.equal(E.setUnitControl(s,u.id,'ai').ok,true);assert.equal(E.lockUnitTarget(s,u.id,enemy.id).ok,true);assert.equal(u.lockedTarget,enemy.id);if(E.TYPES[u.type].domain==='land')assert.deepEqual({x:u.x,y:u.y},before);}
  const hunt=running('hunt'),sub=hunt.units.find(u=>u.side==='blue'&&E.TYPES[u.type].domain==='sub');assert.equal(E.setUnitControl(hunt,sub.id,'ai').ok,true);
});

test('跟随指令只读取已报告坐标，不读取隐藏敌舰位置',()=>{
  const s=running('samar44'),ship=s.units.find(u=>u.type==='ww2_fletcher'),enemy=s.units.find(u=>u.side==='red');
  s.contacts.blue={[enemy.id]:{id:enemy.id,x:80,y:64,time:0,domain:'surface',source:'雷达',quality:'search',observations:{},label:'敌舰报告'}};
  for(const u of s.units.filter(u=>u.side==='red'))for(const key of ['x','y'])Object.defineProperty(u,key,{get(){throw Error('读取隐藏敌舰位置');}});
  assert.doesNotThrow(()=>assert.equal(E.lockUnitTarget(s,ship.id,enemy.id).ok,true));assert.ok(ship.route.length);
});

test('目标失联后仅追踪最后报告，报告过期后停止追踪真实位置',()=>{
  const s=running('samar44'),ship=s.units.find(u=>u.type==='ww2_fletcher'),enemy=s.units.find(u=>u.type==='ww2_jp_torpedo_dd');
  s.units=[ship,enemy];Object.assign(ship,{x:70,y:80});Object.assign(enemy,{x:10,y:10,route:[],autoEngage:false,commandMode:'manual'});
  s.contacts.blue={[enemy.id]:{id:enemy.id,x:75,y:80,time:0,domain:'surface',source:'目视',quality:'track',observations:{},label:'最后报告'}};
  E.lockUnitTarget(s,ship.id,enemy.id);E.step(s,8);assert.ok(ship.route[0].x>70);assert.match(ship.commandStatus,/最后报告/);
  s.time=901;E.step(s,8);assert.deepEqual(ship.route,[]);assert.match(ship.commandStatus,/报告失效/);
});

test('战斗机锁定近距机群后形成缠斗，双方实际航速下降，脱离后恢复',()=>{
  const {s,a,b}=aircraftPair(),cruise=b.speed;
  assert.equal(E.lockUnitTarget(s,a.id,b.id).ok,true);assert.ok(a.dogfightWith.includes(b.id));assert.ok(b.dogfightWith.includes(a.id));
  assert.ok(E.effectiveSpeed(a)<a.speed);assert.ok(E.effectiveSpeed(b)<cruise);
  const picture=seaSnapshot(s);assert.ok(picture.units.find(u=>u.id===a.id).speed<a.speed);
  const loaded=E.deserialize(E.serialize(s));assert.equal(loaded.units.find(u=>u.id===a.id).lockedTarget,b.id);assert.ok(loaded.units.find(u=>u.id===b.id).combatSlow<1);
  b.x=235;E.step(s,1);assert.equal(a.combatSlow,1);assert.equal(b.combatSlow,1);assert.equal(E.effectiveSpeed(b),cruise);
});

test('远距离锁定和仅无线电报告不能对敌方施加缠斗减速',()=>{
  const {s,a,b}=aircraftPair();b.x=230;s.contacts.blue[b.id]={...s.contacts.blue[b.id],x:b.x,observations:{}};
  E.lockUnitTarget(s,a.id,b.id);assert.equal(b.combatSlow,1);
  s.contacts.blue[b.id].x=a.x+.2;E.lockUnitTarget(s,a.id,b.id);assert.equal(b.combatSlow,1);assert.deepEqual(a.dogfightWith,[]);
});

test('自动交战优先攻击锁定目标，AI 接管可取消锁定并恢复自主选敌',()=>{
  const s=running('samar44'),ship=s.units.find(u=>u.type==='ww2_fletcher'),targets=s.units.filter(u=>u.type==='ww2_jp_torpedo_dd').slice(0,2);
  for(const u of s.units){u.commandMode='manual';u.autoEngage=false;u.autoDefense=false;u.route=[];}
  Object.assign(ship,{x:70,y:75});Object.assign(targets[0],{x:71,y:75});Object.assign(targets[1],{x:73,y:75});E.scan(s);
  E.lockUnitTarget(s,ship.id,targets[1].id);E.step(s,8);
  assert.ok(s.missiles.some(m=>m.shooter===ship.id&&m.target===targets[1].id));assert.ok(!s.missiles.some(m=>m.shooter===ship.id&&m.target===targets[0].id));
  E.setUnitControl(s,ship.id,'ai');assert.equal(ship.lockedTarget,null);assert.equal(ship.commandMode,'ai');
});

test('单位命令、损伤记录可保存，旧存档恢复默认指挥，非法锁定被拒绝',()=>{
  const {s,a,b}=aircraftPair();E.lockUnitTarget(s,a.id,b.id);const base=s.units[0];base.criticalHits=[{part:'flightDeck',weapon:'bomb',time:0}];
  const saved=E.deserialize(E.serialize(s));assert.equal(saved.units.find(u=>u.id===a.id).commandMode,'follow');assert.deepEqual(saved.units[0].criticalHits,base.criticalHits);
  const old=JSON.parse(E.serialize(s));for(const u of old.units)for(const k of ['commandMode','lockedTarget','aiTarget','commandAnchor','commandStatus','searchLeg','criticalHits','lastGunAt'])delete u[k];
  assert.equal(E.deserialize(JSON.stringify(old)).units[0].commandMode,'mission');
  const bad=JSON.parse(E.serialize(s));bad.units.find(u=>u.id===a.id).lockedTarget=base.id;assert.throws(()=>E.deserialize(JSON.stringify(bad)),/锁定目标/);
  assert.equal(E.lockUnitTarget(s,a.id,'u99999').ok,false);assert.equal(E.setUnitControl(s,b.id,'ai').ok,false);
});

test('航母放飞间隔和重新整备受甲板节奏限制，现代与二战航母均放慢',()=>{
  for(const [id,type,plane,minimum] of [['midway42','ww2_yorktown','ww2_sbd',240],['samar44','ww2_escort_carrier','ww2_tbm',300],['modernlab','cvn_ford','fa18e',120]]){
    const s=running(id),base=s.units.find(u=>u.type===type);assert.equal(E.launchDeck(s,base.id,plane).ok,true);assert.ok(base.deckReady-s.time>=minimum);
    s.time=minimum-1;assert.equal(E.launchDeck(s,base.id,plane).ok,false);
  }
});

test('指挥卡覆盖逐单位接管、跟随与任务计划，安全显示接触名称',()=>{
  const html=unitCommandCard({id:'u1',commandMode:'ai',commandStatus:'接管中'},{contacts:[{id:'u2',label:'<敌舰>'}]});
  assert.match(html,/AI 接管/);assert.match(html,/data-unit-lock/);assert.match(html,/手动指挥/);assert.match(html,/任务计划/);assert.ok(html.includes('&lt;敌舰&gt;'));
});
