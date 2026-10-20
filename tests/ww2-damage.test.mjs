import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js?v=0.13.0';
import {criticalImpact} from '../dist/ww2-damage.js?v=0.13.0';

test('炸弹、鱼雷和大口径炮命中关键部位会使完整舰艇重伤，普通命中伤害较小',()=>{
  for(const [weapon,type] of [['bomb','ww2_sbd'],['torpedo','ww2_tbd'],['gun','ww2_washington']]){
    const target={hp:800},targetType={hp:800,domain:'surface',armor:.7,deck:{}};
    const w=E.weaponStats({type},weapon),critical=criticalImpact(target,weapon,w,w.damage,targetType,()=>0);
    assert.ok(critical.part);assert.ok(target.hp-critical.amount<=800*.28);
    const normal=criticalImpact(target,weapon,w,w.damage,targetType,()=>.999);assert.equal(normal.amount,w.damage);assert.equal(normal.part,null);
  }
});

test('小口径炮难以穿透战列舰装甲，不能把普通轻炮命中直接算成致命命中',()=>{
  const w=E.weaponStats({type:'ww2_fletcher'},'gun'),target={hp:1000},t={hp:1000,domain:'surface',armor:.8};
  // This roll would be a critical against an unarmoured target, but is not a penetration.
  assert.equal(criticalImpact(target,'gun',w,w.damage,t,()=>.02).part,null);
  assert.ok(criticalImpact(target,'gun',w,w.damage,{...t,armor:0},()=>.02).part);
});

test('实际轰炸以低命中率结算，罕见关键命中产生重伤且可保存',()=>{
  let hits=0,criticals=0;
  for(let i=0;i<180;i++){
    const s=E.createState('midway42');E.start(s);
    for(const u of s.units){u.commandMode='manual';u.autoEngage=false;u.autoDefense=false;u.route=[];u.speed=0;}
    const base=s.units[0],plane=E.launchDeck(s,base.id,'ww2_sbd').unit,target=s.units.find(u=>u.type==='ww2_akagi');
    Object.assign(plane,{x:210,y:60,speed:0,autoEngage:false,commandMode:'manual',altitude:'low'});Object.assign(target,{x:210.4,y:60});
    s.seed=Math.imul(i+1,2654435761)>>>0;E.scan(s);assert.equal(E.fire(s,plane.id,target.id,'bomb').ok,true);E.step(s,4);
    if(target.hp<E.TYPES[target.type].hp)hits++;
    if(target.criticalHits.length){criticals++;assert.ok(target.hp<=E.TYPES[target.type].hp*.4);assert.ok(E.deserialize(E.serialize(s)).units.find(u=>u.id===target.id).criticalHits.length);}
  }
  assert.ok(hits/180>.08&&hits/180<.28,`命中 ${hits}/180`);assert.ok(criticals>5&&criticals<hits,`关键命中 ${criticals}/${hits}`);
});
