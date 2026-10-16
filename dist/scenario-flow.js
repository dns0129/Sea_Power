import {SCENARIOS,TYPES,AUTO_PRESETS,AI_DOCTRINES,createState,createAutoBattle,configureAutoBattle,start,isHistorical,isAutoBattle,freeDeploy,worldFor,landFor,getBattleTheatre,factionName} from './engine.js?v=0.7.0';
import {geographicMap,geoToWorld} from './geography.js';
import {missionZone,missionSearch} from './historical-missions.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number(value).toFixed(1).replace(/\.0$/,'');
const pages=['战斗简介','剧本细节','部署情况','任务目标'];
const modes=[
  {id:'history',name:'历史任务',description:'固定兵力 · 明确目标 · 手动指挥',symbol:'book'},
  {id:'ai',name:'AI 对战',description:'双方部署 · AI 自主交战 · 观察推演',symbol:'air'},
  {id:'sandbox',name:'自由沙盘',description:'自由编组 · 装备试验 · 自定节奏',symbol:'grid'},
];
const symbols={book:'M4 6q6-3 12 0 6-3 12 0v20q-6-3-12 0-6-3-12 0zM16 6v20',air:'M16 3v25M5 20l11-11 11 11M11 28l5-4 5 4',grid:'M4 4h9v9H4zM19 4h9v9h-9zM4 19h9v9H4zM19 19h9v9h-9z',surface:'M9 7h14v16H9zM16 7V2m-5 25h10M12 13h8m-4-4v8',sub:'M5 16c2-8 20-8 22 0-2 8-20 8-22 0zM16 10V5m-4 0h8M10 24h12',land:'M5 25h22M8 25V13l8-7 8 7v12M12 25v-8h8v8'};
const icon=key=>`<svg class="flow-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="${symbols[key]||symbols.surface}"/></svg>`;
const modeFor=s=>isHistorical(s)?'history':isAutoBattle(s)?'ai':'sandbox';
const modeName=s=>modes.find(m=>m.id===modeFor(s)).name;
const scenarioName=s=>isAutoBattle(s)?AUTO_PRESETS.find(p=>p.id===s.automation?.preset)?.name||SCENARIOS[s.scenario].name:SCENARIOS[s.scenario].name;
const fixed=s=>isHistorical(s);
const unrestricted=s=>['modernlab','sandbox'].includes(s.scenario)&&!isAutoBattle(s);
const timeLimit=s=>SCENARIOS[s.scenario].duration||s.automation?.timeLimit||0;
const duration=s=>timeLimit(s)?`${number(timeLimit(s)/60)} 分钟`:'自由推演';
const mapName=s=>geographicMap(s)?.name||getBattleTheatre(s)?.name||'苍岬群岛 · 虚构训练海域';
const friendly=s=>s.units.filter(u=>u.side==='blue'&&u.hp>0&&!u.exited);
const showOpposing=s=>isAutoBattle(s)||s.phase==='setup'&&freeDeploy(s);
const combatReady=s=>['blue','red'].every(side=>isHistorical(s)&&side==='red'||s.units.some(u=>u.side===side&&u.hp>0&&!u.exited&&!TYPES[u.type].support));
const row=(label,value)=>`<div class="flow-info-row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`;

export function scenarioChoices(mode){
  if(mode==='ai')return AUTO_PRESETS.map(p=>({id:p.id,name:p.name,detail:p.description}));
  return Object.entries(SCENARIOS).filter(([id,s])=>mode==='history'?s.historical:id!=='autobattle'&&!s.historical).map(([id,s])=>({id,name:s.name,detail:s.historical?`${s.date.slice(0,4)} · ${s.difficulty} · ${s.duration/60} 分钟`:`${s.budget} 部署点 · ${s.subtitle}`}));
}

export function missionGoals(s){
  if(s.scenario==='bubiyan91')return [
    ['击沉至少 3 艘撤退舰艇','在目标越过东侧脱离线前完成拦截。'],
    ['最多允许 1 艘脱离','若第 2 艘敌舰成功脱离，任务失败。'],
    ['30 分钟内完成任务','推演时限内达成全部目标。'],
  ];
  if(s.scenario==='mantis88')return [
    ['使萨汉德号结构降至 40% 以下','协同水面舰与攻击机，使目标失去战斗力。'],
    ['水面指挥舰抵达东侧撤离区','完成打击后执行撤离，航空队继续掩护。'],
    ['40 分钟内完成任务','目标压制与旗舰撤离均需在时限内完成。'],
  ];
  if(s.scenario==='sanCarlos82')return [
    ['两艘运输船抵达登陆锚地','任一运输船被击沉，任务失败。'],
    ['在锚地连续卸载 120 秒','保持两艘运输船位于锚地范围内。'],
    ['抵御三波空袭，35 分钟内完成任务','利用护航舰和战斗机保护运输船。'],
  ];
  if(isAutoBattle(s))return [
    ['双方 AI 自主侦察、机动和交战','部署完成后，由 AI 使用各自传感器获取的航迹指挥。'],
    ['歼灭对方战斗兵力，或按有效毁伤结算','歼灭后等待在途攻击结算；达到时限或弹药耗尽时比较实际毁伤评分。'],
    [`推演时限 ${duration(s)}`,'可以暂停、调整观看倍率，并切换观察视角。'],
  ];
  if(unrestricted(s))return [
    ['按部署点自由配置双方编队','进入海图后选择装备与任务挂载，再开始推演。'],
    ['试验侦察、交战与海空协同','双方遵循相同的传感器、武器、燃油与补给规则。'],
    ['自主决定演练方向','本沙盘没有强制胜负与任务倒计时。'],
  ];
  return [
    ['摧毁全部红方战斗单位','基地和专职支援平台不计入歼灭目标。'],
    ['保护蓝方战斗兵力','蓝方战斗单位全部损失，推演失败。'],
    ['先建立有效航迹，再组织交战',SCENARIOS[s.scenario].subtitle],
  ];
}

// SVG 直接使用游戏海岸线与海里坐标；历史简报不绘制隐藏敌方位置。
export function briefingChart(s,{deployment=false,compact=false,home=false}={}){
  const world=worldFor(s),geo=geographicMap(s),theatre=getBattleTheatre(s);
  const scale=Math.min(880/world.width,490/world.height),ox=(1000-world.width*scale)/2,oy=(620-world.height*scale)/2;
  const x=v=>number(ox+v*scale),y=v=>number(oy+v*scale);
  const label=(text,p,color='#829eaa')=>`<text x="${x(p.x)}" y="${y(p.y)}" fill="${color}">${esc(text)}</text>`;
  const route=points=>points.map(p=>`${x(p.x)},${y(p.y)}`).join(' ');
  let svg='<rect width="1000" height="620" fill="#0c202d"/>';
  for(let i=20;i<1000;i+=50)svg+=`<path d="M${i} 0V620" class="chart-grid"/>`;
  for(let i=10;i<620;i+=50)svg+=`<path d="M0 ${i}H1000" class="chart-grid"/>`;
  for(const poly of landFor(s))svg+=`<polygon points="${poly.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')}" fill="#213641" stroke="#45606a" stroke-width="1"/>`;
  if(!compact){
    for(const [name,lon,lat] of geo?.labels||[])svg+=label(name,geoToWorld(geo,lon,lat));
    if(!geo)svg+=label(theatre?'虚构远海演练区':'苍岬群岛',{x:world.width*.44,y:world.height*.18},'#587889');
    if(isHistorical(s)&&!home){
      const zone=missionZone(s),search=missionSearch(s);
      svg+=`<circle cx="${x(zone.x)}" cy="${y(zone.y)}" r="${number(zone.radius*scale)}" fill="#d6b5750a" stroke="#d6b575" stroke-dasharray="5 5"/>`;
      svg+=label(deployment?zone.name:'任务边界',{x:Math.min(zone.x+3,world.width*.58),y:zone.y-8},'#d6b575');
      const r=Math.min(6,world.width*.12)*scale;
      svg+=`<circle cx="${x(search.x)}" cy="${y(search.y)}" r="${number(r)}" fill="#d6b57508" stroke="#d6b57580" stroke-dasharray="5 6"/>`;
      svg+=label('任务搜索／掩护区',{x:Math.min(search.x+8,world.width*.7),y:search.y+2},'#b1b6c0');
    }
    if(theatre&&deployment){
      for(const side of ['blue','red'])svg+=`<path d="M${x(theatre.anchors[side].x)} ${y(8)}V${y(world.height-8)}" stroke="${side==='blue'?'#80cbb880':'#e8848080'}" stroke-dasharray="5 6"/>`;
      svg+=`<text x="500" y="35" text-anchor="middle">初始部署间隔 ≥ ${theatre.initialSeparationKm} 公里</text>`;
    }
    const units=s.units.filter(u=>u.hp>0&&!u.exited&&(u.side==='blue'||deployment&&showOpposing(s)));
    units.forEach((u,i)=>{
      const domain=TYPES[u.type].domain,color=u.side==='blue'?'#8cd3bd':'#e88480';
      if(home&&u.route?.length)svg+=`<polyline points="${route([u,...u.route])}" fill="none" stroke="#80cbb84d" stroke-dasharray="6 5"/>`;
      svg+=`<g transform="translate(${x(u.x)} ${y(u.y)})" fill="none" stroke="${color}" stroke-width="1.4">${domain==='air'?'<path d="M-8 4L0-8 8 4M0-8V9M-4 9L0 6 4 9"/>':domain==='sub'?'<ellipse rx="9" ry="5"/>':domain==='land'?'<path d="M-7 7V-2L0-8 7-2V7Z"/>':'<rect x="-6" y="-7" width="12" height="14"/><path d="M-3 0H3M0-3V3"/>'}</g>`;
      if(!home)svg+=`<text x="${number(ox+u.x*scale+12)}" y="${number(oy+u.y*scale+5)}" fill="${color}">${String(i+1).padStart(2,'0')}</text>`;
    });
    const bar=world.width>180?40:10;
    svg+=`<path d="M30 575v8h${number(bar*scale)}v-8" fill="none" stroke="#587a8d"/><text x="30" y="565">${bar} nm</text><text x="963" y="30">N ↑</text>`;
  }
  return `<svg viewBox="0 0 1000 620" fill="#829eaa" class="flow-chart${compact?' flow-chart-mini':''}" role="img" aria-label="${esc(mapName(s))}${deployment?' · 部署情况':''}"${compact?' preserveAspectRatio="xMidYMid slice"':''}>${svg}</svg>`;
}

export function createScenarioFlow({root,getState,onPause,onLaunch,onResume,hasSave,onImport,onHelp,onError}){
  let screen='home',page=0,mode='history',choice='bubiyan91',draft=createState(choice),readOnly=false,session=false,opener=null;
  const selections={history:'bubiyan91',ai:'surface',sandbox:'modernlab'};
  const background=createState('bubiyan91');
  const gameElements=()=>document.querySelectorAll('.workspace,.hud-widget,.hud-dock,.mission-strip');
  function visible(open){
    document.body.classList.toggle('flow-open',open);root.hidden=!open;
    for(const el of gameElements())el.inert=open;
  }
  function pause(){if(root.hidden)opener=document.activeElement;onPause();visible(true);}
  function close(){visible(false);(opener?.isConnected&&!opener.closest('#game-flow')?opener:document.querySelector('#map'))?.focus({preventScroll:true});}
  function select(nextMode,nextChoice=selections[nextMode]){
    mode=nextMode;choice=nextChoice;selections[mode]=choice;
    draft=mode==='ai'?createAutoBattle(choice):createState(choice);readOnly=false;
  }
  const header=()=>`<header class="flow-header"><button class="flow-brand" data-flow-action="home" aria-label="返回主页">SEA POWER</button><span class="flow-header-label">${screen==='brief'?'任务简报':'海空战模拟平台'}</span><span class="flow-header-context">${screen==='brief'?`${esc(modeName(draft))} / ${esc(scenarioName(draft))}`:'海空联合战术沙盘'}</span>${screen==='home'?'<button data-flow-action="help">操作指南</button>':`<button data-flow-action="${session?'resume':'home'}">${session?'返回战场':'返回主页'} <span aria-hidden="true">×</span></button>`}</header>`;
  function home(){
    return `<div class="flow-home"><div class="flow-home-map" aria-hidden="true">${briefingChart(background,{home:true})}</div><div class="flow-home-copy"><h1 tabindex="-1">海空战模拟平台</h1><p>海空联合战术沙盘</p><div class="flow-home-actions"><button class="primary" data-flow-action="select">开始游戏 <span>→</span></button><button class="flow-secondary" data-flow-action="resume" ${!session&&!hasSave()?'disabled':''}>${session?'返回当前战局':'继续战局'}</button><button class="flow-secondary" data-flow-action="import">导入存档</button></div></div></div><nav class="flow-home-modes" aria-label="游戏模式">${modes.map(m=>`<button data-flow-mode="${m.id}">${icon(m.symbol)}${m.name}</button>`).join('')}</nav>`;
  }
  function selection(){
    return `<div class="flow-scroll flow-select"><div class="flow-page-heading"><p class="flow-breadcrumb">主页 / 开始游戏</p><h1 tabindex="-1">选择模式与剧本</h1><p>先选择模式，再选择剧本。</p></div><div class="flow-select-columns"><section aria-labelledby="flow-modes-label"><h2 id="flow-modes-label"><span class="flow-step">01</span> 选择模式</h2><div class="flow-mode-list">${modes.map(m=>`<button class="flow-mode-card ${mode===m.id?'is-selected':''}" data-flow-mode="${m.id}" aria-pressed="${mode===m.id}">${icon(m.symbol)}<span><strong>${m.name}</strong><small>${m.description}</small></span>${mode===m.id?'<span class="flow-check" aria-hidden="true">✓</span>':''}</button>`).join('')}</div></section><section class="flow-choices" aria-labelledby="flow-choices-label"><h2 id="flow-choices-label"><span class="flow-step">02</span> ${mode==='ai'?'选择预案':'选择剧本'}</h2><div class="flow-choice-list">${scenarioChoices(mode).map(c=>`<button class="flow-choice ${choice===c.id?'is-selected':''}" data-flow-choice="${c.id}" aria-pressed="${choice===c.id}"><span class="flow-choice-mark" aria-hidden="true">${icon(mode==='history'?'book':mode==='ai'?'air':'grid')}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.detail)}</small></span>${choice===c.id?'<span class="flow-check" aria-hidden="true">✓</span>':''}</button>`).join('')}</div><div class="flow-selected-summary">${briefingChart(draft,{compact:true})}<div><small>选中${mode==='ai'?'预案':'剧本'}信息</small><p>${fixed(draft)?'固定兵力':`蓝方可用 ${draft.budget} 部署点`} / ${esc(mapName(draft))}</p></div></div></section></div></div><footer class="flow-footer"><button class="flow-secondary" data-flow-action="home">← 返回主页</button><span></span><button class="primary" data-flow-action="brief">查看战斗简介 →</button></footer>`;
  }
  function intro(){
    const t=SCENARIOS[draft.scenario];
    return `<div class="flow-split flow-intro"><section><h1 tabindex="-1">${esc(scenarioName(draft))}</h1><p class="flow-subtitle">${esc(t.subtitle)}</p><div class="flow-meta"><div><small>难度 / 模式</small><span>${esc(t.difficulty||modeName(draft))}</span></div><div><small>时限</small><span>${esc(duration(draft))}</span></div><div><small>兵力</small><span>${fixed(draft)?'固定编队':'可调整部署'}</span></div></div><p class="flow-body-copy">${esc(t.brief)}</p><h2>行动要点</h2><ul class="flow-points">${missionGoals(draft).slice(0,2).map(g=>`<li>${esc(g[0])}</li>`).join('')}</ul><p class="flow-note">${fixed(draft)?'历史背景改编 · 兵力与时限经玩法调整':'虚构演练海域 · 数值用于游戏推演'}</p></section>${chartPanel(false)}</div>`;
  }
  function chartPanel(deployment){
    return `<figure class="flow-map-panel">${briefingChart(draft,{deployment})}<figcaption><span>${esc(mapName(draft))}</span><span>□ 友方${deployment&&showOpposing(draft)?' · ◇ 对方部署':''} · 海里坐标</span></figcaption></figure>`;
  }
  function aiSettings(){
    const a=draft.automation;
    return `<div class="flow-ai-settings"><h2>AI 对战设置</h2><div class="flow-settings-grid">${['blue','red'].map(side=>`<label>${esc(factionName(draft,side))} AI 战术<select data-flow-config="${side}Doctrine" ${readOnly?'disabled':''}>${Object.entries(AI_DOCTRINES).map(([key,d])=>`<option value="${key}" ${a[`${side}Doctrine`]===key?'selected':''}>${esc(d.name)}</option>`).join('')}</select></label>`).join('')}<label>推演时限<select data-flow-config="timeLimit" ${readOnly?'disabled':''}>${[...new Set([5,15,30,60,120,240,a.timeLimit/60])].sort((a,b)=>a-b).map(m=>`<option value="${m*60}" ${a.timeLimit===m*60?'selected':''}>${m} 分钟</option>`).join('')}</select></label><label>随机种子<input data-flow-config="seed" aria-label="随机种子" type="number" min="0" max="4294967295" step="1" value="${a.seed}" ${readOnly?'disabled':''}></label></div><p class="flow-note">相同部署、种子与战术产生可重复的推演结果。</p></div>`;
  }
  function details(){
    const t=SCENARIOS[draft.scenario],w=worldFor(draft),theatre=getBattleTheatre(draft);
    return `<h1 tabindex="-1">剧本细节</h1><div class="flow-split flow-details"><section><div class="flow-text-section"><h2>${fixed(draft)?'历史背景':'演练背景'}</h2><p>${esc(t.history||t.brief)}</p></div><div class="flow-text-section"><h2>${fixed(draft)?'剧本改编':'指挥与规则'}</h2><p>${esc(t.adaptation||(isAutoBattle(draft)?'双方 AI 使用各自发现的有效航迹决策。进入传感器和武器允许的范围后交战；全局观察不会向 AI 提供隐藏信息。':'可以在部署阶段配置单位、挂载和编队。进入战场后，使用暂停、航点、传感器与自动交战控制海空协同。'))}</p></div>${isAutoBattle(draft)?aiSettings():''}${t.sourceURL?`<a class="flow-source" href="${esc(t.sourceURL)}" target="_blank" rel="noopener noreferrer">资料来源：${esc(t.sourceTitle)} ↗</a>`:''}</section><aside class="flow-info-panel"><h2>${icon(fixed(draft)?'book':'grid')} 任务资料</h2>${t.date?row('行动时间',t.date):''}${row('作战区域',mapName(draft))}${row('地图类型',fixed(draft)?'真实海岸线':'虚构演练海域')}${row('海域尺寸',`${number(w.width)} × ${number(w.height)} 海里`)}${theatre?row('初始间隔',`≥ ${theatre.initialSeparationKm} 公里`):''}<div class="flow-tip"><h3>指挥提示</h3><p>先建立有效航迹，再组织交战。</p></div>${fixed(draft)?'<p class="flow-note">使用 Natural Earth 现代海岸线裁切，地图不是当年航海图。</p>':''}</aside></div>`;
  }
  function deployment(){
    const units=friendly(draft),showRed=showOpposing(draft);
    const roster=(side,list)=>`<section class="flow-roster"><h2>${esc(factionName(draft,side))}编队 <small>/ ${list.length} 个单位</small></h2><div>${list.map((u,i)=>`<div class="flow-roster-row ${side==='red'?'is-red':''}"><span class="flow-unit-number">${String(i+1).padStart(2,'0')}</span>${icon(TYPES[u.type].domain)}<span><strong>${esc(u.name)}</strong><small>${esc(TYPES[u.type].name)}</small></span></div>`).join('')||'<p class="flow-note">尚无单位，进入海图后部署。</p>'}</div>${!fixed(draft)?`<p class="flow-note">剩余部署点 ${side==='blue'?draft.budget:draft.redBudget}</p>`:'<p class="flow-note">合成编队与抽象航空单位</p>'}</section>`;
    return `<h1 tabindex="-1">部署情况</h1><p class="flow-subtitle">${fixed(draft)?'固定兵力 · 本任务无需额外部署':readOnly?'当前编队与已知部署':'初始编队 · 可进入海图调整部署与挂载'}</p><div class="flow-split flow-deployment">${chartPanel(true)}<aside class="flow-roster-column">${roster('blue',units)}${showRed?roster('red',draft.units.filter(u=>u.side==='red'&&u.hp>0&&!u.exited)):'<section class="flow-enemy-info"><h2>敌方情报</h2><p>目标动向需进入任务后侦察确认。</p></section>'}${!fixed(draft)&&!readOnly?'<button class="flow-secondary" data-flow-action="deploy">进入海图调整部署 →</button>':''}</aside></div>`;
  }
  function objectives(){
    const t=SCENARIOS[draft.scenario];
    return `<h1 tabindex="-1">任务目标</h1><p class="flow-subtitle">${esc(scenarioName(draft))}${unrestricted(draft)?' / 自由演练':''}</p><div class="flow-split flow-objectives"><ol class="flow-goals">${missionGoals(draft).map((g,i)=>`<li><span class="flow-goal-number">${String(i+1).padStart(2,'0')}</span><div><h2>${esc(g[0])}</h2><p>${esc(g[1])}</p></div></li>`).join('')}</ol><aside class="flow-info-panel"><h2>任务准备${!readOnly&&combatReady(draft)?'<small class="flow-ready">● 已就绪</small>':''}</h2>${row('任务时限',duration(draft))}${row('模式',modeName(draft))}${row('指挥',isAutoBattle(draft)?'双方 AI 指挥':'手动指挥')}${row('兵力',fixed(draft)?'固定编队':'可调整部署')}<div class="flow-tip"><p>进入战场后可随时暂停下令。</p><p>${t.order?`任务开始后，可使用“${esc(t.order)}”指令。`:isAutoBattle(draft)?'可在海图部署阶段继续配置挂载与战术。':'可在海图部署阶段继续配置单位与挂载。'}</p></div>${!combatReady(draft)?'<p class="flow-note">请先在海图为双方部署战斗单位。</p>':''}</aside></div>`;
  }
  function briefing(){
    const last=page===3,action=readOnly?'resume':combatReady(draft)?'launch':'deploy';
    return `<nav class="flow-tabs" role="tablist" aria-label="剧本简报分页">${pages.map((p,i)=>`<button id="flow-tab-${i}" role="tab" aria-selected="${i===page}" aria-controls="flow-page" tabindex="${i===page?0:-1}" class="${i===page?'is-active':''}" data-flow-page="${i}"><span>${String(i+1).padStart(2,'0')}</span> ${p}</button>`).join('')}</nav><div id="flow-page" class="flow-scroll flow-brief-content" role="tabpanel" aria-labelledby="flow-tab-${page}">${[intro,details,deployment,objectives][page]()}</div><footer class="flow-footer"><button class="flow-secondary" data-flow-action="${page?'previous':readOnly?'resume':'select'}">← ${page?'上一页':readOnly?'返回战场':'返回剧本选择'}</button><span class="flow-page-count">${String(page+1).padStart(2,'0')} / 04</span><button class="primary" data-flow-action="${last?action:'next'}">${last?readOnly?'返回战场':action==='deploy'?'进入海图部署':isAutoBattle(draft)?'开始 AI 对战':'开始推演':`下一页：${pages[page+1]}`} →</button></footer>`;
  }
  function render(focusSelector){
    root.dataset.screen=screen;
    root.innerHTML=header()+(screen==='home'?home():screen==='select'?selection():briefing());
    visible(true);
    const focus=focusSelector?root.querySelector(focusSelector):root.querySelector('h1');
    focus?.focus({preventScroll:true});
  }
  function showHome(){pause();screen='home';render();}
  function showSelection(nextMode){pause();if(nextMode||readOnly||draft===getState())select(nextMode||mode);screen='select';readOnly=false;render();}
  function showCurrent(){pause();draft=getState();mode=modeFor(draft);choice=isAutoBattle(draft)?draft.automation.preset:draft.scenario;readOnly=true;screen='brief';page=0;render();}
  function launch(startNow){
    if(startNow){const r=start(draft);if(!r.ok){onError(r.error);return;}}
    onLaunch(draft);session=true;close();
  }
  function action(name){
    if(name==='home')showHome();
    if(name==='select'){if(readOnly||draft===getState())select(mode,choice);screen='select';readOnly=false;render();}
    if(name==='brief'){screen='brief';page=0;readOnly=false;render();}
    if(name==='next'||name==='previous'){page=Math.max(0,Math.min(3,page+(name==='next'?1:-1)));render();}
    if(name==='resume'){if(session)close();else if(onResume()){session=true;close();}}
    if(name==='import')onImport();
    if(name==='help')onHelp();
    if(name==='launch')launch(true);
    if(name==='deploy')launch(false);
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;e.stopPropagation();
    if(b.dataset.flowMode){select(b.dataset.flowMode);screen='select';render(`[data-flow-mode="${mode}"]`);}
    else if(b.dataset.flowChoice){select(mode,b.dataset.flowChoice);render(`[data-flow-choice="${choice}"]`);}
    else if(b.dataset.flowPage!==undefined){page=Number(b.dataset.flowPage);render(`[data-flow-page="${page}"]`);}
    else if(b.dataset.flowAction)action(b.dataset.flowAction);
  });
  root.addEventListener('change',e=>{
    const key=e.target.dataset.flowConfig;if(!key||readOnly||!isAutoBattle(draft))return;
    e.stopPropagation();const value=['seed','timeLimit'].includes(key)?Number(e.target.value):e.target.value;
    if(e.target.value===''||!e.target.checkValidity()){onError('请输入 0–4294967295 之间的整数随机种子');e.target.value=draft.automation[key];return;}
    const r=configureAutoBattle(draft,{[key]:value});if(!r.ok){onError(r.error);e.target.value=draft.automation[key];}
  });
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();action(screen==='brief'?readOnly?'resume':'select':screen==='select'?'home':session?'resume':'home');}
    if(e.target.dataset.flowPage!==undefined&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();page=e.key==='Home'?0:e.key==='End'?3:(page+(e.key==='ArrowRight'?1:3))%4;render(`[data-flow-page="${page}"]`);
    }
  });
  return {home:showHome,selection:showSelection,currentBrief:showCurrent,isOpen:()=>!root.hidden,
    selectScenario(id){pause();select(SCENARIOS[id]?.historical?'history':id==='autobattle'?'ai':'sandbox',id==='autobattle'?'surface':id);screen='brief';page=0;render();},
    markSession(){session=true;close();},
  };
}
