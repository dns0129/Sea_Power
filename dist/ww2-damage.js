export const CRITICAL_PARTS={engine:'动力舱',flooding:'水下舱室',flightDeck:'飞行甲板',magazine:'弹药库',bridge:'舰桥与火控'};

// A rare actual hit may strike a vital compartment. Penetration strongly limits
// small-calibre shells against battleship armour; aircraft still need to hit.
export function criticalImpact(target,weapon,stats,baseDamage,type,random){
  if(type.domain!=='surface'||!stats.criticalChance)return {amount:baseDamage,part:null};
  const caliber=stats.caliber||203;
  const penetration=weapon==='gun'&&type.armor?caliber<150?.025:caliber<250?.09:caliber<350?.4:.85:1;
  if(random()>=stats.criticalChance*penetration)return {amount:baseDamage,part:null};
  const roll=random();
  const part=weapon==='torpedo'?roll<.55?'engine':'flooding':weapon==='bomb'&&type.deck&&roll<.65?'flightDeck':roll<.3?'magazine':roll<.7?'engine':'bridge';
  const remaining=part==='magazine'?.12:.28;
  return {amount:Math.max(baseDamage,target.hp-type.hp*remaining),part};
}
