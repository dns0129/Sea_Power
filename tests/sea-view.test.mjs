import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState,createAutoBattle,TYPES,SCENARIOS,serialize} from '../dist/engine.js?v=0.13.0';
import {MODEL_PROFILES,modelFor,seaSnapshot} from '../dist/sea-scene-data.js?v=0.13.0';
import {GLTFLoader} from '../dist/vendor/three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from '../dist/vendor/three/three.module.js';

test('所有装备类型都映射到可替换的通用模型，舰船与航空保持不同外形',()=>{
  for(const type of Object.keys(TYPES))assert.ok(MODEL_PROFILES[modelFor(type)],type);
  for(const [type,model] of Object.entries({cvn_ford:'carrier',ddg_burke3:'destroyer',ffg_mogami:'frigate',aor901:'supply',submarine:'submarine',fighter:'fighter',awacs:'awacs',helicopter:'helicopter',airbase:'facility'}))assert.equal(modelFor(type),model);
});

test('手动战局中的 3D 数据不读取隐藏敌方的位置、型号、损伤或装备',()=>{
  for(const scenario of ['modernlab','strait','bubiyan91','mantis88','sanCarlos82','midway42']){
    const state=createState(scenario);state.phase='running';
    for(const unit of state.units.filter(u=>u.side==='red')){
      for(const key of ['x','y','type','hp','weapons','airwing'])Object.defineProperty(unit,key,{get(){throw Error(`读取隐藏敌方 ${key}`);}});
    }
    // An 'all' request must never grant manual players global-observer access.
    const picture=seaSnapshot(state,{all:true});
    assert.ok(picture.units.every(u=>u.side==='blue'));
  }
});

test('接触只使用侦察坐标，失效航迹不暴露真实单位参数',()=>{
  const state=createState('strait');state.phase='running';state.time=30;
  const enemy=state.units.find(u=>u.side==='red');
  const contact={id:enemy.id,label:'水面接触 04',x:115,y:82,time:10,domain:'surface',quality:'class',source:'电子支援'};
  state.contacts.blue[enemy.id]=contact;
  for(const key of ['x','y','type','hp','weapons'])Object.defineProperty(enemy,key,{get(){throw Error('接触反查真实单位');}});
  const picture=seaSnapshot(state);
  assert.equal(picture.contacts.length,1);
  const observed=picture.contacts[0];
  assert.deepEqual([observed.x,observed.y,observed.stale,observed.age],[115,82,true,20]);
  for(const key of ['type','model','hp','weapons','airwing','heading'])assert.equal(Object.hasOwn(observed,key),false,key);
});

test('AI 的全局与阵营观察分别显示授权范围，部署阶段可以查看双方',()=>{
  const state=createAutoBattle('surface');
  assert.ok(seaSnapshot(state).units.some(u=>u.side==='red'));
  state.phase='running';
  assert.ok(seaSnapshot(state,{side:'blue'}).units.every(u=>u.side==='blue'));
  assert.ok(seaSnapshot(state,{side:'red'}).units.every(u=>u.side==='red'));
  assert.equal(seaSnapshot(state,{all:true}).units.length,state.units.filter(u=>u.hp>0).length);
});

test('3D 展示数据不改变战局，损失或退出单位不再显示',()=>{
  for(const scenario of Object.keys(SCENARIOS)){
    const state=createState(scenario),before=serialize(state);
    seaSnapshot(state);assert.equal(serialize(state),before,scenario);
  }
  const state=createState('modernlab');state.units[0].hp=0;state.units[1].exited=true;
  const picture=seaSnapshot(state);
  assert.ok(!picture.units.some(u=>['u1','u2'].includes(u.id)));
});

test('通用资产为有效 GLB 2.0 实体网格，带材质与可编辑的命名零件',()=>{
  const base=new URL('../dist/assets/models/',import.meta.url);
  const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',base)));
  const ww2=JSON.parse(fs.readFileSync(new URL('ww2-manifest.json',base)));
  Object.assign(manifest.models,ww2.models);
  assert.deepEqual(Object.keys(manifest.models).sort(),Object.keys(MODEL_PROFILES).sort());
  for(const [key,model] of Object.entries(manifest.models)){
    const buffer=fs.readFileSync(new URL(model.file,base));
    assert.equal(buffer.readUInt32LE(0),0x46546c67,key);
    assert.equal(buffer.readUInt32LE(4),2,key);assert.equal(buffer.readUInt32LE(8),buffer.length,key);
    assert.equal(buffer.readUInt32LE(16),0x4e4f534a,key);
    const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
    assert.ok(json.meshes.length>=10,key);assert.ok(json.materials.length>=3,key);
    assert.ok(json.nodes.some(n=>n.name.startsWith(key+'_')),key);
    assert.ok(json.accessors.some(a=>a.type==='VEC3'&&a.count>30),key);
    assert.ok(json.accessors.filter(a=>a.min||a.max).every(a=>[...(a.min||[]),...(a.max||[])].every(Number.isFinite)),key);
    assert.ok(json.buffers.every(b=>!b.uri),'models must work without external textures/buffers');
    const names=json.nodes.map(n=>n.name).join(' ');
    if(['carrier','destroyer','frigate','supply'].includes(key))assert.match(names,/_Hull/);
    if(key==='fighter')assert.match(names,/_Canopy/);
    if(key==='helicopter')assert.match(names,/_MainRotor/);
  }
  assert.ok(fs.statSync(new URL(manifest.source,base)).size>100000,'editable Blender library');
});

test('实际加载所有 GLB，导出原点和米制尺寸可供场景直接使用',async()=>{
  const loader=new GLTFLoader();
  for(const [key,profile] of Object.entries(MODEL_PROFILES)){
    const bytes=fs.readFileSync(new URL(`../dist/assets/models/generic-${key}.glb`,import.meta.url));
    const model=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const box=new Box3().setFromObject(model.scene),size=box.getSize(new Vector3()),centre=box.getCenter(new Vector3());
    assert.ok(!box.isEmpty(),key);
    assert.ok([...size.toArray(),...centre.toArray()].every(Number.isFinite),key);
    assert.ok(size.z>profile.length*.7&&size.z<profile.length*1.2,`${key} length`);
    assert.ok(Math.abs(centre.x)<(key==='ww2-airfield'?profile.length*.2:1)&&Math.abs(centre.z)<profile.length*.15,`${key} origin`);
    assert.ok(size.x<profile.length*2&&size.y<profile.length,`${key} proportions`);
    model.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();[].concat(o.material).forEach(m=>m.dispose());}});
  }
});
