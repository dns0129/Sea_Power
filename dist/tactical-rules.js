// 游戏参数。计算只接收本方状态和观测报告，不查询敌方隐藏位置。
export const WEATHER={
  clear:{name:'晴朗',vision:1,gunnery:1},
  rain:{name:'降雨',vision:.72,gunnery:.78},
  fog:{name:'浓雾',vision:.38,gunnery:.58},
  storm:{name:'风暴',vision:.4,gunnery:.5},
};
export const AI_LEVELS={
  amateur:{name:'业余',reaction:24,retreat:.16,coordination:false,description:'24 秒反应；就近接敌，重伤后撤。'},
  professional:{name:'专业',reaction:8,retreat:.32,coordination:true,description:'8 秒反应；按任务选目标、协同护航并保存兵力。'},
  ace:{name:'王牌',reaction:4,retreat:.48,coordination:true,description:'4 秒反应；分配火力、分散搜索、掩护与多方向接敌。'},
};
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const weatherFor=s=>WEATHER[s.weather]||WEATHER.clear;
export const aiLevel=(s,side)=>AI_LEVELS[s.automation?.[side+'Difficulty']||s.aiDifficulty]||AI_LEVELS.professional;
export const visualRange=(s,t,domain)=>
  (domain==='air'?t.eoAirRange||8:t.eoRange||5)*weatherFor(s).vision*(s.timeOfDay==='night'?(t.era==='ww2'?(domain==='land'?.65:.23):.55):1);

export function gunnerySolution(s,u,c,w){
  const local=c?.observations?.[u.id],fresh=local&&s.time-local.time<=6;
  const radarFix=fresh&&local.source==='雷达'&&u.radar&&!w.opticalOnly;
  const visibility=fresh&&local.source==='目视'?clamp(local.visibility??.8,0,1):radarFix?.8:0;
  const ratio=Math.hypot(u.x-(c?.x??u.x),u.y-(c?.y??u.y))/w.range;
  const factors={weather:weatherFor(s).gunnery,visibility:.25+.75*visibility,
    rangefinder:.25+.75*clamp(u.rangefinder??1,0,1),
    light:s.timeOfDay==='night'?(radarFix?.8:.45):1,
    range:ratio>.8?.64:ratio>.55?.85:1};
  const chance=clamp(w.hit*Object.values(factors).reduce((n,v)=>n*v,1),.01,.93);
  return {chance,visibility,factors};
}

export function airCombatProfile(u,t){
  const size=t.squadronSize||1,count=clamp(u.aircraft??size,0,size);
  return {count,size,maneuver:t.airCombat?.maneuver||50,defense:t.airCombat?.defense||50,firepower:t.airCombat?.firepower||50};
}
export function dogfightSolution(attacker,defender,w,cohesion=1){
  const maneuver=clamp(Math.sqrt(attacker.maneuver/defender.maneuver),.55,1.5);
  const defense=clamp(Math.sqrt(60/defender.defense),.65,1.5);
  return {chance:clamp(w.hit*maneuver*defense*cohesion,.04,.9),
    damageScale:attacker.count/attacker.size*(attacker.firepower/60)*cohesion};
}
