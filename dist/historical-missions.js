import {missionControlled} from './unit-orders.js?v=0.13.1';
import {isWW2Scenario} from './ww2-data.js?v=0.13.1';
import {initializeWW2,ww2Order,ww2Objectives,updateWW2,ww2Zone,ww2Search} from './ww2-missions.js?v=0.13.1';
import {REAL_MAPS,geoToWorld} from './geography.js?v=0.13.1';
import {playerSide,playerOutcome} from './factions.js?v=0.13.1';
export const HISTORICAL_SCENARIOS={
  bubiyan91:{name:'布比延封锁线',subtitle:'1991 · 海湾战争 · 拦截撤退',mapId:'bubiyan',budget:0,historical:true,date:'1991-01-29—31',duration:1800,difficulty:'入门',
    brief:'指挥舰载直升机与攻击机，在东侧脱离线之前击沉至少 3 艘撤退舰艇；最多允许 1 艘脱离。点击“执行拦截”让航空队进入搜索区，海上兵力负责掩护。任务限时 30 分钟。',
    history:'海湾战争期间，向伊朗方向撤退的伊拉克舰艇在布比延岛一带遭到联军海空兵力攻击，英军携“海鸥”导弹的“大山猫”直升机参与了交战。',
    adaptation:'以 1 月 29—31 日北部海域行动为背景，合并为四个目标与一条游戏脱离线；兵力数量、航线、交战位置和三十分钟时限均为单人任务改编。',
    sourceTitle:'美国海军历史与遗产司令部 · H-058-1',sourceURL:'https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-grams/h-gram-058/h-058-1.html',
    search:[48.57,29.80],zone:{name:'东侧脱离线（任务边界）',lon:48.73,lat:29.84,radius:2},order:'执行拦截',orderKey:'intercept',
    units:[
      ['blue','frigate1980','联军护航舰（合成）',48.60,29.50,{radar:true,speed:18}],
      ['blue','strikeHelicopter','大山猫编队 A（抽象）',48.54,29.65,{radar:true,speed:100}],
      ['blue','strikeHelicopter','大山猫编队 B（抽象）',48.68,29.61,{radar:true,speed:100}],
      ['blue','strikeJet','A-6 攻击组（抽象）',48.88,29.54,{radar:true,speed:290}],
      ['red','missileBoat','撤退舰艇 A',48.48,29.82,{missionRole:'escape',speed:30,radar:true}],
      ['red','missileBoat','撤退舰艇 B',48.55,29.88,{missionRole:'escape',speed:28,radar:true}],
      ['red','missileBoat','撤退舰艇 C',48.60,29.79,{missionRole:'escape',speed:26,radar:true}],
      ['red','missileBoat','撤退舰艇 D',48.45,29.75,{missionRole:'escape',speed:30,radar:true}],
    ]},
  mantis88:{name:'萨汉德号遭遇战',subtitle:'1988 · 祈祷螳螂行动 · 打击与脱离',mapId:'hormuz',budget:0,historical:true,date:'1988-04-18',duration:2400,difficulty:'进阶',
    brief:'协同水面舰与攻击机，使“萨汉德号”失去战斗力（结构 ≤ 40%），随后让水面指挥舰抵达东侧撤离区。点击“执行打击”进入搜索区；目标被压制后使用“执行撤离”。限时 40 分钟。',
    history:'1988 年 4 月 18 日，美国海军实施“祈祷螳螂”行动。“企业号”的 A-6E 与“约瑟夫·施特劳斯号”参与了对伊朗护卫舰“萨汉德号”的交战。',
    adaptation:'仅截取拉腊克岛附近的海空遭遇，使用年代型平台近似兵力；将打击后撤离、增援波次和四十分钟时限作为游戏目标，不复刻整场行动。',
    sourceTitle:'美国海军历史与遗产司令部 · Enterprise 1986—1990',sourceURL:'https://www.history.navy.mil/research/histories/ship-histories/danfs/e/enterprise-cvan-65-viii-1986-1990.html',
    search:[56.24,26.67],zone:{name:'东侧撤离区（游戏目标）',lon:56.88,lat:26.40,radius:1.5},order:'执行打击',orderKey:'strike',
    units:[
      ['blue','destroyer1980','水面指挥舰（施特劳斯角色）',56.64,26.45,{radar:true,speed:28,missionRole:'flagship'}],
      ['blue','strikeJet','A-6E 攻击组 A（抽象）',56.60,26.18,{radar:true,speed:300}],
      ['blue','strikeJet','A-6E 攻击组 B（抽象）',56.72,26.21,{radar:true,speed:300}],
      ['red','frigate1980','萨汉德号（能力抽象）',56.24,26.67,{radar:true,speed:20,missionRole:'mainTarget',advance:[56.42,26.54]}],
    ],
    waves:[{id:'response',time:420,count:2,type:'lightAttack1982',positions:[[56.60,26.95],[56.70,26.94]],destination:[56.72,26.43],message:'岸向攻击机进入海域，保持防空掩护并准备脱离。'}]},
  sanCarlos82:{name:'圣卡洛斯登陆掩护',subtitle:'1982 · 福克兰战争 · 护航与卸载',mapId:'falklands',budget:0,historical:true,date:'1982-05-21',duration:2100,difficulty:'挑战',
    brief:'掩护两艘运输船进入圣卡洛斯水道，并在锚地连续保持 120 秒完成卸载。任一运输船被击沉即失败；敌机分三波接近。运输船已设避岸航线，点击“执行护航”使护航与战斗机进入掩护位置。限时 35 分钟。',
    history:'1982 年 5 月 21 日，英军在圣卡洛斯登陆，舰艇在狭窄水道中掩护两栖兵力，并遭到阿根廷航空兵攻击。',
    adaptation:'把登陆日的连续空袭压缩为三波，将运输船抵达与卸载设为单人目标。舰艇为合成掩护编队，飞机和武器按年代类别近似，不使用现代隐身机或远程主动空空弹。',
    sourceTitle:'英国皇家海军 · 圣卡洛斯登陆纪念',sourceURL:'https://www.royalnavy.mod.uk/news/2020/may/22/220520-hms-forth-falklands-tribute',
    search:[-59.13,-51.45],escortPositions:[[-59.075,-51.497],[-59.06,-51.505]],zone:{name:'登陆锚地（任务目标）',lon:-59.065,lat:-51.505,radius:.65},order:'执行护航',orderKey:'escort',
    units:[
      ['blue','transport','运输船群一号',-59.14,-51.43,{speed:16,missionRole:'transport'}],
      ['blue','transport','运输船群二号',-59.17,-51.415,{speed:16,missionRole:'transport'}],
      ['blue','frigate1980','近程防空护卫舰 A（合成）',-59.15,-51.38,{radar:true,speed:28}],
      ['blue','frigate1980','近程防空护卫舰 B（合成）',-59.24,-51.44,{radar:true,speed:28}],
      ['blue','seaHarrier','海鹞巡逻组 A（抽象）',-59.18,-51.45,{radar:true,speed:260}],
      ['blue','seaHarrier','海鹞巡逻组 B（抽象）',-59.04,-51.40,{radar:true,speed:260}],
    ],
    waves:[
      {id:'wave1',time:120,count:2,type:'lightAttack1982',positions:[[-59.69,-51.42],[-59.68,-51.49]],destination:[-59.065,-51.505],message:'第一波低空攻击机从西侧接近；利用战斗机前出拦截。'},
      {id:'wave2',time:480,count:2,type:'lightAttack1982',positions:[[-59.65,-51.72],[-59.62,-51.76]],destination:[-59.065,-51.505],message:'第二波攻击机从西南方向进入，注意运输船航路。'},
      {id:'wave3',time:900,count:2,type:'lightAttack1982',positions:[[-58.58,-51.24],[-58.60,-51.30]],destination:[-59.065,-51.505],message:'第三波攻击机从东北方向进入，守住最后卸载窗口。'},
    ]},
};
export function missionZone(s){if(isWW2Scenario(s))return ww2Zone(s);const spec=HISTORICAL_SCENARIOS[s.scenario];if(!spec)return null;return {...geoToWorld(REAL_MAPS[spec.mapId],spec.zone.lon,spec.zone.lat),radius:spec.zone.radius,name:spec.zone.name};}
export function missionSearch(s){if(isWW2Scenario(s))return ww2Search(s);const spec=HISTORICAL_SCENARIOS[s.scenario];return spec?geoToWorld(REAL_MAPS[spec.mapId],...spec.search):null;}
export function initializeHistorical(s,api){
  if(isWW2Scenario(s))return initializeWW2(s,api);
  const spec=HISTORICAL_SCENARIOS[s.scenario];if(!spec)return;
  s.budget=s.redBudget=0;s.mapId=spec.mapId;
  s.mission={id:s.scenario,escaped:[],secured:[],waves:[],orders:[],disabled:false,unload:0,reason:'',score:0};
  for(const [side,type,name,lon,lat,options] of spec.units){
    const position=geoToWorld(REAL_MAPS[spec.mapId],lon,lat),u=api.spawn(s,type,side,position.x,position.y);
    Object.assign(u,{...options,name,autoEngage:false});delete u.advance;
    if(options.missionRole==='escape')u.route=api.route(s,u,missionZone(s))||[];
    if(options.missionRole==='transport')u.route=api.route(s,u,missionZone(s))||[];
    if(options.advance)u.route=api.route(s,u,geoToWorld(REAL_MAPS[spec.mapId],...options.advance))||[];
    if(side==='red')u.autoEngage=true;
  }
  s.budget=s.redBudget=0;
  api.log(s,'历史任务已载入。查看目标与历史说明后开始；可随时暂停下令。');
}
export function historicalOrder(s,key,api,side=playerSide(s)){
  if(isWW2Scenario(s))return ww2Order(s,key,api);
  const spec=HISTORICAL_SCENARIOS[s.scenario];if(!spec||s.phase!=='running')return {ok:false,error:'请先开始历史任务'};
  if(side==='red'){
    if(!['intercept','strike','escort','withdraw','defend'].includes(key))return {ok:false,error:'任务指令无效'};
    const own=s.units.filter(u=>u.side==='red'&&u.hp>0&&!u.exited),anchor=own.find(u=>u.missionRole==='mainTarget');
    for(const u of own){u.autoEngage=true;if(u.missionRole==='escape'||s.scenario==='sanCarlos82'){const route=api.route(s,u,missionZone(s));if(route)u.route=route;}else if(anchor&&u!==anchor)u.route=api.route(s,u,anchor)||u.route;}
    api.log(s,'本方执行撤离／阻击任务，舰机按已知任务区域行动。');return {ok:true};
  }
  if(![spec.orderKey,'withdraw'].includes(key)||key==='withdraw'&&(s.scenario!=='mantis88'||!s.mission.disabled))return {ok:false,error:'当前阶段无法执行该指令'};
  const goal=key==='withdraw'?missionZone(s):missionSearch(s);let count=0,escortIndex=0;
  for(const u of s.units.filter(u=>u.side==='blue'&&u.hp>0&&!u.exited&&missionControlled(u)&&u.missionRole!=='transport')){
    u.autoEngage=true;if(key==='withdraw'&&u.missionRole!=='flagship')continue;
    if(key!=='withdraw'&&s.scenario==='mantis88'&&u.missionRole==='flagship')continue;
    const destination=key==='escort'&&u.type==='frigate1980'?geoToWorld(REAL_MAPS[spec.mapId],...spec.escortPositions[escortIndex++]):goal;
    const route=api.route(s,u,destination);if(route){u.route=route;u.leader=null;count++;}
  }
  s.mission.orders.push(key);api.log(s,key==='withdraw'?'水面指挥舰执行撤离，航空队继续掩护。':`${spec.order}指令已下达，${count} 个单位进入任务位置。`);return {ok:true};
}
export function historicalObjectives(s){
  if(isWW2Scenario(s))return ww2Objectives(s);
  if(!s.mission)return [];
  const m=s.mission,zone=missionZone(s),dist=u=>Math.hypot(u.x-zone.x,u.y-zone.y);
  if(playerSide(s)==='red'){
    if(s.scenario==='bubiyan91')return [{text:`至少两艘舰艇脱离 ${m.escaped.length} / 2`,done:m.escaped.length>=2},{text:'或坚持至时限，阻止对方击沉三艘舰艇',done:s.phase==='ended'&&s.result==='victory'}];
    if(s.scenario==='mantis88')return [{text:'保护萨汉德号，阻止打击与撤离目标同时完成',failed:s.phase==='ended'&&s.result==='defeat'},{text:'击沉敌方指挥舰，或坚持至任务时限',done:s.phase==='ended'&&s.result==='victory'}];
    return [{text:'击沉至少一艘运输船，或阻止卸载直至时限',done:s.phase==='ended'&&s.result==='victory'},{text:`攻击波已到达 ${m.waves.length} / 3`,done:m.waves.length===3}];
  }
  if(s.scenario==='bubiyan91'){const sunk=s.units.filter(u=>u.missionRole==='escape'&&u.hp<=0).length;return [{text:`击沉撤退舰艇 ${sunk} / 3`,done:sunk>=3},{text:`脱离舰艇 ${m.escaped.length} / 最多 1`,failed:m.escaped.length>=2,done:s.phase==='ended'&&s.result==='victory'}];}
  if(s.scenario==='mantis88'){const flag=s.units.find(u=>u.missionRole==='flagship');return [{text:'使萨汉德号结构降至 40% 以下',done:m.disabled},{text:'水面指挥舰抵达东侧撤离区',done:!!flag&&flag.hp>0&&dist(flag)<=zone.radius}];}
  const transports=s.units.filter(u=>u.missionRole==='transport'),inside=transports.filter(u=>u.hp>0&&dist(u)<=zone.radius).length;
  return [{text:`运输船抵达锚地 ${inside} / 2`,done:inside===2},{text:`连续卸载 ${Math.floor(m.unload)} / 120 秒`,done:m.unload>=120},{text:`空袭已进入 ${m.waves.length} / 3 波`,done:m.waves.length===3}];
}
export function updateHistorical(s,dt,api){
  if(isWW2Scenario(s))return updateWW2(s,dt,api);
  const spec=HISTORICAL_SCENARIOS[s.scenario];if(!spec||s.phase!=='running')return;
  const m=s.mission,zone=missionZone(s),inside=u=>Math.hypot(u.x-zone.x,u.y-zone.y)<=zone.radius;
  for(const wave of spec.waves||[])if(s.time>=wave.time&&!m.waves.includes(wave.id)){
    m.waves.push(wave.id);for(let i=0;i<wave.count;i++){
      const p=geoToWorld(REAL_MAPS[spec.mapId],...wave.positions[i]),u=api.spawn(s,wave.type,'red',p.x,p.y);
      Object.assign(u,{name:`来袭攻击组 ${m.waves.length}-${i+1}`,missionRole:'raider',autoEngage:playerSide(s)!=='red',radar:false,altitude:'low',speed:420,home:{...p,baseId:null}});
      u.route=[geoToWorld(REAL_MAPS[spec.mapId],...wave.destination)];
    }s.redBudget=0;api.log(s,wave.message,'warning');
  }
  for(const u of s.units.filter(u=>u.missionRole==='escape'&&u.hp>0&&!u.exited&&inside(u))){u.exited=true;u.route=[];m.escaped.push(u.id);for(const side of ['blue','red'])delete s.contacts[side][u.id];api.log(s,'一艘目标穿过东侧任务脱离线。','warning');}
  for(const u of s.units.filter(u=>u.missionRole==='raider'&&!u.exited&&['servicing','grounded'].includes(u.flightState))){u.exited=true;u.flightState='grounded';u.route=[];for(const side of ['blue','red'])delete s.contacts[side][u.id];}
  const finish=(result,reason)=>{
    s.phase='ended';s.paused=true;s.result=playerOutcome(s,result);m.reason=playerSide(s)==='red'?`对方任务：${reason}`:reason;
    const blue=s.units.filter(u=>u.side==='blue'),health=blue.reduce((sum,u)=>sum+u.hp/api.types[u.type].hp,0)/blue.length;
    m.score=s.result==='victory'?Math.round(60+20*(playerSide(s)==='blue'?health:1-health)+20*Math.max(0,1-s.time/spec.duration)):Math.round(30*(playerSide(s)==='blue'?health:1-health));
    api.log(s,reason,result==='victory'?'combat':'warning');
  };
  if(s.scenario==='bubiyan91'){
    if(m.escaped.length>=2)return finish('defeat','两艘舰艇脱离，封锁任务失败。');
    if(s.units.filter(u=>u.missionRole==='escape'&&u.hp<=0).length>=3)return finish('victory','至少三艘撤退舰艇被击沉，封锁目标完成。');
  }else if(s.scenario==='mantis88'){
    const target=s.units.find(u=>u.missionRole==='mainTarget'),flag=s.units.find(u=>u.missionRole==='flagship');
    if(flag.hp<=0)return finish('defeat','水面指挥舰损失，任务失败。');
    if(!m.disabled&&target.hp<=api.types[target.type].hp*.4){m.disabled=true;target.speed=0;target.route=[];target.autoEngage=false;target.radar=false;target.weapons=Object.fromEntries(Object.keys(target.weapons).map(key=>[key,0]));api.log(s,'萨汉德号已失去战斗力。选择“执行撤离”，让指挥舰进入东侧区域。','combat');}
    if(m.disabled&&inside(flag))return finish('victory','完成对舰打击，水面指挥舰安全脱离。');
  }else{
    const transports=s.units.filter(u=>u.missionRole==='transport');if(transports.some(u=>u.hp<=0))return finish('defeat','运输船损失，登陆掩护失败。');
    if(transports.every(inside)){m.unload+=dt;for(const u of transports){u.route=[];u.speed=0;}}else m.unload=0;
    if(m.unload>=120&&m.waves.length===3)return finish('victory','两艘运输船抵达锚地并完成卸载，登陆掩护成功。');
  }
  if(!s.units.some(u=>u.side==='blue'&&u.hp>0&&!u.exited))return finish('defeat','本方兵力全部损失。');
  if(s.time>=spec.duration)return finish('defeat','任务时间耗尽，主要目标未完成。');
}

// 红方玩家进入历史任务后，原蓝方按公开任务目标推进，空中拦截只读蓝方报告。
export function commandHistorical(s,api){
  if(playerSide(s)!=='red'||s.phase!=='running'||isWW2Scenario(s))return;
  const m=s.mission,key=s.scenario==='mantis88'&&m.disabled?'withdraw':HISTORICAL_SCENARIOS[s.scenario].orderKey;
  if(!m.orders.includes(key))historicalOrder(s,key,api,'blue');
  for(const u of s.units.filter(u=>u.side==='blue'&&u.hp>0&&!u.exited)){
    u.autoEngage=true;
    if(api.types[u.type].domain!=='air'||u.flightState!=='airborne')continue;
    const c=api.visibleContacts(s,'blue').filter(c=>!c.stale&&c.domain==='air').sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
    if(c)u.route=[{x:c.x,y:c.y}];
  }
}
