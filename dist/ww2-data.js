// Original first-edition WWII rules. Aircraft units represent small flight
// groups; ammunition, times and starting stations are gameplay abstractions.
import {SURFACE_MAPS,SURFACE_SCENARIOS} from './ww2-scenarios.js?v=0.13.1';
export const isWW2Scenario=s=>Object.hasOwn(WW2_SCENARIOS,s?.scenario);
const latitude=29.5,west=-181,east=-174,north=32,south=27;
const project=([lon,lat])=>[(lon-west)*60*Math.cos(latitude*Math.PI/180),(north-lat)*60];
export const WW2_MAPS={...SURFACE_MAPS,midway1942:{
  id:'midway1942',name:'中途岛周边海域',west,east,north,south,referenceLatitude:latitude,
  width:(east-west)*60*Math.cos(latitude*Math.PI/180),height:(north-south)*60,
  source:'中途岛环礁简化示意轮廓；经纬度投影，非精密航海图',schematic:true,
  // Sand and Eastern Islands, deliberately enlarged to remain selectable.
  land:[
    [[-177.405,28.205],[-177.398,28.22],[-177.379,28.224],[-177.365,28.213],[-177.369,28.2],[-177.389,28.197]].map(project),
    [[-177.342,28.209],[-177.332,28.215],[-177.318,28.212],[-177.32,28.201],[-177.335,28.201]].map(project)
  ],labels:[['中途岛',-177.38,28.207],['美军航母待机海域',-175.85,31.28],['西北搜索扇面',-179.45,30.5]]
}};

export const WW2_SCENARIOS={...SURFACE_SCENARIOS,midway42:{
  name:'中途岛海战',era:'ww2',historical:true,mapId:'midway1942',date:'1942-06-04 · 黎明至上午',
  subtitle:'美日双方 · 搜索与空袭 · 航母决战',difficulty:'进阶',duration:14400,budget:0,
  brief:'指挥企业号、大黄蜂号、约克城号与中途岛航空兵。日军航母位置尚未确认：派 PBY 与舰载侦察机展开搜索，用早期雷达预警空袭，再组织战斗机掩护和俯冲轰炸／鱼雷攻击。四小时内使至少三艘日军航母失去航空作战能力，同时保住中途岛和至少一艘可作战的美军航母。',
  history:'1942 年 6 月 4—7 日，美日海军在中途岛附近交战。美军投入企业号、大黄蜂号、约克城号，日军机动部队拥有赤城、加贺、苍龙、飞龙四艘主力航母。侦察、空袭预警、航空队出动时机与损管共同影响战局。',
  adaptation:'首版从 6 月 4 日黎明切入，采用战术化初始阵位和缩编航空小队，不复刻每一架飞机或史实时间线。仅使用目视、侦察机报告与早期雷达搜索；没有导弹、自动化近防、电子支援侦收或现代数据链。无线电共享最后报告，舰炮与航空攻击必须由本单位目视确认。航母战以航空打击为主，舰炮负责近距离海战，防空炮自动保护舰队。',
  sourceTitle:'美国海军历史与遗产司令部 · 中途岛海战',
  sourceURL:'https://www.history.navy.mil/browse-by-topic/wars-conflicts-and-operations/world-war-ii/1942/midway.html',
  search:[-179.45,30.35],zone:{name:'中途岛防御区',lon:-177.38,lat:28.207,radius:12},
  order:'执行航空作战计划',orderKey:'plan',
}};

WW2_SCENARIOS.ww2sandbox={name:'二战自定义海战',subtitle:'双方部署 · 舰炮、鱼雷与潜艇',era:'ww2',budget:600,
  brief:'自行配置双方战舰、潜艇与航空队，选择扮演美军或日军。可载入炮战、航母或猎潜编组，也可从空白海域开始；双方各 600 点，没有强制时限与胜负。'};
export const WW2_PRESETS={fleet:'舰炮与鱼雷编队',carrier:'航母航空编队',subhunt:'驱逐舰与潜艇',empty:'空白部署'};
export function populateWW2Sandbox(s,preset,api){
  if(!Object.hasOwn(WW2_PRESETS,preset))preset='fleet';
  s.ww2Preset=preset;s.units=[];s.missiles=[];s.contacts={blue:{},red:{}};s.nextId=0;s.budget=s.redBudget=600;
  s.mission={id:s.scenario,orders:[],stage:'自由部署 · 自定义二战编队',disabledCarriers:0,operationalCarriers:0,midwayHealth:0};
  const rows={fleet:{blue:[['ww2_north_carolina',55,85],['ww2_us_destroyer',62,78],['ww2_us_destroyer',62,94],['ww2_gato',49,100]],red:[['ww2_yamato',185,85],['ww2_jp_destroyer',178,78],['ww2_jp_destroyer',178,94],['ww2_i_boat',191,100]]},
    carrier:{blue:[['ww2_yorktown',53,90],['ww2_us_cruiser',61,82],['ww2_us_destroyer',62,98]],red:[['ww2_akagi',187,90],['ww2_jp_cruiser',179,82],['ww2_jp_destroyer',178,98]]},
    subhunt:{blue:[['ww2_us_destroyer',60,95],['ww2_gato',65,110]],red:[['ww2_jp_destroyer',174,95],['ww2_i_boat',169,110]]},empty:{blue:[],red:[]}}[preset];
  for(const side of ['blue','red'])for(const [type,x,y] of rows[side])api.spawn(s,type,side,x,y);
}

const gun={name:'203 毫米主炮齐射',short:'GUN',range:14,minRange:.4,speed:1800,damage:42,hit:.19,caliber:203,criticalChance:.28,guidance:'inertial',seeker:0,cooldown:35};
const flak={name:'高射炮射击批次',short:'AA',range:2.6,minRange:.12,speed:2300,damage:9,hit:.28,guidance:'inertial',seeker:0,targets:['air'],cooldown:16};
const machineGun={name:'航空机枪／机炮射击',short:'MG',range:.85,minRange:.06,speed:3200,damage:14,hit:.44,guidance:'inertial',seeker:0,targets:['air'],cooldown:9};
const diveBomb={name:'俯冲轰炸攻击批次',short:'BOMB',range:1.2,minRange:.05,speed:450,damage:65,hit:.18,criticalChance:.55,guidance:'inertial',seeker:0,cooldown:14};
const airTorpedo={name:'空投直航鱼雷',short:'TORP',range:4,releaseRange:1.6,minRange:.35,speed:42,damage:110,hit:.14,criticalChance:.68,guidance:'inertial',seeker:0,targets:['surface'],cooldown:20};
const shipTorpedo={name:'舰载直航鱼雷',short:'TORP',range:8,minRange:.45,speed:46,damage:130,hit:.58,guidance:'inertial',seeker:0,targets:['surface'],cooldown:48};

export function buildWW2Catalog(platform){
  const result={};
  const add=(id,spec)=>result[id]=platform({era:'ww2',period:'ww2',model:false,radar:0,sonar:0,esm:0,channels:0,ciws:0,decoys:0,signature:1,height:22,profiles:{point:flak,gun},...spec});
  const aircraft=(id,name,country,role,spec)=>{
    const weapons={...(['dive','torpedo'].includes(role)?{ir:10}:{}),...spec.weapons},loadouts=[{id:'standard',name:role==='scout'?'搜索侦察':role==='fighter'?'战斗巡逻':role==='torpedo'?'鱼雷攻击':'俯冲轰炸',weapons,external:false,note:'缩编航空小队；余量表示攻击／射击批次。'}];
    add(id,{name,country,code:role==='fighter'?'FTR':role==='scout'?'SCT':role==='torpedo'?'TB':'DB',domain:'air',category:role==='scout'?'patrol':role==='fighter'?'navalAir':'strike',ww2Role:role,
      hp:100,cost:10,speed:230,endurance:250,eoRange:18,eoAirRange:10,altitude:'medium',altitudes:['low','medium'],evasion:.05,carrierModes:[country==='美国'?'ww2-us':'ww2-jp'],
      squadronSize:role==='scout'?3:6,airCombat:role==='fighter'?{maneuver:70,defense:60,firepower:65}:role==='scout'?{maneuver:25,defense:40,firepower:15}:{maneuver:38,defense:65,firepower:25},
      support:role==='scout',loadouts,...spec,weapons,profiles:{ir:role==='fighter'?machineGun:{...machineGun,name:'航空自卫机枪射击',damage:6,hit:.25,cooldown:15},bomb:diveBomb,torpedo:airTorpedo,...spec.profiles}});
  };
  aircraft('ww2_f4f','F4F 野猫战斗小队','美国','fighter',{speed:280,endurance:240,hp:90,eoRange:12,airCombat:{maneuver:65,defense:82,firepower:74},weapons:{ir:24},desc:'螺旋桨舰载战斗小队，结构防护与火力较强，负责目视拦截和舰队战斗巡逻。'});
  aircraft('ww2_sbd','SBD 无畏俯冲轰炸小队','美国','dive',{speed:230,weapons:{bomb:4},desc:'以俯冲轰炸打击航母和水面舰艇；攻击需本机目视确认，耗弹后返航整备。'});
  aircraft('ww2_sbd_scout','SBD 舰载侦察小队','美国','scout',{speed:225,weapons:{},desc:'沿搜索扇面目视侦察，以无线电报告敌舰位置；不承担攻击任务。'});
  aircraft('ww2_tbd','TBD 蹂躏者鱼雷小队','美国','torpedo',{speed:180,endurance:250,hp:90,weapons:{torpedo:2},profiles:{torpedo:{...airTorpedo,hit:.10}},desc:'低速鱼雷攻击小队，须低空接近目标。Mark 13 早期可靠性以较低命中概率抽象。'});
  aircraft('ww2_pby','PBY 卡特琳娜侦察小队','美国','scout',{speed:135,endurance:900,hp:90,eoRange:32,eoAirRange:10,carrierModes:['ww2-land'],weapons:{},desc:'中途岛岸基远程巡逻小队；无机载搜索雷达，以目视搜索并发送无线电报告。'});
  aircraft('ww2_a6m','A6M 零式战斗小队','日本','fighter',{speed:290,endurance:260,hp:80,evasion:.17,eoRange:12,airCombat:{maneuver:92,defense:42,firepower:67},weapons:{ir:24},desc:'机动灵活、防护较弱的螺旋桨舰载战斗小队，负责近距空战和空袭护航。'});
  aircraft('ww2_d3a','D3A 九九舰爆小队','日本','dive',{speed:220,endurance:260,weapons:{bomb:4},desc:'目视俯冲轰炸小队，可攻击舰艇和中途岛设施；没有精确制导武器。'});
  aircraft('ww2_b5n','B5N 九七舰攻小队','日本','torpedo',{speed:235,endurance:280,weapons:{torpedo:2},desc:'低空投放直航鱼雷攻击舰艇；需要侦察报告引导接敌，再由本机目视攻击。'});
  aircraft('ww2_e13a','E13A 零式水侦小队','日本','scout',{speed:185,endurance:700,eoRange:24,altitude:'low',carrierModes:['ww2-float'],weapons:{},desc:'巡洋舰搭载的水上侦察机小队，沿既定扇面低空搜索，以无线电发送目视报告。'});
  const carrier=(id,name,country,hp,wing,radar=0)=>add(id,{name,country,hp,code:'CV-42',domain:'surface',category:'carrier',ww2Role:'carrier',cost:80,speed:31,eoRange:12,eoAirRange:8,radar,radarSurface:radar?14:0,radarAir:radar,
    baseSupply:70,weapons:{point:90},deck:{modes:[country==='美国'?'ww2-us':'ww2-jp'],capacity:5,cooldown:240,wing},
    desc:'1942 年航空母舰。舰载机负责远距离打击，高射炮保护近空；结构低于 40% 时甲板停止放飞。'});
  const usWing={ww2_f4f:2,ww2_sbd_scout:1,ww2_sbd:2,ww2_tbd:1};
  const jpWing={ww2_a6m:1,ww2_d3a:2,ww2_b5n:1};
  carrier('ww2_yorktown','约克城级航空母舰','美国',340,usWing,75);
  carrier('ww2_akagi','赤城号航空母舰','日本',360,jpWing);
  carrier('ww2_kaga','加贺号航空母舰','日本',390,jpWing);
  carrier('ww2_soryu','苍龙号航空母舰','日本',290,jpWing);
  carrier('ww2_hiryu','飞龙号航空母舰','日本',310,jpWing);
  add('ww2_us_cruiser',{name:'美军 203 毫米重巡洋舰',country:'美国',code:'CA-42',domain:'surface',category:'cruiser',cost:34,hp:215,speed:32,eoRange:14,eoAirRange:8,radar:42,radarSurface:12,radarAir:42,weapons:{gun:70,point:70},desc:'重巡洋舰以 203 毫米舰炮进行近海炮战，早期雷达用于搜索预警，不能提供现代火控。'});
  add('ww2_jp_cruiser',{name:'利根级重巡洋舰',country:'日本',code:'CA-42',domain:'surface',category:'cruiser',cost:34,hp:215,speed:33,eoRange:14,eoAirRange:8,baseSupply:30,weapons:{gun:70,point:60,torpedo:8},profiles:{gun,point:flak,torpedo:{...shipTorpedo,name:'610 毫米舰载直航鱼雷',range:11,damage:155}},deck:{modes:['ww2-float'],capacity:2,cooldown:120,wing:{ww2_e13a:2}},desc:'水上侦察、203 毫米舰炮与有限舰载鱼雷；直航鱼雷按最后观测航向提前瞄准。'});
  for(const [id,country] of [['ww2_us_destroyer','美国'],['ww2_jp_destroyer','日本']])add(id,{name:country==='美国'?'美军舰队驱逐舰':'日军舰队驱逐舰',country,code:'DD-42',domain:'surface',category:'destroyer',cost:20,hp:125,speed:35,sonar:6,eoRange:10,eoAirRange:7,weapons:{gun:90,point:55,torpedo:8,depthCharge:18},profiles:{gun:{...gun,name:'127 毫米舰炮齐射',range:9,damage:23,caliber:127,hit:.22,cooldown:18},point:flak,torpedo:{...shipTorpedo,name:country==='美国'?'533 毫米舰载直航鱼雷':'610 毫米舰载直航鱼雷',range:country==='美国'?8:11}},desc:'舰炮、高射炮、有限鱼雷与深水炸弹；低速声呐搜索潜艇，深弹须接近声呐接触后投放。'});
  for(const [id,name,country,hp,length,cost] of [['ww2_north_carolina','北卡罗来纳级战列舰','美国',560,222,85]])add(id,{name,country,hp,lengthMetres:length,beamMetres:country==='美国'?33:38.9,cost,code:'BB-42',domain:'surface',category:'battleship',speed:27,eoRange:20,eoAirRange:10,weapons:{gun:65,point:150},profiles:{gun:{...gun,name:country==='美国'?'406 毫米主炮齐射':'460 毫米主炮齐射',range:country==='美国'?22:24,damage:country==='美国'?78:92,caliber:406,cooldown:45},point:flak},desc:'重型主炮与高射炮防空，装甲和火力较强。本型不配置鱼雷管，需驱逐舰反潜护航。'});
  for(const [id,name,country,length] of [['ww2_gato','加托级柴油潜艇','美国',95],['ww2_i_boat','伊号远洋潜艇（合成）','日本',109]])add(id,{name,country,lengthMetres:length,beamMetres:country==='美国'?8.3:9.3,code:'SS-42',domain:'sub',category:'submarine',ww2Role:'submarine',cost:26,hp:90,speed:20,submergedSpeed:8,subBattery:7200,defaultDepth:'periscope',sonar:9,eoRange:7,eoAirRange:3,height:3,weapons:{torpedo:12,gun:25},profiles:{torpedo:{...shipTorpedo,name:'潜艇直航鱼雷',range:7,cooldown:40},gun:{...gun,name:'潜艇甲板炮',range:4,damage:15,cooldown:18}},desc:'柴油潜艇可浮航、潜望镜航行或深潜。潜望镜观测发射直航鱼雷；深潜不能开火或接收无线电，驱逐舰声呐与深水炸弹可反制。'});
  add('ww2_midway',{name:'中途岛航空基地',country:'美国',code:'MIDWAY',domain:'land',category:'airbase',ww2Role:'base',cost:50,hp:420,speed:0,eoRange:10,eoAirRange:9,radar:65,radarSurface:10,radarAir:65,baseSupply:45,weapons:{point:100},deck:{modes:['ww2-land'],capacity:2,cooldown:120,wing:{ww2_pby:2}},desc:'中途岛守军与航空设施的合并目标。岸基侦察机执行远程搜索，早期雷达提供空袭预警。'});
  const mainGun=(mm,range,damage,cooldown=38,hit=.20)=>({...gun,name:`${mm} 毫米主炮齐射`,caliber:mm,range,damage,cooldown,hit,criticalChance:mm>=300?.32:.25});
  const surfaceTorpedo={...airTorpedo,name:'水面舰直航鱼雷齐射',releaseRange:5.5,range:7,speed:46,damage:150,hit:.17,cooldown:90,criticalChance:.60};
  const battleship=(id,name,country,hp,speed,mm,range,damage,spec={})=>add(id,{
    name,country,hp,speed,code:'BB',domain:'surface',category:'battleship',ww2Role:'battleship',cost:70,
    eoRange:16,eoAirRange:8,armor:.72,weapons:{gun:90,point:90},profiles:{gun:mainGun(mm,range,damage),point:flak},
    desc:`${mm} 毫米重炮主力舰。装甲减轻中小口径炮弹毁伤，舰艏接敌限制齐射效率；数值为战术化抽象。`,...spec
  });
  battleship('ww2_hood','胡德号战列巡洋舰','英国',610,31,381,18,106,{code:'BC',armor:.45,radar:30,radarSurface:15,radarAir:30});
  battleship('ww2_prince_wales','威尔士亲王号战列舰','英国',740,28,356,18,99,{radar:40,radarSurface:18,radarAir:40});
  battleship('ww2_bismarck','俾斯麦号战列舰','德国',820,30,380,19,116,{radar:30,radarSurface:18,radarAir:30});
  add('ww2_uk_cruiser',{name:'郡级重巡洋舰','country':'英国',code:'CA',domain:'surface',category:'cruiser',cost:32,hp:215,speed:31,eoRange:14,eoAirRange:8,radar:30,radarSurface:20,radarAir:30,weapons:{gun:70,point:60},profiles:{gun:mainGun(203,14,42),point:flak},desc:'外围搜索与跟踪舰，以光学观测和早期搜索雷达维持接触。'});
  add('ww2_prinz_eugen',{name:'欧根亲王号重巡洋舰',country:'德国',code:'CA',domain:'surface',category:'cruiser',cost:34,hp:290,speed:32,eoRange:14,eoAirRange:8,radar:28,radarSurface:17,radarAir:28,weapons:{gun:80,point:60},profiles:{gun:mainGun(203,15,46),point:flak},desc:'配合俾斯麦号突围，以 203 毫米主炮攻击目标；早期雷达用于搜索和测距。'});
  battleship('ww2_washington','北卡罗来纳级战列舰','美国',880,27,406,21,125,{radar:65,radarSurface:23,radarAir:65,radarFireControl:true});
  battleship('ww2_south_dakota','南达科他级战列舰','美国',850,27,406,21,120,{radar:60,radarSurface:21,radarAir:60,radarFireControl:true});
  battleship('ww2_kirishima','雾岛号战列舰','日本',710,30,356,18,103);
  const surfaceEscort=(id,name,country,hp,speed,mm,radar=0,smoke=0)=>add(id,{
    name,country,hp,speed,code:mm===203?'CA':mm===152?'CL':hp<115?'DE':'DD',domain:'surface',category:mm>=152?'cruiser':'destroyer',
    cost:25,eoRange:mm>=152?14:11,eoAirRange:7,radar,radarSurface:radar?14:0,radarAir:radar,smoke,
    weapons:{gun:85,point:65,torpedo:mm>=152?4:hp<115?3:5},
    profiles:{gun:mainGun(mm,mm===203?15:mm===152?12:9,mm===203?44:mm===152?31:24,mm===203?30:18,.21),point:flak,torpedo:surfaceTorpedo},
    desc:`${mm} 毫米舰炮与有限直航鱼雷，鱼雷按最后观测的航向、速度超前瞄准。${smoke?'可施放烟幕遮蔽目视射线，搜索雷达仍可穿透烟幕。':'夜战依赖目视和炮口焰暴露的目标。'}`
  });
  surfaceEscort('ww2_us_night_dd','美军夜战驱逐舰','美国',135,35,127,28,3);
  surfaceEscort('ww2_jp_surface_ca','高雄级重巡洋舰','日本',260,34,203);
  surfaceEscort('ww2_jp_light_cruiser','日军轻巡洋舰','日本',175,35,152);
  surfaceEscort('ww2_jp_torpedo_dd','日军鱼雷驱逐舰','日本',125,35,127);
  add('ww2_henderson',{name:'亨德森机场',country:'美国',code:'FIELD',domain:'land',category:'airbase',ww2Role:'base',cost:50,hp:500,speed:0,eoRange:8,eoAirRange:7,weapons:{point:90},desc:'夜间轰击任务的固定目标；机场及邻近设施合并为一个防御目标。'});
  battleship('ww2_yamato','大和级战列舰','日本',1150,27,460,25,145,{lengthMetres:263,beamMetres:38.9,armor:.85,radar:65,radarSurface:18,radarAir:65});
  battleship('ww2_nagato','长门级战列舰','日本',880,25,410,23,128,{radar:50,radarSurface:16,radarAir:50});
  battleship('ww2_kongo','金刚级高速战列舰','日本',720,30,356,21,106,{radar:45,radarSurface:14,radarAir:45});
  surfaceEscort('ww2_fletcher','弗莱彻级驱逐舰','美国',145,35,127,40,4);
  surfaceEscort('ww2_destroyer_escort','护航驱逐舰','美国',100,24,127,32,4);
  aircraft('ww2_fm2','FM-2 野猫战斗小队','美国','fighter',{speed:275,hp:95,endurance:300,carrierModes:['ww2-cve'],weapons:{ir:24},desc:'护航航母搭载的螺旋桨战斗小队，以目视搜索报告追击舰队，并可掩护返航与攻击机。'});
  aircraft('ww2_tbm','TBM 复仇者鱼雷小队','美国','torpedo',{speed:240,endurance:350,carrierModes:['ww2-cve'],weapons:{torpedo:2},desc:'携带反舰鱼雷的缩编小队，低空接敌并投放直航鱼雷，攻击后回收整备。'});
  aircraft('ww2_tbm_support','TBM 复仇者轰炸小队','美国','dive',{ww2Model:'ww2-torpedo',speed:240,endurance:350,carrierModes:['ww2-cve'],weapons:{bomb:2},profiles:{bomb:{...diveBomb,name:'航空炸弹攻击批次',damage:50,hit:.15,criticalChance:.45}},desc:'以航空炸弹支援撤退；轰炸作为攻击批次抽象，不模拟俯冲轰炸机的飞行姿态。'});
  add('ww2_escort_carrier',{name:'卡萨布兰卡级护航航母',country:'美国',code:'CVE',domain:'surface',category:'carrier',ww2Role:'carrier',cost:45,hp:245,speed:19,eoRange:12,eoAirRange:8,radar:55,radarSurface:12,radarAir:55,baseSupply:35,
    weapons:{gun:35,point:70},profiles:{gun:mainGun(127,8,19,24,.18),point:flak},
    deck:{modes:['ww2-cve'],capacity:3,cooldown:300,wing:{ww2_fm2:1,ww2_tbm_support:1,ww2_tbm:1}},
    desc:'低速、轻防护的护航航母。保全航空队并撤离是主要任务，单座舰炮仅用于自卫；航空单位为缩编小队。'});
  return result;
}
