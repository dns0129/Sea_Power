// Original first-edition WWII rules. Aircraft units represent small flight
// groups; ammunition, times and starting stations are gameplay abstractions.
export const isWW2Scenario=s=>Object.hasOwn(WW2_SCENARIOS,s?.scenario);
const latitude=29.5,west=-181,east=-174,north=32,south=27;
const project=([lon,lat])=>[(lon-west)*60*Math.cos(latitude*Math.PI/180),(north-lat)*60];
export const WW2_MAPS={midway1942:{
  id:'midway1942',name:'中途岛周边海域',west,east,north,south,referenceLatitude:latitude,
  width:(east-west)*60*Math.cos(latitude*Math.PI/180),height:(north-south)*60,
  source:'中途岛环礁简化示意轮廓；经纬度投影，非精密航海图',schematic:true,
  // Sand and Eastern Islands, deliberately enlarged to remain selectable.
  land:[
    [[-177.405,28.205],[-177.398,28.22],[-177.379,28.224],[-177.365,28.213],[-177.369,28.2],[-177.389,28.197]].map(project),
    [[-177.342,28.209],[-177.332,28.215],[-177.318,28.212],[-177.32,28.201],[-177.335,28.201]].map(project)
  ],labels:[['中途岛',-177.38,28.207],['美军航母待机海域',-175.85,31.28],['西北搜索扇面',-179.45,30.5]]
}};

export const WW2_SCENARIOS={midway42:{
  name:'中途岛海战',era:'ww2',historical:true,mapId:'midway1942',date:'1942-06-04 · 黎明至上午',
  subtitle:'美军视角 · 搜索与空袭 · 航母决战',difficulty:'进阶',duration:14400,budget:0,
  brief:'指挥企业号、大黄蜂号、约克城号与中途岛航空兵。日军航母位置尚未确认：派 PBY 与舰载侦察机展开搜索，用早期雷达预警空袭，再组织战斗机掩护和俯冲轰炸／鱼雷攻击。四小时内使至少三艘日军航母失去航空作战能力，同时保住中途岛和至少一艘可作战的美军航母。',
  history:'1942 年 6 月 4—7 日，美日海军在中途岛附近交战。美军投入企业号、大黄蜂号、约克城号，日军机动部队拥有赤城、加贺、苍龙、飞龙四艘主力航母。侦察、空袭预警、航空队出动时机与损管共同影响战局。',
  adaptation:'首版从 6 月 4 日黎明切入，采用战术化初始阵位和缩编航空小队，不复刻每一架飞机或史实时间线。仅使用目视、侦察机报告与早期雷达搜索；没有导弹、自动化近防、电子支援侦收或现代数据链。无线电共享最后报告，舰炮与航空攻击必须由本单位目视确认。航母战以航空打击为主，舰炮负责近距离海战，防空炮自动保护舰队。',
  sourceTitle:'美国海军历史与遗产司令部 · 中途岛海战',
  sourceURL:'https://www.history.navy.mil/browse-by-topic/wars-conflicts-and-operations/world-war-ii/1942/midway.html',
  search:[-179.45,30.35],zone:{name:'中途岛防御区',lon:-177.38,lat:28.207,radius:12},
  order:'执行航空作战计划',orderKey:'plan',
}};

const gun={name:'203 毫米主炮齐射',short:'GUN',range:14,minRange:.4,speed:1800,damage:42,hit:.51,guidance:'inertial',seeker:0,cooldown:35};
const flak={name:'高射炮射击批次',short:'AA',range:2.6,minRange:.12,speed:2300,damage:9,hit:.28,guidance:'inertial',seeker:0,targets:['air'],cooldown:16};
const machineGun={name:'航空机枪／机炮射击',short:'MG',range:.85,minRange:.06,speed:3200,damage:14,hit:.44,guidance:'inertial',seeker:0,targets:['air'],cooldown:9};
const diveBomb={name:'俯冲轰炸攻击批次',short:'BOMB',range:1.2,minRange:.05,speed:450,damage:87,hit:.64,guidance:'inertial',seeker:0,cooldown:14};
const airTorpedo={name:'空投直航鱼雷',short:'TORP',range:4,releaseRange:1.6,minRange:.35,speed:42,damage:112,hit:.50,guidance:'inertial',seeker:0,targets:['surface'],cooldown:20};

export function buildWW2Catalog(platform){
  const result={};
  const add=(id,spec)=>result[id]=platform({era:'ww2',period:'ww2',model:false,radar:0,sonar:0,esm:0,channels:0,ciws:0,decoys:0,signature:1,height:22,profiles:{point:flak,gun},...spec});
  const aircraft=(id,name,country,role,spec)=>{
    const weapons=spec.weapons||{},loadouts=[{id:'standard',name:role==='scout'?'搜索侦察':role==='fighter'?'战斗巡逻':role==='torpedo'?'鱼雷攻击':'俯冲轰炸',weapons,external:false,note:'缩编航空小队；余量表示攻击／射击批次。'}];
    add(id,{name,country,code:role==='fighter'?'FTR':role==='scout'?'SCT':role==='torpedo'?'TB':'DB',domain:'air',category:role==='scout'?'patrol':role==='fighter'?'navalAir':'strike',ww2Role:role,
      hp:100,cost:10,speed:230,endurance:250,eoRange:18,eoAirRange:10,altitude:'medium',altitudes:['low','medium'],evasion:.05,carrierModes:[country==='美国'?'ww2-us':'ww2-jp'],
      support:role==='scout',weapons,loadouts,profiles:{ir:machineGun,bomb:diveBomb,torpedo:airTorpedo},...spec});
  };
  aircraft('ww2_f4f','F4F 野猫战斗小队','美国','fighter',{speed:280,endurance:240,hp:90,eoRange:12,weapons:{ir:24},desc:'螺旋桨舰载战斗小队，负责目视拦截和舰队战斗巡逻，不携带导弹。'});
  aircraft('ww2_sbd','SBD 无畏俯冲轰炸小队','美国','dive',{speed:230,weapons:{bomb:3},desc:'以俯冲轰炸打击航母和水面舰艇；攻击需本机目视确认，耗弹后返航整备。'});
  aircraft('ww2_sbd_scout','SBD 舰载侦察小队','美国','scout',{speed:225,weapons:{},desc:'沿搜索扇面目视侦察，以无线电报告敌舰位置；不承担攻击任务。'});
  aircraft('ww2_tbd','TBD 蹂躏者鱼雷小队','美国','torpedo',{speed:180,endurance:250,hp:90,weapons:{torpedo:2},profiles:{torpedo:{...airTorpedo,hit:.36}},desc:'低速鱼雷攻击小队，须低空接近目标。Mark 13 早期可靠性以较低命中概率抽象。'});
  aircraft('ww2_pby','PBY 卡特琳娜侦察小队','美国','scout',{speed:135,endurance:900,hp:90,eoRange:32,eoAirRange:10,carrierModes:['ww2-land'],weapons:{},desc:'中途岛岸基远程巡逻小队；无机载搜索雷达，以目视搜索并发送无线电报告。'});
  aircraft('ww2_a6m','A6M 零式战斗小队','日本','fighter',{speed:290,endurance:260,hp:80,evasion:.17,eoRange:12,weapons:{ir:24},desc:'机动灵活的螺旋桨舰载战斗小队，负责近距空战和空袭护航。'});
  aircraft('ww2_d3a','D3A 九九舰爆小队','日本','dive',{speed:220,endurance:260,weapons:{bomb:3},desc:'目视俯冲轰炸小队，可攻击舰艇和中途岛设施；没有精确制导武器。'});
  aircraft('ww2_b5n','B5N 九七舰攻小队','日本','torpedo',{speed:235,endurance:280,weapons:{torpedo:2},desc:'低空投放直航鱼雷攻击舰艇；需要侦察报告引导接敌，再由本机目视攻击。'});
  aircraft('ww2_e13a','E13A 零式水侦小队','日本','scout',{speed:185,endurance:700,eoRange:24,altitude:'low',carrierModes:['ww2-float'],weapons:{},desc:'巡洋舰搭载的水上侦察机小队，沿既定扇面低空搜索，以无线电发送目视报告。'});
  const carrier=(id,name,country,hp,wing,radar=0)=>add(id,{name,country,hp,code:'CV-42',domain:'surface',category:'carrier',ww2Role:'carrier',cost:80,speed:31,eoRange:12,eoAirRange:8,radar,radarSurface:radar?14:0,radarAir:radar,
    baseSupply:70,weapons:{point:90},deck:{modes:[country==='美国'?'ww2-us':'ww2-jp'],capacity:5,cooldown:90,wing},
    desc:'1942 年航空母舰。舰载机负责远距离打击，高射炮保护近空；结构低于 40% 时甲板停止放飞。'});
  const usWing={ww2_f4f:2,ww2_sbd_scout:1,ww2_sbd:2,ww2_tbd:1};
  const jpWing={ww2_a6m:1,ww2_d3a:2,ww2_b5n:1};
  carrier('ww2_yorktown','约克城级航空母舰','美国',340,usWing,75);
  carrier('ww2_akagi','赤城号航空母舰','日本',360,jpWing);
  carrier('ww2_kaga','加贺号航空母舰','日本',390,jpWing);
  carrier('ww2_soryu','苍龙号航空母舰','日本',290,jpWing);
  carrier('ww2_hiryu','飞龙号航空母舰','日本',310,jpWing);
  add('ww2_us_cruiser',{name:'美军 203 毫米重巡洋舰',country:'美国',code:'CA-42',domain:'surface',category:'cruiser',cost:34,hp:215,speed:32,eoRange:14,eoAirRange:8,radar:42,radarSurface:12,radarAir:42,weapons:{gun:70,point:70},desc:'重巡洋舰以 203 毫米舰炮进行近海炮战，早期雷达用于搜索预警，不能提供现代火控。'});
  add('ww2_jp_cruiser',{name:'利根级重巡洋舰',country:'日本',code:'CA-42',domain:'surface',category:'cruiser',cost:34,hp:215,speed:33,eoRange:14,eoAirRange:8,baseSupply:30,weapons:{gun:70,point:60},deck:{modes:['ww2-float'],capacity:2,cooldown:120,wing:{ww2_e13a:2}},desc:'搭载水上侦察机的重巡洋舰，以目视与无线电报告支持机动部队搜索。'});
  for(const [id,country] of [['ww2_us_destroyer','美国'],['ww2_jp_destroyer','日本']])add(id,{name:country==='美国'?'美军舰队驱逐舰':'日军舰队驱逐舰',country,code:'DD-42',domain:'surface',category:'destroyer',cost:20,hp:125,speed:35,eoRange:10,eoAirRange:7,weapons:{gun:90,point:55},profiles:{gun:{...gun,name:'127 毫米舰炮齐射',range:9,damage:23,hit:.57,cooldown:18},point:flak},desc:'以舰炮进行近距离交战，高射炮提供有限防空；首版不模拟水面舰鱼雷齐射。'});
  add('ww2_midway',{name:'中途岛航空基地',country:'美国',code:'MIDWAY',domain:'land',category:'airbase',ww2Role:'base',cost:50,hp:420,speed:0,eoRange:10,eoAirRange:9,radar:65,radarSurface:10,radarAir:65,baseSupply:45,weapons:{point:100},deck:{modes:['ww2-land'],capacity:2,cooldown:120,wing:{ww2_pby:2}},desc:'中途岛守军与航空设施的合并目标。岸基侦察机执行远程搜索，早期雷达提供空袭预警。'});
  return result;
}
