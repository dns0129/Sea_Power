import {TYPES,WEAPONS,CUSTOM_MISSIONS,validateCustomLoadout,loadoutUsage} from './engine.js?v=0.13.1';

const targetNames={air:'航空目标',surface:'水面舰艇',sub:'潜艇',land:'陆地目标',missile:'来袭导弹'};
const missionFor=row=>row?.mission||({naval:'naval',navalEscort:'naval',navalHeavy:'naval',asw:'asw',cap:'air',air:'air',strike:'strike',sead:'sead',close:'close'}[row?.id]||'general');
export function loadoutUsageText(type,weapons){const n=loadoutUsage(type,weapons),parts=[];if(n.payloadLimit!==null)parts.push(`载荷额度 ${n.payloadUsed} / ${n.payloadLimit}`);if(n.vlsLimit!==null)parts.push(`垂发占用 ${n.vlsUsed} / ${n.vlsLimit} 单元`);return parts.join(' · ');}

// Each editor receives a private draft. Applying writes through the engine; presets remain shared read-only data.
export function createLoadoutEditor({modal,escape:esc}){
  let editing=null;
  const form=()=>document.querySelector('#custom-loadout-form');
  function draft(){const f=form();return {name:f.elements.namedItem('name').value,mission:f.elements.namedItem('mission').value,weapons:Object.fromEntries([...f.querySelectorAll('[data-custom-weapon]')].map(el=>[el.dataset.customWeapon,el.value===''?NaN:Number(el.value)]))};}
  function refresh(){if(!editing||!form())return;const value=draft(),check=validateCustomLoadout(editing.type,value),usage=loadoutUsage(editing.type,value.weapons),parts=[];
    if(usage.payloadLimit!==null)parts.push(`<span class="${usage.payloadUsed>usage.payloadLimit?'over-capacity':''}">载荷额度 <b>${usage.payloadUsed} / ${usage.payloadLimit}</b></span>`);
    if(usage.vlsLimit!==null)parts.push(`<span class="${usage.vlsUsed>usage.vlsLimit?'over-capacity':''}">垂发单元 <b>${usage.vlsUsed} / ${usage.vlsLimit}</b></span>`);
    document.querySelector('#custom-loadout-usage').innerHTML=parts.join('')||'<span>按该平台各武器的集成数量上限配置</span>';
    document.querySelector('#custom-loadout-error').textContent=check.ok?'配置可用':check.error;
    document.querySelector('#custom-loadout-error').classList.toggle('valid',check.ok);
    document.querySelector('#custom-loadout-external').textContent=check.ok&&check.row.external?'此配置使用外挂，会增加雷达可探测特征。':'';
    document.querySelector('#custom-loadout-apply').disabled=!check.ok;
  }
  function applyTemplate(id){const row=TYPES[editing.type].loadouts.find(r=>r.id===id);if(!row)return;const f=form();f.elements.namedItem('name').value=`${row.name} · 自定义`;f.elements.namedItem('mission').value=missionFor(row);for(const el of f.querySelectorAll('[data-custom-weapon]'))el.value=row.weapons[el.dataset.customWeapon]||0;refresh();}
  document.addEventListener('input',e=>{if(e.target.closest('#custom-loadout-form'))refresh();});
  document.addEventListener('change',e=>{if(e.target.id==='custom-loadout-template')applyTemplate(e.target.value);else if(e.target.closest('#custom-loadout-form'))refresh();});
  document.addEventListener('click',e=>{if(!e.target.closest('[data-custom-loadout-cancel]'))return;if(editing?.onCancel)editing.onCancel();else document.querySelector('#dialog').close();});
  document.addEventListener('submit',e=>{if(e.target.id!=='custom-loadout-form'||!editing)return;e.preventDefault();const value=draft(),check=validateCustomLoadout(editing.type,value);if(!check.ok){refresh();return;}const result=editing.onApply(check.row);if(result?.ok===false){document.querySelector('#custom-loadout-error').textContent=result.error;document.querySelector('#custom-loadout-error').classList.remove('valid');}});
  return {open({type,row,onApply,onCancel,title}){const t=TYPES[type];editing={type,onApply,onCancel};row=row||t.loadouts[0];
    modal(title||`${t.name} · ${t.domain==='air'?'自定义挂载':'自定义弹库'}`,`<p>选择任务定位，再分配各类武器。平台兼容武器、各类数量上限、载荷额度和共享垂发单元会共同限制配置；参数用于游戏推演。</p><form id="custom-loadout-form" novalidate><div class="custom-loadout-meta"><label>配置名称<input name="name" maxlength="36" value="${esc(row.id==='custom'?row.name:`${row.name} · 自定义`)}" required></label><label>任务定位<select name="mission">${Object.entries(CUSTOM_MISSIONS).map(([key,name])=>`<option value="${key}" ${missionFor(row)===key?'selected':''}>${esc(name)}</option>`).join('')}</select></label></div><label class="control-select">从现有方案开始<select id="custom-loadout-template"><option value="">保留当前草稿</option>${t.loadouts.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label><div class="custom-loadout-usage" id="custom-loadout-usage" aria-live="polite"></div><div class="custom-weapon-list">${Object.entries(t.weapons).filter(([key,n])=>n>0&&WEAPONS[key]).map(([key,max])=>{const w={...WEAPONS[key],...t.profiles[key]};return `<label class="custom-weapon-row"><span><strong>${esc(w.name)}</strong><small>${w.minRange}–${w.range} 海里（约 ${Math.round(w.range*1.852)} 公里） · ${w.targets.map(k=>targetNames[k]||k).join('、')}</small><small>本平台上限 ${max}${t.vlsWeapons?.[key]?` · 每枚占 ${t.vlsWeapons[key]} 垂发单元`:''}</small></span><input type="number" min="0" max="${max}" step="1" value="${row.weapons[key]||0}" data-custom-weapon="${key}" aria-label="${esc(w.name)}数量" inputmode="numeric"></label>`;}).join('')}</div><p id="custom-loadout-external" class="custom-loadout-external"></p><p id="custom-loadout-error" class="custom-loadout-feedback" role="status" aria-live="polite"></p><div class="custom-loadout-actions"><button type="button" class="outline" data-custom-loadout-cancel>取消</button><button type="submit" id="custom-loadout-apply" class="primary">应用此配置</button></div></form>`);document.querySelector('#dialog').classList.add('loadout-dialog');refresh();},refresh};
}
