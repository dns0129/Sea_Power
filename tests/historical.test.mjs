import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../dist/engine.js';
import {REAL_MAPS,geoToWorld,worldToGeo} from '../dist/geography.js';
import {HISTORICAL_SCENARIOS,missionZone} from '../dist/historical-missions.js';
const scenarios=Object.keys(HISTORICAL_SCENARIOS);
function run(s,seconds){while(seconds>0&&s.phase==='running'){const n=Math.min(seconds,30);E.step(s,n);seconds-=n;}}
test('三张地图均来自真实海岸线；经纬度投影保持海里比例并可逆',()=>{
  for(const [id,map] of Object.entries(REAL_MAPS)){
    assert.ok(map.land.length>0);assert.match(map.source,/Natural Earth/);assert.match(map.sourceSHA256,/^[a-f0-9]{64}$/);
    const a={lon:(map.west+map.east)/2,lat:(map.north+map.south)/2},p=geoToWorld(map,a.lon,a.lat),g=worldToGeo(map,p);
    assert.ok(Math.abs(g.lon-a.lon)<1e-10);assert.ok(Math.abs(g.lat-a.lat)<1e-10);assert.ok(Math.abs(geoToWorld(map,a.lon,a.lat-.1).y-p.y-6)<1e-8);
    const state=E.createState(scenarios.find(s=>HISTORICAL_SCENARIOS[s].mapId===id));assert.equal(E.worldFor(state).width,map.width);
    assert.equal(E.inBounds({x:map.width+1,y:10},state),false);
  }
});
test('布比延岛、拉腊克岛和东福克兰的陆地遮罩位置真实，锚地位于水面',()=>{
  for(const [scenario,lon,lat] of [['bubiyan91',48.23,29.80],['mantis88',56.36,26.85],['sanCarlos82',-58.70,-51.50]]){
    const s=E.createState(scenario),map=REAL_MAPS[s.mapId];assert.equal(E.inLand(geoToWorld(map,lon,lat),s),true);
  }
  const s=E.createState('sanCarlos82');assert.equal(E.inLand(missionZone(s),s),false);
});
test('所有初始兵力与任务水面航线均在各自真实地图内，航段不穿陆',()=>{
  for(const scenario of scenarios){const s=E.createState(scenario);for(const u of s.units){assert.ok(E.inBounds(u,s),u.name);if(E.TYPES[u.type].domain==='air')continue;assert.equal(E.inLand(u,s),false,u.name);let from=u;for(const p of u.route){assert.ok(E.clearPath(from,p,s),`${u.name} route`);from=p;}}}
});
test('历史任务禁止自由增援和撤回，保持固定兵力与零预算',()=>{
  for(const scenario of scenarios){const s=E.createState(scenario);assert.equal(s.budget,0);assert.equal(s.redBudget,0);assert.equal(E.addUnit(s,'fighter','blue',{x:20,y:20}).ok,false);assert.equal(E.removeUnit(s,s.units[0].id),false);assert.match(E.SCENARIOS[scenario].sourceURL,/^https:\/\//);assert.ok(E.SCENARIOS[scenario].adaptation);}
});
test('圣卡洛斯允许从无可见敌人的部署阶段开始，不触发歼灭胜利',()=>{
  const s=E.createState('sanCarlos82');assert.equal(s.units.some(u=>u.side==='red'),false);assert.ok(E.start(s).ok);E.step(s,60);E.checkOutcome(s);assert.equal(s.phase,'running');assert.equal(s.mission.waves.length,0);
});
test('空袭按时间进入并在保存载入后不重复生成',()=>{
  const s=E.createState('mantis88');E.start(s);run(s,425);assert.deepEqual(s.mission.waves,['response']);const count=s.units.length;
  const loaded=E.deserialize(E.serialize(s));assert.equal(loaded.paused,true);assert.deepEqual(loaded.mission.waves,['response']);assert.equal(loaded.mapId,'hormuz');loaded.paused=false;run(loaded,30);assert.equal(loaded.units.length,count);assert.deepEqual(loaded.mission.waves,['response']);
});
test('布比延任务三艘击沉即可完成，不要求消灭全部敌人',()=>{
  const s=E.createState('bubiyan91');E.start(s);const targets=s.units.filter(u=>u.missionRole==='escape');for(const u of targets.slice(0,3))u.hp=0;E.step(s,1);assert.equal(s.result,'victory');assert.ok(targets[3].hp>0);
});
test('布比延两艘越过脱离线会失败，并从探测和战斗中退出',()=>{
  const s=E.createState('bubiyan91');E.start(s);for(const u of s.units.filter(u=>u.missionRole==='escape').slice(0,2))Object.assign(u,{...missionZone(s),route:[]});E.step(s,1);assert.equal(s.result,'defeat');assert.equal(s.mission.escaped.length,2);assert.ok(s.units.filter(u=>u.exited).length===2);
});
test('萨汉德任务先压制目标，再撤离；只完成打击不会提前结束',()=>{
  const s=E.createState('mantis88');assert.equal(E.issueMissionOrder(s,'strike').ok,false);E.start(s);assert.equal(E.issueMissionOrder(s,'withdraw').ok,false);
  const target=s.units.find(u=>u.missionRole==='mainTarget');target.hp=E.TYPES[target.type].hp*.4;E.step(s,1);assert.ok(s.mission.disabled);assert.equal(target.autoEngage,false);assert.equal(target.speed,0);assert.equal(s.phase,'running');assert.ok(E.issueMissionOrder(s,'withdraw').ok);
  const flag=s.units.find(u=>u.missionRole==='flagship');Object.assign(flag,{...missionZone(s),route:[]});E.step(s,1);assert.equal(s.result,'victory');
});
test('指挥舰或运输船损失会按任务条件失败',()=>{
  for(const [scenario,role] of [['mantis88','flagship'],['sanCarlos82','transport']]){const s=E.createState(scenario);E.start(s);s.units.find(u=>u.missionRole===role).hp=0;E.step(s,1);assert.equal(s.result,'defeat');}
});
test('运输船必须连续保持锚地卸载，驶离会重置计时',()=>{
  const s=E.createState('sanCarlos82');E.start(s);const boats=s.units.filter(u=>u.missionRole==='transport');for(const u of boats)Object.assign(u,{...missionZone(s),speed:0,route:[]});run(s,60);assert.equal(s.mission.unload,60);
  boats[0].x-=2;E.step(s,1);assert.equal(s.mission.unload,0);assert.equal(s.phase,'running');
});
test('历史任务时限到达会失败，不会无限等待弹药耗尽后的僵局',()=>{
  const s=E.createState('bubiyan91');E.start(s);s.time=E.SCENARIOS[s.scenario].duration-1;E.step(s,1);assert.equal(s.result,'defeat');assert.match(s.mission.reason,/时间/);
});
test('历史任务完整合法指令推演均可完成，保留非歼灭胜利条件',()=>{
  for(const scenario of scenarios){const s=E.createState(scenario);E.start(s);assert.ok(E.issueMissionOrder(s,E.SCENARIOS[scenario].orderKey).ok);let withdrew=false;
    while(s.phase==='running'&&s.time<E.SCENARIOS[scenario].duration){E.step(s,15);if(scenario==='mantis88'&&s.mission.disabled&&!withdrew){assert.ok(E.issueMissionOrder(s,'withdraw').ok);withdrew=true;}}
    assert.equal(s.result,'victory',`${scenario}: ${s.mission.reason}`);assert.ok(s.mission.score>=60&&s.mission.score<=100);assert.ok(E.historicalObjectives(s).every(o=>o.done));
    const loaded=E.deserialize(E.serialize(s));assert.equal(loaded.result,'victory');assert.equal(loaded.mission.score,s.mission.score);
  }
});
test('历史任务存档拒绝坏目标引用与伪造波次，地图从剧本派生',()=>{
  const s=E.createState('mantis88'),raw=JSON.parse(E.serialize(s));raw.mapId='bubiyan';assert.equal(E.deserialize(JSON.stringify(raw)).mapId,'hormuz');
  raw.mission.waves=['not-a-wave'];assert.throws(()=>E.deserialize(JSON.stringify(raw)));raw.mission.waves=[];raw.units[0].missionRole=null;assert.throws(()=>E.deserialize(JSON.stringify(raw)));
});
test('轻型半主动反舰弹采用平台弹头，不会误用重型反舰弹伤害',()=>{
  const s=E.createState('sandbox');s.units=[];s.budget=s.redBudget=200;
  const blue=E.addUnit(s,'strikeHelicopter','blue',{x:90,y:90}).unit,red=E.addUnit(s,'missileBoat','red',{x:95,y:90}).unit;
  blue.radar=true;blue.speed=red.speed=0;red.autoDefense=red.autoEngage=red.radar=red.esm=false;E.start(s);E.step(s,12);assert.ok(E.fire(s,blue.id,red.id,'asm').ok);s.seed=1;E.step(s,35);assert.equal(red.hp,12);
});
test('自由落体炸弹不触发导弹拦截，年代型战斗机不携带现代主动空空弹',()=>{
  const s=E.createState('sandbox');s.units=[];s.budget=s.redBudget=200;const blue=E.addUnit(s,'destroyer','blue',{x:90,y:90}).unit,red=E.addUnit(s,'lightAttack1982','red',{x:94,y:90}).unit;red.x=91.2;
  blue.radar=true;red.radar=false;red.autoEngage=false;red.speed=0;E.start(s);E.step(s,12);const ammo=blue.weapons.sam;assert.ok(E.fire(s,red.id,blue.id,'bomb').ok);E.step(s,2);assert.equal(blue.weapons.sam,ammo);assert.equal(s.missiles.some(m=>m.targetKind==='missile'),false);
  assert.equal(E.TYPES.seaHarrier.weapons.aam,0);assert.equal(E.TYPES.seaHarrier.weapons.ir,4);
});
test('v2 战局升级保留旧弹药，新年代武器默认为零',()=>{
  const s=E.deserialize(readFileSync(new URL('./fixtures/legacy-v2.json',import.meta.url),'utf8'));assert.equal(s.version,5);assert.equal(s.scenario,'strait');assert.equal(s.units[0].weapons.asm,8);assert.equal(s.units[0].weapons.ir,0);assert.equal(s.units[0].weapons.bomb,0);assert.equal(s.paused,true);
});
