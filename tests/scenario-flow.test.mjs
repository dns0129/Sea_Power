import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,createAutoBattle,SCENARIOS,AUTO_PRESETS,serialize} from '../dist/engine.js?v=0.13.1';
import {briefingChart,missionGoals,scenarioChoices,scenarioThumbnail,homeMenu} from '../dist/scenario-flow.js?v=0.13.1';

test('首页直接提供四个模式入口，不渲染海图或自动继续战局',()=>{
  const html=homeMenu();
  assert.match(html,/选择游戏模式/);
  for(const mode of ['history','ww2','ai','sandbox'])assert.match(html,new RegExp(`data-flow-mode="${mode}"`));
  assert.doesNotMatch(html,/<canvas|flow-chart|flow-home-map/);
  assert.match(html,/data-flow-action="resume" disabled/);
  assert.doesNotMatch(homeMenu({hasSave:true}),/data-flow-action="resume" disabled/);
});

test('模式选择覆盖现有剧本与 AI 预案，目标遵循各自任务规则',()=>{
  const ids=[...scenarioChoices('history'),...scenarioChoices('ww2'),...scenarioChoices('sandbox')].map(s=>s.id);
  assert.deepEqual(new Set(ids),new Set(Object.keys(SCENARIOS).filter(id=>id!=='autobattle')));
  assert.equal(ids.length,new Set(ids).size);
  assert.deepEqual(scenarioChoices('ai').map(s=>s.id),AUTO_PRESETS.map(p=>p.id));
  assert.match(JSON.stringify(missionGoals(createState('bubiyan91'))),/30 分钟/);
  assert.match(JSON.stringify(missionGoals(createState('mantis88'))),/40%/);
  assert.match(JSON.stringify(missionGoals(createState('sanCarlos82'))),/120 秒/);
  for(const id of ['modernlab','sandbox'])assert.match(JSON.stringify(missionGoals(createState(id))),/没有强制胜负/);
});

test('历史简报绘制不读取隐藏敌方位置，也不改变任务与兵力状态',()=>{
  for(const id of scenarioChoices('history').map(c=>c.id)){
    const s=createState(id),before=serialize(s);
    briefingChart(s);briefingChart(s,{deployment:true});missionGoals(s);
    assert.equal(serialize(s),before);
    for(const u of s.units.filter(u=>u.side==='red'))for(const key of ['x','y'])Object.defineProperty(u,key,{get(){throw Error('简报读取了隐藏敌方位置');}});
    assert.doesNotThrow(()=>briefingChart(s,{deployment:true}));
    assert.doesNotThrow(()=>briefingChart(s));
  }
  const arena=createAutoBattle('surface');
  assert.match(briefingChart(arena,{deployment:true}),/远海/);
});

test('手动沙盘开战后的简报不泄露敌方部署位置',()=>{
  for(const id of ['modernlab','sandbox']){
    const s=createState(id);s.phase='running';
    for(const u of s.units.filter(u=>u.side==='red'))for(const key of ['x','y'])Object.defineProperty(u,key,{get(){throw Error('简报泄露敌方位置');}});
    assert.doesNotThrow(()=>briefingChart(s,{deployment:true}));
  }
});

test('历史剧本缩略海图使用各自真实海岸线，且不需要生成战斗单位',()=>{
  const thumbnails=scenarioChoices('history').map(c=>scenarioThumbnail('history',c.id));
  assert.equal(new Set(thumbnails).size,3);
  for(const html of thumbnails){assert.match(html,/<polygon/);assert.doesNotMatch(html,/<circle|translate\(/);}
});
