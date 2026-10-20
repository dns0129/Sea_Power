export const playerSide=s=>s?.playerSide==='red'?'red':'blue';
export const opposingSide=side=>side==='red'?'blue':'red';
export const aiControlLocked=s=>!!s?.automation?.started&&s.automation.control!=='player';
export const playerOutcome=(s,result)=>playerSide(s)==='red'&&result!=='draw'?(result==='victory'?'defeat':'victory'):result;

const FACTIONS={
  denmark41:[['英军','英国','🇬🇧'],['德军','德国','🇩🇪']],
  guadalcanal42:[['美军','美国','🇺🇸'],['日军','日本','🇯🇵']],
  samar44:[['美军','美国','🇺🇸'],['日军','日本','🇯🇵']],
  midway42:[['美军','美国','🇺🇸'],['日军','日本','🇯🇵']],
  ww2sandbox:[['美军','美国','🇺🇸'],['日军','日本','🇯🇵']],
  bubiyan91:[['联军','英国／美国','🇬🇧 🇺🇸'],['伊拉克海军','伊拉克','🇮🇶']],
  mantis88:[['美军','美国','🇺🇸'],['伊朗海军','伊朗','🇮🇷']],
  sanCarlos82:[['英军','英国','🇬🇧'],['阿根廷航空兵','阿根廷','🇦🇷']],
};
const ESTIMATES={
  denmark41:['英国主力舰与外围跟踪巡洋舰','德国战列舰与重巡洋舰突围编队'],
  guadalcanal42:['美军战列舰、驱逐舰与岸上机场','日本战列舰、巡洋舰和鱼雷驱逐舰'],
  samar44:['护航航母及驱逐舰掩护编队','日本战列舰、巡洋舰和鱼雷驱逐舰追击编队'],
  midway42:['航母特遣舰队、巡洋舰、驱逐舰与岸基侦察航空兵','多艘航空母舰，巡洋舰、驱逐舰和舰载攻击航空兵'],
  bubiyan91:['水面护航舰、舰载直升机与攻击机','数艘向东撤离的小型武装舰艇'],
  mantis88:['水面指挥舰与舰载攻击机','护卫舰与可能到达的岸基攻击航空兵'],
  sanCarlos82:['运输船、防空护卫舰与海鹞战斗机','分批到达的低空攻击机；首波约两分钟后进入海域'],
  ww2sandbox:['按部署点配置的舰艇、潜艇和航空队','按部署点自定义的舰艇、潜艇和航空队'],
};
export function factionInfo(s,side){
  const row=(String(s?.mapId).startsWith('uscn')?[['美方','美国','🇺🇸'],['中方','中国','🇨🇳']]:FACTIONS[s?.scenario])?.[side==='red'?1:0];
  return row?{name:row[0],country:row[1],flag:row[2]}:{name:side==='red'?'红方':'蓝方',country:'自定义编队',flag:side==='red'?'🔴':'🔵'};
}
export const forceEstimate=(s,side)=>ESTIMATES[s?.scenario]?.[side==='red'?1:0]||'可能包含水面舰艇、潜艇、航空兵与岸基支援；实际编组需侦察确认';
