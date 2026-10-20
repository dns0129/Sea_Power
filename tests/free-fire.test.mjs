import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.13.1';
import {sceneUnit} from '../dist/sea-scene-data.js?v=0.13.1';
import {unitCommandCard} from '../dist/unit-command-ui.js?v=0.13.1';
function pair(){
  const s=E.createState('midway42');E.start(s);
  for(const u of s.units){u.autoEngage=u.autoDefense=false;u.commandMode='manual';u.route=[];u.speed=0;u.deckReady=1e8;}
  const u=s.units.find(u=>u.type==='ww2_us_cruiser'),target=s.units.find(u=>u.type==='ww2_jp_destroyer');
  target.x=u.x+3;target.y=u.y;E.scan(s);return {s,u,target};
}
test('自由开火无需指定目标即可射击，并保留航线、编组和指挥模式',()=>{
  const {s,u,target}=pair();u.route=[{x:u.x+5,y:u.y}];u.leader=s.units[0].id;u.offset={x:5,y:5};
  const before=structuredClone({route:u.route,leader:u.leader,offset:u.offset,mode:u.commandMode});
  assert.equal(E.fireCheck(s,u.id,target.id,'gun').ok,true);
  const ammo=u.weapons.gun;assert.equal(E.setFreeFire(s,u.id,true).ok,true);
  assert.deepEqual({route:u.route,leader:u.leader,offset:u.offset,mode:u.commandMode},before);
  E.step(s,8);assert.ok(u.weapons.gun<ammo);assert.ok(s.missiles.some(m=>m.shooter===u.id&&m.target===target.id));
  assert.equal(u.manualTarget,null);assert.equal(u.commandMode,'manual');assert.equal(u.leader,before.leader);
});
test('关闭自由开火后 AI 接管不会重新开启攻击；自卫设置独立',()=>{
  const {s,u}=pair();E.setUnitControl(s,u.id,'ai');assert.equal(E.setFreeFire(s,u.id,false).ok,true);
  const ammo=structuredClone(u.weapons),defense=u.autoDefense;E.step(s,24);
  assert.equal(u.autoEngage,true);assert.equal(E.freeFireEnabled(u),false);assert.deepEqual(u.weapons,ammo);assert.equal(u.autoDefense,defense);
});
test('目标未被发现或超出射程时不开火，也不消耗弹药',()=>{
  const {s,u,target}=pair();target.x=u.x+120;target.y=u.y;s.contacts.blue={};E.scan(s);
  E.setFreeFire(s,u.id,true);const ammo=structuredClone(u.weapons);E.step(s,16);assert.deepEqual(u.weapons,ammo);
});
test('开火设置逐单位保存，旧存档兼容，非法值拒绝',()=>{
  const s=E.createState('midway42'),own=s.units.filter(u=>u.side==='blue');
  E.setFreeFire(s,own[0].id,true);E.setFreeFire(s,own[1].id,false);
  const restored=E.deserialize(E.serialize(s));assert.equal(E.freeFireEnabled(restored.units.find(u=>u.id===own[0].id)),true);assert.equal(E.freeFireEnabled(restored.units.find(u=>u.id===own[1].id)),false);
  const old=JSON.parse(E.serialize(s));for(const u of old.units)delete u.fireAtWill;
  for(const u of E.deserialize(JSON.stringify(old)).units)assert.equal(E.freeFireEnabled(u),u.autoEngage);
  old.units[0].fireAtWill='true';assert.throws(()=>E.deserialize(JSON.stringify(old)),/自由开火/);
});
test('批量开火指令支持各平台，阵营权限和结束状态受到校验',()=>{
  const s=E.createState('midway42'),own=s.units.filter(u=>u.side==='blue'),enemy=s.units.find(u=>u.side==='red');
  assert.equal(E.commandUnits(s,own.map(u=>u.id),{kind:'autoEngage',value:true}).ok,true);
  assert.ok(own.every(E.freeFireEnabled));assert.equal(enemy.fireAtWill,undefined);
  assert.equal(E.setFreeFire(s,enemy.id,true).ok,false);assert.equal(E.setFreeFire(s,own[0].id,'true').ok,false);
  E.setPlayerSide(s,'red');assert.equal(E.setFreeFire(s,enemy.id,true).ok,true);
  s.phase='ended';assert.equal(E.setFreeFire(s,enemy.id,false).ok,false);
});
test('所有单位包括无武器平台都有开火按钮，2D 和 3D 状态一致',()=>{
  const s=E.createState('modernlab');
  for(const u of s.units.filter(u=>u.side==='blue')){
    E.setFreeFire(s,u.id,true);const v=sceneUnit(u);assert.equal(v.autoEngage,true);
    const html=unitCommandCard(v);assert.match(html,/data-unit-free-fire=/);assert.match(html,/aria-pressed="true"/);assert.match(html,/自由开火：开启/);
  }
});
