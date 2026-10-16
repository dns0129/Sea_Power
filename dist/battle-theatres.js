// Fictional exercise geometry. Coordinates remain nautical miles throughout the engine.
export const KM_PER_NM=1.852;
const separation=500/KM_PER_NM;
export const USCN_THEATRE={
  id:'uscn500',name:'美中远海对抗 · 虚构演习海域',width:440,height:260,
  initialSeparationKm:500,initialSeparationNm:separation,
  anchors:{blue:{x:(440-separation)/2,y:130},red:{x:(440+separation)/2,y:130}},
  factions:{blue:{name:'美方',country:'美国'},red:{name:'中方',country:'中国'}},
  land:[
    [[0,0],[43,0],[40,15],[29,25],[35,37],[22,47],[25,60],[13,72],[18,88],[0,97]],
    [[440,210],[424,218],[417,236],[409,245],[413,260],[440,260]],
    [[207,22],[223,17],[239,24],[245,38],[236,50],[221,47],[211,36]],
    [[207,218],[214,215],[221,221],[218,230],[211,232],[206,226]],
  ],
};
export const getBattleTheatre=s=>s?.mapId===USCN_THEATRE.id?USCN_THEATRE:null;
export const factionName=(s,side)=>getBattleTheatre(s)?.factions[side]?.name||(side==='blue'?'蓝方':'红方');
export function inDeploymentZone(s,side,p){const t=getBattleTheatre(s);return !t||(side==='blue'?p.x<=t.anchors.blue.x+1e-9:p.x>=t.anchors.red.x-1e-9);}
export function nearestSeparationKm(units){
  const blue=units.filter(u=>u.side==='blue'),red=units.filter(u=>u.side==='red');
  if(!blue.length||!red.length)return null;
  let closest=Infinity;for(const a of blue)for(const b of red)closest=Math.min(closest,Math.hypot(a.x-b.x,a.y-b.y));return closest*KM_PER_NM;
}
