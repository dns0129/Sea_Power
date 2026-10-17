// Smoke blocks optical lines for either side. Radar is handled separately.
export function smokeBlocks(s,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
  return (s.smoke||[]).some(c=>{
    if(c.until<=s.time)return false;
    const t=l?Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/l)):0;
    return Math.hypot(a.x+dx*t-c.x,a.y+dy*t-c.y)<c.radius;
  });
}

export function updateSmoke(s){
  s.smoke=(s.smoke||[]).filter(c=>c.until>s.time);
  for(const u of s.units.filter(u=>u.hp>0&&!u.exited&&u.smokeUntil>s.time)){
    const previous=s.smoke.filter(c=>c.owner===u.id).at(-1);
    if(previous&&s.time-previous.born<12)continue;
    s.smoke.push({owner:u.id,x:u.x,y:u.y,radius:1.8,born:s.time,until:s.time+150});
  }
  s.smoke=s.smoke.slice(-120);
}
