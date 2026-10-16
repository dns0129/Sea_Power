// Small A* grid for mission orders; every returned segment is checked against land.
export function seaRoute(from,to,{width,height,blocked,clear}){
  if(clear(from,to))return [{x:to.x,y:to.y}];
  const cell=.5,cols=Math.ceil(width/cell),rows=Math.ceil(height/cell),key=(x,y)=>y*cols+x;
  const coordinates=id=>({x:(id%cols)*cell+.25,y:Math.floor(id/cols)*cell+.25});
  const walkable=new Map();
  const allowed=id=>{if(!walkable.has(id)){const p=coordinates(id);walkable.set(id,p.x>=.25&&p.y>=.25&&p.x<width-.25&&p.y<height-.25&&!blocked(p));}return walkable.get(id);};
  function nearest(p){const gx=Math.floor(p.x/cell),gy=Math.floor(p.y/cell);for(let r=0;r<8;r++)for(let y=Math.max(0,gy-r);y<=Math.min(rows-1,gy+r);y++)for(let x=Math.max(0,gx-r);x<=Math.min(cols-1,gx+r);x++){const id=key(x,y);if(allowed(id)&&clear(p,coordinates(id)))return id;}return null;}
  const start=nearest(from),end=nearest(to);if(start===null||end===null)return null;
  const g=new Map([[start,0]]),parent=new Map(),heap=[];
  const push=(id,score)=>{let i=heap.length;heap.push({id,score});while(i>0){const p=(i-1)>>1;if(heap[p].score<=score)break;heap[i]=heap[p];i=p;}heap[i]={id,score};};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;if(heap[c].score>=last.score)break;heap[i]=heap[c];i=c;}heap[i]=last;}return top.id;};
  const h=id=>Math.hypot(coordinates(id).x-to.x,coordinates(id).y-to.y);push(start,h(start));const closed=new Set();
  while(heap.length){const current=pop();if(closed.has(current))continue;closed.add(current);if(current===end){
    const points=[{x:to.x,y:to.y}];let node=end;while(node!==start){points.unshift(coordinates(node));node=parent.get(node);}points.unshift(coordinates(start));
    const result=[];let last=from,i=0;while(i<points.length){let far=points.length-1;while(far>i&&!clear(last,points[far]))far--;if(!clear(last,points[far]))return null;result.push(points[far]);last=points[far];i=far+1;}return result;
  }
    const x=current%cols,y=Math.floor(current/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const next=key(nx,ny);if(closed.has(next)||!allowed(next))continue;
      const score=g.get(current)+cell*Math.hypot(dx,dy);if(score>=(g.get(next)??Infinity)||!clear(coordinates(current),coordinates(next)))continue;g.set(next,score);parent.set(next,current);push(next,score+h(next));
    }
  }return null;
}
