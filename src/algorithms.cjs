// Actual deterministic algorithm traces drive the illustrations.
const random=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296};
const rng=random(8080),initial=Array.from({length:64},(_,i)=>i+1);
for(let i=63;i>0;i--){const j=Math.floor(rng()*(i+1));[initial[i],initial[j]]=[initial[j],initial[i]]}
function mergeTrace(a){const stages=[a.slice()];for(let w=1;w<a.length;w*=2){let b=a.slice();for(let l=0;l<a.length;l+=w*2){let i=l,j=l+w,k=l,r=Math.min(l+w*2,a.length),m=Math.min(l+w,a.length);while(i<m||j<r)b[k++]=j>=r||(i<m&&a[i]<=a[j])?a[i++]:a[j++]}a=b;stages.push(a.slice())}return stages}
const merge=mergeTrace(initial.slice());
function binaryTrace(n,target){let lo=0,hi=n-1,steps=[];while(lo<=hi){let mid=(lo+hi)>>1;steps.push({lo,hi,mid,found:mid===target});if(mid===target)break;if(mid<target)lo=mid+1;else hi=mid-1}return steps}
const binary=binaryTrace(128,93);
const side=23,graph=Array.from({length:side*side},(_,i)=>{const x=i%side,y=Math.floor(i/side);return{x,y,wall:(x===8&&y>2&&y<19&&y!==13)||(y===9&&x>10&&x<21&&x!==17)}});
const source=2+side*3,target=20+side*18;
function dijkstra(){const d=Array(graph.length).fill(Infinity),prev=Array(graph.length).fill(-1),visited=new Set(),order=[];d[source]=0;while(visited.size<graph.length){let u=-1;for(let i=0;i<graph.length;i++)if(!visited.has(i)&&!graph[i].wall&&(u<0||d[i]<d[u]))u=i;if(u<0||!Number.isFinite(d[u]))break;visited.add(u);order.push(u);const p=graph[u];for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x>=side||y>=side)continue;const v=x+y*side;if(graph[v].wall)continue;const weight=1+(x*7+y*3)%4;const nd=d[u]+weight;if(nd<d[v]){d[v]=nd;prev[v]=u}}}let path=[],v=target;while(v!==-1){path.push(v);v=prev[v]}return{dist:d,order,path:path.reverse(),prev}}
const route=dijkstra();
const dp=Array.from({length:14},()=>Array(14).fill(0));for(let y=0;y<14;y++)for(let x=0;x<14;x++)dp[y][x]=(x===0||y===0)?1:dp[y-1][x]+dp[y][x-1];
function potential(x,z){return .18*(x*x+z*z)+.58*Math.sin(x*1.7)*Math.cos(z*1.5)}
function grad(x,z){return[.36*x+.986*Math.cos(x*1.7)*Math.cos(z*1.5),.36*z-.87*Math.sin(x*1.7)*Math.sin(z*1.5)]}
const descents=[[-3.6,3.2],[3.3,2.8],[2,-3.3],[-2,-2.8]].map(start=>{const a=[start];let[x,z]=start;for(let i=0;i<160;i++){const[gx,gz]=grad(x,z);x-=.09*gx;z-=.09*gz;a.push([x,z])}return a});
// Radix-2 Cooley–Tukey FFT, n=64; components at bins 3, 7 and 13.
function fft(re,im=Array(re.length).fill(0)){const n=re.length;if(n===1)return{re,im};const e=fft(re.filter((_,i)=>!(i%2)),im.filter((_,i)=>!(i%2))),o=fft(re.filter((_,i)=>i%2),im.filter((_,i)=>i%2)),r=[],q=[];for(let k=0;k<n/2;k++){let a=-2*Math.PI*k/n,c=Math.cos(a),s=Math.sin(a),tr=c*o.re[k]-s*o.im[k],ti=s*o.re[k]+c*o.im[k];r[k]=e.re[k]+tr;q[k]=e.im[k]+ti;r[k+n/2]=e.re[k]-tr;q[k+n/2]=e.im[k]-ti}return{re:r,im:q}}
const signal=Array.from({length:64},(_,i)=>Math.sin(2*Math.PI*3*i/64)+.6*Math.sin(2*Math.PI*7*i/64)+.3*Math.sin(2*Math.PI*13*i/64));const spectrum=fft(signal);
module.exports={random,initial,merge,binary,graph,side,source,target,route,dp,potential,grad,descents,signal,spectrum,fft};
