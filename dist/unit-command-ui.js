import {CRITICAL_PARTS} from './ww2-damage.js?v=0.12.0';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function unitCommandCard(u,{contacts=[],choice=null,disabled=false,phase='running'}={}){
  const mode=u.commandMode||'mission',lock=u.lockedTarget,chosen=choice||lock||'',label=contacts.find(c=>c.id===lock)?.label||contacts.find(c=>c.id===lock)?.name;
  return `<section class="unit-command-card" aria-label="单独单位指挥"><div class="unit-command-heading"><strong>单位指挥</strong><small>${mode==='ai'?'AI 接管':mode==='follow'?'目标跟随':mode==='manual'?'手动':'随任务计划'}</small></div><div class="unit-command-actions">${[['ai','AI 接管'],['manual','手动指挥'],['mission','任务计划']].map(([key,name])=>`<button type="button" data-unit-control="${key}" data-control-unit="${esc(u.id)}" class="${mode===key?'active':''}" ${disabled?'disabled':''}>${name}</button>`).join('')}</div><p>${esc(u.commandStatus||'随任务计划')}${lock?` · ${esc(label||'最后报告目标')}`:''}</p><label class="unit-lock-label">敌方接触<select data-lock-choice="${esc(u.id)}" aria-label="选择锁定目标" ${disabled||phase!=='running'?'disabled':''}><option value="">选择已发现的敌方单位</option>${contacts.map(c=>`<option value="${esc(c.id)}" ${chosen===c.id?'selected':''}>${esc(c.label||c.name)}${c.stale?' · 最后报告':''}</option>`).join('')}</select></label><button type="button" class="unit-lock-button" data-unit-lock="${esc(u.id)}" ${disabled||phase!=='running'||!contacts.length?'disabled':''}>${u.domain==='land'?'锁定并跟踪':'锁定并跟随'}</button><small class="unit-command-note">单独命令优先于任务计划。失联后按最后报告搜索；近距缠斗会降低交战机群速度。</small></section>`;
}

export function unitCombatStatus(u){
  const fights=u.dogfightWith||[],hit=u.criticalHits?.at(-1);
  return `${fights.length?`<p class="unit-combat-alert">正在缠斗 · 航速受限<br><small>脱离近距交战后恢复正常航速</small></p>`:''}${hit?`<p class="unit-critical-alert">关键部位重伤 · ${esc(CRITICAL_PARTS[hit.part])}</p>`:''}`;
}
