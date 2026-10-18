// Real model identities and public roles; every numeric combat value below is a game parameter.
export const MODEL_SOURCES={
  gripen:{title:'Saab · Gripen E 任务系统',url:'https://www.saab.com/newsroom/stories/2020/december/taking-a-closer-look-at-gripens-ew-and-weapons-system'},
  jasdf:{title:'日本航空自卫队 · 装备',url:'https://www.mod.go.jp/asdf/equipment/'},
  mrtt:{title:'Airbus · A330 MRTT',url:'https://www.airbus.com/en/products-services/defence/military-aircraft/a330-mrtt'},
  usaf:{title:'美国空军 · 装备事实资料',url:'https://www.af.mil/About-Us/Fact-Sheets/Aircraft-Factsheets/'},
  usn:{title:'美国海军 · 公开装备资料',url:'https://www.navy.mil/Resources/Fact-Files/Display/Article/204442/aircraft-carriers/'},
  hornet:{title:'美国海军 · Hornet / Super Hornet',url:'https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2383479/fa-18a-d-hornet-and-fa-18ef-super-hornet-strike-fighter/'},
  burke:{title:'美国海军 · DDG-51',url:'https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2169871/destroyers-ddg/linkId/destroyers-ddg-51/'},
  zumwalt:{title:'美国海军 · DDG-1000',url:'https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2391800/destroyers-ddg-1000/destroyers-ddg-1000/'},
  ohio:{title:'美国海军 · SSGN',url:'https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2169613/guided-missile-submarines-ssgn/'},
  mh60:{title:'美国海军 · MH-60R',url:'https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2166679/mh-60r-sea-hawk/mh-60r-seahawk/'},
  mh60s:{title:'美国海军 · MH-60S',url:'https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2166682/mh-60s-seahawk/'},
  f16:{title:'洛克希德·马丁 · F-16',url:'https://www.lockheed-martin.com/en-us/products/f-16.html'},
  f35:{title:'洛克希德·马丁 · F-35 型别',url:'https://lockheedmartin.com/f35/news-and-features/Choose-Your-Fighter-F35A-vs-F35B.html'},
  boeing:{title:'波音 · F-15EX',url:'https://www.boeing.com/defense/fighters-and-bombers/f-15ex-eagle'},
  china:{title:'中国国防部 · 舰载航空公开配置',url:'https://www.mod.gov.cn/gfbw/qwfb/yw_214049/16422733.html'},
  chinaAir:{title:'中国国防部 · 公开航空装备',url:'https://www.mod.gov.cn/gfbw/qwfb/16407156.html'},
  china054:{title:'中国国防部 · 054B 交接入列',url:'https://www.mod.gov.cn/gfbw/qwfb/16365671.html'},
  chinaFleet:{title:'美国国防部 · 2024 中国军力公开报告',url:'https://media.defense.gov/2024/Dec/18/2003615520/-1/-1/0/MILITARY-AND-%09SECURITY-DEVELOPMENTS-INVOLVING-THE-PEOPLES-REPUBLIC-OF-CHINA-2024.PDF'},
  uac:{title:'俄罗斯联合航空 · 军用飞机产品',url:'https://uacrussia.ru/en/aircraft/lineup/military/'},
  rafale:{title:'达索 · Rafale 任务定位',url:'https://www.dassault-aviation.com/en/defense/rafale/'},
  eurofighter:{title:'Eurofighter · Aircraft',url:'https://www.eurofighter.com/the-aircraft'},
  saab:{title:'Saab · 航空与海军产品',url:'https://www.saab.com/products/naval'},
  globaleye:{title:'Saab · GlobalEye',url:'https://www.saab.com/products/globaleye'},
  kai:{title:'KAI · KF-21 与 FA-50',url:'https://www.koreaaero.com/VIRTUAL_EX/CorporateZone/FixedWing.html'},
  hal:{title:'HAL · Tejas',url:'https://www.hal-india.co.in/tejas'},
  airbus:{title:'Airbus · C295 MPA/ASW',url:'https://www.airbus.com/en/products-services/defence/military-aircraft/c295/c295-mpa-asw'},
  iai:{title:'IAI · G550 CAEW',url:'https://www.iai.co.il/press/the-ministry-of-defence-and-israel-aerospace-industries-have-delivered-the-first-caew-g550-to-the-italian-air-force/'},
  navalGroup:{title:'Naval Group · 舰艇产品与项目',url:'https://www.naval-group.com/en'},
  fincantieri:{title:'Fincantieri · FREMM 产品资料',url:'https://www.fincantieri.com/globalassets/prodotti-servizi/repository/bb1_fincantieri_scheda_naval_vessels_fremm_2025.pdf'},
  vulcano:{title:'Fincantieri · Vulcano 补给舰',url:'https://www.fincantieri.com/en/business/products/naval-vessels/logistic-and-replenishment-ships/vulcano-class'},
  royal:{title:'英国皇家海军 · Type 45 舰艇与舰载机',url:'https://www.royalnavy.mod.uk/organisation/units-and-squadrons/destroyers/hms-diamond'},
  ukFleet:{title:'英国议会 · 2025 水面舰队资料',url:'https://researchbriefings.files.parliament.uk/documents/CBP-10257/CBP-10257.pdf'},
  astute:{title:'英国国防部 · 潜艇类型',url:'https://www.gov.uk/government/publications/uk-royal-navy-submarines/types-of-uk-royal-navy-submarine'},
  jmsdf:{title:'日本海上自卫队 · 装备',url:'https://www.mod.go.jp/msdf/en/equipment/'},
  kawasaki:{title:'川崎重工 · P-1 / P-3C',url:'https://origin.global.kawasaki.com/en/mobility/air/aircrafts/index.html'},
  taigei:{title:'川崎重工 · 大鲸型潜艇',url:'https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20251014_8821'},
  german:{title:'德国联邦国防军 · 海军装备',url:'https://www.bundeswehr.de/de/organisation/marine/ausruestung-und-technik'},
  navantia:{title:'Navantia · F-100',url:'https://catalogo.navantia.es/es/producto/f100/'},
  australia:{title:'澳大利亚海军 · 舰艇与潜艇',url:'https://www.navy.gov.au/capabilities/ships-boats-and-submarines'},
  dutch:{title:'荷兰国防部 · 七省级防空指挥护卫舰',url:'https://www.defensie.nl/onderwerpen/m/materieel/schepen/luchtverdedigings-en-commandofregatten-lcf'},
  norway:{title:'挪威国防军 · 海军舰队',url:'https://www.forsvaret.no/om-forsvaret/organisasjon/sjoforsvaret/marinen'},
  hhi:{title:'HD 现代重工 · 2026 海军舰艇产品',url:'https://naval-special.hhi.co.kr/Uploads/Brochure/Attachment/2026031294530_hhi_naval_ship_division.pdf'},
  hanwha:{title:'韩华海洋 · 2025 舰艇项目',url:'https://www.hanwhaocean.com/pdf/Hanwha_Ocean_Brochure_EN_2025.pdf'},
  india:{title:'印度新闻局 · 新一代水面舰艇',url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2092999&lang=2&reg=48'},
  stm:{title:'STM · Ada / Istanbul',url:'https://www.stm.com.tr/en/tcg-istanbul-f-515'},
  damen:{title:'Damen · SIGMA',url:'https://www.damen.com/vessels/defence-and-security/sigma-frigates'},
  roe:{title:'Rosoboronexport · Project 636',url:'https://roe.ru/pdfs/pdf_6484.pdf'},
};
export const PERIODS={legacy:'现代早期沿用型',upgrade:'信息化改进型',current:'当代新型'};
export const CATEGORIES={fighter:'战斗机',navalAir:'舰载战斗机',strike:'攻击／轰炸机',electronic:'电子战机',awacs:'预警机',patrol:'海上巡逻机',helicopter:'直升机',tanker:'加油机',carrier:'航空母舰',amphibious:'两栖／航空舰',destroyer:'驱逐／巡洋舰',frigate:'护卫舰',corvette:'轻型舰／导弹艇',submarine:'潜艇',supply:'补给舰'};
const ROLES={airSuperiority:'制空拦截',multirole:'多用途空战／对地',stealthAir:'低可探测制空',stealthStrike:'低可探测多用途',navalFighter:'舰队制空／海上打击',sead:'电子压制／反辐射',strike:'对地打击',maritimeStrike:'远程海上打击',awacs:'空中预警／态势共享',patrol:'海上巡逻／反潜',aswHelo:'舰载反潜',attackHelo:'近距反舰／攻击',heloAwacs:'舰载空中预警',tanker:'空中加油',carrier:'舰载航空运用',amphibious:'航空与两栖支援',aad:'编队区域防空',multimission:'多任务水面作战',asw:'反潜护航',corvette:'近海警戒／反舰',ssn:'远洋反潜／反舰',ssgn:'潜航对陆打击',ssk:'近海隐蔽伏击',supply:'航空补给接力'};
const AIR={
  airSuperiority:{category:'fighter',cost:24,hp:48,speed:650,radar:155,esm:160,endurance:85,evasion:.14,weapons:{aam:8,ir:2},payloadSlots:10},
  multirole:{category:'fighter',cost:20,hp:45,speed:560,radar:135,esm:145,endurance:80,evasion:.10,weapons:{aam:6,ir:2,pgm:4},payloadSlots:8},
  stealthAir:{category:'fighter',cost:34,hp:48,speed:720,radar:170,esm:185,endurance:90,signature:.25,evasion:.18,weapons:{aam:6,ir:2,pgm:2},payloadSlots:8,internalAam:6,internalIr:2,internalPgm:2},
  stealthStrike:{category:'fighter',cost:31,hp:46,speed:570,radar:155,esm:180,endurance:95,signature:.28,evasion:.12,weapons:{aam:6,ir:2,pgm:4},payloadSlots:8,internalAam:4,internalIr:0,internalPgm:2},
  navalFighter:{category:'navalAir',cost:23,hp:48,speed:580,radar:145,esm:155,endurance:75,evasion:.1,weapons:{aam:6,ir:2,asm:2,pgm:4},payloadSlots:10},
  sead:{category:'electronic',cost:27,hp:48,speed:530,radar:135,esm:200,endurance:95,jammer:48,weapons:{aam:4,ir:2,arm:4,pgm:2},payloadSlots:8},
  strike:{category:'strike',cost:24,hp:60,speed:500,radar:110,esm:145,endurance:120,weapons:{aam:2,ir:2,pgm:8,cruise:4},payloadSlots:12},
  maritimeStrike:{category:'strike',cost:29,hp:85,speed:480,radar:155,esm:160,endurance:180,weapons:{asm:6,pgm:8,cruise:6},payloadSlots:16},
  awacs:{category:'awacs',cost:27,hp:65,speed:330,radar:210,esm:200,endurance:210,signature:1.5,altitude:'high',support:true,weapons:{},payloadSlots:0},
  patrol:{category:'patrol',cost:24,hp:65,speed:330,radar:175,esm:170,sonar:30,sonarMode:'buoy',endurance:190,weapons:{asm:4,torpedo:6},payloadSlots:12},
  aswHelo:{category:'helicopter',cost:13,hp:36,speed:150,radar:60,esm:75,sonar:32,sonarMode:'dipping',endurance:135,rotary:true,altitude:'low',weapons:{torpedo:4,atgm:4},payloadSlots:6,carrierModes:['helicopter']},
  attackHelo:{category:'helicopter',cost:14,hp:38,speed:155,radar:55,esm:65,endurance:115,rotary:true,altitude:'low',eoRange:10,weapons:{atgm:8,ir:2},payloadSlots:8,carrierModes:['helicopter']},
  heloAwacs:{category:'helicopter',cost:17,hp:42,speed:140,radar:130,esm:145,endurance:150,rotary:true,altitude:'medium',support:true,weapons:{},payloadSlots:0,carrierModes:['helicopter']},
  tanker:{category:'tanker',cost:23,hp:85,speed:430,radar:0,esm:85,endurance:240,tanker:true,fuelSupply:18000,refuelRate:14,signature:1.8,support:true,weapons:{},payloadSlots:0},
};
const SHIP={
  carrier:{category:'carrier',cost:88,hp:520,speed:30,radar:145,esm:165,sonar:0,signature:2.3,ciws:28,decoys:14,channels:2,weapons:{point:32},baseSupply:120},
  amphibious:{category:'amphibious',cost:58,hp:400,speed:24,radar:110,esm:125,sonar:0,signature:1.8,ciws:20,decoys:10,weapons:{point:24,gun:24},baseSupply:85},
  aad:{category:'destroyer',cost:43,hp:200,speed:30,radar:165,sonar:25,esm:180,channels:6,ciws:22,decoys:12,weapons:{sam:64,point:32,asm:8,asroc:12,torpedo:6,cruise:24,gun:48}},
  multimission:{category:'destroyer',cost:35,hp:175,speed:30,radar:125,sonar:29,esm:145,channels:4,ciws:18,decoys:10,weapons:{sam:40,point:24,asm:8,asroc:8,torpedo:6,cruise:16,gun:40}},
  asw:{category:'frigate',cost:28,hp:135,speed:28,radar:95,sonar:38,esm:120,channels:3,ciws:12,decoys:8,weapons:{sam:24,point:16,asm:8,torpedo:8,asroc:8,gun:36}},
  corvette:{category:'corvette',cost:17,hp:85,speed:29,radar:65,sonar:18,esm:85,channels:2,ciws:10,decoys:5,weapons:{point:12,asm:8,torpedo:4,gun:30}},
  supply:{category:'supply',cost:24,hp:230,speed:22,radar:45,sonar:0,esm:50,ciws:8,decoys:4,support:true,baseSupply:180,supplyShip:true,weapons:{}},
  ssn:{category:'submarine',domain:'sub',cost:34,hp:115,speed:31,radar:18,sonar:48,esm:65,decoys:8,weapons:{torpedo:18,asm:8,cruise:12}},
  ssgn:{category:'submarine',domain:'sub',cost:45,hp:145,speed:28,radar:16,sonar:42,esm:60,decoys:8,weapons:{torpedo:12,asm:12,cruise:48}},
  ssk:{category:'submarine',domain:'sub',cost:24,hp:88,speed:21,radar:15,sonar:40,esm:55,decoys:6,acoustic:.8,weapons:{torpedo:12,asm:4}},
};
export const PAYLOAD_WEIGHTS={aam:1,ir:1,asm:2,supersonic:3,arm:1,pgm:1,cruise:2,torpedo:2,atgm:1};
function airLoadouts(t){
  const cap=t.weapons,slots=t.payloadSlots;
  if(!Object.values(cap).some(Boolean))return [{id:'mission',name:'任务设备',weapons:{},note:ROLES[t.role],external:false}];
  const rows=[];
  const add=(id,name,desired,note)=>{const w={},limit={left:slots};for(const [key,n] of desired){const count=Math.min(cap[key]||0,n,Math.floor(limit.left/(PAYLOAD_WEIGHTS[key]||1)));if(count){w[key]=count;limit.left-=count*(PAYLOAD_WEIGHTS[key]||1);}}
    if(!Object.values(w).some(Boolean))return;const external=t.signature<.5&&((w.aam||0)>(t.internalAam||0)||(w.ir||0)>(t.internalIr||0)||(w.pgm||0)>(t.internalPgm||0)||!!w.asm||!!w.arm||!!w.cruise);
    rows.push({id,name,weapons:w,note,external});};
  if(cap.aam||cap.ir)add('air','制空挂载',[['aam',t.internalAam??cap.aam],['ir',t.internalIr??Math.min(2,cap.ir||0)]],'优先空战弹药，减少对地挂载。');
  if(cap.torpedo)add('asw','反潜挂载',[['torpedo',cap.torpedo],['asm',1],['atgm',2]],'低空低速使用吊放声呐，巡逻机低空使用浮标抽象搜索。');
  if(cap.arm)add('sead','压制挂载',[['arm',cap.arm],['aam',2],['ir',2]],'反辐射弹与自卫空空弹，主动干扰需手动开启。');
  if(cap.asm||cap.supersonic){
    add('naval','对海挂载',[['supersonic',cap.supersonic||0],['asm',cap.asm||0],['aam',2],['ir',2]],'优先携带反舰弹；只能攻击符合武器目标条件的舰船，需有效海面航迹。');
    const distinct=(id,name,desired,note)=>{const before=rows.length;add(id,name,desired,note);if(rows.length===before)return;const row=rows.at(-1);if(rows.slice(0,-1).some(other=>Object.keys(cap).every(key=>(other.weapons[key]||0)===(row.weapons[key]||0))))rows.pop();else row.mission='naval';};
    distinct('navalEscort','对海护航挂载',[['aam',2],['ir',2],['supersonic',cap.supersonic||0],['asm',cap.asm||0]],'先保留空战自卫，再装反舰弹；自卫弹占用反舰载荷，不能用对陆弹替代反舰弹。');
    distinct('navalHeavy','重反舰挂载',[['supersonic',cap.supersonic||0],['asm',cap.asm||0],['ir',Math.min(2,cap.ir||0)]],'优先装满兼容反舰弹，减少中距空战自卫；需要制空掩护与有效海面航迹。');
  }
  if(cap.cruise||cap.pgm)add('strike','对地挂载',[['cruise',Math.min(cap.cruise||0,4)],['pgm',t.internalPgm??cap.pgm],['aam',2],['ir',t.internalIr??2]],'对陆武器不能攻击移动舰船。');
  if(cap.atgm)add('close','近距支援',[['atgm',cap.atgm],['ir',2],['torpedo',1]],'依靠近距光电航迹持续指示目标。');
  if(t.signature<.5&&(cap.aam>(t.internalAam||0)||cap.pgm>(t.internalPgm||0)))add('external','外部加强挂载',[['aam',cap.aam],['ir',cap.ir||0],['pgm',cap.pgm||0]],'增加弹药，但降低低可探测优势。');
  const preferred={sead:'sead',patrol:'asw',aswHelo:'asw',attackHelo:'close',strike:'strike',maritimeStrike:'naval'}[t.role];
  if(preferred)rows.sort((a,b)=>(a.id===preferred?-1:0)-(b.id===preferred?-1:0));return rows;
}
function shipLoadouts(t){
  const cap=t.weapons,weights=t.vlsWeapons||{},cells=t.vlsCells||0;
  const naval=()=>{
    const weapons={...cap};
    if(cells){
      for(const key of Object.keys(weights))weapons[key]=0;
      let remaining=cells;
      for(const key of ['supersonic','asm','point','sam','asroc']){
        const weight=weights[key];if(!weight)continue;
        const count=Math.min(cap[key]||0,Math.floor((remaining+1e-9)/weight));
        weapons[key]=count;remaining-=count*weight;
      }
    }
    return {id:'naval',name:'对海优先弹库',mission:'naval',weapons,note:cells?'优先装满兼容反舰弹，再分配防空与反潜；共享垂发中的对陆弹药让位，固定发射器不能转换为反舰弹位。':'使用固定反舰发射器执行对海任务；任务选择不增加反舰弹数量，各独立弹库仍按原装置计算。'};
  };
  if(!cells){const rows=[{id:'standard',name:'标准弹库',weapons:{...cap},note:'固定发射装置与独立弹库的游戏化组合。'}];if(cap.asm||cap.supersonic)rows.push(naval());return rows;}
  const profiles=[['balanced','均衡弹库',{sam:.65,point:.75,asroc:.5,cruise:.5,asm:1}],['airdef','防空优先',{sam:1,point:1,asroc:.5,cruise:0,asm:.5}],['asw','反潜优先',{sam:.5,point:.75,asroc:1,cruise:.25,asm:.5}],['strike','对陆优先',{sam:.4,point:.5,asroc:.25,cruise:1,asm:1}]];
  const rows=profiles.filter(([id])=>id!=='strike'||cap.cruise>0).map(([id,name,ratio])=>{
    const w=Object.fromEntries(Object.entries(cap).map(([k,v])=>[k,Object.hasOwn(weights,k)?Math.floor(v*(ratio[k]??1)):v]));
    const used=()=>Object.entries(weights).reduce((n,[k,weight])=>n+(w[k]||0)*weight,0);
    const priority=id==='airdef'?['cruise','asm','asroc','point','sam']:id==='strike'?['asroc','sam','point','asm','cruise']:['cruise','asroc','asm','point','sam'];
    for(const k of priority)while(used()>cells&&w[k]>0&&weights[k])w[k]--;
    return {id,name,weapons:w,note:'共享垂发容量；近防、甲板反舰弹与鱼雷按各自弹库计算。'};
  });
  if(cap.asm||cap.supersonic)rows.push(naval());
  return rows;
}
export function buildModernCatalog(platform){
  const out={};
  const add=(id,name,country,role,source,note,extra={},air=true)=>{
    const base=(air?AIR:SHIP)[role],{weapons,...rest}=extra;
    const spec={domain:air?'air':base.domain||'surface',height:air?20:24,signature:1,sonar:0,channels:2,decoys:air?8:4,...base,...rest,
      weapons:weapons||base.weapons,name,code:extra.code||id.toUpperCase().replaceAll('_','-').slice(0,12),model:true,country,role,period:extra.period||'upgrade',sourceIds:[source],realRole:ROLES[role],realNote:note,desc:note,
      aliases:[id,name,extra.aliases||'',country,ROLES[role]].join(' '),altitudes:extra.altitudes||(base.rotary?['low','medium']:['low','medium','high']),
      gameNote:air?'任务挂载、燃油与平台特征共同约束作战；界面数值为游戏值。':'共享发射容量、独立弹库与航空支援构成分工；界面数值为游戏值。'};
    if(spec.domain==='sub')spec.sonarMode='passive';
    spec.loadouts=air?airLoadouts(spec):shipLoadouts(spec);
    out[id]=platform(spec);
  };
  const a=(id,name,country,role,source,note,extra={})=>add(id,name,country,role,source,note,extra,true),n=(id,name,country,role,source,note,extra={})=>add(id,name,country,role,source,note,extra,false);
  // Combat aviation: distinct versions are kept only when roles or naval compatibility differ.
  a('f22a','F-22A 猛禽','美国','stealthAir','usaf','隐身制空与超声速巡航；保留有限精确对地能力。',{period:'upgrade',speed:740,radar:170,evasion:.19});
  a('f35a','F-35A 闪电 II','美国','stealthStrike','f35','常规起降多用途隐身机；默认内置挂载，未假定未公开的反舰集成。',{period:'current',internalAam:4,internalIr:0,internalPgm:2});
  a('f35b','F-35B 闪电 II','美国','stealthStrike','f35','短距起飞／垂直降落型，可从兼容的轻型航空舰起降。',{category:'navalAir',period:'current',cost:33,endurance:70,carrierModes:['stovl'],internalPgm:2});
  a('f35c','F-35C 闪电 II','美国','stealthStrike','f35','舰载弹射／阻拦型，以低可探测挂载执行制空与对地任务。',{category:'navalAir',period:'current',cost:34,endurance:100,carrierModes:['catapult']});
  a('f15c','F-15C 鹰','美国','airSuperiority','usaf','以制空拦截为主，缺少本库中的对地挂载。',{period:'legacy',speed:710,radar:150,weapons:{aam:8,ir:2}});
  a('f15e','F-15E 攻击鹰','美国','multirole','usaf','双座远程攻击型，兼顾空战与精确对陆打击。',{cost:26,hp:54,endurance:110,payloadSlots:12,weapons:{aam:8,ir:2,pgm:8,cruise:4}});
  a('f15ex','F-15EX 鹰 II','美国','multirole','boeing','新型航电与大挂载量；体积与电磁暴露带来代价。',{period:'current',cost:31,hp:56,radar:180,esm:185,payloadSlots:12,weapons:{aam:12,ir:2,pgm:8,cruise:4},profiles:{aam:{range:100}}});
  a('f16c50','F-16C Block 50','美国','multirole','f16','轻型多用途平台，可配置反辐射挂载执行防空压制。',{period:'legacy',cost:18,endurance:75,weapons:{aam:6,ir:2,pgm:4,arm:2}});
  a('f16v70','F-16V / Block 70','美国','multirole','f16','采用 APG-83 AESA 的公开升级配置，增强态势感知。',{period:'current',cost:23,radar:155,esm:160,weapons:{aam:6,ir:2,pgm:6,arm:2}});
  a('fa18c','F/A-18C 大黄蜂','美国','navalFighter','hornet','早期多用途舰载机，反舰与压制任务兼容，续航较短。',{period:'legacy',cost:20,endurance:65,carrierModes:['catapult'],weapons:{aam:6,ir:2,asm:2,arm:2,pgm:4}});
  a('fa18e','F/A-18E 超级大黄蜂','美国','navalFighter','hornet','单座舰载多用途机，兼顾舰队防空与对海打击。',{carrierModes:['catapult'],weapons:{aam:8,ir:2,asm:4,arm:2,pgm:6},payloadSlots:12,profiles:{asm:{range:100}}});
  a('fa18f','F/A-18F 超级大黄蜂','美国','navalFighter','hornet','双座舰载多用途配置，强化复杂对地与海上任务的游戏分工。',{cost:25,carrierModes:['catapult'],payloadSlots:12,weapons:{aam:6,ir:2,asm:4,arm:4,pgm:6}});
  a('ea18g','EA-18G 咆哮者','美国','sead','hornet','专职舰载电子攻击；干扰与反辐射挂载占用载荷。',{carrierModes:['catapult'],jammer:55,cost:29,weapons:{aam:4,arm:4,pgm:2}});
  a('av8b','AV-8B Harrier II','美国','multirole','usn','现代早期短距／垂直起降攻击机，制空与雷达能力有限。',{category:'navalAir',period:'legacy',cost:16,speed:440,radar:55,carrierModes:['stovl'],weapons:{ir:4,pgm:6},payloadSlots:8});
  a('j20','歼-20','中国','stealthAir','chinaAir','以隐身制空和体系协同为定位，不添加未确认的反舰挂载。',{period:'current',cost:35,signature:.24,speed:730,radar:175,weapons:{aam:4,ir:2},internalAam:4,internalIr:2,payloadSlots:6});
  a('j35a','歼-35A','中国','stealthStrike','chinaAir','按公开展示的多用途隐身定位建模，不代表完整作战配置披露。',{period:'current',cost:31,publicConfig:true});
  a('j35','歼-35 舰载型','中国','stealthStrike','china','已公开完成福建舰弹射与着舰训练的舰载型号。',{category:'navalAir',period:'current',carrierModes:['catapult'],cost:34,publicConfig:true});
  a('j16','歼-16','中国','multirole','chinaAir','双座重型多用途机，以较大挂载承担制空和打击。',{cost:27,hp:55,radar:155,endurance:105,payloadSlots:12,weapons:{aam:8,ir:2,asm:2,pgm:8,arm:2}});
  a('j16d','歼-16D','中国','sead','chinaAir','专职电子战型号，重点是干扰、支援与防空压制。',{period:'current',cost:30,hp:54,jammer:55,esm:210,weapons:{aam:4,arm:4}});
  a('j15','歼-15','中国','navalFighter','china','滑跃起飞舰载战斗机，适配本库滑跃航空母舰。',{carrierModes:['stobar'],radar:140,cost:23});
  a('j15t','歼-15T','中国','navalFighter','china','适配电磁弹射的公开舰载配置，与滑跃型分开建模。',{period:'current',carrierModes:['catapult'],cost:27,radar:160,payloadSlots:12,weapons:{aam:8,ir:2,asm:4,pgm:6}});
  a('j15dt','歼-15DT','中国','sead','china','公开出现的弹射舰载电子战角色，参数按支援任务游戏化。',{period:'current',carrierModes:['catapult'],cost:29,jammer:52,publicConfig:true});
  a('j10c','歼-10C','中国','multirole','chinaAir','中型多用途战斗机，以现代航电和空战效费比分工。',{period:'current',cost:22,radar:150,esm:155,weapons:{aam:6,ir:2,pgm:4}});
  a('j11b','歼-11B','中国','airSuperiority','chinaAir','重型制空平台，承担中远程空中拦截。',{cost:22,radar:140,speed:660,weapons:{aam:6,ir:4}});
  a('jh7a','歼轰-7A','中国','maritimeStrike','chinaAir','双座战斗轰炸机，以对海／对地攻击为主要分工。',{category:'strike',cost:22,hp:55,speed:510,endurance:100,payloadSlots:10,weapons:{asm:4,arm:2,pgm:6,ir:2},profiles:{asm:{range:95}}});
  a('jf17iii','JF-17 Block III 枭龙','巴基斯坦','multirole','chinaAir','中巴合作轻型战机，按公开出口任务类别配置。',{period:'current',cost:17,hp:40,radar:130,endurance:70,weapons:{aam:4,ir:2,asm:2,pgm:4},payloadSlots:8});
  a('su57','Su-57','俄罗斯','stealthStrike','uac','多用途低可探测平台；内部挂载与外部加强配置分开。',{period:'current',cost:33,speed:700,signature:.35,weapons:{aam:6,ir:2,pgm:4,cruise:2},internalAam:4,internalIr:2});
  a('su35s','Su-35S','俄罗斯','airSuperiority','uac','重型制空平台，兼具对地与反舰任务的公开多用途定位。',{cost:27,radar:165,speed:710,payloadSlots:12,weapons:{aam:8,ir:4,asm:2,pgm:4},profiles:{aam:{range:95}}});
  a('su30sm','Su-30SM','俄罗斯','multirole','uac','双座多用途重型机，可在制空、反舰和对地间换装。',{cost:24,hp:54,radar:145,endurance:105,payloadSlots:12,weapons:{aam:8,ir:2,asm:2,arm:2,pgm:6}});
  a('su30mki','Su-30MKI（重型反舰配置）','印度','multirole','uac','以印度改进型为基础；重型反舰挂载牺牲其他载荷。',{cost:28,hp:55,endurance:110,payloadSlots:10,weapons:{aam:6,ir:2,supersonic:1,pgm:6},profiles:{supersonic:{range:130,minRange:8,damage:100,cooldown:35}}});
  a('su34','Su-34','俄罗斯','strike','uac','专职双座攻击机，以对地精确打击与防空压制分工。',{cost:27,hp:70,speed:570,radar:125,payloadSlots:14,weapons:{ir:2,pgm:8,cruise:4,arm:4,asm:2}});
  a('mig35','MiG-35','俄罗斯','multirole','uac','按公开产品定位建立多用途型号；不把宣传指标当实测数据。',{cost:22,radar:145,weapons:{aam:6,ir:2,asm:2,pgm:4},publicConfig:true});
  a('mig29k','MiG-29K','俄罗斯','navalFighter','uac','舰载多用途型号，适配滑跃甲板。',{period:'upgrade',cost:21,endurance:65,carrierModes:['stobar'],payloadSlots:8});
  a('mig31bm','MiG-31BM','俄罗斯','airSuperiority','uac','远程截击角色，速度和远距空战优先，近距机动较弱。',{cost:28,speed:840,radar:180,evasion:.02,endurance:75,weapons:{aam:6,ir:2},profiles:{aam:{range:115,minRange:4,hit:.74}}});
  a('su33','Su-33','俄罗斯','navalFighter','uac','以舰队制空为主的滑跃舰载机，不默认具备现代反舰弹挂载。',{period:'legacy',cost:21,carrierModes:['stobar'],weapons:{aam:6,ir:4},payloadSlots:10,endurance:70});
  a('rafale_c','Rafale C 阵风','法国','multirole','rafale','多用途任务包括制空、精确打击和反舰，按任务换装。',{cost:25,radar:150,esm:175,payloadSlots:10,weapons:{aam:6,ir:2,asm:1,pgm:6,cruise:2}});
  a('rafale_m','Rafale M 阵风','法国','navalFighter','rafale','海军弹射／阻拦型，可执行制空和对海、对陆打击。',{cost:26,carrierModes:['catapult'],radar:150,esm:175,payloadSlots:10,weapons:{aam:6,ir:2,asm:1,pgm:6,cruise:2}});
  a('typhoon','Eurofighter Typhoon','欧洲联合','multirole','eurofighter','以制空见长的多用途战机；不假定尚未普遍集成的反舰挂载。',{cost:26,radar:155,speed:680,evasion:.16,weapons:{aam:6,ir:2,pgm:4}});
  a('typhoon_fgr4','Typhoon FGR4','英国','multirole','eurofighter','英国多用途配置，加入已公开的远程对陆任务类别。',{cost:27,radar:155,speed:670,payloadSlots:10,weapons:{aam:6,ir:2,pgm:6,cruise:2}});
  a('gripen_c','JAS 39C 鹰狮','瑞典','multirole','gripen','轻型多用途平台，以较低成本兼顾制空与海上打击。',{cost:18,hp:41,radar:125,endurance:70,payloadSlots:8,weapons:{aam:4,ir:2,asm:2,pgm:4}});
  a('gripen_e','JAS 39E 鹰狮','瑞典','multirole','gripen','新型航电与电子防护配置，增强感知与持续作战。',{period:'current',cost:24,radar:155,esm:180,endurance:90,weapons:{aam:6,ir:2,asm:2,pgm:4},payloadSlots:10});
  a('mirage2000_5','Mirage 2000-5','法国','airSuperiority','rafale','现代早期改进的拦截角色，挂载以空空弹为主。',{period:'legacy',cost:17,hp:41,radar:115,speed:610,weapons:{aam:4,ir:2},endurance:65});
  a('mirage2000d','Mirage 2000D','法国','strike','rafale','双座对地攻击角色，侧重精确打击而非远程制空。',{period:'legacy',cost:19,hp:43,radar:90,speed:530,endurance:90,payloadSlots:8,weapons:{ir:2,pgm:6,cruise:1}});
  a('tornado_ids','Tornado IDS','欧洲联合','strike','eurofighter','现代早期低空攻击平台，承担对陆突防与远距攻击。',{period:'legacy',cost:21,hp:55,speed:540,radar:85,payloadSlots:10,weapons:{ir:2,pgm:6,cruise:2}});
  a('tornado_ecr','Tornado ECR','德国','sead','german','电子侦察与反辐射压制型号，保留有限空战自卫。',{period:'legacy',cost:23,radar:90,esm:180,jammer:35,weapons:{ir:2,arm:4},payloadSlots:8});
  a('f2a','F-2A','日本','multirole','jasdf','日本海上打击取向的多用途机，反舰载荷优先。',{cost:24,radar:145,payloadSlots:10,weapons:{aam:4,ir:2,asm:4,pgm:4},profiles:{asm:{range:105}}});
  a('f15j','F-15J','日本','airSuperiority','jasdf','按基础制空配置建模，不混入尚未确认的升级武器。',{period:'legacy',cost:22,speed:700,radar:140,weapons:{aam:6,ir:2}});
  a('f15k','F-15K Slam Eagle','韩国','multirole','boeing','韩国双座多用途配置，兼顾远程打击与海上任务。',{cost:27,hp:54,payloadSlots:12,endurance:105,weapons:{aam:6,ir:2,asm:2,pgm:6,cruise:2}});
  a('fa50','FA-50','韩国','multirole','kai','轻型战斗／攻击平台，按基础配置保留近程自卫，不假定所有出口升级。',{cost:12,hp:34,radar:70,endurance:60,weapons:{ir:4,pgm:4},payloadSlots:6});
  a('kf21','KF-21 Boramae Block I','韩国','airSuperiority','kai','按公开的初期制空定位建模，不提前加入后续对地集成。',{period:'current',cost:26,radar:155,signature:.7,weapons:{aam:6,ir:2},publicConfig:true});
  a('tejas_mk1','Tejas Mk1 光辉','印度','multirole','hal','轻型多用途机，以有限载荷和较低成本承担空战与对地任务。',{cost:15,hp:38,radar:100,endurance:65,weapons:{aam:4,ir:2,pgm:4},payloadSlots:7});
  a('tejas_mk1a','Tejas Mk1A 光辉','印度','multirole','hal','按公开航电改进方案建模，不推定未披露武器集成。',{period:'current',cost:19,hp:39,radar:135,esm:145,endurance:70,weapons:{aam:4,ir:2,pgm:4},publicConfig:true});
  // Long-range strike aviation carries conventional game weapons only.
  a('b1b','B-1B Lancer','美国','maritimeStrike','usaf','大载荷常规远程攻击；海上打击按公开 LRASM 任务类别抽象。',{cost:39,hp:105,speed:570,endurance:240,payloadSlots:24,weapons:{asm:8,pgm:16,cruise:12},signature:1.7});
  a('b52h','B-52H','美国','strike','usaf','远程常规防区外打击，速度低、目标大，需要制空保护。',{cost:34,hp:115,speed:400,endurance:300,payloadSlots:24,signature:2,weapons:{pgm:16,cruise:12}});
  a('b2a','B-2A Spirit','美国','stealthStrike','usaf','低可探测对陆攻击平台，无空空或反舰挂载。',{category:'strike',cost:43,hp:90,speed:440,endurance:260,radar:95,signature:.2,payloadSlots:16,weapons:{pgm:16},internalPgm:16,internalAam:0});
  a('h6k','轰-6K','中国','strike','chinaAir','远程对陆巡航打击；不把其他轰-6 改型的任务混入本型号。',{cost:30,hp:95,speed:420,endurance:230,payloadSlots:16,signature:1.8,weapons:{cruise:6,pgm:8}});
  a('h6j','轰-6J','中国','maritimeStrike','chinaAir','海上方向远程精确打击角色，强化远距反舰任务。',{period:'current',cost:34,hp:95,speed:430,endurance:220,payloadSlots:18,weapons:{supersonic:4,asm:4},profiles:{supersonic:{range:145,minRange:8}},signature:1.8});
  a('tu22m3','Tu-22M3','俄罗斯','maritimeStrike','uac','远程海上攻击角色，以少量重型反舰弹形成突击。',{period:'legacy',cost:34,hp:100,speed:600,endurance:200,payloadSlots:16,weapons:{supersonic:3,pgm:8},profiles:{supersonic:{range:140,minRange:10}},signature:1.8});
  a('tu160m','Tu-160M','俄罗斯','strike','uac','大型远程巡航导弹载机；常规对陆配置，不设制空功能。',{period:'current',cost:39,hp:120,speed:550,endurance:300,payloadSlots:24,signature:2,weapons:{cruise:12}});
  a('tu95ms','Tu-95MS','俄罗斯','strike','uac','低速长航时防区外打击平台，需保护其航线。',{period:'legacy',cost:30,hp:100,speed:350,endurance:300,payloadSlots:16,signature:2,weapons:{cruise:8}});
  // Surveillance, ASW and refuelling aircraft.
  a('e2d','E-2D 先进鹰眼','美国','awacs','usn','舰载固定翼预警，适配弹射航母，扩大海上态势。',{period:'current',cost:29,speed:300,radar:220,endurance:180,carrierModes:['catapult']});
  a('e2c','E-2C 鹰眼','美国','awacs','usn','现代早期舰载预警平台，探测与处理效能较新型低。',{period:'legacy',cost:23,speed:280,radar:180,endurance:165,carrierModes:['catapult']});
  a('e3g','E-3G Sentry','美国','awacs','usaf','大型陆基空中预警与指挥平台，不能在航母起降。',{cost:30,speed:380,radar:225,endurance:250,signature:1.9});
  a('e7','E-7 Wedgetail','美国','awacs','usaf','多任务电子扫描预警平台，支援空海态势共享。',{period:'current',cost:31,speed:390,radar:230,endurance:240});
  a('kj500','空警-500A','中国','awacs','chinaAir','中型预警与体系支援角色，具备公开空中受油改进。',{period:'current',cost:27,speed:300,radar:205,endurance:220});
  a('kj2000','空警-2000','中国','awacs','chinaAir','大型预警平台，长航时与大范围态势优先。',{cost:30,speed:370,radar:220,endurance:235,signature:1.9});
  a('kj600','空警-600','中国','awacs','china','已公开完成福建舰弹射与着舰训练的舰载预警机。',{period:'current',cost:28,speed:290,radar:210,endurance:170,carrierModes:['catapult'],publicConfig:true});
  a('a50u','A-50U','俄罗斯','awacs','uac','大型空中预警与控制平台，需远离敌方截击机。',{cost:28,speed:370,radar:210,endurance:230,signature:1.9});
  a('globaleye','GlobalEye','瑞典','awacs','globaleye','多域预警与海面监视，强调航时和态势融合。',{period:'current',cost:32,speed:390,radar:230,endurance:270,esm:215});
  a('g550_caew','G550 CAEW','以色列','awacs','iai','共形阵列空中预警平台，可为友军提供态势信息。',{cost:28,speed:400,radar:210,endurance:230});
  a('p8a','P-8A Poseidon','美国','patrol','usn','喷气式海上巡逻／反潜机，依靠浮标与轻型鱼雷搜索潜艇。',{period:'current',cost:27,speed:390,radar:185,sonar:33,endurance:210,weapons:{asm:4,torpedo:6}});
  a('p3c','P-3C Orion','美国','patrol','kawasaki','现代早期长航时反潜巡逻机，速度低但可持续搜索。',{period:'legacy',cost:22,speed:280,radar:150,sonar:31,endurance:250});
  a('p1','P-1','日本','patrol','kawasaki','专用海上巡逻／反潜平台，组合海面搜索与浮标任务。',{period:'current',cost:28,speed:370,radar:190,sonar:35,endurance:220});
  a('atl2','Atlantique 2','法国','patrol','navalGroup','长航时海上巡逻，兼顾反舰与反潜任务。',{cost:23,speed:270,radar:155,sonar:33,endurance:250,weapons:{asm:2,torpedo:6}});
  a('kq200','空潜-200 / 运-8Q','中国','patrol','chinaFleet','以反潜搜索和海面巡逻为定位的专用航空平台。',{cost:24,speed:290,radar:165,sonar:34,endurance:220,weapons:{torpedo:6}});
  a('c295_mpa','C295 MPA/ASW','西班牙','patrol','airbus','武装海上巡逻／反潜型；与无武装 MSA 版本区分。',{cost:18,hp:50,speed:245,radar:125,sonar:27,endurance:200,weapons:{torpedo:4,asm:2},payloadSlots:8});
  a('mh60r','MH-60R Seahawk','美国','aswHelo','mh60','舰载反潜与反水面任务，组合吊放声呐、鱼雷和近距导弹。',{cost:14,radar:65,sonar:35,weapons:{torpedo:4,atgm:4}});
  a('mh60s','MH-60S Seahawk','美国','attackHelo','mh60s','海上多任务直升机，按近距武装支援配置建模，无吊放声呐。',{cost:12,weapons:{atgm:6},radar:0,eoRange:10});
  a('sh60k','SH-60K','日本','aswHelo','jmsdf','舰载反潜型号，以声呐、浮标与鱼雷分工。',{sonar:36,weapons:{torpedo:4},cost:14});
  a('z20f','直-20F','中国','aswHelo','chinaFleet','按公开海军反潜型号族建模，载荷与传感器数值为游戏抽象。',{period:'current',cost:14,sonar:34,weapons:{torpedo:4,atgm:4},publicConfig:true});
  a('z9c','直-9C','中国','aswHelo','chinaFleet','轻型舰载反潜平台，载荷少但部署成本低。',{period:'legacy',cost:10,hp:30,speed:140,radar:40,sonar:26,endurance:100,weapons:{torpedo:2},payloadSlots:4});
  a('z18f','直-18F','中国','aswHelo','chinaFleet','较大型舰载反潜平台，强化持续搜索与载荷。',{cost:16,hp:48,sonar:39,endurance:160,weapons:{torpedo:6},payloadSlots:12});
  a('z18j','直-18J','中国','heloAwacs','chinaFleet','舰载旋翼预警角色，覆盖小于固定翼预警机。',{cost:18,hp:48,radar:145,carrierModes:['helicopter']});
  a('merlin_hm2','Merlin HM2','英国','aswHelo','royal','重型舰载反潜直升机，长航时和吊放声呐是主要优势。',{cost:16,hp:45,sonar:39,endurance:165,weapons:{torpedo:4},payloadSlots:8});
  a('merlin_crowsnest','Merlin Crowsnest','英国','heloAwacs','royal','旋翼预警任务配置，服务于短距起降航母体系。',{cost:18,hp:45,radar:145,endurance:155});
  a('wildcat_hma2','Wildcat HMA2','英国','attackHelo','royal','舰载侦察与近海攻击，以轻型反舰／近距导弹分工。',{cost:14,radar:65,weapons:{asm:4,atgm:6},payloadSlots:8,profiles:{asm:{range:22,minRange:1,damage:40,hit:.8,seeker:5,speed:650}}});
  a('nh90_nfh','NH90 NFH','欧洲联合','aswHelo','navalGroup','舰载反潜型，不能把通用运输型任务直接视作同一挂载。',{cost:14,sonar:35,weapons:{torpedo:4,asm:2},profiles:{asm:{range:35,damage:45}},payloadSlots:8});
  a('ka27pl','Ka-27PL','俄罗斯','aswHelo','uac','舰载反潜型号，按吊放声呐与鱼雷配置。',{period:'legacy',cost:12,sonar:32,radar:45,weapons:{torpedo:4}});
  a('ka31','Ka-31','俄罗斯','heloAwacs','uac','旋翼预警平台，可为滑跃航母补充海空态势。',{period:'legacy',cost:16,radar:125,endurance:130});
  a('ka52k','Ka-52K','俄罗斯','attackHelo','uac','舰载攻击直升机，以近距精确武器支援海岸与小型目标。',{cost:15,hp:43,radar:45,weapons:{atgm:8,ir:2},eoRange:11});
  a('kc135r','KC-135R','美国','tanker','usaf','空中加油支援，按飞杆体系提供受油兼容性。',{period:'legacy',cost:20,refuelSystems:['boom'],fuelSupply:16000});
  a('kc46a','KC-46A Pegasus','美国','tanker','usaf','新一代加油平台，飞杆与软管支援统一为受油接口选择。',{period:'current',cost:26,refuelSystems:['boom','probe'],fuelSupply:22000,refuelRate:16});
  a('a330_mrtt','A330 MRTT','欧洲联合','tanker','mrtt','多用途加油平台，提供较大的航空燃油支援储备。',{cost:27,refuelSystems:['boom','probe'],fuelSupply:24000,endurance:270});
  a('il78m','Il-78M','俄罗斯','tanker','uac','软管加油平台，为兼容受油机延长任务时间。',{period:'legacy',cost:22,refuelSystems:['probe'],fuelSupply:19000,speed:400});
  a('yy20','运油-20','中国','tanker','chinaAir','大型空中加油平台，支援具备受油能力的友军机群。',{period:'current',cost:26,refuelSystems:['probe'],fuelSupply:23000});
  // Carrier and helicopter groups below are deliberately small GAME air wings, not real complements.
  const deck=(modes,capacity,wing,cooldown=45)=>({modes,capacity,wing,cooldown});
  n('cvn_ford','福特级航空母舰','美国','carrier','usn','弹射／阻拦航空母舰，依靠航空联队作战，舰体需护航。',{period:'current',cost:98,hp:560,deck:deck(['catapult','helicopter'],6,{fa18e:3,fa18f:1,f35c:2,ea18g:1,e2d:1,mh60r:1},40)});
  n('cvn_nimitz','尼米兹级航空母舰','美国','carrier','usn','以现代航空联队配置建模，舰载机与支援航空协同。',{cost:90,deck:deck(['catapult','helicopter'],5,{fa18e:3,fa18f:1,f35c:1,ea18g:1,e2d:1,mh60r:1},50)});
  n('cv_queen_elizabeth','伊丽莎白女王级','英国','carrier','ukFleet','短距／垂直起降航空体系，固定翼战斗机与旋翼预警组合。',{period:'current',cost:75,hp:460,deck:deck(['stovl','helicopter'],4,{f35b:4,merlin_hm2:1,merlin_crowsnest:1}),weapons:{point:0},ciws:28});
  n('cv_charles','戴高乐级航空母舰','法国','carrier','navalGroup','弹射舰载阵风与固定翼预警机的航空运用平台。',{cost:78,hp:440,deck:deck(['catapult','helicopter'],4,{rafale_m:4,e2c:1,nh90_nfh:1}),weapons:{sam:24,point:16},profiles:{sam:{range:35}}});
  n('cv_liaoning','辽宁舰（001 型）','中国','carrier','china','滑跃航空母舰，使用歼-15 与旋翼预警／反潜支援。',{cost:72,hp:470,deck:deck(['stobar','helicopter'],4,{j15:4,z18j:1,z18f:1}),weapons:{point:32}});
  n('cv_shandong','山东舰（002 型）','中国','carrier','china','滑跃航空运用平台，较前型增加游戏航空运用容量。',{period:'current',cost:79,hp:490,deck:deck(['stobar','helicopter'],5,{j15:5,z18j:1,z18f:1}),weapons:{point:32}});
  n('cv_fujian','福建舰（003 型）','中国','carrier','china','电磁弹射与阻拦回收，按公开三型舰载机适配结果配置。',{period:'current',cost:98,hp:550,deck:deck(['catapult','helicopter'],6,{j15t:3,j35:2,j15dt:1,kj600:1,z20f:1},40),publicConfig:true});
  n('cv_vikrant','维克兰特级航空母舰','印度','carrier','india','滑跃舰载航空平台，以 MiG-29K 和旋翼支援编组。',{period:'current',cost:70,hp:430,deck:deck(['stobar','helicopter'],4,{mig29k:4,ka31:1,ka27pl:1}),weapons:{point:24}});
  n('cv_vikramaditya','维克拉玛蒂亚号','印度','carrier','india','改装滑跃航母，依靠舰载机建立制空与海上打击。',{cost:67,hp:420,deck:deck(['stobar','helicopter'],4,{mig29k:4,ka31:1,ka27pl:1}),weapons:{point:20}});
  n('lha_america','美国级两栖攻击舰','美国','amphibious','usn','以航空作战与两栖支援为定位，游戏中侧重短距舰载航空。',{period:'current',cost:66,hp:430,deck:deck(['stovl','helicopter'],4,{f35b:3,mh60s:2},55)});
  n('lhd_wasp','黄蜂级两栖攻击舰','美国','amphibious','usn','两栖航空平台，按现代 F-35B 支援配置建模。',{cost:60,deck:deck(['stovl','helicopter'],3,{f35b:2,mh60s:2},60)});
  n('lhd075','075 型两栖攻击舰','中国','amphibious','chinaFleet','直升机航空与两栖支援平台，不假设可运用固定翼隐身战斗机。',{period:'current',cost:57,deck:deck(['helicopter'],3,{z20f:2,z18f:1,z9c:1}),weapons:{point:24}});
  n('lpd071','071 型船坞登陆舰','中国','amphibious','chinaFleet','船坞登陆与直升机支援；登陆部队本版以运输职责抽象。',{cost:43,hp:320,deck:deck(['helicopter'],2,{z18f:1,z9c:1}),weapons:{gun:30},ciws:16});
  n('lhd_mistral','西北风级两栖舰','法国','amphibious','navalGroup','直升机与两栖指挥支援，不作为弹射航母使用。',{cost:46,hp:330,deck:deck(['helicopter'],3,{nh90_nfh:2}),weapons:{point:12,gun:20}});
  n('lhd_trieste','的里雅斯特级','意大利','amphibious','fincantieri','航空与两栖支援，短距／垂直起降航空任务单独配备。',{period:'current',cost:61,hp:390,deck:deck(['stovl','helicopter'],3,{f35b:2,nh90_nfh:2}),weapons:{point:20,gun:30}});
  n('lhd_juan_carlos','胡安·卡洛斯 I 级','西班牙','amphibious','navantia','短距航空与两栖支援组合，基础航空组使用 AV-8B。',{cost:49,hp:350,deck:deck(['stovl','helicopter'],3,{av8b:3,nh90_nfh:1}),weapons:{point:0,gun:20},ciws:12});
  n('lhd_canberra','堪培拉级两栖舰','澳大利亚','amphibious','australia','直升机两栖航空平台，不因有滑跃甲板就自动获得 F-35B 航空组。',{cost:47,hp:360,deck:deck(['helicopter'],3,{mh60r:2,mh60s:1}),weapons:{point:0,gun:20}});
  n('ddh_izumo','出云级航空护卫舰','日本','amphibious','jmsdf','按直升机运用配置建模；固定翼改装与认证进度不在此统一假定。',{cost:52,hp:360,deck:deck(['helicopter'],3,{sh60k:3}),weapons:{point:20}});
  n('lph_dokdo','独岛级两栖舰','韩国','amphibious','hanwha','直升机与两栖支援平台，不具备弹射战斗机运用能力。',{cost:44,hp:320,deck:deck(['helicopter'],2,{mh60s:2}),weapons:{point:20}});
  // Surface combatants: launcher counts constrain GAME inventories and are not claimed as real magazine loadouts.
  const usVls={sam:1,point:.25,asroc:1,cruise:1},cnVls={sam:1,asroc:1,cruise:1,asm:1};
  const helo=(type,count=1)=>deck(['helicopter'],count,{[type]:count},60);
  n('ddg_burke2a','阿利·伯克级 Flight IIA','美国','aad','burke','宙斯盾多任务驱逐舰，以防空、反潜和对陆弹库分配体现选择。',{cost:43,vlsCells:96,vlsWeapons:usVls,weapons:{sam:64,point:32,asroc:12,torpedo:6,cruise:24,gun:48},deck:helo('mh60r',2),baseSupply:50,profiles:{sam:{range:90}}});
  n('ddg_burke3','阿利·伯克级 Flight III','美国','aad','burke','新一代雷达配置，强化编队防空，但仍受火控与弹库限制。',{period:'current',cost:49,radar:195,channels:8,hp:210,vlsCells:96,vlsWeapons:usVls,weapons:{sam:64,point:32,asroc:12,torpedo:6,cruise:24,gun:48},deck:helo('mh60r',2),baseSupply:50,profiles:{sam:{range:110}}});
  n('ddg_zumwalt','朱姆沃尔特级','美国','multimission','zumwalt','低可探测大型水面舰，重视远程打击；不假设无弹药舰炮可用。',{cost:48,hp:240,signature:.55,radar:155,vlsCells:80,vlsWeapons:usVls,weapons:{sam:48,point:24,cruise:40},deck:helo('mh60r'),baseSupply:40});
  n('cg_ticonderoga','提康德罗加级','美国','aad','usn','现代早期宙斯盾巡洋舰配置，大弹库与较大舰体共存。',{period:'legacy',cost:47,hp:220,radar:170,vlsCells:122,vlsWeapons:usVls,deck:helo('mh60r',2),baseSupply:50});
  n('ddg055','055 型驱逐舰','中国','aad','chinaFleet','大型多任务水面舰，兼顾编队防空、反舰与反潜。',{period:'current',cost:49,hp:230,radar:185,channels:8,vlsCells:112,vlsWeapons:cnVls,deck:helo('z20f',2),baseSupply:50,profiles:{sam:{range:105},asm:{range:125,speed:950}},weapons:{sam:64,point:32,asm:12,asroc:12,torpedo:6,cruise:24,gun:48}});
  n('ddg052d','052D 型驱逐舰','中国','multimission','chinaFleet','通用垂直发射的多任务驱逐舰，在防空与打击间分配弹库。',{cost:36,radar:145,vlsCells:64,vlsWeapons:cnVls,deck:helo('z9c'),baseSupply:30,profiles:{sam:{range:90},asm:{range:110}}});
  n('ddg052dl','052D 改进型（加长甲板）','中国','multimission','chinaFleet','按公开加长甲板配置区别于前型，增加中型反潜直升机运用。',{period:'current',cost:39,radar:150,vlsCells:64,vlsWeapons:cnVls,deck:helo('z20f'),baseSupply:35,profiles:{sam:{range:95}}});
  n('ddg052c','052C 型驱逐舰','中国','aad','chinaFleet','早期相控阵区域防空舰，反舰弹与防空发射装置分开。',{period:'legacy',cost:31,radar:135,channels:4,vlsCells:48,vlsWeapons:{sam:1},weapons:{sam:48,asm:8,torpedo:6,gun:36},deck:helo('z9c'),baseSupply:25,profiles:{sam:{range:80}}});
  n('ddg_type45','45 型 Daring 级','英国','aad','royal','以舰队区域防空为主，反潜和对陆能力不照搬多任务美舰。',{cost:42,radar:180,sonar:18,channels:7,vlsCells:48,vlsWeapons:{sam:1},weapons:{sam:48,asm:8,gun:40},deck:helo('wildcat_hma2'),baseSupply:35,profiles:{sam:{range:100,guidance:'active',seeker:12}}});
  n('ddg_hobart','霍巴特级','澳大利亚','aad','australia','以宙斯盾编队防空和多任务护航为定位。',{cost:38,hp:175,vlsCells:48,vlsWeapons:{sam:1,point:.25},weapons:{sam:40,point:24,asm:8,torpedo:6,gun:36},deck:helo('mh60r'),baseSupply:35,profiles:{sam:{range:90}}});
  n('ddg_kongo','金刚级','日本','aad','jmsdf','早期宙斯盾防空舰，依赖编队补充有机反潜航空。',{period:'legacy',cost:36,vlsCells:90,vlsWeapons:{sam:1,asroc:1},weapons:{sam:64,asm:8,asroc:16,torpedo:6,gun:40},profiles:{sam:{range:90}}});
  n('ddg_atago','爱宕级','日本','aad','jmsdf','区域防空与反潜护航组合，具有有机直升机支援。',{cost:42,vlsCells:96,vlsWeapons:{sam:1,asroc:1},weapons:{sam:64,asm:8,asroc:16,torpedo:6,gun:40},deck:helo('sh60k'),baseSupply:35,profiles:{sam:{range:100}}});
  n('ddg_maya','摩耶级','日本','aad','jmsdf','现代网络化区域防空舰，兼顾反潜与舰队协同。',{period:'current',cost:47,radar:180,channels:8,vlsCells:96,vlsWeapons:{sam:1,asroc:1},weapons:{sam:72,asm:8,asroc:16,torpedo:6,gun:40},deck:helo('sh60k'),baseSupply:40,profiles:{sam:{range:110}}});
  n('ddg_akizuki','秋月级护卫舰','日本','asw','jmsdf','反潜与近中程编队防空，支持较高效的舰载反潜航空。',{category:'destroyer',cost:32,radar:125,sonar:40,vlsCells:32,vlsWeapons:{sam:1,point:.25,asroc:1},deck:helo('sh60k'),baseSupply:35,profiles:{sam:{range:45}}});
  n('ddg_asahi','朝日级护卫舰','日本','asw','jmsdf','更侧重反潜搜索与安静航行的现代护航配置。',{category:'destroyer',period:'current',cost:33,sonar:44,vlsCells:32,vlsWeapons:{point:.25,asroc:1},weapons:{point:32,asm:8,asroc:16,torpedo:8,gun:36},deck:helo('sh60k'),baseSupply:35});
  n('ddg_sejong','世宗大王级 Batch I','韩国','aad','hhi','大型宙斯盾驱逐舰，以大弹库和多用途任务组合分工。',{cost:47,hp:225,vlsCells:128,vlsWeapons:{sam:1,asroc:1,cruise:1},weapons:{sam:72,point:24,asm:16,asroc:16,torpedo:6,cruise:24,gun:45},deck:helo('mh60r',2),baseSupply:45});
  n('ddg_jeongjo','正祖大王级 Batch II','韩国','aad','hhi','新一代 KDX-III 改进配置，强化传感器与协同防空。',{period:'current',cost:49,hp:230,radar:185,channels:8,vlsCells:88,vlsWeapons:{sam:1,asroc:1,cruise:1},weapons:{sam:64,point:24,asm:8,asroc:16,torpedo:6,cruise:24,gun:45},deck:helo('mh60r',2),baseSupply:45});
  n('ddg_kdx2','忠武公李舜臣级','韩国','multimission','hanwha','中型多任务防空舰，以区域护航与反潜兼顾。',{cost:33,hp:165,vlsCells:64,vlsWeapons:{sam:1,asroc:1,cruise:1},deck:helo('mh60r'),baseSupply:30,profiles:{sam:{range:70}}});
  n('ddg_kolkata','加尔各答级','印度','aad','india','区域防空和重型反舰组合，舰载反潜航空提供搜索。',{cost:40,hp:190,vlsCells:48,vlsWeapons:{sam:1,supersonic:1},weapons:{sam:40,point:16,supersonic:16,torpedo:6,gun:40},deck:helo('ka27pl',2),baseSupply:40,profiles:{sam:{range:80,guidance:'active',seeker:10}}});
  n('ddg_visakhapatnam','维沙卡帕特南级','印度','aad','india','项目 15B 改进型，多任务护航与远程反舰并重。',{period:'current',cost:43,hp:200,radar:165,vlsCells:48,vlsWeapons:{sam:1,supersonic:1},weapons:{sam:40,point:16,supersonic:16,torpedo:6,gun:40},deck:helo('mh60r',2),baseSupply:40,profiles:{sam:{range:85,guidance:'active',seeker:10}}});
  n('ddg_horizon','Horizon / 地平线级','欧洲联合','aad','fincantieri','法意区域防空舰，以主动舰空弹护卫航空与水面编队。',{cost:40,radar:170,channels:6,vlsCells:48,vlsWeapons:{sam:1},weapons:{sam:48,point:16,asm:8,torpedo:6,gun:40},deck:helo('nh90_nfh'),baseSupply:35,profiles:{sam:{range:95,guidance:'active',seeker:12}}});
  // Frigates and littoral combatants.
  n('ffg054a','054A 型护卫舰','中国','asw','chinaFleet','均衡护航平台，组合中程防空、拖曳／舰壳声呐与舰载航空。',{cost:25,radar:100,sonar:34,vlsCells:32,vlsWeapons:{sam:1,asroc:1},weapons:{sam:32,asm:8,asroc:8,torpedo:6,gun:35},deck:helo('z9c'),baseSupply:25,profiles:{sam:{range:45}}});
  n('ffg054b','054B 型护卫舰','中国','asw','china054','新型中型护卫舰，按公开综合作战定位增强传感器与航空支援。',{period:'current',cost:32,hp:155,radar:135,sonar:41,vlsCells:32,vlsWeapons:{sam:1,asroc:1},weapons:{sam:32,point:24,asm:8,asroc:12,torpedo:6,gun:40},deck:helo('z20f'),baseSupply:35,profiles:{sam:{range:55}},publicConfig:true});
  n('ffg_fremm_fr','FREMM 阿基坦级','法国','asw','navalGroup','法国反潜型 FREMM，兼顾有限区域防空与对陆巡航打击。',{cost:34,sonar:44,vlsCells:32,vlsWeapons:{sam:1,cruise:1},weapons:{sam:24,asm:8,torpedo:8,cruise:16,gun:36},deck:helo('nh90_nfh'),baseSupply:35,profiles:{sam:{range:55,guidance:'active',seeker:10}}});
  n('ffg_fremm_aa','FREMM 防空增强型','法国','aad','navalGroup','FREMM 系列防空取向配置，取舍反潜与对陆弹库。',{category:'frigate',cost:36,hp:160,vlsCells:32,vlsWeapons:{sam:1},weapons:{sam:32,asm:8,torpedo:6,gun:36},deck:helo('nh90_nfh'),baseSupply:30,profiles:{sam:{range:90,guidance:'active',seeker:12}}});
  n('ffg_fremm_it_gp','FREMM 贝尔加米尼通用型','意大利','multimission','fincantieri','意大利通用任务配置，兼顾反舰、舰炮与区域护航。',{category:'frigate',cost:31,hp:155,vlsCells:16,vlsWeapons:{sam:1},weapons:{sam:24,asm:8,torpedo:6,gun:54},deck:helo('nh90_nfh',2),baseSupply:35,profiles:{sam:{range:70,guidance:'active',seeker:10},gun:{range:9,damage:20}}});
  n('ffg_fremm_it_asw','FREMM 意大利反潜型','意大利','asw','fincantieri','反潜取向配置，以更强搜索与有机航空护航。',{cost:33,sonar:44,vlsCells:16,vlsWeapons:{sam:1},weapons:{sam:24,asm:8,torpedo:10,gun:36},deck:helo('nh90_nfh',2),baseSupply:40,profiles:{sam:{range:65,guidance:'active',seeker:10}}});
  n('ffg_fdi','FDI 防御干预护卫舰','法国','multimission','navalGroup','数字化多用途护卫舰，紧凑舰体承载现代传感器。',{category:'frigate',period:'current',cost:35,hp:145,radar:160,sonar:37,vlsCells:32,vlsWeapons:{sam:1},weapons:{sam:32,asm:8,torpedo:6,gun:36},deck:helo('nh90_nfh'),baseSupply:30,profiles:{sam:{range:85,guidance:'active',seeker:12}}});
  n('ffg_type23','23 型公爵级','英国','asw','ukFleet','反潜护航为核心，舰空弹与反舰弹承担自卫和反水面任务。',{period:'legacy',cost:28,sonar:43,vlsCells:32,vlsWeapons:{point:1},weapons:{point:32,asm:8,torpedo:8,gun:38},deck:helo('merlin_hm2'),baseSupply:35,profiles:{point:{range:20,seeker:8}}});
  n('ffg_f124','F124 萨克森级','德国','aad','german','以区域防空和编队指挥为定位的护卫舰。',{category:'frigate',cost:37,hp:160,vlsCells:32,vlsWeapons:{sam:1,point:.25},weapons:{sam:32,point:32,asm:8,torpedo:6,gun:36},deck:helo('nh90_nfh',2),baseSupply:35,profiles:{sam:{range:90}}});
  n('ffg_f125','F125 巴登-符腾堡级','德国','multimission','german','远洋持续部署与海岸支援配置，不给本型虚构区域防空垂发。',{category:'frigate',period:'current',cost:29,hp:175,radar:110,sonar:0,weapons:{point:32,asm:8,gun:60},deck:helo('nh90_nfh',2),baseSupply:45,profiles:{point:{range:12},gun:{range:9,damage:18}}});
  n('ffg_f123','F123 勃兰登堡级','德国','asw','german','现代早期反潜护卫舰，以声呐与直升机补强搜索。',{period:'legacy',cost:25,sonar:36,vlsCells:16,vlsWeapons:{point:1},weapons:{point:24,asm:4,torpedo:8,gun:35},deck:helo('nh90_nfh',2),baseSupply:30});
  n('ffg_f100','F100 阿尔瓦罗·德·巴赞级','西班牙','aad','navantia','宙斯盾区域防空护卫舰，兼具反水面与反潜自卫。',{category:'frigate',cost:36,hp:165,vlsCells:48,vlsWeapons:{sam:1,point:.25},weapons:{sam:40,point:24,asm:8,torpedo:6,gun:40},deck:helo('mh60r'),baseSupply:30,profiles:{sam:{range:90}}});
  n('ffg_nansen','弗里德约夫·南森级','挪威','asw','norway','以反潜护航和近海反舰为定位，区域防空弹库较紧。',{cost:28,hp:140,radar:120,sonar:40,vlsCells:8,vlsWeapons:{point:.25},weapons:{point:32,asm:8,torpedo:8,gun:36},deck:helo('mh60r'),baseSupply:30});
  n('ffg_zeven','七省级','荷兰','aad','dutch','防空与编队指挥护卫舰，强调空中态势与舰空拦截。',{category:'frigate',cost:37,hp:165,radar:175,vlsCells:40,vlsWeapons:{sam:1,point:.25},weapons:{sam:40,point:32,asm:8,torpedo:6,gun:40},deck:helo('nh90_nfh'),baseSupply:30,profiles:{sam:{range:95}}});
  n('ffg_anzac','安扎克级（改进配置）','澳大利亚','asw','australia','以改进传感器、近中程防空和反潜航空护航。',{cost:27,hp:125,radar:125,sonar:35,vlsCells:8,vlsWeapons:{point:.25},weapons:{point:32,asm:8,torpedo:6,gun:36},deck:helo('mh60r'),baseSupply:30,profiles:{point:{range:25,seeker:10}}});
  n('ffg_daegu','大邱级 FFX-II','韩国','asw','hhi','中型反潜护卫舰，结合反潜火力与航空搜索。',{cost:25,hp:125,vlsCells:16,vlsWeapons:{asroc:1,cruise:1},weapons:{point:16,asm:8,asroc:12,torpedo:8,cruise:8,gun:40},deck:helo('mh60r'),baseSupply:25});
  n('ffg_chungnam','忠南级 FFX-III','韩国','multimission','hhi','新一代传感器与多用途任务配置，保留中型舰的弹库取舍。',{category:'frigate',period:'current',cost:30,hp:140,radar:145,sonar:36,vlsCells:16,vlsWeapons:{sam:1,asroc:1,cruise:1},weapons:{sam:24,point:16,asm:8,asroc:8,torpedo:6,cruise:8,gun:40},deck:helo('mh60r'),baseSupply:30,profiles:{sam:{range:50}}});
  n('ffg_shivalik','什瓦利克级','印度','asw','india','多用途隐身护卫舰，组合反潜护航与较强反舰火力。',{cost:29,hp:155,radar:110,sonar:38,weapons:{sam:24,point:16,supersonic:8,torpedo:8,gun:38},deck:helo('ka27pl',2),baseSupply:35,profiles:{sam:{range:40}}});
  n('ffg_nilgiri','尼尔吉里级 Project 17A','印度','multimission','india','现代隐身多用途护卫舰，在中型舰体上强化协同作战。',{category:'frigate',period:'current',cost:36,hp:165,radar:150,sonar:40,vlsCells:40,vlsWeapons:{sam:1,supersonic:1},weapons:{sam:32,point:16,supersonic:8,torpedo:8,gun:40},deck:helo('mh60r',2),baseSupply:35,profiles:{sam:{range:75,guidance:'active',seeker:10}}});
  n('ffg_talwar','塔尔瓦级','印度','multimission','india','俄制设计的多用途护卫舰，侧重护航与反舰突击。',{category:'frigate',period:'legacy',cost:27,hp:140,radar:100,sonar:32,weapons:{sam:24,point:12,supersonic:8,torpedo:6,gun:36},deck:helo('ka27pl'),baseSupply:25,profiles:{sam:{range:35}}});
  n('ffg_istanbul','伊斯坦布尔级','土耳其','multimission','stm','MILGEM 延伸多用途护卫舰，兼顾防空、反舰与反潜。',{category:'frigate',period:'current',cost:29,hp:130,radar:125,sonar:32,vlsCells:16,vlsWeapons:{sam:1},weapons:{sam:24,point:16,asm:8,torpedo:6,gun:36},deck:helo('mh60r'),baseSupply:25,profiles:{sam:{range:45}}});
  n('ffg_sigma10514','SIGMA 10514','荷兰','asw','damen','模块化护卫舰，以印尼武装配置的任务类别近似。',{cost:24,hp:115,radar:100,sonar:30,vlsCells:12,vlsWeapons:{point:1},weapons:{point:16,asm:8,torpedo:6,gun:30},deck:helo('nh90_nfh'),baseSupply:25,profiles:{point:{range:20}}});
  n('ffg_lafayette','拉斐特级（反潜改进）','法国','asw','navalGroup','按部分舰改进配置建模，不给所有舰统一添加区域防空。',{cost:22,hp:120,radar:85,sonar:27,weapons:{point:12,asm:8,torpedo:0,gun:36},deck:helo('nh90_nfh'),baseSupply:25,profiles:{point:{range:10}}});
  n('ffg_mogami','最上级 FFM','日本','asw','jmsdf','多用途近海护卫舰，现实兼顾水雷任务，本版实现护航与反潜。',{period:'current',cost:29,hp:130,radar:130,sonar:36,vlsCells:16,vlsWeapons:{asroc:1},weapons:{point:20,asm:8,asroc:12,torpedo:6,gun:40},deck:helo('sh60k'),baseSupply:30,unmodeled:'水雷搜索与扫雷尚未模拟'});
  n('cor056a','056A 型轻型护卫舰','中国','corvette','chinaFleet','近海反潜警戒平台，有着舰点但不把它视作完整航空母舰。',{cost:16,sonar:30,weapons:{point:8,asm:4,torpedo:6,gun:30},deck:deck(['helicopter'],1,{},70),baseSupply:10});
  n('cor_visby','维斯比级','瑞典','corvette','saab','低可探测近海作战舰，强调反舰与反潜，缺乏区域防空。',{cost:19,hp:70,speed:35,signature:.45,sonar:30,weapons:{asm:8,torpedo:6,gun:30}});
  n('cor_ada','Ada 级','土耳其','corvette','stm','近海多任务护卫舰，反潜与有机航空是主要优势。',{cost:21,hp:100,sonar:32,weapons:{point:16,asm:8,torpedo:6,gun:30},deck:helo('mh60r'),baseSupply:25});
  n('cor_gowind','Gowind 2500','法国','corvette','navalGroup','按武装出口型多任务配置建模，客户具体挂载存在差异。',{cost:21,hp:100,radar:90,sonar:30,vlsCells:16,vlsWeapons:{point:1},weapons:{point:16,asm:8,torpedo:6,gun:30},deck:helo('nh90_nfh'),baseSupply:25,profiles:{point:{range:20}}});
  n('cor_k130','K130 不伦瑞克级','德国','corvette','german','近海反舰与警戒平台，不赋予本型舰壳反潜声呐。',{cost:18,hp:85,sonar:0,weapons:{point:24,asm:4,gun:30},ciws:0});
  n('fac022','022 型导弹艇','中国','corvette','chinaFleet','高速近海反舰突击，缺少持续防空与反潜能力。',{cost:11,hp:45,speed:38,radar:38,sonar:0,signature:.65,weapons:{asm:8,gun:15},ciws:4});
  n('fac_skjold','盾牌级 Skjold','挪威','corvette','norway','高速低可探测近海导弹艇，适合短促反舰突击。',{cost:14,hp:50,speed:48,signature:.5,radar:50,sonar:0,weapons:{asm:8,gun:24},ciws:0});
  // Submarines are conventional-weapon combatants; no strategic nuclear weapon modelling.
  n('ssn_virginia','弗吉尼亚级','美国','ssn','usn','攻击核潜艇，兼顾反潜、反舰与常规对陆巡航打击。',{period:'current',cost:38,sonar:52,weapons:{torpedo:20,asm:8,cruise:12}});
  n('ssn_seawolf','海狼级','美国','ssn','usn','高性能反潜核潜艇，以较大鱼雷载荷与搜索能力分工。',{cost:40,hp:125,sonar:56,weapons:{torpedo:24,asm:8,cruise:8}});
  n('ssn_losangeles','洛杉矶级改进型','美国','ssn','usn','现代早期攻击核潜艇配置，兼顾水下搜索与常规打击。',{period:'legacy',cost:31,hp:105,sonar:44,weapons:{torpedo:18,asm:8,cruise:12}});
  n('ssgn_ohio','俄亥俄级 SSGN 改装型','美国','ssgn','ohio','常规巡航导弹打击型；与弹道导弹核潜艇版本明确区分。',{cost:48,hp:155,sonar:44,weapons:{torpedo:12,cruise:48}});
  n('ssn_astute','机敏级','英国','ssn','astute','远洋反潜与常规对陆打击，以长航时水下任务为定位。',{period:'current',cost:38,sonar:53,weapons:{torpedo:20,asm:0,cruise:16}});
  n('ssn_suffren','絮弗伦级 Barracuda','法国','ssn','navalGroup','现代攻击核潜艇，结合反潜、反舰与常规对陆任务。',{period:'current',cost:37,hp:110,sonar:51,weapons:{torpedo:16,asm:6,cruise:10}});
  n('ssgn_yasenm','亚森-M 级','俄罗斯','ssgn','roe','大型巡航导弹核潜艇，远程打击载荷优先。',{period:'current',cost:46,hp:145,sonar:49,weapons:{torpedo:16,supersonic:12,cruise:32}});
  n('ssn_akula','阿库拉级 Project 971','俄罗斯','ssn','roe','现代早期攻击核潜艇，以反潜与反舰任务为主。',{period:'legacy',cost:32,sonar:46,weapons:{torpedo:22,asm:8}});
  n('ssn093','093 型攻击核潜艇族','中国','ssn','chinaFleet','按公开型号族建模，不给未公开改型推定精确性能与武器。',{cost:33,sonar:46,weapons:{torpedo:18,asm:8},publicConfig:true});
  n('ssk039ab','039A/B 型 元级','中国','ssk','chinaFleet','常规动力近海潜艇，低速隐蔽搜索与伏击优先。',{cost:25,sonar:42,weapons:{torpedo:14,asm:6}});
  n('ssk_kilo636','636.3 型 基洛改进型','俄罗斯','ssk','roe','常规动力攻击潜艇，兼顾近海伏击与常规巡航打击。',{cost:28,hp:95,sonar:42,weapons:{torpedo:14,asm:4,cruise:6}});
  n('ssk_soryu','苍龙级','日本','ssk','taigei','现代常规潜艇，以低速水下搜索和近海反潜分工。',{cost:27,hp:95,sonar:45,weapons:{torpedo:16,asm:4}});
  n('ssk_taigei','大鲸级','日本','ssk','taigei','新一代常规动力潜艇，强化持续水下作战的游戏表现。',{period:'current',cost:30,hp:98,sonar:48,acoustic:.7,weapons:{torpedo:18,asm:4}});
  n('ssk212a','212A 型','德国','ssk','german','小型常规潜艇，以近海安静航行和鱼雷伏击分工。',{cost:26,hp:80,sonar:44,acoustic:.65,weapons:{torpedo:12}});
  n('ssk214','214 型','德国','ssk','german','出口型常规潜艇，能力按近海反潜与反舰任务近似。',{cost:25,sonar:42,weapons:{torpedo:14,asm:4}});
  n('ssk_scorpene','鲉鱼级 Scorpène','法国','ssk','navalGroup','常规潜艇设计族，按鱼雷与潜射反舰配置建模。',{cost:25,sonar:42,weapons:{torpedo:14,asm:6}});
  n('ssk_gotland','哥特兰级','瑞典','ssk','saab','近海常规潜艇，低速隐蔽与短距伏击是主要优势。',{cost:24,hp:78,sonar:44,acoustic:.65,weapons:{torpedo:14}});
  n('ssk_kss3','岛山安昌浩级 KSS-III','韩国','ssk','hanwha','大型常规潜艇；本版仅建模常规反潜、反舰和对陆任务类别。',{period:'current',cost:31,hp:110,sonar:45,weapons:{torpedo:16,asm:6,cruise:6}});
  // Replenishment transfers aviation stores only: no at-sea reload of VLS missiles.
  n('aor901','901 型综合补给舰','中国','supply','chinaFleet','快速综合补给，游戏中向航空舰转移有限航空补给点。',{period:'current',cost:29,hp:260,speed:25,baseSupply:220});
  n('aor903a','903A 型综合补给舰','中国','supply','chinaFleet','远洋编队后勤，提供有限航空补给接力。',{cost:22,hp:210,speed:20,baseSupply:160});
  n('aor_supply','Supply 级快速战斗支援舰','美国','supply','usn','快速舰队后勤平台，补给库存有限且自身防御薄弱。',{cost:28,hp:260,speed:25,baseSupply:220});
  n('aor_vulcano','火山级 Vulcano','意大利','supply','vulcano','综合后勤支援；本版实现航空补给库存转移。',{period:'current',cost:24,hp:230,speed:20,baseSupply:185});
  // Public weapon families identify roles; shared projectile physics remain game abstractions.
  const families=(ids,labels,profiles={})=>{for(const id of ids.split(' ')){const t=out[id];if(!t)continue;for(const [key,name] of Object.entries(labels))if(t.weapons[key])t.profiles[key]={...t.profiles[key],name};for(const [key,values] of Object.entries(profiles))t.profiles[key]={...t.profiles[key],...values};}};
  families('f22a f35a f35b f35c f15c f15e f15ex f16c50 f16v70 fa18c fa18e fa18f ea18g',{aam:'AIM-120 AMRAAM 类空空弹',ir:'AIM-9 Sidewinder 类近程弹'});
  families('f15e f15ex',{cruise:'AGM-158 JASSM 类对陆弹药'});
  families('fa18c fa18e fa18f f15k p8a p3c',{asm:'AGM-84 Harpoon 类反舰弹'});
  families('f16c50 f16v70 fa18c fa18e fa18f ea18g',{arm:'AGM-88 HARM 类反辐射弹'});
  families('b1b',{asm:'AGM-158C LRASM 类反舰弹',cruise:'AGM-158 JASSM 类对陆弹药'});
  families('j20 j35a j35 j16 j10c',{aam:'霹雳-15 类主动空空弹',ir:'霹雳-10 类近程弹'});
  families('j15 j15t',{aam:'霹雳-12／15 类空空弹',asm:'鹰击系列舰载反舰弹'});
  families('su57 su35s su30sm su30mki mig35 mig29k',{aam:'R-77 类主动空空弹',ir:'R-73 类近程弹'});
  families('su33',{aam:'R-27R/ER 类半主动空空弹',ir:'R-73 类近程弹'},{aam:{range:55,guidance:'semi',seeker:0}});
  families('mig31bm',{aam:'R-37M 类远程空空弹',ir:'R-73 类近程弹'});
  families('su30mki',{supersonic:'BrahMos-A 类重型反舰弹'});
  families('rafale_c rafale_m',{aam:'MICA／Meteor 类空空弹',ir:'MICA IR 类近程弹',asm:'AM39 Exocet 类反舰弹',cruise:'SCALP 类对陆弹药'});
  families('mirage2000_5',{aam:'MICA EM 类主动空空弹',ir:'Magic 2 类近程弹'});
  families('typhoon typhoon_fgr4 gripen_c gripen_e',{aam:'AMRAAM／Meteor 类空空弹'});
  families('gripen_c gripen_e',{asm:'RBS15 类反舰弹'});
  families('mh60r mh60s',{atgm:'AGM-114 Hellfire 类轻型攻击弹'});
  families('mh60r p8a',{torpedo:'Mk 54 类轻型反潜鱼雷'});
  families('merlin_hm2',{torpedo:'Sting Ray 类轻型反潜鱼雷'});
  families('ddg_burke2a ddg_burke3 cg_ticonderoga',{sam:'SM-2 类区域防空弹',point:'ESSM 类近中程防空弹',asroc:'VL-ASROC 类反潜武器',cruise:'Tomahawk 类对陆巡航弹'});
  families('ddg_type45 ddg_horizon ffg_fremm_fr ffg_fremm_aa ffg_fremm_it_gp ffg_fremm_it_asw ffg_fdi',{sam:'Aster 类主动舰空弹'});
  families('ffg_type23',{point:'Sea Ceptor / CAMM 类防空弹'});
  families('ddg055 ddg052d ddg052dl ddg052c',{sam:'海红旗-9 类区域防空弹',asm:'鹰击系列反舰弹'});
  families('ffg054a ffg054b',{sam:'海红旗-16 类舰空弹'});
  families('ddg_kolkata ddg_visakhapatnam ffg_nilgiri',{sam:'Barak-8 类主动防空弹',supersonic:'BrahMos 类重型反舰弹'});
  families('ssn_virginia ssn_seawolf ssn_losangeles ssgn_ohio',{torpedo:'Mk 48 类重型鱼雷',cruise:'Tomahawk 类对陆巡航弹'});
  families('ssn_astute',{torpedo:'Spearfish 类重型鱼雷',cruise:'Tomahawk 类对陆巡航弹'});

  for(const [id,t] of Object.entries(out)){
    if(['ddg055','ddg052d','ddg052dl'].includes(id)){t.weapons.cruise=0;t.loadouts=shipLoadouts(t);t.realNote+=' 不推定未公开的对陆巡航挂载。';t.desc=t.realNote;}

    if(t.deck){t.cost+=Math.ceil(Object.entries(t.deck.wing).reduce((n,[key,qty])=>n+out[key].cost*qty,0)*.65);t.gameNote+=' 部署点已计入缩编航空队，放飞不再收费。';}
    if(t.domain==='air'&&!t.tanker&&!t.rotary){
      const noRefuel=['e2c','kj2000','a50u','p3c','p1','kq200','atl2','c295_mpa','jh7a','j11b','f2a','tejas_mk1','fa50','globaleye','g550_caew','h6k','h6j','tu22m3','kj600'];
      t.refuelSystem=noRefuel.includes(id)?null:/^(f22|f35a|f15|f16|f2a|f15j|f15k|kf21|b1b|b52h|b2a|e3g|e7|p8a)/.test(id)?'boom':'probe';
    }
    if(t.domain==='air'&&t.rotary)t.refuelSystem=null;
    t.strengths=t.role==='awacs'?'远程态势与数据链支援':t.role==='tanker'?'延长兼容机型的任务时间':t.domain==='sub'?'水下隐蔽、声呐搜索与伏击':t.deck?'航空队与舰体协同':t.jammer?'电子支援与干扰压制':t.sonar>=35?'反潜搜索与护航':t.radar>=150?'空中态势与防空覆盖':'成本、载荷与任务适配';
    t.limitations=t.tanker?'无攻击武器；需要受油机接口、位置和速度匹配。':t.category==='awacs'?'无攻击武器；暴露和护航需求较高。':t.deck?'甲板放飞有间隔；飞机、在空容量与航空补给均有限。':t.domain==='sub'?'深潜不能持续接收空中数据链；高速会增加噪声。':t.signature<.5?'外部挂载削弱低可探测优势；开雷达仍可被电子支援侦知。':'弹药、航迹、射程与专用任务限制，不能包办所有作战。';
  }
  for(const t of Object.values(out))if(t.deck&&['carrier','amphibious'].includes(t.category))t.deck.cooldown*=3;
  return out;
}
