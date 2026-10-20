// 海图 x/y 单位为海里；Three.js 的 x/z 保持同样坐标，y 为海拔。
export const METRES_PER_NM=1852;
export const DISPLAY_SCALES={realistic:{name:'真实比例 · 1:1',factor:1},tactical:{name:'统一放大 · ×12',factor:12}};
export const metresToScene=m=>m/METRES_PER_NM;
export const scenePosition=item=>({x:item.x,y:item.height||0,z:item.y});
export const sceneHeading=heading=>-(heading||0)*Math.PI/180;
export const modelLength=(item,profile,mode='realistic')=>metresToScene(item.lengthMetres||profile.length)*(DISPLAY_SCALES[mode]?.factor||1);
export const modelTransform=(item,profile,sourceLength,mode='realistic')=>({
  position:scenePosition(item),yaw:sceneHeading(item.heading),scale:modelLength(item,profile,mode)/sourceLength,
});
