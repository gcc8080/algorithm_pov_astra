const story=require('./story.cjs'),A=require('./algorithms.cjs'),{Image}=require('@napi-rs/canvas');
const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)},out=x=>1-(1-clamp(x))**3;
const fract=x=>x-Math.floor(x),hash=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
const palette=['#64f4ff','#ad75ff','#ff5fa2','#ffc66f','#80ffba','#e2d9ff'];
function rgb(c,a=1){return `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},${a})`}
function colorBlend(a,b,t){t=clamp(t);return '#'+[1,3,5].map(i=>Math.round(lerp(parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),t)).toString(16).padStart(2,'0')).join('')}
function makeFilm(createCanvas){
 const sprites=new Map();
 function sprite(c){if(sprites.has(c))return sprites.get(c);const k=createCanvas(96,96),g=k.getContext('2d'),r=g.createRadialGradient(48,48,0,48,48,48);r.addColorStop(0,'#ffffff');r.addColorStop(.055,'#ffffff');r.addColorStop(.12,rgb(c,.9));r.addColorStop(.27,rgb(c,.3));r.addColorStop(.6,rgb(c,.045));r.addColorStop(1,rgb(c,0));g.fillStyle=r;g.fillRect(0,0,96,96);const immutable=new Image();immutable.src=k.toBuffer('image/png');sprites.set(c,immutable);return immutable}
 const stars=Array.from({length:470},(_,i)=>({x:hash(i)*2600-1300,y:hash(i+600)*1400-700,z:hash(i+1000)*1800-600,r:.5+hash(i+55)*1.7}));
 const dust=Array.from({length:1100},(_,i)=>({a:hash(i+2)*TAU,r:Math.sqrt(hash(i+300))*650,z:hash(i+900)*700-350}));
 // Organic binary recursion, stored once and revealed over time.
 const branches=[];
 function branch(x,y,z,len,ang,depth,id){if(depth>9)return;const nx=x+Math.sin(ang)*len,ny=y-Math.cos(ang)*len,nz=z+Math.sin(id*1.7)*len*.45;branches.push({a:[x,y,z],b:[nx,ny,nz],depth,id});branch(nx,ny,nz,len*.73,ang-.45-.07*Math.sin(id),depth+1,id*2);branch(nx,ny,nz,len*.73,ang+.45+.08*Math.cos(id),depth+1,id*2+1)}
 branch(0,300,0,150,0,0,1);
 function draw(ctx,t,W=1920,H=1080){
  const shot=Math.min(39,Math.floor(t/7.5)),local=t-shot*7.5,q=local/7.5,[kind,zh,en,cn,eng]=story[shot];
  const beat=t*128/60,hit=Math.exp(-fract(beat)*8),slow=t*.1;
  const primary=palette[Math.floor(shot/4)%palette.length],secondary=palette[(Math.floor(shot/4)+2)%palette.length];
  ctx.save();ctx.scale(W/1920,H/1080);ctx.fillStyle='#02030a';ctx.fillRect(0,0,1920,1080);
  const text=(s,x,y,size=30,c='#f3f6ff',align='left',bold=false,alpha=1)=>{ctx.globalAlpha=alpha;ctx.fillStyle=c;ctx.font=`${size}px "${bold?'Film Bold':'Film Regular'}"`;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.globalAlpha=1};
  const stroke=(pts,c,w=1,a=1)=>{if(pts.length<2)return;ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();ctx.globalAlpha=1};
  const poly=(pts,c,a=1)=>{ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fill();ctx.globalAlpha=1};
  const glow=(x,y,r,c=primary,a=1)=>{if(r<.1)return;ctx.globalAlpha=clamp(a);ctx.drawImage(sprite(c),x-r*6,y-r*6,r*12,r*12);ctx.globalAlpha=1};
  const orb=(p,r,c=primary,a=1)=>glow(p.x,p.y,r*p.s,c,a);
  const ring=(x,y,r,c=primary,w=1,a=.4)=>{ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.globalAlpha=1};
  let yaw=.3,pitch=.25,dist=1250,centerX=960,centerY=485,focal=1150;
  function P(x,y,z=0){const c=Math.cos(yaw),s=Math.sin(yaw),xx=x*c-z*s,zz=x*s+z*c,yy=y*Math.cos(pitch)-zz*Math.sin(pitch),zz2=y*Math.sin(pitch)+zz*Math.cos(pitch);const scale=focal/Math.max(140,dist+zz2);return{x:centerX+xx*scale,y:centerY+yy*scale,s:scale,z:zz2}}
  function cube(x,y,z,w,h,d,c,a=1){const pts=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]].map(([xx,yy,zz])=>P(x+xx*w/2,y+yy*h,z+zz*d/2));
   const faces=[[0,1,5,4,.38],[1,2,6,5,.62],[2,3,7,6,.5],[3,0,4,7,.3],[4,5,6,7,.9]].map(f=>({p:f.slice(0,4).map(i=>pts[i]),s:f[4]})).sort((a,b)=>b.p.reduce((s,p)=>s+p.z,0)-a.p.reduce((s,p)=>s+p.z,0));
   for(const f of faces){poly(f.p,colorBlend('#040719',c,f.s),a);stroke([...f.p,f.p[0]],c,.75,a*.35)}
   return pts;
  }
  // Letterboxed stage. Text and captions remain outside camera transforms.
  ctx.save();ctx.beginPath();ctx.rect(0,66,1920,850);ctx.clip();
  for(const [x,y,r,c,a]of[[400+Math.sin(slow)*300,380,770,primary,.2],[1500,430+Math.cos(slow)*170,750,secondary,.18],[1000,850,900,'#457bdb',.12]]){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgb(c,a));g.addColorStop(1,rgb(c,0));ctx.fillStyle=g;ctx.fillRect(0,66,1920,850)}
  yaw=Math.sin(t*.035)*.16;pitch=.05;
  for(const st of stars){const p=P(st.x,st.y,st.z);ctx.globalAlpha=.14+hash(st.z)*.3;ctx.fillStyle='#bbd1ff';ctx.fillRect((p.x+t*1.4)%2000,p.y,st.r,st.r)}ctx.globalAlpha=1;
  function latticeFloor(c=primary){for(let z=-600;z<1300;z+=100){const a=P(-1600,310,z),b=P(1600,310,z);stroke([a,b],c,1,.12)}for(let x=-1600;x<=1600;x+=100)stroke([P(x,310,-600),P(x,310,1300)],c,1,.1)}
  if(['genesis','vortex','title','lattice'].includes(kind)){
   yaw=t*.025;pitch=.12+Math.sin(t*.1)*.1;dist=1300-(shot===1?q*380:0);
   const shape=smooth((t-16)/13);
   ctx.globalCompositeOperation='lighter';
   for(let i=0;i<1700;i++){
    const a=i*2.39996+slow*.2,r=170+hash(i+12)*430;
    let x=Math.cos(a)*r,y=(hash(i+47)-.5)*580,z=Math.sin(a)*r;
    if(shot===0){const squeeze=smooth(q);x*=1.8-squeeze*.6;y*=1.1;z+=((hash(i+120)*2000-t*95)%2000)-1000}
    if(shot===1||shot===2){const h=i/1700;const th=a+Math.sin(h*18+t*.6)*.5;x=Math.cos(th)*r;y=Math.sin(a*.13+t*.22)*180+(h-.5)*380;z=Math.sin(th)*r}
    if(shot===3){const xx=(i%17-8)*66,yy=(Math.floor(i/17)%10-4.5)*52,zz=(Math.floor(i/170)-4.5)*66;x=lerp(x,xx,shape);y=lerp(y,yy,shape);z=lerp(z,zz,shape)}
    const p=P(x,y,z),c=palette[i%3];if(p.x<0||p.x>1920||p.y<50||p.y>920)continue;
    if(shot===0&&i%5===0)stroke([p,{x:p.x+(p.x-960)*.04,y:p.y+(p.y-480)*.04}],c,1,.3);
    orb(p,.7+hash(i+90)*1.6,c,.5+hash(i)*.45);
   }
   for(let j=0;j<5;j++){const pts=[];for(let i=0;i<240;i++){const a=i/239*TAU,r=350+j*25;pts.push(P(Math.cos(a+t*.08+j*.1)*r,Math.sin(a*3+t*.4+j)*70,Math.sin(a+t*.08+j*.1)*r))}stroke(pts,palette[j%3],1.2,.16)}
   ctx.globalCompositeOperation='source-over';
  }else if(kind==='sort'){
   const u=t-30,stage=shot===4?smooth(q)*.4:shot===5?.4+smooth(q)*2.6:shot===6?3+smooth(q)*3:6;
   yaw=shot===5?lerp(-.8,-.42,smooth(q)):shot===7?lerp(.52,.1,smooth(q)):-.38+Math.sin(u*.09)*.35;pitch=shot===6?.62:shot===5?.2:.3;dist=shot===5?lerp(1050,870,smooth(q)):shot===7?lerp(1200,940,smooth(q)):1200;centerY=485;
   latticeFloor('#7886ff');const s=Math.floor(stage),f=smooth(fract(stage));const a=A.merge[s],b=A.merge[Math.min(s+1,6)];
   const columns=Array.from({length:64},(_,j)=>{const value=j+1,ia=a.indexOf(value),ib=b.indexOf(value),index=lerp(ia,ib,f);return{value,x:(index-31.5)*19,z:Math.sin(index*.2+u*.2)*12,y:250,h:22+value*6.2,c:colorBlend('#57efff','#fa5ba9',value/64)}}).sort((a,b)=>P(b.x,0,b.z).z-P(a.x,0,a.z).z);
   for(const c of columns){const pts=cube(c.x,c.y,c.z,15,c.h,90,c.c,.92);stroke([pts[4],pts[5]],'#ffffff',1,.5);orb(P(c.x,c.y-c.h-3,c.z),2,c.c,.8);stroke([P(c.x,260,c.z),P(c.x,335+c.h*.3,c.z)],c.c,3,.09)}
   // Parallel merge levels appear as spectral rails, not decorative false data.
   for(let level=0;level<=Math.ceil(stage);level++){const pts=[];for(let i=0;i<64;i++){let val=A.merge[Math.min(level,6)][i];pts.push(P((i-31.5)*19,-210-level*13,-160-level*26+val*.4))}stroke(pts,palette[level%3],1,.24)}
   if(local>3){text(`MERGE RUN SIZE  ${2**Math.ceil(stage)}`,1540,825,22,'#8ddfff','right',false,.8);text('64 ELEMENTS  /  ACTUAL MERGE TRACE',110,825,17,'#9cafc9')}
  }else if(kind==='binary'){
   const u=t-60,step=Math.min(A.binary.length-1,Math.floor(u/3.4)),state=A.binary[step];yaw=-.25+u*.02;pitch=.15;dist=shot===8?1200-150*q:1200;
   for(let i=0;i<128;i++){
    const a=(i/128)*TAU-Math.PI/2,inside=i>=state.lo&&i<=state.hi,active=i===state.mid,c=i===93?'#ffc56b':inside?'#73f8ff':'#48527a';
    const circle=[Math.cos(a)*400,Math.sin(a)*285,Math.sin(a*2)*100],grid=[(i%16-7.5)*65,(Math.floor(i/16)-3.5)*63,0],blend=shot===10?smooth(q):0;
    const x=lerp(circle[0],grid[0],blend),y=lerp(circle[1],grid[1],blend),z=lerp(circle[2],grid[2],blend),p=P(x,y,z);
    orb(p,active?11:inside?4:1.6,c,inside?1:.3);if(active||i===93||i%16===0)text(String(i),p.x,p.y-24,active?28:16,c,'center',active,inside?1:.35);
    if(active){stroke([P(0,0,0),p],c,2,.5);ring(p.x,p.y,27+hit*12,c,1,.7)}
   }
   for(let j=0;j<8;j++){const pts=[];for(let i=0;i<=140;i++){let a=i/140*TAU;pts.push(P(Math.cos(a)*(520+j*80),Math.sin(a)*(390+j*65),j*180))}stroke(pts,j%2?'#946dff':'#67d6ff',1,.12)}
   text(`${state.lo} … ${state.hi}`,960,470,58,'#ffffff','center',true,.85);text(state.found?'FOUND  /  93':'REMAINING CANDIDATES',960,516,17,'#b2bfd9','center');
  }else if(kind==='path'){
   const u=t-82.5;const visitedCount=Math.floor(clamp(u/14)*A.route.order.length),visited=new Set(A.route.order.slice(0,visitedCount));
   yaw=shot===13?lerp(.28,.85,smooth(q)):-.48+u*.027;pitch=shot===11?.9:shot===12?.65:.48;dist=shot===13?lerp(1050,880,smooth(q)):1150;centerY=435;
   const cells=[...A.graph].map((p,i)=>({...p,i})).sort((a,b)=>P((b.x-11)*40,0,(b.y-11)*40).z-P((a.x-11)*40,0,(a.y-11)*40).z);
   for(const c of cells){const x=(c.x-11)*40,z=(c.y-11)*40,seen=visited.has(c.i);if(c.wall){cube(x,95,z,35,80,35,'#544c85',.8);continue}const points=[P(x-18,100,z-18),P(x+18,100,z-18),P(x+18,100,z+18),P(x-18,100,z+18)];poly(points,seen?colorBlend('#132e50','#39cabb',A.route.dist[c.i]/110):'#080f22',.9);stroke([...points,points[0]],seen?'#5eebdc':'#526292',.8,seen?.6:.28);if(seen&&c.i%7===0)orb(P(x,91,z),1.4,'#5cfff0',.7)}
   const trail=A.route.path.map(i=>{const c=A.graph[i];return P((c.x-11)*40,75,(c.y-11)*40)});const len=Math.floor(clamp((u-12)/5)*trail.length);if(len>1){stroke(trail.slice(0,len),'#ffb968',14,.09);stroke(trail.slice(0,len),'#ffba70',3,1);for(let j=0;j<6;j++){const p=trail[Math.floor((fract(t*.3+j/6))*(len-1))];orb(p,5,'#ffd590',1)}}
   for(const [id,c]of[[A.source,'#6effe1'],[A.target,'#ffad8b']]){const a=A.graph[id],p=P((a.x-11)*40,50,(a.y-11)*40);orb(p,10,c);stroke([p,{x:p.x,y:p.y-90}],c,1,.6);text(id===A.source?'START':'DESTINATION',p.x,p.y-108,16,c,'center')}
  }else if(kind==='fractal'){
   const u=t-105;dist=shot===15?lerp(950,630,smooth(q)):shot===16?lerp(650,850,smooth(q)):shot===17?lerp(800,1050,smooth(q)):lerp(1300,1000,smooth(q));yaw=shot===15?lerp(-.2,.6,smooth(q)):-.28+u*.022;pitch=.07;centerY=shot===15||shot===16?620:500;
   const growth=clamp(u/7.1)*10;
   ctx.globalCompositeOperation='lighter';
   for(const b of branches){const f=clamp(growth-b.depth);if(f<=0)continue;const aa=P(...b.a),bb=P(...b.a.map((n,i)=>lerp(n,b.b[i],smooth(f))));const c=colorBlend('#ffc975','#55ffd1',b.depth/9);stroke([aa,bb],c,Math.max(.6,(9-b.depth)*.8),.55);if(b.depth>6)orb(bb,1.4,c,.75);if(shot===17&&Math.floor((30-u)*2)%10===b.depth)stroke([aa,bb],'#ffffff',2,.75)}
   for(let i=0;i<260;i++){const a=i*2.39996+u*.1,r=60+hash(i)*420;orb(P(Math.cos(a)*r,Math.sin(a)*r*.7-50,Math.sin(i*8+u*.04)*200),.8,palette[i%3],.3)}
   ctx.globalCompositeOperation='source-over';
   // Subtle mirrored echo creates depth, leaving the branching trace readable.
   for(let j=0;j<4;j++){const pts=[];for(let i=0;i<=120;i++){let a=i/120*TAU;pts.push(P(Math.cos(a)*(360+j*30),Math.sin(a)*(360+j*30)-50,260+j*70))}stroke(pts,'#7adacb',.8,.09)}
  }else if(kind==='dp'){
   const u=t-135;const diagonal=clamp(u/16)*27;yaw=shot===21?lerp(.4,1.1,smooth(q)):-.6+Math.sin(u*.1)*.36;pitch=shot===19?.4:.63;dist=shot===19?950:1060;centerY=425;
   const cells=[];for(let y=0;y<14;y++)for(let x=0;x<14;x++)cells.push({x,y,z:P((x-6.5)*49,0,(y-6.5)*49).z});cells.sort((a,b)=>b.z-a.z);
   for(const cell of cells){const{x,y}=cell,h=Math.log2(A.dp[y][x]+1)*5+5,filled=x+y<diagonal,px=(x-6.5)*49,pz=(y-6.5)*49,c=colorBlend('#5367ee','#ffd277',(x+y)/26);cube(px,145,pz,39,filled?h:2,39,c,filled?.9:.22);if(filled&&x+y>diagonal-2){orb(P(px,143-h,pz),4,'#ffdc84');if(x>0)stroke([P(px-49,120-h,pz),P(px,143-h,pz)],'#77f3ff',2,.8);if(y>0)stroke([P(px,120-h,pz-49),P(px,143-h,pz)],'#fb93cf',2,.8)}}
   if(local>2.6){text('F(x,y) = F(x−1,y) + F(x,y−1)',960,790,29,'#ffdfa6','center',true);text('GRID PATH COUNTS  /  RIGHT OR DOWN',960,835,17,'#99accb','center')}
   for(let j=0;j<3;j++){const pts=[];for(let i=0;i<160;i++){const v=i/159*TAU;pts.push(P(Math.cos(v)*550,-120+Math.sin(v*3+u*.4+j)*40,Math.sin(v)*500))}stroke(pts,palette[j],1,.22)}
  }else if(kind==='fft'){
   const u=t-165;yaw=.1+Math.sin(u*.08)*.2;pitch=.15;dist=shot===25?lerp(1170,920,smooth(q)):shot===23?1050:1150;
   if(shot===23){
    // Radix-2 butterfly connectivity, six stages over 64 lanes.
    for(let stage=0;stage<6;stage++)for(let n=0;n<64;n++){const other=n^(1<<stage),p=P(-540+stage*180,(n-31.5)*8,Math.sin(n*.1)*40),a=P(-540+(stage+1)*180,(n-31.5)*8,Math.sin(n*.1)*40),b=P(-540+(stage+1)*180,(other-31.5)*8,Math.sin(other*.1)*40);stroke([p,a],palette[stage%3],.9,.32);stroke([p,b],palette[(stage+1)%3],.9,.25);if(n%4===0){const f=fract(t*.8-stage*.14);orb({x:lerp(p.x,b.x,f),y:lerp(p.y,b.y,f),s:1},2.5,palette[stage%3],.8)}}
   }else if(shot===24){
    yaw=-.2;pitch=.27;latticeFloor('#926afa');for(let k=0;k<32;k++){const m=Math.hypot(A.spectrum.re[k],A.spectrum.im[k])/32,h=m*330;cube((k-15.5)*33,190,0,22,Math.max(3,h),70,colorBlend('#59efff','#f05df5',k/32),.95);if(m>.05){orb(P((k-15.5)*33,180-h,0),7,palette[k%3]);const p=P((k-15.5)*33,230,0);text(String(k),p.x,p.y,25,'#ffffff','center',true)}}text('FREQUENCY BIN',960,810,18,'#b2bfd8','center');
   }else{
    ctx.globalCompositeOperation='lighter';for(let layer=0;layer<7;layer++){let pts=[];for(let i=0;i<=420;i++){let x=i/420*1320-660,a=i/420*TAU;let y=0;if(layer<3){const f=[3,7,13][layer];y=Math.sin(a*f-u*1.5)*[120,72,36][layer]}else y=(Math.sin(a*3-u*1.5)+.6*Math.sin(a*7-u*1.5)+.3*Math.sin(a*13-u*1.5))*90;const twist=shot===25?smooth(q)*.6:0;pts.push(P(x,y+(layer-3)*35,Math.sin(a*2+layer*.6)*90+layer*30+Math.cos(a*4+u)*twist*180))}stroke(pts,palette[layer%3],layer<3?2.3:1.2,layer<3?.85:.3);const p=pts[Math.floor(fract(t*.13+layer*.12)*420)];orb(p,6,palette[layer%3],.8)}ctx.globalCompositeOperation='source-over';
   }
  }else if(kind==='terrain'){
   const u=t-195;yaw=shot===28?lerp(.5,1.1,smooth(q)):-.5+u*.035;pitch=shot===27?.47:shot===29?.9:.7;dist=shot===27?1080:shot===28?1150:1260;centerY=445;
   const pieces=[];const N=28;for(let z=0;z<N;z++)for(let x=0;x<N;x++){const xx=x/N*8-4,zz=z/N*8-4,s=8/N;const vertices=[[xx,zz],[xx+s,zz],[xx+s,zz+s],[xx,zz+s]].map(([a,b])=>P(a*110,140-A.potential(a,b)*60,b*110));pieces.push({p:vertices,v:A.potential(xx,zz),depth:vertices.reduce((s,p)=>s+p.z,0)})}pieces.sort((a,b)=>b.depth-a.depth);
   for(const p of pieces){const c=colorBlend('#a04fff','#ffc286',p.v/5);poly(p.p,colorBlend('#070819',c,.3),.9);stroke([...p.p,p.p[0]],c,.9,.45)}
   const fraction=clamp((u-2)/20);for(let j=0;j<A.descents.length;j++){const a=A.descents[j],idx=Math.max(1,Math.floor(fraction*(a.length-1))),pts=a.slice(0,idx+1).map(([x,z])=>P(x*110,132-A.potential(x,z)*60,z*110));stroke(pts,palette[j],6,.15);stroke(pts,palette[j],2.5,.95);orb(pts[pts.length-1],8,palette[j],1);ring(pts[pts.length-1].x,pts[pts.length-1].y,17+hit*8,palette[j],1,.55)}
   if(local>3)text('FOUR INITIALIZATIONS  /  ONE NONCONVEX SURFACE',960,826,18,'#c9b2ea','center');
  }else if(kind==='complexity'){
   yaw=-.32;pitch=.25;dist=1380;latticeFloor();const labels=['O(1)','O(log n)','O(n)','O(n²)'];
   for(let j=0;j<4;j++){const pts=[];for(let i=0;i<=160;i++){const x=i/160,v=j===0?.1:j===1?Math.log2(1+31*x)/10:j===2?x*.78:x*x;pts.push(P(x*1120-560,230-v*440,j*65-100))}stroke(pts,palette[j],10,.09);stroke(pts,palette[j],3,.9);const p=pts[Math.floor(q*160)];orb(p,8,palette[j],1);text(labels[j],pts[160].x+30,pts[160].y,24,palette[j],'left',true)}text('GROWTH / SCHEMATIC',110,830,17,'#a0b3ce');
  }else if(kind==='duality'){
   yaw=local*.08;pitch=.12;dist=1220;
   ctx.globalCompositeOperation='lighter';for(let j=0;j<2;j++){for(let k=0;k<22;k++){const pts=[];for(let i=0;i<=170;i++){let a=i/170*TAU,r=190+k*2,xx=(j?300:-300)+Math.cos(a)*r,yy=Math.sin(a)*r*.85,zz=Math.sin(a*3+t*.5+k*.08)*55;pts.push(P(xx,yy,zz))}stroke(pts,j?'#ffad81':'#65e6ff',1,.17)}for(let i=0;i<120;i++){let a=i/120*TAU+t*.6;orb(P((j?300:-300)+Math.cos(a)*225,Math.sin(a)*190,Math.sin(a*3)*60),1.7,j?'#ffa7c9':'#84ffef',.7)}}ctx.globalCompositeOperation='source-over';text('TIME',655,495,52,'#f5f7ff','center',true);text('SPACE',1265,495,52,'#f5f7ff','center',true);
  }else if(kind==='network'){
   yaw=local*.085;pitch=.15;dist=shot===32?lerp(1250,900,smooth(q)):lerp(930,1170,smooth(q));const pts=[];for(let i=0;i<200;i++){const yy=1-2*(i+.5)/200,r=Math.sqrt(1-yy*yy),a=i*2.39996;pts.push({raw:[Math.cos(a)*r*340,yy*340,Math.sin(a)*r*340],p:null})}for(const p of pts)p.p=P(...p.raw);
   ctx.globalCompositeOperation='lighter';for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){let d=pts[i].raw.reduce((s,v,k)=>s+(v-pts[j].raw[k])**2,0);if(d<135**2){stroke([pts[i].p,pts[j].p],palette[i%3],1,.35);if(i%9===0){let f=fract(t*.5+i*.1);glow(lerp(pts[i].p.x,pts[j].p.x,f),lerp(pts[i].p.y,pts[j].p.y,f),2,'#ffffff',.7)}}}pts.forEach((p,i)=>orb(p.p,i%13===0?4:1.5,palette[i%3],.8));ctx.globalCompositeOperation='source-over';
  }else if(kind==='braid'||kind==='galaxy'||kind==='finale'){
   yaw=t*.045;pitch=kind==='galaxy'?.38+Math.sin(q*Math.PI)*.22:.18+Math.sin(t*.08)*.16;dist=kind==='galaxy'?lerp(1200,980,smooth(q)):kind==='braid'?lerp(1080,850,smooth(q)):1100;
   ctx.globalCompositeOperation='lighter';
   if(kind==='braid'||kind==='finale'){
    for(let j=0;j<9;j++){const pts=[];for(let i=0;i<=500;i++){const a=i/500*TAU,r=270+Math.cos(a*3+t*.18+j*.05)*95;pts.push(P(Math.cos(a*2+t*.08)*r,Math.sin(a*3+t*.18)*165+(j-4)*5,Math.sin(a*2+t*.08)*r))}stroke(pts,palette[j%3],2.1,.55);for(let i=0;i<25;i++){const p=pts[Math.floor(fract(i/25+t*.09+j*.025)*500)];orb(p,2.4,palette[j%3],.85)}}
   }else{
    for(let i=0;i<2400;i++){const r=Math.sqrt(hash(i))*620,arm=i%4,a=arm*TAU/4+r*.013+hash(i+800)*.32+t*.04;const p=P(Math.cos(a)*r,(hash(i+90)-.5)*60+Math.sin(r*.01+t*.1)*25,Math.sin(a)*r);orb(p,.5+hash(i+200)*2,palette[arm%3],.7)}
    orb(P(0,0,0),25,'#fff0ce',.7);
   }
   // Scattered sparks continue through the final titles.
   for(let i=0;i<220;i++){const d=dust[i],p=P(Math.cos(d.a+t*.03)*d.r,Math.sin(d.a*2+t*.12)*260,d.z);orb(p,.8,palette[i%3],.45)}
   ctx.globalCompositeOperation='source-over';
  }
  // Lens streaks, restrained on informational shots, strongest in the opening/finale.
  const cinema=shot<4||shot>33;
  if(cinema){const g=ctx.createLinearGradient(300,0,1620,0);g.addColorStop(0,'#ffffff00');g.addColorStop(.49,rgb(primary,.18));g.addColorStop(.5,'#ffffff88');g.addColorStop(.51,rgb(secondary,.18));g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(300,490+Math.sin(t*.07)*35,1320,1);}
  // Optical vignette keeps the viewer inside the moving form.
  const vig=ctx.createRadialGradient(960,480,380,960,480,1250);vig.addColorStop(0,'#00000000');vig.addColorStop(1,'#010208a0');ctx.fillStyle=vig;ctx.fillRect(0,66,1920,850);
  // Large typography enters with a dolly-like drift, then yields to the scene.
  const hero=kind==='title'||kind==='finale';const ta=hero?smooth(local/.8)*smooth((7.5-local)/.7):smooth(local/.55)*(1-smooth((local-2.7)/1));
  if(ta>.001){
   if(hero){ctx.fillStyle=rgb('#02040c',.32*ta);ctx.fillRect(0,220,1920,400);text(zh,960,480+22*(1-out(local)),shot===38?100:142,'#ffffff','center',true,ta);text(en,960,556+22*(1-out(local)),shot===38?35:34,'#b7deff','center',false,ta);text('A FILM ABOUT THE BEAUTY OF ALGORITHMS',960,614,17,'#a7b8d2','center',false,ta)}
   else{const g=ctx.createLinearGradient(0,0,1300,0);g.addColorStop(0,rgb('#02050d',.86*ta));g.addColorStop(1,rgb('#02050d',0));ctx.fillStyle=g;ctx.fillRect(0,66,1600,450);text(zh,108+25*(1-out(local)),245,shot===8?67:78,'#ffffff','left',true,ta);text(en,112+25*(1-out(local)),300,28,primary,'left',false,ta);ctx.globalAlpha=ta;ctx.fillStyle=primary;ctx.fillRect(112,335,64+q*80,3);ctx.globalAlpha=1}
  }
  // Match cuts use a traveling light veil or a spectral iris; no white flash.
  if(shot>0&&local<.68){const f=local/.68,opacity=(1-f)**2;ctx.globalAlpha=opacity;ctx.fillStyle='#02030a';ctx.fillRect(0,66,1920,850);ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';if(shot%3===0){for(let j=0;j<4;j++)ring(960,485,80+out(f)*1150+j*10,palette[j%3],2,opacity*.4)}else{const x=shot%2?1920*f:1920*(1-f);const g=ctx.createLinearGradient(x-250,0,x+250,0);g.addColorStop(0,rgb(primary,0));g.addColorStop(.5,rgb(primary,.2*opacity));g.addColorStop(1,rgb(secondary,0));ctx.fillStyle=g;ctx.fillRect(x-250,66,500,850)}ctx.globalCompositeOperation='source-over'}
  ctx.restore();
  // Minimal film identity. No permanent chapter slide or diagram panel.
  text('A /',70,42,19,'#f2f7ff','left',true,.9);text('THE INVISIBLE CHOREOGRAPHY',116,40,12,'#8193b0');
  text(`${String(shot+1).padStart(2,'0')}  /  40`,1850,41,13,'#8092b0','right');
  ctx.fillStyle='#020309';ctx.fillRect(0,916,1920,164);const ca=smooth(local/.4)*smooth((7.5-local)/.45);
  text(cn,960,975,32,'#f5f6ff','center',true,ca);text(eng,960,1021,23,'#b0bfd8','center',false,ca);
  ctx.fillStyle='#141c2c';ctx.fillRect(70,1056,1780,1);ctx.fillStyle=primary;ctx.fillRect(70,1056,1780*t/300,1);
  const fade=Math.min(smooth(t/1.6),smooth((300-t)/3));if(fade<1){ctx.globalAlpha=1-fade;ctx.fillStyle='#02030a';ctx.fillRect(0,0,1920,1080);ctx.globalAlpha=1}
  ctx.restore();
 }
 return {draw};
}
module.exports={makeFilm};
