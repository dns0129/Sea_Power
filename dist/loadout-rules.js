import {PAYLOAD_WEIGHTS} from './modern-catalog.js?v=0.10.0';

// Counts and capacity costs are game abstractions, not real loading instructions.
export const CUSTOM_MISSIONS=Object.freeze({general:'通用',air:'制空／防空',naval:'对海',asw:'反潜',strike:'对地',sead:'压制',close:'近距支援'});
const WEAPON_KEYS=Object.freeze(['gun','asroc','pgm','atgm','asm','supersonic','aam','sam','point','torpedo','arm','ir','bomb','cruise']);
const MISSION_WEAPONS=Object.freeze({air:['aam','ir','sam','point'],naval:['asm','supersonic','atgm'],asw:['torpedo','asroc'],strike:['pgm','cruise','bomb'],sead:['arm'],close:['atgm']});
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

export function missionWeaponKeys(mission){return Object.hasOwn(MISSION_WEAPONS,mission)?[...MISSION_WEAPONS[mission]]:null;}

export function supportsCustom(t){
  return !!(t?.model&&['air','surface','sub'].includes(t.domain)&&Object.values(t.weapons||{}).some(n=>n>0));
}

export function loadoutUsage(t,weapons={}){
  const air=t?.domain==='air',payloadLimit=air?(Number.isFinite(t.payloadSlots)?Math.max(0,t.payloadSlots):0):null;
  const vlsLimit=Number.isFinite(t?.vlsCells)&&t.vlsCells>0?t.vlsCells:null;
  const payloadUsed=air?Object.entries(weapons).reduce((n,[key,count])=>n+count*(PAYLOAD_WEIGHTS[key]||1),0):0;
  const vlsUsed=Object.entries(t?.vlsWeapons||{}).reduce((n,[key,weight])=>n+(weapons[key]||0)*weight,0);
  return {payloadUsed,payloadLimit,vlsUsed,vlsLimit};
}

function externalPayload(t,weapons){
  if(t.domain!=='air'||!(t.signature<.5))return false;
  const internal={aam:t.internalAam||0,ir:t.internalIr||0,pgm:t.internalPgm||0};
  return Object.entries(weapons).some(([key,count])=>count>(internal[key]||0));
}

export function validateCustom(t,draft){
  const fail=error=>({ok:false,error});
  if(!supportsCustom(t))return fail('该平台不支持自定义挂载或弹库。');
  if(!record(draft)||!record(draft.weapons))return fail('请提供有效的武器数量。');
  if(draft.name!==undefined&&typeof draft.name!=='string')return fail('挂载名称必须是文字。');
  const name=draft.name?.trim()||(t.domain==='air'?'自定义挂载':'自定义弹库');
  if(name.length>36||/[\u0000-\u001f\u007f]/u.test(name))return fail('挂载名称最多 36 个字符，且不能包含控制字符。');
  const mission=draft.mission??'general';
  if(typeof mission!=='string'||!Object.hasOwn(CUSTOM_MISSIONS,mission))return fail('请选择有效的任务类型。');
  for(const [key,count] of Object.entries(draft.weapons)){
    if(!WEAPON_KEYS.includes(key))return fail('挂载包含未知武器。');
    if(!Number.isSafeInteger(count)||count<0)return fail('武器数量必须是非负整数。');
    if(count>(t.weapons[key]||0))return fail('武器数量超出该型号的兼容上限。');
  }
  const weapons=Object.fromEntries(WEAPON_KEYS.filter(key=>Object.hasOwn(draft.weapons,key)&&draft.weapons[key]>0).map(key=>[key,draft.weapons[key]]));
  if(!Object.keys(weapons).length)return fail('自定义挂载至少需要一种武器。');
  const usage=loadoutUsage(t,weapons);
  if(usage.payloadLimit!==null&&usage.payloadUsed>usage.payloadLimit)return fail('挂载超过该型号的载荷额度。');
  if(usage.vlsLimit!==null&&usage.vlsUsed>usage.vlsLimit)return fail('弹库超过共享垂直发射容量。');
  const primary=missionWeaponKeys(mission);
  if(primary&&!primary.some(key=>weapons[key]>0))return fail('当前挂载缺少所选任务需要的主武器。');
  const external=externalPayload(t,weapons);
  const note=t.domain==='air'?'仅能使用该型号兼容的武器；任务类型不改变武器的目标限制。'+(external?' 外部挂载削弱低可探测优势。':''):'共享垂发与各独立弹库分别计数；任务类型不改变武器的目标限制。';
  return {ok:true,row:{id:'custom',name,mission,weapons,external,note},usage};
}
