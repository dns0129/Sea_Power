import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/addons/controls/OrbitControls.js';
import {GLTFLoader} from './vendor/three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from './vendor/three/addons/utils/BufferGeometryUtils.js';
import {MODEL_PROFILES} from './sea-scene-data.js?v=0.12.0';
import {unitCommandCard,unitCombatStatus} from './unit-command-ui.js?v=0.12.0';

const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=s=>[Math.floor(s/3600),Math.floor(s/60)%60,Math.floor(s)%60].map(n=>String(n).padStart(2,'0')).join(':');
const domainName={surface:'水面舰艇',sub:'水下单位 · 海面示意',air:'航空单位',land:'岸基单位'};
const codes={carrier:'CV',destroyer:'DDG',frigate:'FFG',supply:'AOR',submarine:'SSN',fighter:'JET',bomber:'ATK',awacs:'AEW',helicopter:'HEL',facility:'BASE','ww2-carrier':'CV','ww2-battleship':'BB','ww2-cruiser':'CA','ww2-destroyer':'DD','ww2-fighter':'FTR','ww2-dive':'DB','ww2-torpedo':'TB','ww2-scout':'SCT','ww2-airfield':'BASE'};
const asset=key=>new URL(`./assets/models/generic-${key}.glb`,import.meta.url).href;

const skyVertex=`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const skyFragment=`
  varying vec3 vDirection;uniform vec3 sunDirection;uniform float night;
  void main(){
    vec3 d=normalize(vDirection);float h=max(d.y,0.);
    vec3 color=mix(vec3(.36,.49,.58),vec3(.065,.16,.29),pow(h,.48));
    float sun=max(dot(d,sunDirection),0.);
    color+=vec3(1.,.84,.62)*pow(sun,4200.)*2.5;
    color+=vec3(.14,.11,.07)*pow(sun,12.);
    float cloud=sin(d.x*19.+d.z*7.)*sin(d.z*23.-d.x*4.);
    color+=vec3(.045)*smoothstep(.28,.8,cloud)*smoothstep(.05,.28,h)*(1.-smoothstep(.28,.58,h));
    color=mix(color,color*vec3(.12,.17,.29),night);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const waterVertex=`
  uniform float time;uniform float storm;varying vec3 vWorld;
  void main(){
    vec3 p=position;
    p.z+=sin(p.x*.7+time*.65)*cos(p.y*.51+time*.33)*(.035+storm*.055);
    vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;
    gl_Position=projectionMatrix*viewMatrix*world;
  }`;
const waterFragment=`
  uniform float time;uniform float storm;uniform float night;uniform vec3 sunDirection;varying vec3 vWorld;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
  }
  float wave(vec2 p){
    vec2 drift=vec2(time*.14,-time*.07);
    vec2 q=mat2(.8,-.6,.6,.8)*p;
    return sin(p.x*.8+p.y*.35+time*.65)*.21
      +noise(p*3.3+drift)*.37+noise(q*8.7-drift)*.13
      +noise(p*22.+drift*1.3)*.045;
  }
  void main(){
    vec2 p=vWorld.xz;float eps=.018;float w=wave(p);
    vec3 normal=normalize(vec3((w-wave(p+vec2(eps,0.)))*(.95+storm*.9),.16,
      (w-wave(p+vec2(0.,eps)))*(.95+storm*.9)));
    vec3 eye=normalize(cameraPosition-vWorld);
    float fresnel=pow(1.-max(dot(eye,normal),0.),3.);
    float dist=distance(cameraPosition,vWorld);
    vec3 deep=mix(vec3(.004,.024,.041),vec3(.008,.068,.087),clamp(w*.9+.1,0.,1.));
    vec3 sky=vec3(.18,.29,.37);
    vec3 color=mix(deep,sky,.04+fresnel*.64);
    float spec=pow(max(dot(normal,normalize(eye+sunDirection)),0.),180.);
    color+=vec3(1.,.87,.65)*spec*.23;
    float sparkle=pow(max(dot(normal,normalize(eye+sunDirection)),0.),900.);
    color+=sparkle*.16;
    float crest=smoothstep(.63,.73,w)*(.01+storm*.1);
    color+=vec3(.5,.65,.68)*crest;
    color=mix(color,vec3(.29,.42,.51),1.-exp(-dist*.0016));
    color*=1.-storm*.17;
    color=mix(color,color*vec3(.12,.17,.29),night);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const wakeVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const wakeFragment=`
  varying vec2 vUv;uniform float time;uniform float strength;
  void main(){
    float aft=1.-vUv.y;float width=.08+aft*.4;
    float edge=1.-smoothstep(width*.65,width,abs(vUv.x-.5));
    float streak=.5+.5*sin(vUv.y*95.+time*6.+sin(vUv.x*61.)*2.);
    float foam=edge*pow(1.-aft,1.8)*(.3+streak*.35)*strength;
    gl_FragColor=vec4(.75,.88,.87,foam);
  }`;

// Merge static components per material for inexpensive fleet rendering. The
// Blender source keeps each part editable; rotors/radars retain separate pivots.
function prepareModel(source){
  const group=new THREE.Group(),batches=new Map();source.updateMatrixWorld(true);
  source.traverse(node=>{
    if(!node.isMesh)return;
    const material=node.material;material.side=THREE.DoubleSide;material.envMapIntensity=.6;
    const geometry=(node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone());
    for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    if(/MainRotor|RadarSpinner|Propeller/.test(node.name)){
      const pivot=new THREE.Group();pivot.name=`motion_${node.name}`;
      const pos=new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
      geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-pos.x,-pos.y,-pos.z).multiply(node.matrixWorld));
      const mesh=new THREE.Mesh(geometry,material);pivot.position.copy(pos);pivot.add(mesh);group.add(pivot);
    }else{
      geometry.applyMatrix4(node.matrixWorld);
      if(!batches.has(material.uuid))batches.set(material.uuid,{material,geometries:[]});
      batches.get(material.uuid).geometries.push(geometry);
    }
  });
  for(const {material,geometries} of batches.values()){
    const merged=mergeGeometries(geometries,false);
    if(!merged)throw Error('模型几何合并失败');
    group.add(new THREE.Mesh(merged,material));geometries.forEach(g=>g.dispose());
  }
  return group;
}

export async function createSeaView({root,onSelect,onMap,onPlay,onSpeed,onHome,onBrief,onSave,onError,onMissionOrder=()=>{},onLaunchAircraft=()=>{},onDeploySmoke=()=>{},onUnitCommand=()=>false,onProgress=()=>{}}){
  root.className='sea-view';root.dataset.details='open';
  root.innerHTML=`<canvas tabindex="0" aria-label="3D 海面：点击舰船或飞机查看详情，左键拖动旋转，右键平移，滚轮缩放；触屏单指旋转、双指缩放。"></canvas>
    <div class="sea-labels"></div>
    <header class="sea-topbar"><span class="sea-brand">SEA POWER</span><div class="sea-title"><span>3D 海面</span><small data-sea-title></small></div><nav aria-label="海面视图导航"><button data-sea-action="home">主页</button><button data-sea-action="brief">任务简报</button><button data-sea-action="save">保存</button><button class="sea-map-button" data-sea-action="map">2D 战术海图 ↗</button></nav></header>
    <span class="sea-environment"></span>
    <button class="sea-roster-toggle sea-panel" data-sea-action="roster">编队列表 ☰</button>
    <aside class="sea-roster sea-panel" aria-label="3D 单位列表"><div class="sea-panel-heading"><span>海空编队</span><small data-sea-observer></small></div><div class="sea-ww2-task" hidden></div><div class="sea-roster-tabs"><button class="active" data-sea-list="fleet">单位</button><button data-sea-list="contacts">接触</button></div><div class="sea-roster-list"></div><div class="sea-roster-note">点击单位，拉近观察并查看详情。<br>敌方位置遵循当前视角的侦察情报。</div></aside>
    <button class="sea-ww2-mobile sea-panel" data-sea-order="plan" hidden>执行作战计划 ↗</button>
    <aside class="sea-details sea-panel" aria-label="选中单位详情"><div class="sea-details-head"></div><div class="sea-detail-tabs"><button class="active" data-sea-tab="status">状态</button><button data-sea-tab="equipment">装备</button><button data-sea-tab="model">模型</button></div><div class="sea-detail-content"></div><div class="sea-detail-foot"><button data-sea-action="closeup">近景观察</button><button data-sea-action="map">在海图中控制 →</button></div></aside>
    <button class="sea-show-details sea-panel" data-sea-action="details">单位详情 ↙</button>
    <div class="sea-gesture-hint">左键旋转 · 右键平移 · 滚轮缩放<span>通用示意模型 · 单位外观与高度采用显示比例</span></div>
    <div class="sea-status" role="status"></div>
    <nav class="sea-controls sea-panel" aria-label="镜头与推演控制"><button class="sea-play" data-sea-action="play" aria-label="开始推演">▶</button><div class="sea-clock-block"><time>00:00:00</time><small>推演暂停</small></div><select data-sea-speed aria-label="推演速度"><option value="1">1×</option><option value="10">10×</option><option value="30">30×</option><option value="120">120×</option></select><span class="sea-control-divider"></span><button data-sea-action="focus">定位单位</button><button data-sea-action="overview">编队全景</button><button data-sea-action="follow" aria-pressed="true" class="active">跟随</button></nav>`;
  const $=selector=>root.querySelector(selector),canvas=$('canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
  catch{root.innerHTML='';throw Error('当前设备未能启用 WebGL 3D');}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#91b0c1',.0015);
  const camera=new THREE.PerspectiveCamera(42,1,.06,8000);
  camera.position.set(75,7,113);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=1.8;controls.maxDistance=1800;
  controls.minPolarAngle=.06;controls.maxPolarAngle=Math.PI/2-.025;controls.screenSpacePanning=false;
  controls.target.set(65,0,100);controls.zoomSpeed=.8;controls.rotateSpeed=.65;
  const sunDirection=new THREE.Vector3(-.45,.52,-.72).normalize();
  const skyMaterial=new THREE.ShaderMaterial({vertexShader:skyVertex,fragmentShader:skyFragment,
    uniforms:{sunDirection:{value:sunDirection},night:{value:0}},side:THREE.BackSide,depthWrite:false});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(3500,32,16),skyMaterial);sky.frustumCulled=false;scene.add(sky);
  const ambient=new THREE.HemisphereLight('#d6e8f3','#2e5863',1.25);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#ffe8c9',2);sun.position.copy(sunDirection).multiplyScalar(100);scene.add(sun);
  const pmrem=new THREE.PMREMGenerator(renderer),envScene=new THREE.Scene();
  const envSky=new THREE.Mesh(new THREE.SphereGeometry(50,24,12),skyMaterial);envScene.add(envSky);
  const environment=pmrem.fromScene(envScene,.05,.1,100);scene.environment=environment.texture;pmrem.dispose();envSky.geometry.dispose();
  const waterMaterial=new THREE.ShaderMaterial({vertexShader:waterVertex,fragmentShader:waterFragment,
    uniforms:{time:{value:0},storm:{value:0},night:{value:0},sunDirection:{value:sunDirection}}});
  const ocean=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000,200,200),waterMaterial);
  ocean.rotation.x=-Math.PI/2;scene.add(ocean);
  const terrain=new THREE.Group();scene.add(terrain);
  const landMaterial=new THREE.MeshStandardMaterial({color:'#596761',roughness:1,metalness:0});
  const coastMaterial=new THREE.LineBasicMaterial({color:'#a0c4bb',transparent:true,opacity:.35});
  const library=new Map(),loader=new GLTFLoader();
  let loaded=0;
  try{
    await Promise.all(Object.keys(MODEL_PROFILES).map(async key=>{
      const gltf=await loader.loadAsync(asset(key));library.set(key,prepareModel(gltf.scene));
      // Source geometries can be released once the optimized library is built.
      gltf.scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
      onProgress(++loaded,Object.keys(MODEL_PROFILES).length);
    }));
  }catch(error){renderer.dispose();environment.dispose();throw Error(`通用模型加载失败：${error.message}`);}
  const actors=new Map(),labels=new Map(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const rounds=new Map(),splashes=new Map();
  const smokeMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:'#71818b',transparent:true,opacity:.42,depthWrite:false}),600);
  smokeMesh.count=0;smokeMesh.frustumCulled=false;scene.add(smokeMesh);const smokeTransform=new THREE.Object3D();
  const tracerGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,.13),new THREE.Vector3(0,0,-.13)]);
  const tracerMaterials={blue:new THREE.LineBasicMaterial({color:'#ffe4a3'}),red:new THREE.LineBasicMaterial({color:'#efb19b'})};
  const splashGeometry=new THREE.RingGeometry(.04,.12,18),splashMaterials={hit:new THREE.MeshBasicMaterial({color:'#ffbd77',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}),miss:new THREE.MeshBasicMaterial({color:'#d1e5e8',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false})};
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#a3e3ca',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false});
  const ring=new THREE.Mesh(new THREE.RingGeometry(1,1.013,100),ringMaterial);ring.rotation.x=-Math.PI/2;scene.add(ring);
  const selectionLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,1,0)]),new THREE.LineDashedMaterial({color:'#a3e3ca',dashSize:.13,gapSize:.09,transparent:true,opacity:.5}));selectionLine.computeLineDistances();scene.add(selectionLine);
  let snapshot=null,selectedKey=null,detailTab='status',listTab='fleet',follow=true,fly=null,lastFollow=null;
  let commandUnitId=null;const targetChoices=new Map();
  let previousLand=null,lastRoster='',lastHead='',lastBody='',lastPanel=0,firstFrame=true,active=false,disposed=false;
  const handlers=new AbortController();
  const resize=()=>{
    const rect=root.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6,Math.sqrt(2000000/(rect.width*rect.height))));
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;
    if(rect.width<=520&&root.dataset.details==='open')camera.setViewOffset(rect.width,rect.height,0,rect.height*.11,rect.width,rect.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);resize();
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();onError('3D 显示已中断，请重新打开 3D 海面');},{signal:handlers.signal});
  controls.addEventListener('start',()=>{fly=null;setFollow(false);});

  function setFollow(value){follow=value;const button=$('[data-sea-action="follow"]');button.classList.toggle('active',follow);button.setAttribute('aria-pressed',String(follow));lastFollow=null;}
  function allItems(){return snapshot?[...snapshot.units,...snapshot.contacts]:[];}
  function selectedItem(){return allItems().find(u=>u.id===selectedKey)||null;}
  function itemPoint(item){return new THREE.Vector3(item.x,item.height||0,item.y);}
  function flyTo(position,target){fly={position,target,start:performance.now(),fromPosition:camera.position.clone(),fromTarget:controls.target.clone()};}
  function focus(id,close=false){
    const item=allItems().find(u=>u.id===id);if(!item)return;
    const size=item.model?MODEL_PROFILES[item.model].size:2;
    const target=itemPoint(item).add(new THREE.Vector3(0,size*.06,0));
    const distance=(close?size*1.75:Math.max(size*2.55,7))/Math.min(1,Math.sqrt(camera.aspect/.9));
    const offset=new THREE.Vector3(1,.47,1.25).normalize().multiplyScalar(distance);
    flyTo(target.clone().add(offset),target);setFollow(true);lastFollow=itemPoint(item);
    $('.sea-status').textContent=item.contact?'接触位置来自侦察情报':`正在观察 · ${item.name}`;
  }
  function overview(){
    const items=allItems();if(!items.length)return;
    const box=new THREE.Box3();items.forEach(u=>box.expandByPoint(itemPoint(u)));
    const target=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3()),radius=Math.max(9,size.length()*.52);
    const aspect=Math.min(camera.aspect,1.5);
    const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.25/Math.min(1,aspect);
    flyTo(target.clone().add(new THREE.Vector3(.35,.87,1).normalize().multiplyScalar(distance)),target);
    setFollow(false);$('.sea-status').textContent='编队全景 · 点击单位可拉近观察';
  }
  function select(id){
    const item=allItems().find(u=>u.id===id);if(!item)return;
    selectedKey=id;root.dataset.details='open';root.classList.remove('roster-open');
    lastHead=lastBody=lastRoster='';resize();focus(id);onSelect(item);updatePanels();
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    event.stopPropagation();
    if(button.dataset.unitControl){onUnitCommand(button.dataset.controlUnit,button.dataset.unitControl);lastBody='';return;}
    if(button.dataset.unitLock){
      const id=button.dataset.unitLock,c=button.dataset.lockContact||root.querySelector(`[data-lock-choice="${id}"]`)?.value||targetChoices.get(id);
      if(onUnitCommand(id,'follow',c)){selectedKey=id;lastHead=lastBody='';}return;
    }
    if(button.dataset.seaUnit){select(button.dataset.seaUnit);return;}
    if(button.dataset.seaOrder){onMissionOrder(button.dataset.seaOrder);lastPanel=0;return;}
    if(button.dataset.seaSmoke){onDeploySmoke(button.dataset.seaSmoke);lastBody='';return;}
    if(button.dataset.seaLaunch){onLaunchAircraft(button.dataset.seaBase,button.dataset.seaLaunch);lastBody='';return;}
    if(button.dataset.seaTab){detailTab=button.dataset.seaTab;lastBody='';updatePanels();return;}
    if(button.dataset.seaList){listTab=button.dataset.seaList;lastRoster='';updatePanels();return;}
    const action=button.dataset.seaAction;
    if(action==='map')onMap();
    if(action==='home')onHome();
    if(action==='brief')onBrief();
    if(action==='save')onSave();
    if(action==='play')onPlay();
    if(action==='focus')focus(selectedKey);
    if(action==='closeup'){root.dataset.details='closed';focus(selectedKey,true);}
    if(action==='overview')overview();
    if(action==='follow'){setFollow(!follow);if(follow)focus(selectedKey);}
    if(action==='roster')root.classList.toggle('roster-open');
    if(action==='close-details')root.dataset.details='closed';
    if(action==='details')root.dataset.details='open';
    if(['closeup','close-details','details'].includes(action))resize();
  },{signal:handlers.signal});
  $('[data-sea-speed]').addEventListener('change',event=>onSpeed(Number(event.target.value)),{signal:handlers.signal});
  root.addEventListener('change',event=>{if(event.target.dataset.lockChoice){targetChoices.set(event.target.dataset.lockChoice,event.target.value);event.stopPropagation();}},{signal:handlers.signal});
  let pointerStart=null;
  canvas.addEventListener('pointerdown',event=>{if(event.isPrimary&&event.button===0)pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId};else pointerStart=null;},{signal:handlers.signal});
  canvas.addEventListener('pointercancel',()=>{pointerStart=null;},{signal:handlers.signal});
  canvas.addEventListener('pointerup',event=>{
    const down=pointerStart;pointerStart=null;
    if(!down||event.pointerId!==down.id||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5)return;
    const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects([...actors.values()].map(a=>a.body),true);
    for(const hit of hits){let object=hit.object;while(object&&!object.userData.unitId)object=object.parent;if(object){select(object.userData.unitId);break;}}
  },{signal:handlers.signal});

  function buildLand(land){
    for(const child of [...terrain.children]){terrain.remove(child);child.geometry.dispose();}
    for(const polygon of land){
      if(polygon.length<3)continue;
      const shape=new THREE.Shape();polygon.forEach(([x,y],i)=>i?shape.lineTo(x,-y):shape.moveTo(x,-y));shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false,steps:1,curveSegments:1});geometry.rotateX(-Math.PI/2);
      const mesh=new THREE.Mesh(geometry,landMaterial);terrain.add(mesh);
      const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(polygon.map(([x,y])=>new THREE.Vector3(x,.08,y))),coastMaterial);terrain.add(line);
    }
  }
  function createActor(item){
    const group=new THREE.Group(),body=new THREE.Group();group.add(body);body.userData.unitId=item.id;
    let wake=null,animations=[];
    if(item.contact&&!item.model){
      const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.65),new THREE.MeshBasicMaterial({color:'#e7a29a',wireframe:true,transparent:true,opacity:.8}));body.add(mesh);
    }else{
      const model=library.get(item.model).clone(true);const profile=MODEL_PROFILES[item.model];
      model.scale.setScalar(profile.size/profile.length);body.add(model);
      model.traverse(o=>{if(o.name.startsWith('motion_'))animations.push(o);});
      if(!item.contact&&item.domain==='surface'){
        const mat=new THREE.ShaderMaterial({vertexShader:wakeVertex,fragmentShader:wakeFragment,
          uniforms:{time:{value:0},strength:{value:.5}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
        wake=new THREE.Mesh(new THREE.PlaneGeometry(profile.size*.62,profile.size*1.25),mat);
        wake.rotation.x=-Math.PI/2;wake.position.set(0,.105,profile.size*1.15);group.add(wake);
      }
    }
    scene.add(group);
    const label=document.createElement('button');label.className='sea-marker';label.dataset.seaUnit=item.id;
    $('.sea-labels').append(label);labels.set(item.id,label);
    const actor={group,body,wake,animations,model:item.model,contact:item.contact,marker:item.contact&&!item.model,label};actors.set(item.id,actor);return actor;
  }
  function removeActor(id){
    const a=actors.get(id);if(!a)return;
    scene.remove(a.group);a.label.remove();labels.delete(id);
    if(a.wake){a.wake.geometry.dispose();a.wake.material.dispose();}
    if(a.marker)a.body.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
    actors.delete(id);
  }
  function updateBattleEffects(){
    let puff=0;
    for(const cloud of snapshot.smoke||[]){
      const fade=Math.min(1,(cloud.until-snapshot.time)/30),age=snapshot.time-cloud.born;
      for(let i=0;i<5;i++){
        const a=i*Math.PI*.4;smokeTransform.position.set(cloud.x+Math.cos(a)*.8,.5+Math.sin(a)*.18,cloud.y+Math.sin(a)*.8);
        smokeTransform.scale.set(cloud.radius*.75,Math.max(.08,.5*fade),cloud.radius*.75);smokeTransform.rotation.y=age*.002+i;
        smokeTransform.updateMatrix();smokeMesh.setMatrixAt(puff++,smokeTransform.matrix);
      }
    }
    smokeMesh.count=puff;smokeMesh.instanceMatrix.needsUpdate=true;
    const live=new Set();
    for(const p of snapshot.projectiles||[]){
      live.add(p.id);let line=rounds.get(p.id);
      if(!line){line=new THREE.Line(tracerGeometry,tracerMaterials[p.side]);scene.add(line);rounds.set(p.id,line);}
      const height=p.weapon==='bomb'?.12+(1-p.progress)*Math.max(.4,p.height):p.weapon==='gun'?.15+Math.sin(p.progress*Math.PI)*.4:p.weapon==='torpedo'?.08:Math.max(.2,p.height);
      line.position.set(p.x,height,p.y);line.rotation.y=-p.heading*Math.PI/180;
      line.scale.z=p.weapon==='torpedo'?.6:1;
    }
    for(const [id,line] of rounds)if(!live.has(id)){scene.remove(line);rounds.delete(id);}
    const visible=new Set();
    for(const e of snapshot.effects||[]){
      const id=`${e.time}:${e.x}:${e.y}`,age=snapshot.time-e.time;if(age>12)continue;
      visible.add(id);let splash=splashes.get(id);
      if(!splash){splash=new THREE.Mesh(splashGeometry,splashMaterials[e.kind==='hit'||e.kind==='critical'?'hit':'miss']);splash.rotation.x=-Math.PI/2;scene.add(splash);splashes.set(id,splash);}
      splash.position.set(e.x,.13,e.y);splash.scale.setScalar(1+age*.13);
    }
    for(const [id,mesh] of splashes)if(!visible.has(id)){scene.remove(mesh);splashes.delete(id);}
  }
  function updateActors(now){
    const items=allItems(),live=new Set(items.map(u=>u.id));
    for(const id of actors.keys())if(!live.has(id))removeActor(id);
    for(const item of items){
      let a=actors.get(item.id);
      if(a&&(a.model!==item.model||a.contact!==item.contact)){removeActor(item.id);a=null;}
      a ||= createActor(item);
      a.group.position.set(item.x,item.height||0,item.y);a.group.rotation.y=-(item.heading||0)*Math.PI/180;
      if(!item.contact){
        const bob=item.domain==='surface'?.025: item.inAir?.018:0;
        a.body.position.y=Math.sin(now*.0008+Number(item.id.slice(1)))*bob;
        a.body.rotation.z=item.domain==='surface'?Math.sin(now*.00065+item.x)*.006:0;
        a.animations.forEach(p=>{if(p.name.includes('Propeller'))p.rotation.z=now*.028;else p.rotation.y=now*(p.name.includes('MainRotor')?.018:.00045);});
        if(a.wake){a.wake.visible=item.speed>1;a.wake.material.uniforms.time.value=now/1000;a.wake.material.uniforms.strength.value=Math.min(.75,item.speed/40);}
      }else if(!item.model)a.body.rotation.y=now*.0002;
      a.label.classList.toggle('red',item.side==='red');a.label.classList.toggle('contact',item.contact);a.label.classList.toggle('active',item.id===selectedKey);
      const labelText=`${item.name}|${item.contact?item.stale?'最后已知位置':item.source:item.typeName}`;
      if(a.label.dataset.copy!==labelText){a.label.dataset.copy=labelText;a.label.innerHTML=`<strong>${safe(item.name)}</strong><small>${safe(item.contact?item.stale?'最后已知位置':item.source:item.typeName)}</small>`;a.label.setAttribute('aria-label',`查看${item.name}详情`);}
    }
    const item=selectedItem();ring.visible=!!item;selectionLine.visible=!!item&&item.height>0;
    if(item){const size=item.model?MODEL_PROFILES[item.model].size:1.6;ring.position.set(item.x,.075,item.y);ring.scale.setScalar(size*.65);ringMaterial.color.set(item.side==='red'?'#e9a29a':'#a3e3ca');selectionLine.position.set(item.x,.08,item.y);selectionLine.scale.y=item.height;}
  }
  const projected=new THREE.Vector3();
  function projectLabels(){
    const width=canvas.clientWidth,height=canvas.clientHeight,occupied=new Set();
    const items=allItems().sort((a,b)=>(b.id===selectedKey)-(a.id===selectedKey)||camera.position.distanceToSquared(itemPoint(a))-camera.position.distanceToSquared(itemPoint(b)));
    for(const item of items){
      const label=labels.get(item.id);if(!label)continue;
      const raise=item.contact?1:(item.domain==='air'?.7:item.model==='carrier'?1.15:.95);
      projected.set(item.x,(item.height||0)+raise,item.y).project(camera);
      const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      const cell=`${Math.floor(x/140)}:${Math.floor(y/48)}`;
      const visible=projected.z>-1&&projected.z<1&&x>35&&x<width-35&&y>73&&y<height-73&&!occupied.has(cell);
      label.hidden=!visible;if(visible){label.style.left=`${x}px`;label.style.top=`${y}px`;occupied.add(cell);}
    }
  }
  function statusBody(u){
    const stat=(label,value,unit='')=>`<div><dt>${label}</dt><dd>${safe(value)}<small>${unit}</small></dd></div>`;
    if(u.contact)return `${snapshot.canCommand&&commandUnitId?`<section class="unit-command-card"><p>由 ${safe(snapshot.units.find(v=>v.id===commandUnitId)?.name)} 执行</p><button class="unit-lock-button" data-unit-lock="${safe(commandUnitId)}" data-lock-contact="${safe(u.id)}">锁定并跟随此目标</button></section>`:''}<h3>${u.stale?'最后已知接触':'侦察接触'}</h3><p>来源：${safe(u.source)}<br>航迹：${u.quality==='track'?'有效跟踪':u.quality==='class'?'已分类':'待确认'}<br>距上次观测：${Math.floor(u.age)} 秒</p><dl class="sea-stats">${stat('已知 X',u.x.toFixed(1),'nm')}${stat('已知 Y',u.y.toFixed(1),'nm')}</dl><p>单位型号、装备与损伤尚未确认。位置随当前视角的侦察情报更新。</p>`;
    let rows=stat('航速',Math.round(u.speed),'kn')+stat('航向',Math.round(u.heading),'°');
    if(u.domain==='air')rows+=stat('高度',u.altitude.toLocaleString(),'m')+stat('燃油',Math.round(u.fuel),'%');
    else rows+=stat('海图 X',u.x.toFixed(1),'nm')+stat('海图 Y',u.y.toFixed(1),'nm');
    const sensors=u.ww2?[['radar','早期雷达'],['datalink','无线电']]:[['radar','雷达'],['sonar','声呐'],['esm','电子支援'],['datalink','数据链']];
    return `${unitCombatStatus(u)}${unitCommandCard(u,{contacts:snapshot.contacts,choice:targetChoices.get(u.id),disabled:!snapshot.canCommand||u.side!==snapshot.side,phase:snapshot.phase})}<div class="sea-health-heading"><span>结构完整度</span><b>${Math.round(u.hp/u.maxHp*100)}%</b></div><div class="sea-health-track"><i style="width:${Math.max(0,Math.min(100,u.hp/u.maxHp*100))}%"></i></div><dl class="sea-stats">${rows}</dl><div class="sea-sensors">${sensors.map(([key,label])=>`<span class="${u[key]?'on':''}">${label} ${u[key]?'开':'关'}</span>`).join('')}${u.ww2?'<span class="on">目视搜索</span>':''}</div>${u.radarFireControl?'<p>舰炮雷达火控：需要本舰连续跟踪，烟幕不阻断雷达测距。</p>':''}${u.smoke?`<p>烟幕余量 ${u.smoke.charges} 次 · ${u.smoke.until>snapshot.time?'正在施放':u.smoke.ready>snapshot.time?`准备 ${Math.ceil(u.smoke.ready-snapshot.time)} 秒`:'设备就绪'}</p><button class="sea-plan" data-sea-smoke="${safe(u.id)}" ${snapshot.phase!=='running'||!u.smoke.charges||u.smoke.ready>snapshot.time?'disabled':''}>施放烟幕</button>`:''}${u.domain==='sub'?`<p>潜航状态：${u.depth==='periscope'?'潜望深度':'深潜'} · 模型在海面作位置示意</p>`:''}${u.domain==='air'?`<p>飞行状态：${u.inAir?u.altitudeName:u.flightState==='servicing'?'整备中':'停场'}</p>`:''}<p>${safe(u.description)}</p>`;
  }
  function equipmentBody(u){
    if(u.contact)return '<p>尚未获得该接触的装备情报。</p>';
    return `<h3>当前武器与余量</h3>${u.weapons.length?u.weapons.map(w=>`<div class="sea-weapon"><span>${safe(w.name)}</span><b>${w.count}</b></div>`).join(''):'<p>当前无可用武器。</p>'}${u.airwing.length?`<h3>${u.ww2?'待出动航空小队':'待出动舰载机'}</h3>${u.airwing.map(w=>`<div class="sea-weapon"><span>${safe(w.name)}</span><b>${w.count}</b>${u.ww2&&u.side==='blue'?`<button class="sea-launch" data-sea-launch="${safe(w.id)}" data-sea-base="${safe(u.id)}" ${snapshot.phase!=='running'||u.hp<u.maxHp*.4||u.deckReady>snapshot.time?'disabled':''}>放飞</button>`:''}</div>`).join('')}`:''}${u.ww2&&u.deck?`<p>${u.deckReady>snapshot.time?`甲板准备 ${Math.ceil(u.deckReady-snapshot.time)} 秒`:'可放飞'} · 放飞间隔 ${u.launchInterval} 秒 · 航空补给 ${Math.floor(u.supply)} 点</p>`:''}<p>${u.ww2?'每个航空单位代表缩编小队。攻击批次与外观挂载均为玩法抽象；回收后十分钟整备。':'装备与弹药读取当前战局；通用模型的外观挂载仅作示意。使用战术海图进行挂载、起飞与作战操作。'}</p>`;
  }
  function modelBody(u){
    if(u.contact)return '<p>接触使用情报标记，确认前不显示具体舰船或战机模型。</p>';
    const p=MODEL_PROFILES[u.model];
    return `<div class="sea-model-badge">${safe(p.name)}<br><small>原创通用原型 · 可继续修改</small></div><p>当前外观用于同类单位的海面展示。模型原型长约 ${p.length} 米；为方便观察，舰船、飞机与高度采用显示比例。</p><div class="sea-downloads"><a href="${asset(u.model)}" download>下载当前 3D 模型 <small>GLB ↓</small></a><a href="./assets/models/${p.source||'generic-fleet.blend'}" download>下载整套可编辑源文件 <small>BLEND ↓</small></a></div><p>源文件中的零件分别命名，可在 Blender 中继续建模。</p>`;
  }
  function updatePanels(speed){
    if(!snapshot)return;
    $('[data-sea-title]').textContent=snapshot.title;
    $('[data-sea-observer]').textContent=snapshot.observer;
    root.classList.toggle('ww2-view',snapshot.ww2);$('.sea-ww2-task').hidden=!snapshot.ww2;
    $('.sea-ww2-mobile').hidden=!snapshot.ww2;
    if(snapshot.ww2){
      const task=snapshot.task,host=$('.sea-ww2-task'),signature=JSON.stringify([task,snapshot.phase]);
      if(host.dataset.signature!==signature){host.dataset.signature=signature;host.innerHTML=`<strong>${safe(snapshot.title)}</strong><p>${task.result?`<b>${task.result==='victory'?'任务完成':'任务失败'} · ${task.score} 分</b><br>${safe(task.reason)}`:safe(task.stage)}</p><small>${task.objectives.map(o=>`${o.done?'✓':o.failed?'×':'○'} ${safe(o.text)}`).join('<br>')}</small><button class="sea-plan" data-sea-order="${task.plan?'manual':'plan'}" ${snapshot.phase!=='running'?'disabled':''}>${task.plan?'转为手动指挥':safe(task.order)+' →'}</button><div class="sea-task-actions">${task.actions.map(([key,label])=>`<button data-sea-order="${key}" ${snapshot.phase!=='running'?'disabled':''}>${safe(label)}</button>`).join('')}</div>`;}
      $('.sea-ww2-mobile').disabled=snapshot.phase!=='running';$('.sea-ww2-mobile').dataset.seaOrder=task.plan?'manual':'plan';$('.sea-ww2-mobile').textContent=task.result?task.result==='victory'?'任务完成':'任务失败':task.plan?'作战计划执行中':'执行作战计划 ↗';
    }
    $('.sea-environment').textContent=`${snapshot.night?'夜间 · 目视受限':snapshot.weather==='storm'?'风暴 · 6 级海况':'日间 · 2 级海况'} / 通用模型`;
    const rosterSignature=JSON.stringify([listTab,selectedKey,snapshot.units.map(u=>[u.id,u.name,u.typeName,u.side]),snapshot.contacts.map(u=>[u.id,u.name,u.stale])]);
    if(rosterSignature!==lastRoster){
      lastRoster=rosterSignature;
      const items=listTab==='fleet'?snapshot.units:snapshot.contacts;
      $('.sea-roster-list').innerHTML=items.map(u=>`<button class="sea-unit-row ${u.side==='red'?'red':''} ${u.id===selectedKey?'active':''}" data-sea-unit="${safe(u.id)}"><i>${u.contact?'?':codes[u.model]}</i><span><strong>${safe(u.name)}</strong><small>${safe(u.contact?u.stale?'最后已知位置':u.source:u.typeName)}</small></span></button>`).join('')||`<p class="sea-empty">${listTab==='contacts'?'尚未发现接触。<br>开启传感器以建立情报。':'当前没有可显示单位。'}</p>`;
      root.querySelectorAll('[data-sea-list]').forEach(b=>{b.classList.toggle('active',b.dataset.seaList===listTab);b.textContent=b.dataset.seaList==='fleet'?`单位 ${snapshot.units.length}`:`接触 ${snapshot.contacts.length}`;});
    }
    const u=selectedItem();
    const headSignature=JSON.stringify(u&&[u.id,u.name,u.typeName,u.side,u.contact]);
    if(headSignature!==lastHead){
      lastHead=headSignature;
      $('.sea-details').classList.toggle('red',u?.side==='red');
      $('.sea-details-head').innerHTML=`<button class="sea-close" data-sea-action="close-details" aria-label="收起单位详情">×</button>${u?`<small>${u.contact?'侦察接触':`${u.side==='blue'?'蓝方':'红方'} / ${domainName[u.domain]}`}</small><h2>${safe(u.name)}</h2><p>${safe(u.contact?'未确认单位':u.typeName)}</p>`:'<h2>海面观察</h2><p>点击舰船或战机查看详情</p>'}`;
      root.dataset.selection=u?.id||'';
    }
    const bodySignature=JSON.stringify([detailTab,snapshot.phase,snapshot.canCommand,commandUnitId,u&&(detailTab==='model'?[u.id,u.model]:detailTab==='equipment'?[u.id,u.weapons,u.airwing,u.ww2?Math.ceil(Math.max(0,u.deckReady-snapshot.time)):0,snapshot.phase]:[u.id,u.hp,u.commandMode,u.commandStatus,u.lockedTarget,u.dogfightWith,u.criticalHits,snapshot.contacts.map(c=>[c.id,c.name,c.stale]),targetChoices.get(u.id),Math.round(u.speed),Math.round(u.heading),Math.round(u.fuel),u.altitude,u.radar,u.sonar,u.esm,u.datalink,u.flightState,u.depth,u.smoke?.charges,Math.ceil(Math.max(0,(u.smoke?.ready||0)-snapshot.time)),Math.floor(u.x*10),Math.floor(u.y*10),u.stale,Math.floor(u.age)])]);
    if(lastBody!==bodySignature&&!document.activeElement?.hasAttribute('data-lock-choice')){lastBody=bodySignature;$('.sea-detail-content').innerHTML=u?(detailTab==='status'?statusBody(u):detailTab==='equipment'?equipmentBody(u):modelBody(u)):'<p>使用左侧编队列表定位单位，或在海面直接点击模型。</p>';}
    root.querySelectorAll('[data-sea-tab]').forEach(b=>b.classList.toggle('active',b.dataset.seaTab===detailTab));
    $('.sea-clock-block time').textContent=clock(snapshot.time);
    const phase=snapshot.phase==='setup'?'部署阶段':snapshot.phase==='ended'?'推演结束':snapshot.paused?'推演暂停':'实时推演';
    $('.sea-clock-block small').textContent=phase;
    const play=$('.sea-play');play.textContent=snapshot.phase==='running'&&!snapshot.paused?'Ⅱ':'▶';play.disabled=snapshot.phase==='ended';play.setAttribute('aria-label',snapshot.phase==='running'&&!snapshot.paused?'暂停推演':'开始推演');
    if(speed!==undefined)$('[data-sea-speed]').value=String(speed);
  }
  function render(next,{selected,target,speed},now,dt){
    if(disposed)return;snapshot=next;if(snapshot.units.some(u=>u.id===selected&&u.side===snapshot.side))commandUnitId=selected;
    if(previousLand!==snapshot.land){previousLand=snapshot.land;buildLand(snapshot.land);}
    const requested=target&&snapshot.contacts.some(u=>u.id===target)?target:selected;
    const visible=allItems(),nextKey=visible.find(u=>u.id===requested)?.id||visible.find(u=>u.side===snapshot.side)?.id||visible[0]?.id||null;
    if(selectedKey!==nextKey){selectedKey=nextKey;lastHead=lastBody=lastRoster='';if(selectedKey)focus(selectedKey);}
    if(firstFrame){firstFrame=false;if(selectedKey)focus(selectedKey);else{controls.target.set(snapshot.world.width/2,0,snapshot.world.height/2);camera.position.copy(controls.target).add(new THREE.Vector3(35,28,35));}}
    updateActors(now);updateBattleEffects();
    const item=selectedItem();
    if(follow&&item){
      const p=itemPoint(item);
      if(lastFollow){const delta=p.clone().sub(lastFollow);camera.position.add(delta);controls.target.add(delta);if(fly){fly.target.add(delta);fly.position.add(delta);fly.fromPosition.add(delta);fly.fromTarget.add(delta);}}
      lastFollow=p;
    }
    if(fly){
      const progress=Math.min(1,Math.max(0,(now-fly.start)/850)),amount=progress*progress*(3-2*progress);
      camera.position.lerpVectors(fly.fromPosition,fly.position,amount);controls.target.lerpVectors(fly.fromTarget,fly.target,amount);
      if(progress===1)fly=null;
    }
    controls.update();camera.position.y=Math.max(.28,camera.position.y);sky.position.copy(camera.position);
    ocean.position.x=Math.round(controls.target.x/100)*100;ocean.position.z=Math.round(controls.target.z/100)*100;
    waterMaterial.uniforms.time.value=now/1000;waterMaterial.uniforms.storm.value=snapshot.weather==='storm'?1:0;
    ambient.intensity=snapshot.night?.45:snapshot.weather==='storm'?.8:1.25;sun.intensity=snapshot.night?.16:snapshot.weather==='storm'?.7:2;
    scene.fog.color.set(snapshot.night?'#0a1525':'#91b0c1');
    skyMaterial.uniforms.night.value=snapshot.night?1:0;waterMaterial.uniforms.night.value=snapshot.night?1:0;
    if(now-lastPanel>250){updatePanels(speed);lastPanel=now;}
    renderer.render(scene,camera);projectLabels();root.dataset.ready='true';
  }
  function setActive(value){active=value;if(active){resize();lastPanel=0;canvas.focus({preventScroll:true});}}
  function reset(){selectedKey=null;commandUnitId=null;targetChoices.clear();previousLand=null;lastHead=lastBody=lastRoster='';firstFrame=true;lastFollow=null;fly=null;root.dataset.details='open';for(const id of actors.keys())removeActor(id);for(const o of [...rounds.values(),...splashes.values()])scene.remove(o);rounds.clear();splashes.clear();smokeMesh.count=0;}
  function dispose(){
    if(disposed)return;disposed=true;handlers.abort();resizeObserver.disconnect();controls.dispose();
    for(const id of actors.keys())removeActor(id);
    const geometries=new Set(),materials=new Set();
    const collect=o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [].concat(o.material))materials.add(m);};
    scene.traverse(collect);library.forEach(g=>g.traverse(collect));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    tracerGeometry.dispose();splashGeometry.dispose();Object.values(tracerMaterials).forEach(m=>m.dispose());Object.values(splashMaterials).forEach(m=>m.dispose());
    environment.dispose();renderer.dispose();root.innerHTML='';
  }
  return {render,resize,setActive,reset,focus,overview,dispose};
}
