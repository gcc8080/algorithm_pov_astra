const assert=require('node:assert/strict'),A=require('../src/algorithms.cjs'),story=require('../src/story.cjs');
assert.equal(story.length,40);assert.equal(story.length*7.5,300);assert.equal(300*128/60,640);
assert.deepEqual(A.merge.at(-1),Array.from({length:64},(_,i)=>i+1));
for(let k=0;k<A.merge.length;k++){const width=2**k,a=A.merge[k];assert.deepEqual([...a].sort((a,b)=>a-b),A.merge.at(-1));for(let start=0;start<a.length;start+=width)for(let i=start+1;i<Math.min(a.length,start+width);i++)assert.ok(a[i]>=a[i-1])}
assert.equal(A.binary.at(-1).mid,93);assert.ok(A.binary.at(-1).found);for(let i=1;i<A.binary.length;i++)assert.ok(A.binary[i].hi-A.binary[i].lo<A.binary[i-1].hi-A.binary[i-1].lo);
assert.equal(A.route.path[0],A.source);assert.equal(A.route.path.at(-1),A.target);let cost=0;
for(let i=1;i<A.route.path.length;i++){const a=A.graph[A.route.path[i-1]],b=A.graph[A.route.path[i]];assert.equal(Math.abs(a.x-b.x)+Math.abs(a.y-b.y),1);assert.ok(!b.wall);cost+=1+(b.x*7+b.y*3)%4}assert.equal(cost,A.route.dist[A.target]);
for(const a of A.graph){if(a.wall)continue;const u=a.x+a.y*A.side;for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=a.x+dx,y=a.y+dy;if(x<0||y<0||x>=A.side||y>=A.side||A.graph[x+y*A.side].wall)continue;assert.ok(A.route.dist[x+y*A.side]<=A.route.dist[u]+1+(x*7+y*3)%4)}}
assert.equal(A.dp[13][13],10400600);
for(const [k,amplitude]of[[3,1],[7,.6],[13,.3]])assert.ok(Math.abs(Math.hypot(A.spectrum.re[k],A.spectrum.im[k])/32-amplitude)<1e-9);
for(const path of A.descents)for(let i=1;i<path.length;i++)assert.ok(A.potential(...path[i])<=A.potential(...path[i-1])+1e-9);
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');GlobalFonts.registerFromPath('assets/NotoSansSC-Regular.ttf','Film Regular');GlobalFonts.registerFromPath('assets/NotoSansSC-Bold.ttf','Film Bold');
const c=createCanvas(960,540),ctx=c.getContext('2d'),film=require('../src/film.cjs').makeFilm(createCanvas);
for(let i=0;i<40;i++){assert.equal(story[i].length,5);ctx.font='32px "Film Bold"';assert.ok(ctx.measureText(story[i][3]).width<1760,story[i][3]);ctx.font='23px "Film Regular"';assert.ok(ctx.measureText(story[i][4]).width<1760,story[i][4]);film.draw(ctx,i*7.5+.01,960,540);film.draw(ctx,i*7.5+4.5,960,540)}
console.log('PASS: merge, binary search, shortest-path certificate, DP, FFT, descent, 40 shots, subtitle widths, 300s / 640-beat timeline');
