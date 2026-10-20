// 所有批量指令复用单机校验；失败项回传给界面，避免静默漏令。
export function commandUnits(s,ids,order,api){
  if(!Array.isArray(ids)||!order||typeof order!=='object')return {ok:false,error:'群体指令无效'};
  const units=[...new Set(ids)].map(id=>api.unitById(s,id));
  if(!units.length||units.length>60||units.some(u=>!api.controllable(s,u)))return {ok:false,error:'请选择可指挥的存活单位'};
  if(new Set(units.map(u=>u.side)).size!==1)return {ok:false,error:'群体指令只能下达给同一阵营'};
  const applied=[],skipped=[];
  if(['escort','group'].includes(order.kind)){
    const leader=api.unitById(s,order.leaderId),followers=units.filter(u=>u!==leader);
    if(!api.controllable(s,leader)||leader.side!==units[0].side||!followers.length||leader.leader||api.types[leader.type].domain===(order.kind==='escort'?'air':'land')||order.kind==='escort'&&api.types[leader.type].domain!=='surface')return {ok:false,error:'请选择同方独立舰船护航，或选中编组中的空中领队'};
    if(order.kind==='group'&&(!units.includes(leader)||units.some(u=>api.types[u.type].domain!=='air')))return {ok:false,error:'协同机群须包含至少两个在空机群与所选领队'};
    if(followers.some(u=>!['air','surface'].includes(api.types[u.type].domain)||api.types[u.type].domain==='air'&&u.flightState!=='airborne'||s.units.some(v=>v.leader===u.id)))return {ok:false,error:'返航、整备或正在带队的单位不能加入跟随'};
    if(order.kind==='group'&&leader.flightState!=='airborne')return {ok:false,error:'领队必须在空'};
    followers.forEach((u,n)=>{const air=api.types[u.type].domain==='air';u.leader=leader.id;u.offset={x:(n%2?1:-1)*(air?1.5:5)*(1+Math.floor(n/2)%6),y:(air?1.5:6)+Math.floor(n/12)*(air?1.5:5)};u.route=[];u.refuelTarget=null;u.commandMode=order.kind;u.manualTarget=null;u.lockedTarget=u.aiTarget=null;u.combatGoal=null;applied.push(u.id);});
    if(order.kind==='group'){leader.commandMode='group';applied.push(leader.id);}
  }else{
    for(const u of [...units].sort((a,b)=>(!!a.leader)-(!!b.leader))){
      let r={ok:true};
      if(order.kind==='route'){
        // Followers move with a selected leader, retaining the explicit group.
        if(u.leader&&ids.includes(u.leader)){if(applied.includes(u.leader))applied.push(u.id);else skipped.push({id:u.id,name:u.name,error:'领队航线未能执行'});continue;}
        r=api.setRoute(s,u.id,order.point,order.append===true);
      }else if(order.kind==='return')r=api.types[u.type].domain==='air'?api.returnToBase(s,u.id):{ok:false,error:'仅飞机可返航'};
      else if(order.kind==='speed')r=api.setSpeed(s,u.id,order.value);
      else if(order.kind==='altitude')r=api.setAltitude(s,u.id,order.value);
      else if(order.kind==='autoEngage'){r=api.setFreeFire(s,u.id,!!order.value);}
      else if(order.kind==='independent'||order.kind==='resumeAI'||order.kind==='stop'){
        if(api.types[u.type].domain==='air'&&u.flightState!=='airborne'){r={ok:false,error:'飞机正在返航或整备'};}
        else {u.leader=null;u.offset=null;u.manualTarget=null;u.lockedTarget=u.aiTarget=null;u.combatGoal=null;u.commandMode=order.kind==='resumeAI'?'mission':order.kind==='independent'?'independent':'manual';if(order.kind==='independent')for(const v of s.units.filter(v=>v.leader===u.id&&v.commandMode==='group')){v.leader=null;v.offset=null;v.commandMode='independent';}if(order.kind==='stop'){u.route=[];if(api.types[u.type].domain!=='air'||api.types[u.type].rotary)u.speed=0;}}
      }else if(order.kind==='attack'){
        const c=s.contacts[u.side][order.targetId];
        if(!c||s.time-c.time>6||c.quality!=='track')r={ok:false,error:'攻击需要有效目标报告'};
        else if(!Object.keys(u.weapons).some(k=>u.weapons[k]>0&&api.weaponStats(u,k).targets.includes(c.domain)))r={ok:false,error:'无适用武器'};
        else {r=api.types[u.type].domain==='land'||u.leader&&ids.includes(u.leader)?{ok:true}:api.setRoute(s,u.id,{x:c.x,y:c.y});if(r.ok){u.manualTarget=c.id;u.autoEngage=true;u.fireAtWill=true;}}
      }else return {ok:false,error:'未知群体指令'};
      if(r.ok)applied.push(u.id);else skipped.push({id:u.id,name:u.name,error:r.error});
    }
  }
  if(!applied.length)return {ok:false,error:skipped[0]?.error||'没有单位可执行此指令',applied,skipped};
  api.log(s,`群体指令：${{route:'航行',return:'返航',speed:'速度',altitude:'高度',autoEngage:'自动交战',escort:'舰船护航',group:'机群协同',independent:'独立行动',resumeAI:'恢复作战计划',stop:'待命',attack:'攻击'}[order.kind]} · ${applied.length} 个单位${skipped.length?`，${skipped.length} 个未执行`:''}`);
  return {ok:true,applied,skipped};
}
