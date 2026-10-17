import {REAL_MAPS} from './real-coastlines.js?v=0.10.0';
import {WW2_MAPS} from './ww2-data.js?v=0.10.0';
export {REAL_MAPS};
export const geographicMap=s=>REAL_MAPS[s?.mapId]||WW2_MAPS[s?.mapId]||null;
export function geoToWorld(map,lon,lat){return {x:(lon-map.west)*60*Math.cos(map.referenceLatitude*Math.PI/180),y:(map.north-lat)*60};}
export function worldToGeo(map,p){return {lon:map.west+p.x/(60*Math.cos(map.referenceLatitude*Math.PI/180)),lat:map.north-p.y/60};}
export function formatGeo(map,p){const g=worldToGeo(map,p);return `${Math.abs(g.lat).toFixed(3)}°${g.lat<0?'S':'N'}  ${Math.abs(g.lon).toFixed(3)}°${g.lon<0?'W':'E'}`;}
