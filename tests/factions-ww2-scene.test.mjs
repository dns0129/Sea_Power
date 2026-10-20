import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../dist/engine.js?v=0.13.1';
import {briefingIntel,briefingChart,missionGoals,scenarioBrief} from '../dist/scenario-flow.js?v=0.13.1';
import {seaSnapshot,sceneUnit,MODEL_PROFILES} from '../dist/sea-scene-data.js?v=0.13.1';
import {METRES_PER_NM,modelTransform,modelLength,sceneHeading} from '../dist/scene-coordinates.js?v=0.13.1';
import {prepareModel} from '../dist/sea-view.js?v=0.13.1';
import {missionZone} from '../dist/historical-missions.js?v=0.13.1';
import {GLTFLoader} from '../dist/vendor/three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from '../dist/vendor/three/three.module.js';

function quiet(s){
  for(const u of s.units){u.autoEngage=u.autoDefense=false;u.route=[];u.commandMode='manual';u.nextDecision=u.nextDeckDecision=1e6;u.speed=0;}
  return s;
}
function duel(blueType='ww2_us_destroyer',redType='ww2_jp_destroyer'){
  const s=E.createState('ww2sandbox');E.configureWW2Sandbox(s,'empty');
  const blue=E.addUnit(s,blueType,'blue',{x:65,y:100}).unit;
  const red=E.addUnit(s,redType,'red',{x:75,y:100}).unit;
  assert.ok(E.start(s).ok);quiet(s);red.x=66;E.scan(s);return {s,blue,red};
}

test('每个剧本均可选择双方，开战后只指挥自己的单位，增援归所属玩家',()=>{
  for(const scenario of Object.keys(E.SCENARIOS))for(const side of ['blue','red']){
    const s=E.createState(scenario);assert.ok(E.setPlayerSide(s,side).ok);
    if(E.isAutoBattle(s))E.configureAutoBattle(s,{control:'player'});
    assert.ok(E.start(s).ok,`${scenario} ${side}`);
    if(scenario==='sanCarlos82'&&side==='red')E.step(s,120);
    const own=s.units.find(u=>u.side===side&&u.hp>0&&E.TYPES[u.type].domain!=='land');
    const enemy=s.units.find(u=>u.side!==side&&u.hp>0&&E.TYPES[u.type].domain!=='land');
    assert.ok(own,`${scenario} ${side} own unit`);
    assert.ok(E.setSpeed(s,own.id,E.maxSpeed(own)*.7).ok,`${scenario} ${side} control`);
    if(enemy)assert.equal(E.setSpeed(s,enemy.id,1).ok,false);
    assert.equal(E.setPlayerSide(s,E.opposingSide(side)).ok,false,'running side is fixed');
    if(scenario==='sanCarlos82'&&side==='red')assert.equal(own.autoEngage,false);
  }
});

test('红方部署使用自己的预算和区域，新加入的己方单位默认等待玩家下令',()=>{
  const s=E.createState('strait');E.setPlayerSide(s,'red');
  const before=[s.budget,s.redBudget],r=E.addUnit(s,'destroyer','red',{x:190,y:110});
  assert.ok(r.ok);assert.equal(r.unit.autoEngage,false);
  assert.deepEqual([s.budget,s.redBudget],[before[0],before[1]-E.TYPES.destroyer.cost]);
  assert.equal(E.addUnit(s,'destroyer','red',{x:80,y:120}).ok,false);
  assert.equal(E.addUnit(s,'destroyer','blue',{x:90,y:120}).ok,false);
  assert.ok(E.removeUnit(s,r.unit.id));assert.deepEqual([s.budget,s.redBudget],before);
  assert.match(scenarioBrief(s),/摧毁全部蓝方战斗单位/);
  assert.doesNotMatch(scenarioBrief(s),/摧毁全部红方/);
});

test('反向历史任务由原蓝方推进目标，双方 AI 都保留玩家手动航线',()=>{
  const history=E.createState('mantis88');E.setPlayerSide(history,'red');E.start(history);
  assert.ok(history.mission.orders.includes('strike'));
  assert.ok(history.units.some(u=>u.side==='blue'&&u.route.length&&u.autoEngage));
  for(const scenario of ['strait','midway42','ww2sandbox','autobattle']){
    const s=E.createState(scenario);E.setPlayerSide(s,'red');
    if(E.isAutoBattle(s))E.configureAutoBattle(s,{control:'player'});
    E.start(s);const own=s.units.find(u=>u.side==='red'&&E.TYPES[u.type].domain==='surface');
    const goal={x:own.x,y:own.y+1};assert.ok(E.setRoute(s,own.id,goal).ok);
    E.step(s,16);assert.deepEqual(own.route,[goal],scenario);
    if(scenario==='midway42')assert.ok(s.units.some(u=>u.side==='blue'&&u.originDeck&&u.id.slice(1)>22),'opponent launches aircraft');
  }
});

test('歼灭、历史任务和自动对战的胜败均按所扮演阵营结算',()=>{
  for(const side of ['blue','red']){
    const s=E.createState('strait');E.setPlayerSide(s,side);E.start(s);
    for(const u of s.units.filter(u=>u.side==='blue'))u.hp=0;
    E.checkOutcome(s);assert.equal(s.result,side==='red'?'victory':'defeat');
    const auto=E.createAutoBattle();E.setPlayerSide(auto,side);E.configureAutoBattle(auto,{control:'player'});E.start(auto);
    for(const u of auto.units.filter(u=>u.side==='blue'))u.hp=0;
    E.checkOutcome(auto);assert.equal(auto.automation.winner,'red');assert.equal(auto.result,side==='red'?'victory':'defeat');
    for(const scenario of ['bubiyan91','mantis88','sanCarlos82','midway42']){
      const h=E.createState(scenario);E.setPlayerSide(h,side);E.start(h);quiet(h);
      if(scenario==='bubiyan91')h.mission.escaped=h.units.filter(u=>u.missionRole==='escape').slice(0,2).map(u=>{u.exited=true;return u.id;});
      if(scenario==='mantis88')h.units.find(u=>u.missionRole==='flagship').hp=0;
      if(scenario==='sanCarlos82')h.units.find(u=>u.missionRole==='transport').hp=0;
      if(scenario==='midway42')h.units.find(u=>u.type==='ww2_midway').hp=0;
      E.step(h,1);assert.equal(h.result,side==='red'?'victory':'defeat',scenario);
      assert.equal(E.deserialize(E.serialize(h)).result,h.result);
    }
  }
});

test('双方的简报与 3D 仅使用本方部署和粗略敌情，玩家模式不能开启全局观察',()=>{
  for(const scenario of Object.keys(E.SCENARIOS))for(const side of ['blue','red']){
    const s=E.createState(scenario);E.setPlayerSide(s,side);
    if(E.isAutoBattle(s))E.configureAutoBattle(s,{control:'player'});
    E.start(s);
    for(const u of s.units.filter(u=>u.side!==side))for(const key of ['x','y','hp','type','weapons'])Object.defineProperty(u,key,{get(){throw Error(`hidden ${key}`);}});
    assert.doesNotThrow(()=>briefingIntel(s),scenario);
    assert.doesNotThrow(()=>briefingChart(s,{deployment:true}),scenario);
    const snapshot=seaSnapshot(s,{all:true});assert.ok(snapshot.units.every(u=>u.side===side),scenario);
  }
  const japan=E.createState('midway42');E.setPlayerSide(japan,'red');
  assert.equal(briefingIntel(japan).own.flag,'🇯🇵');assert.equal(briefingIntel(japan).enemy.flag,'🇺🇸');
  assert.match(JSON.stringify(missionGoals(japan)),/保护至少两艘/);
});

test('合并的三个二战剧本均支持反向目标、胜败与存档，敌方 AI 可自主施放烟幕',()=>{
  for(const scenario of ['denmark41','guadalcanal42','samar44'])for(const result of ['victory','defeat']){
    const s=E.createState(scenario);E.setPlayerSide(s,'red');E.start(s);quiet(s);
    if(scenario==='denmark41'){
      if(result==='victory')s.units.filter(u=>u.side==='blue'&&E.TYPES[u.type].ww2Role==='battleship').forEach(u=>u.hp=0);
      else{s.units.find(u=>u.type==='ww2_bismarck').hp=400;s.mission.tracking=119;}
    }else if(scenario==='guadalcanal42')s.units.find(u=>u.type===(result==='victory'?'ww2_henderson':'ww2_kirishima')).hp=0;
    else{
      const cv=s.units.filter(u=>u.type==='ww2_escort_carrier');
      if(result==='victory')cv.slice(0,3).forEach(u=>u.hp=0);
      if(result==='defeat'){
        // Public scenario evacuation gate; never an enemy's hidden position.
        const gate=missionZone(s);cv.slice(0,4).forEach(u=>{u.x=gate.x;u.y=gate.y;});
      }
    }
    E.step(s,1);assert.equal(s.result,result,scenario);assert.equal(E.deserialize(E.serialize(s)).result,result);
    assert.ok(missionGoals(s).some(g=>g[0].includes(scenario==='denmark41'?'俾斯麦':scenario==='guadalcanal42'?'亨德森':'护航航母')));
  }
  const s=E.createState('samar44');E.setPlayerSide(s,'red');E.start(s);quiet(s);
  const ship=s.units.find(u=>u.type==='ww2_fletcher'),enemy=s.units.find(u=>u.type==='ww2_jp_torpedo_dd');
  Object.assign(ship,{x:65,y:100,hp:E.TYPES[ship.type].hp*.44,commandMode:'mission',autoDefense:true});
  Object.assign(enemy,{x:67,y:100});E.scan(s);const charges=ship.smokeCharges;
  E.step(s,8);assert.equal(ship.smokeCharges,charges-1);assert.ok(s.smoke.some(c=>c.owner===ship.id));
});

test('高射炮按已识别类别筛选，自动防空也遵守鱼雷机优先策略',()=>{
  const {s,blue,red}=duel('ww2_us_destroyer','ww2_a6m');
  const type=red.type;
  for(const [policy,classification,allowed] of [['fighters','fighter',true],['fighters','torpedo',false],['torpedo','fighter',false],['torpedo','torpedo',true],['attack','dive',true],['attack','fighter',false],['fighters',null,false],['all',null,true]]){
    s.contacts.blue[red.id].classification=classification;assert.ok(E.setAAPriority(s,blue.id,policy).ok);
    Object.defineProperty(red,'type',{configurable:true,get(){throw Error('AA must use observed classification');}});
    assert.equal(E.fireCheck(s,blue.id,red.id,'point').ok,allowed,`${policy} ${classification}`);
    Object.defineProperty(red,'type',{configurable:true,writable:true,value:type});
  }
  // The nearer fighter must not consume flak reserved for a torpedo squadron.
  const extra=structuredClone(red);extra.id=`u${++s.nextId}`;extra.type='ww2_b5n';extra.x=66.4;extra.y=100;
  extra.hp=E.TYPES[extra.type].hp;extra.weapons={...E.TYPES[extra.type].weapons};s.units.push(extra);E.scan(s);
  E.setAAPriority(s,blue.id,'torpedo');blue.autoDefense=true;E.step(s,1);
  assert.ok(s.missiles.some(m=>m.shooter===blue.id&&m.weapon==='point'&&m.target===extra.id));
  assert.ok(!s.missiles.some(m=>m.shooter===blue.id&&m.target===red.id));
});

test('二战驱逐舰和潜艇使用有限直航鱼雷，舰艇发射不受空投低空限制',()=>{
  for(const type of ['ww2_us_destroyer','ww2_gato']){
    const {s,blue,red}=duel(type);red.heading=90;red.speed=20;red.route=[{x:100,y:100}];E.scan(s);
    const ammo=blue.weapons.torpedo;assert.ok(E.fire(s,blue.id,red.id,'torpedo').ok,type);
    const shot=s.missiles.at(-1),aim={...shot.aim};assert.equal(shot.guidance,'inertial');assert.equal(E.projectileStats(s,shot).seeker,0);
    assert.ok(aim.x>red.x);assert.equal(blue.weapons.torpedo,ammo-1);
    red.y+=3;E.step(s,1);assert.deepEqual(shot.aim,aim);
    assert.match(E.fireCheck(s,blue.id,red.id,'torpedo').error,/冷却|目视|航迹/);
  }
  for(const type of ['ww2_north_carolina','ww2_yamato']){assert.equal(E.TYPES[type].weapons.torpedo,0);assert.ok(E.TYPES[type].weapons.gun>0);}
});

test('潜艇浮航、潜望镜与深潜影响武器、航速、电池和可见性',()=>{
  const {s,blue,red}=duel('ww2_gato');
  assert.equal(E.maxSpeed(blue),8);assert.ok(E.fireCheck(s,blue.id,red.id,'torpedo').ok);
  assert.match(E.fireCheck(s,blue.id,red.id,'gun').error,/浮航/);
  E.setDepth(s,blue.id,'deep');assert.match(E.fireCheck(s,blue.id,red.id,'torpedo').error,/潜望镜/);
  assert.equal(sceneUnit(blue).height,-35/METRES_PER_NM);
  blue.battery=1;E.step(s,1);assert.equal(blue.depth,'surfaced');assert.equal(blue.battery,0);
  E.step(s,2);assert.equal(blue.battery,4);assert.equal(E.domainOf(blue),'surface');assert.equal(E.maxSpeed(blue),20);
  E.scan(s);assert.ok(E.fireCheck(s,blue.id,red.id,'gun').ok);
  E.setSpeed(s,blue.id,20);E.setDepth(s,blue.id,'periscope');assert.equal(blue.speed,8);
  blue.speed=0;E.setRoute(s,blue.id,{x:65,y:101});assert.ok(blue.speed<=8);blue.route=[];
  red.sonar=false;s.contacts.red={};E.scan(s);assert.equal(s.contacts.red[blue.id].source,'目视');
  E.setDepth(s,blue.id,'deep');s.contacts.red={};E.scan(s);assert.equal(s.contacts.red[blue.id],undefined);
  assert.equal(s.contacts.blue[red.id].source,'声呐','deep submarine receives only its own sonar fixes');
});

test('深潜 AI 潜艇不会因其他舰船的无线电报告擅自升起潜望镜',()=>{
  const s=E.createState('ww2sandbox');E.configureWW2Sandbox(s,'subhunt');E.start(s);quiet(s);
  const sub=s.units.find(u=>u.type==='ww2_i_boat'),observer=s.units.find(u=>u.type==='ww2_jp_destroyer'),target=s.units.find(u=>u.type==='ww2_us_destroyer');
  target.x=65;target.y=100;observer.x=66;observer.y=100;sub.depth='deep';sub.sonar=false;
  E.scan(s);assert.ok(s.contacts.red[target.id]);assert.equal(s.contacts.red[target.id].observations[sub.id],undefined);
  sub.commandMode='auto';sub.nextDecision=0;E.step(s,8);assert.equal(sub.depth,'deep');
  sub.x=66;sub.y=100;sub.sonar=true;E.scan(s);E.step(s,8);assert.equal(sub.depth,'periscope');
});

test('驱逐舰需要本舰声呐确认，近距离深水炸弹能够损伤深潜潜艇',()=>{
  const {s,blue,red}=duel('ww2_us_destroyer','ww2_i_boat');red.x=65.4;red.depth='deep';E.scan(s);
  assert.equal(s.contacts.blue[red.id].source,'声呐');assert.ok(E.fireCheck(s,blue.id,red.id,'depthCharge').ok);
  const before=red.hp,ammo=blue.weapons.depthCharge;s.seed=1;E.fire(s,blue.id,red.id,'depthCharge');E.step(s,6);
  assert.ok(red.hp<before);assert.equal(blue.weapons.depthCharge,ammo-1);
  blue.sonar=false;s.contacts.blue={};E.scan(s);assert.equal(E.fireCheck(s,blue.id,red.id,'depthCharge').ok,false);
});

test('二战自定义预案遵守年代、国别与预算，空白预案须部署后开战并可继续存档',()=>{
  for(const preset of Object.keys(E.WW2_PRESETS)){
    const s=E.createState('ww2sandbox');E.setPlayerSide(s,'red');assert.ok(E.configureWW2Sandbox(s,preset).ok);
    for(const side of ['blue','red']){
      const own=s.units.filter(u=>u.side===side);assert.equal(s[side==='blue'?'budget':'redBudget'],600-own.reduce((sum,u)=>sum+E.TYPES[u.type].cost,0));
      for(const u of own){assert.equal(E.TYPES[u.type].era,'ww2');assert.equal(E.TYPES[u.type].country,side==='blue'?'美国':'日本');}
    }
    assert.equal(E.addUnit(s,'cvn_ford','red',{x:150,y:80}).ok,false);
    assert.equal(E.addUnit(s,'ww2_gato','red',{x:150,y:80}).ok,false);
    assert.equal(E.start(s).ok,preset!=='empty');
    if(preset!=='empty'){E.issueMissionOrder(s,'plan');E.step(s,16);}
    const restored=E.deserialize(E.serialize(s));assert.equal(restored.ww2Preset,preset);assert.equal(restored.playerSide,'red');
    assert.deepEqual(restored.mission.orders,s.mission.orders);assert.equal(restored.units.length,s.units.length);assert.equal(restored.version,9);
  }
});

test('3D 坐标、海拔与航向共用海里尺度，舰机尺寸比例不会被独立夸大',()=>{
  const item={x:71,y:113,height:3500/METRES_PER_NM,heading:90,lengthMetres:222};
  const profile=MODEL_PROFILES['ww2-cruiser'],actual=modelTransform(item,profile,188);
  assert.deepEqual(actual.position,{x:71,y:3500/METRES_PER_NM,z:113});assert.ok(Math.abs(actual.scale*188-222/METRES_PER_NM)<1e-12);
  const north=new Vector3(0,0,-1).applyAxisAngle(new Vector3(0,1,0),sceneHeading(0));
  const east=new Vector3(0,0,-1).applyAxisAngle(new Vector3(0,1,0),sceneHeading(90));
  assert.ok(north.distanceTo(new Vector3(0,0,-1))<1e-9);assert.ok(east.distanceTo(new Vector3(1,0,0))<1e-9);
  assert.equal(modelLength(item,profile,'tactical')/modelLength(item,profile),12);
  assert.ok(Math.abs(modelLength({lengthMetres:222},profile)/modelLength({lengthMetres:9},MODEL_PROFILES['ww2-fighter'])-222/9)<1e-9);
});

test('实际 GLB 的几何中心归零，缩放后舰长与指定米制长度一致',async()=>{
  for(const model of ['carrier','ww2-cruiser','ww2-destroyer','submarine']){
    const bytes=fs.readFileSync(new URL(`../dist/assets/models/generic-${model}.glb`,import.meta.url));
    const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const body=prepareModel(gltf.scene),transform=modelTransform({x:0,y:0,lengthMetres:222},MODEL_PROFILES[model],body.userData.sourceLength);
    body.scale.setScalar(transform.scale);body.updateMatrixWorld(true);
    const box=new Box3().setFromObject(body),center=box.getCenter(new Vector3());
    assert.ok(Math.abs(center.x)<1e-8&&Math.abs(center.z)<1e-8,model);
    assert.ok(Math.abs(box.getSize(new Vector3()).z-222/METRES_PER_NM)<1e-8,model);
    body.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
  }
});

test('显示主题不影响战斗参数，阵营、AA、潜航和比例可存档，旧档保留默认值',()=>{
  const {s,blue}=duel('ww2_gato');const before=structuredClone(s.units);
  assert.ok(E.setPresentation(s,{chartTheme:'light',modelScale:'tactical'}).ok);assert.deepEqual(s.units,before);
  assert.equal(E.setPresentation(s,{chartTheme:'invalid'}).ok,false);
  E.setDepth(s,blue.id,'surfaced');blue.battery=678;
  const saved=E.deserialize(E.serialize(s));assert.equal(saved.chartTheme,'light');assert.equal(saved.modelScale,'tactical');
  assert.equal(saved.units[0].depth,'surfaced');assert.equal(saved.units[0].battery,678);
  const aa=E.createState('midway42');E.setPlayerSide(aa,'red');E.setAAPriority(aa,aa.units.find(u=>u.side==='red').id,'torpedo');
  assert.equal(E.deserialize(E.serialize(aa)).units.find(u=>u.side==='red').aaPriority,'torpedo');
  const legacy=JSON.parse(E.serialize(E.createState('midway42')));legacy.version=8;
  delete legacy.playerSide;delete legacy.chartTheme;delete legacy.modelScale;
  for(const u of legacy.units){delete u.aaPriority;delete u.battery;delete u.weapons.depthCharge;}
  const loaded=E.deserialize(JSON.stringify(legacy));assert.equal(loaded.playerSide,'blue');assert.equal(loaded.chartTheme,'dark');assert.equal(loaded.modelScale,'realistic');
  for(const [key,value] of [['playerSide','green'],['chartTheme','unknown'],['modelScale','huge']]){
    const raw=JSON.parse(E.serialize(saved));raw[key]=value;assert.throws(()=>E.deserialize(JSON.stringify(raw)));
  }
});
