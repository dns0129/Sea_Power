import {SURFACE_SCENARIOS} from './ww2-scenarios.js?v=0.11.0';
import {geographicMap,geoToWorld} from './geography.js?v=0.11.0';

export const isSurfaceWW2=s=>Object.hasOwn(SURFACE_SCENARIOS,s.scenario);
const live=u=>u.hp>0&&!u.exited;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const percent=(u,api)=>u?Math.ceil(u.hp/api.types[u.type].hp*100):0;
const activeBB=(s,api)=>s.units.filter(u=>u.side==='blue'&&api.types[u.type].ww2Role==='battleship'&&live(u)&&percent(u,api)>=40).length;
const find=(s,type)=>s.units.find(u=>u.type===type);
const zone=s=>{const z=SURFACE_SCENARIOS[s.scenario].zone;return {...geoToWorld(geographicMap(s),z.lon,z.lat),radius:z.radius,name:z.name};};
const reports=(s,side,api)=>api.visibleContacts(s,side).filter(c=>c.domain==='surface'&&s.time-c.time<=90);
const clamp=(s,p)=>({x:Math.max(.5,Math.min(geographicMap(s).width-.5,p.x)),y:Math.max(.5,Math.min(geographicMap(s).height-.5,p.y))});
function route(s,u,p,api){const goal=clamp(s,p),path=api.route(s,u,goal);if(path)u.route=path;u.leader=null;u.speed=Math.min(api.types[u.type].speed,u.hp<api.types[u.type].hp*.4?api.types[u.type].speed*.65:api.types[u.type].speed);}
function closeOn(s,u,c,stand,api){
  // Extrapolate only from a received observation. No hidden enemy coordinates.
  const a=(c.course||0)*Math.PI/180,lead=Math.min(180,Math.max(0,s.time-c.time)+90)/3600;
  const fix={x:c.x+Math.sin(a)*(c.speed||0)*lead,y:c.y-Math.cos(a)*(c.speed||0)*lead};
  const d=dist(u,fix)||1;
  const n=Number(u.id.slice(1)),turn=(n%2?1:-1)*.24;
  const dx=(u.x-fix.x)/d,dy=(u.y-fix.y)/d;
  route(s,u,{x:fix.x+(dx*Math.cos(turn)-dy*Math.sin(turn))*stand,y:fix.y+(dx*Math.sin(turn)+dy*Math.cos(turn))*stand},api);
}
function initMission(s){
  s.mission={id:s.scenario,escaped:[],secured:[],waves:[],orders:[],disabled:false,unload:0,reason:'',score:0,
    stage:'等待指挥 · 可执行作战计划或逐舰下令',tracking:0,targetHealth:100,baseHealth:100,activeBattleships:2,escapedCarriers:0,lostCarriers:0};
}
export function initializeSurfaceWW2(s,api){
  initMission(s);
  const put=(type,side,name,x,y,goal)=>{
    const u=api.spawn(s,type,side,x,y),t=api.types[type];Object.assign(u,{name,radar:t.radar>0,sonar:false,esm:false,datalink:true,autoEngage:side==='red',speed:t.domain==='land'?0:Math.min(t.speed,26)});
    if(goal)route(s,u,goal,api);return u;
  };
  if(s.scenario==='denmark41'){
    put('ww2_hood','blue','胡德号',32,38,{x:38,y:35});put('ww2_prince_wales','blue','威尔士亲王号',30,41,{x:39,y:38});
    put('ww2_uk_cruiser','blue','萨福克号',55,39,{x:62,y:47});put('ww2_uk_cruiser','blue','诺福克号',49,48,{x:59,y:51});
    put('ww2_bismarck','red','俾斯麦号',44,27,{x:68,y:53});put('ww2_prinz_eugen','red','欧根亲王号',42,24,{x:66,y:51});
  }else if(s.scenario==='guadalcanal42'){
    put('ww2_washington','blue','华盛顿号 BB-56',20,24,{x:18,y:19});put('ww2_south_dakota','blue','南达科他号 BB-57',21.5,26,{x:20,y:21});
    ['沃尔克号','本汉姆号','普雷斯顿号','格温号'].forEach((name,i)=>put('ww2_us_night_dd','blue',name,18+i*.9,21+i*.8,{x:17+i,y:16+i}));
    const base=geoToWorld(geographicMap(s),160.05,-9.428);put('ww2_henderson','blue','亨德森机场',base.x,base.y);
    const station={x:24,y:28};
    put('ww2_kirishima','red','雾岛号',15,8,station);
    ['爱宕号','高雄号'].forEach((name,i)=>put('ww2_jp_surface_ca','red',name,13+i*4,9+i,station));
    ['川内号','长良号'].forEach((name,i)=>put('ww2_jp_light_cruiser','red',name,9+i*10,7+i*4,station));
    ['朝云号','照月号','五月雨号','电号','绫波号','浦波号','敷波号','初雪号','白雪号'].forEach((name,i)=>{
      put('ww2_jp_torpedo_dd','red',name,7+i*1.9,5+(i%3)*2,{x:21+(i%3),y:25+(i%2)});
    });
  }else{
    const gate=zone(s);
    ['范肖湾号','圣洛号','白平原号','加里宁湾号','基特昆湾号','甘比尔湾号'].forEach((name,i)=>put('ww2_escort_carrier','blue',name,72+(i%3)*2.3,68+Math.floor(i/3)*3,gate));
    ['约翰斯顿号','霍埃尔号','希尔曼号'].forEach((name,i)=>put('ww2_fletcher','blue',name,69+i*4,58+(i%2),{x:gate.x-5+i*4,y:gate.y}));
    ['塞缪尔·B·罗伯茨号','约翰·C·巴特勒号','雷蒙德号','丹尼斯号'].forEach((name,i)=>put('ww2_destroyer_escort','blue',name,68+i*3,62,{x:gate.x-6+i*4,y:gate.y}));
    [['ww2_yamato','大和号'],['ww2_nagato','长门号'],['ww2_kongo','金刚号'],['ww2_kongo','榛名号']].forEach(([type,name],i)=>put(type,'red',name,65+i*3.8,43+i*1.5,gate));
    ['熊野号','铃谷号','鸟海号','羽黑号','筑摩号','利根号'].forEach((name,i)=>put('ww2_jp_surface_ca','red',name,62+i*3,43+(i%2)*2,gate));
    ['能代号','矢矧号'].forEach((name,i)=>put('ww2_jp_light_cruiser','red',name,63+i*13,45,gate));
    ['岛风号','早霜号','秋霜号','岸波号','冲波号','浜波号','野分号','浦风号','矶风号','雪风号','藤波号'].forEach((name,i)=>put('ww2_jp_torpedo_dd','red',name,59+(i%6)*4,47+Math.floor(i/6)*3,gate));
  }
  s.budget=s.redBudget=0;
  api.log(s,`${SURFACE_SCENARIOS[s.scenario].name}：阵位已载入。敌舰须通过目视或雷达搜索确认，历史结局不会强制发生。`);
}

export function surfaceWW2Order(s,key,api){
  if(s.phase!=='running')return {ok:false,error:'请先开始二战任务'};
  if(!['plan','intercept','withdraw','smoke','strike','manual'].includes(key))return {ok:false,error:'本剧本没有此项指令'};
  if(key==='smoke'){
    let count=0;for(const u of s.units.filter(u=>u.side==='blue'&&live(u)&&api.types[u.type].smoke))if(api.deploySmoke(s,u.id).ok)count++;
    return count?{ok:true}:{ok:false,error:'烟幕尚未就绪或已用尽'};
  }
  if(key==='strike'&&!reports(s,'blue',api).length)return {ok:false,error:'尚无敌舰报告，航空队需要先建立目视接触'};
  s.mission.orders=key==='manual'?[]:[key];
  api.log(s,key==='manual'?'已转为手动指挥，保留当前航线。':`已下达${key==='plan'?'作战计划':key==='withdraw'?'撤离':'拦截／航空反击'}指令。`);
  commandSurfaceWW2(s,api);return {ok:true};
}

function aviationOrders(s,api){
  const contacts=reports(s,'blue',api),carriers=s.units.filter(u=>u.side==='blue'&&api.types[u.type].ww2Role==='carrier'&&live(u));
  for(const base of carriers){
    for(const type of Object.keys(base.airwing).filter(k=>base.airwing[k]>0)){
      if(api.types[type].ww2Role!=='fighter'&&!contacts.length)continue;
      const r=api.launchDeck(s,base.id,type);if(r.ok){r.unit.autoEngage=api.types[type].ww2Role!=='fighter';r.unit.radar=false;r.unit.esm=false;}break;
    }
  }
  for(const u of s.units.filter(u=>u.side==='blue'&&api.types[u.type].domain==='air'&&live(u)&&api.airborne(u)&&u.flightState!=='returning')){
    const t=api.types[u.type],role=t.ww2Role,base=api.unitById(s,u.home?.baseId);
    const c=contacts.filter(c=>!c.disabled).sort((a,b)=>(a.classification==='battleship'?0:1)-(b.classification==='battleship'?0:1)||dist(u,a)-dist(u,b))[Number(u.id.slice(1))%Math.max(1,Math.min(3,contacts.length))];
    const ammo=u.weapons[role==='fighter'?'ir':role==='torpedo'?'torpedo':'bomb'];
    if(!ammo){api.returnToBase(s,u.id);continue;}
    if(role==='fighter'){
      const air=api.visibleContacts(s,'blue').filter(c=>c.domain==='air'&&s.time-c.time<9).sort((a,b)=>dist(u,a)-dist(u,b))[0];
      if(air){u.route=[{x:air.x,y:air.y}];u.autoEngage=true;}
      else if(c){u.route=[{x:c.x,y:c.y}];u.altitude='low';} // Visual scouting over the pursuit force; machine guns remain air defense.
      else if(base&&!u.route.length)u.route=[{x:base.x-4,y:base.y-4},{x:base.x+4,y:base.y+3}];
    }else if(c){u.route=[clamp(s,c)];u.autoEngage=true;u.altitude=dist(u,c)<12?'low':'medium';}
    else if(base&&!u.route.length)u.route=[{x:base.x-6,y:Math.max(1,base.y-22)}];
    u.speed=Math.round(t.speed*.88);
  }
}

export function commandSurfaceWW2(s,api){
  const spec=SURFACE_SCENARIOS[s.scenario],plan=s.mission.orders.includes('plan'),withdraw=s.mission.orders.includes('withdraw'),attack=s.mission.orders.includes('intercept');
  const gate=zone(s);
  for(const side of ['blue','red']){
    const own=s.units.filter(u=>u.side===side&&live(u)&&api.types[u.type].domain==='surface'),intel=reports(s,side,api);
    for(const u of own){
      const t=api.types[u.type];
      if(side==='blue'&&!plan&&!withdraw&&!attack)continue;
      u.autoEngage=true;
      const ordered=intel.toSorted((a,b)=>(s.scenario==='samar44'?0:(a.classification==='battleship'?0:1)-(b.classification==='battleship'?0:1))||dist(u,a)-dist(u,b)),c=ordered[0];
      if(side==='red'){
        if(s.scenario==='denmark41')continue; // preserve the breakout route
        if(s.scenario==='guadalcanal42'){
          const base=s.units.find(v=>v.type==='ww2_henderson');
          // The fixed airfield is a known mission location, not a hidden ship.
          const seen=api.visibleContacts(s,'red').find(c=>c.id===base.id&&s.time-c.time<=6);
          if(t.ww2Role==='battleship'&&seen&&percent(base,api)>=60)api.fire(s,u.id,base.id,'gun');
          if(t.ww2Role!=='battleship'&&c&&dist(u,c)<9)closeOn(s,u,c,u.weapons.torpedo?2.2:4,api);
        }else if(c)closeOn(s,u,c,t.ww2Role==='battleship'?10:5,api);
        continue;
      }
      if(withdraw){
        const p=s.scenario==='guadalcanal42'?{x:39,y:27}:s.scenario==='denmark41'?{x:25,y:56}:gate;
        route(s,u,p,api);continue;
      }
      if(s.scenario==='samar44'){
        if(t.ww2Role==='carrier'){route(s,u,gate,api);continue;}
        const cv=own.filter(v=>api.types[v.type].ww2Role==='carrier');
        const center=cv.length?{x:cv.reduce((n,v)=>n+v.x,0)/cv.length,y:cv.reduce((n,v)=>n+v.y,0)/cv.length}:gate;
        const n=Number(u.id.slice(1))%7;
        if(c&&dist(u,c)<17&&(cv.some(v=>dist(v,c)<18)||u.hp<t.hp*.5)&&u.smokeUntil<=s.time)api.deploySmoke(s,u.id);
        if(c&&dist(u,c)<12&&u.weapons.torpedo>0)closeOn(s,u,c,3.8,api);
        else route(s,u,{x:center.x+(n-3)*2,y:center.y-5-(n%2)*2},api);
      }else if(c){
        const stand=s.scenario==='denmark41'?(t.category==='cruiser'?18:10):t.ww2Role==='battleship'?(u.type==='ww2_south_dakota'?6:12):2.2;
        closeOn(s,u,c,stand,api);
      }else route(s,u,geoToWorld(geographicMap(s),...spec.search),api);
    }
  }
  if(s.scenario==='samar44'&&(plan||s.mission.orders.includes('strike')))aviationOrders(s,api);
  const seen=reports(s,'blue',api).length;
  s.mission.stage=plan||attack||withdraw?s.scenario==='samar44'?'烟幕与航空兵掩护 · 航母向南撤离':seen?'接触已建立 · 按报告组织炮战':'搜索接敌 · 无线电共享最后报告':'等待指挥 · 可逐舰设置航线与自动交战';
}

function finish(s,result,reason,score,api){s.phase='ended';s.paused=true;s.result=result;s.mission.reason=reason;s.mission.score=Math.round(Math.max(0,Math.min(100,score)));api.log(s,reason,result==='victory'?'combat':'warning');}
export function updateSurfaceWW2(s,dt,api){
  const m=s.mission,spec=SURFACE_SCENARIOS[s.scenario];m.activeBattleships=activeBB(s,api);
  if(s.scenario==='denmark41'){
    const target=find(s,'ww2_bismarck');m.targetHealth=percent(target,api);
    const c=api.visibleContacts(s,'blue').find(c=>c.id===target.id&&s.time-c.time<=6);
    m.tracking=m.targetHealth<=65&&(target.hp<=0||c)?Math.min(120,m.tracking+dt):0;
    if(!m.activeBattleships)return finish(s,'defeat','英国主力舰均失去战斗能力，截击失败。',25,api);
    if(m.tracking>=120)return finish(s,'victory','俾斯麦号遭到有效打击，英军保持接触并保住可作战主力舰。',70+m.activeBattleships*10+(percent(find(s,'ww2_hood'),api)>=40?10:0),api);
  }else if(s.scenario==='guadalcanal42'){
    m.targetHealth=percent(find(s,'ww2_kirishima'),api);m.baseHealth=percent(find(s,'ww2_henderson'),api);
    if(m.baseHealth<60)return finish(s,'defeat','亨德森机场遭重炮严重破坏，防御失败。',20,api);
    if(!m.activeBattleships)return finish(s,'defeat','美军两艘战列舰均失去战斗能力。',20,api);
    if(m.targetHealth<=40)return finish(s,'victory','雾岛号失去战斗能力，亨德森机场得到保护。',55+m.activeBattleships*10+m.baseHealth*.25,api);
  }else{
    const gate=zone(s),cv=s.units.filter(u=>u.side==='blue'&&api.types[u.type].ww2Role==='carrier');
    for(const u of cv)if(live(u)&&dist(u,gate)<=gate.radius){u.exited=true;u.route=[];m.secured.push(u.id);api.log(s,`${u.name} 成功撤出战场。`,'combat');}
    m.escapedCarriers=cv.filter(u=>u.exited).length;m.lostCarriers=cv.filter(u=>u.hp<=0).length;
    if(m.lostCarriers>2)return finish(s,'defeat','护航航母损失超过两艘，无法完成撤退目标。',m.escapedCarriers*15,api);
    if(m.escapedCarriers>=4)return finish(s,'victory','至少四艘护航航母成功撤出，掩护撤退任务完成。',60+m.escapedCarriers*5+cv.reduce((n,u)=>n+percent(u,api),0)/60,api);
  }
  if(s.time>=spec.duration)finish(s,'defeat','作战窗口结束，未达成任务目标。',s.scenario==='samar44'?m.escapedCarriers*15:Math.max(0,100-m.targetHealth)*.5,api);
}

export function surfaceWW2Objectives(s){
  const m=s.mission,win=s.phase==='ended'&&s.result==='victory';
  if(s.scenario==='denmark41')return [{text:'有效打击俾斯麦号 / 结构 ≤ 65%',done:m.targetHealth<=65},{text:`持续保持接触 ${Math.floor(m.tracking)} / 120 秒`,done:m.tracking>=120},{text:`可作战英国主力舰 ${m.activeBattleships} / 至少 1`,done:win,failed:m.activeBattleships<1}];
  if(s.scenario==='guadalcanal42')return [{text:'使雾岛号失能 / 结构 ≤ 40%',done:m.targetHealth<=40},{text:`亨德森机场完整度 ${m.baseHealth}% / ≥ 60%`,done:win,failed:m.baseHealth<60},{text:`可作战战列舰 ${m.activeBattleships} / 至少 1`,done:win,failed:m.activeBattleships<1}];
  return [{text:`护航航母成功撤出 ${m.escapedCarriers} / 4`,done:m.escapedCarriers>=4},{text:`护航航母损失 ${m.lostCarriers} / 最多 2`,failed:m.lostCarriers>2,done:win},{text:'以烟幕、鱼雷与航空兵掩护撤退',done:win}];
}

export function restoreSurfaceWW2(s,raw,api){
  const m=raw.mission,spec=SURFACE_SCENARIOS[s.scenario];
  if(m.orders.some(k=>!['plan','intercept','withdraw','strike'].includes(k))||!Number.isFinite(m.score)||m.score<0||m.score>100)throw Error('二战任务指令或评分无效');
  if(s.units.some(u=>api.types[u.type].era!=='ww2'||api.types[u.type].country!==(u.side==='blue'?spec.blueCountry:spec.redCountry)))throw Error('二战任务阵营或年代不符');
  const required={denmark41:{ww2_hood:1,ww2_prince_wales:1,ww2_bismarck:1,ww2_prinz_eugen:1,ww2_uk_cruiser:2},guadalcanal42:{ww2_washington:1,ww2_south_dakota:1,ww2_kirishima:1,ww2_henderson:1,ww2_us_night_dd:4,ww2_jp_surface_ca:2,ww2_jp_light_cruiser:2,ww2_jp_torpedo_dd:9},samar44:{ww2_escort_carrier:6,ww2_fletcher:3,ww2_destroyer_escort:4,ww2_yamato:1,ww2_nagato:1,ww2_kongo:2,ww2_jp_surface_ca:6,ww2_jp_light_cruiser:2,ww2_jp_torpedo_dd:11}}[s.scenario];
  for(const [type,count] of Object.entries(required))if(s.units.filter(u=>u.type===type).length!==count)throw Error('二战剧本关键兵力缺失');
  if(!Number.isFinite(m.tracking)||m.tracking<0||m.tracking>120)throw Error('跟踪计时无效');
  initMission(s);Object.assign(s.mission,{orders:[...new Set(m.orders)],tracking:m.tracking,score:m.score,reason:typeof m.reason==='string'?m.reason.slice(0,140):'',stage:typeof m.stage==='string'?m.stage.slice(0,90):'等待指挥'});
  const restored=s.mission;restored.activeBattleships=activeBB(s,api);
  if(s.scenario==='samar44'){
    const cv=s.units.filter(u=>u.side==='blue'&&api.types[u.type].ww2Role==='carrier');
    if(s.units.some(u=>u.exited&&!cv.includes(u))||cv.some(u=>u.exited&&dist(u,zone(s))>zone(s).radius+.01))throw Error('撤离位置无效');
    restored.secured=cv.filter(u=>u.exited).map(u=>u.id);restored.escapedCarriers=restored.secured.length;restored.lostCarriers=cv.filter(u=>u.hp<=0).length;
  }else{restored.targetHealth=percent(find(s,s.scenario==='denmark41'?'ww2_bismarck':'ww2_kirishima'),api);if(s.scenario==='guadalcanal42')restored.baseHealth=percent(find(s,'ww2_henderson'),api);}
}
