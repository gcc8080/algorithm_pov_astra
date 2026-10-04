const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..');process.chdir(root);
GlobalFonts.registerFromPath('assets/NotoSansSC-Regular.ttf','Film Regular');GlobalFonts.registerFromPath('assets/NotoSansSC-Bold.ttf','Film Bold');
const {makeFilm}=require('../src/film.cjs'),story=require('../src/story.cjs');
const width=Number(process.env.WIDTH||1920),height=width*9/16,fps=Number(process.env.FPS||30);
if(!Number.isInteger(height)||width%2||height%2||fps<=0)throw Error('WIDTH must produce even 16:9 dimensions; FPS must be positive');
fs.mkdirSync('output',{recursive:true});
function stamp(s){const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`}
if(!process.argv.includes('--chunk')){
 fs.writeFileSync('output/subtitles.srt',story.map((s,i)=>`${i+1}\n${stamp(i*7.5)} --> ${stamp((i+1)*7.5)}\n${s[3]}\n${s[4]}\n`).join('\n'));
 fs.writeFileSync('output/chapters.ffmeta',';FFMETADATA1\ntitle=The Invisible Choreography\nartist=Algorithm POV Astra\n'+[[0,30,'Genesis'],[30,60,'Merge sort'],[60,82.5,'Binary search'],[82.5,105,'Shortest paths'],[105,135,'Recursion'],[135,165,'Dynamic programming'],[165,195,'Fourier transform'],[195,225,'Optimization'],[225,255,'Choices'],[255,300,'Finale']].map(([a,b,title])=>`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${a*1000}\nEND=${b*1000}\ntitle=${title}\n`).join(''));
}
async function renderFrames(start,duration,dest){
 const canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),film=makeFilm(createCanvas);
 const args=['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${width}x${height}`,'-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','20','-pix_fmt','yuv420p','-frames:v',String(Math.round(duration*fps)),dest];
 const ff=spawn('ffmpeg',args,{stdio:['pipe','ignore','inherit']});const done=once(ff,'close');let failed;
 ff.on('error',e=>failed=e);ff.stdin.on('error',e=>failed=e);
 for(let frame=0;frame<Math.round(duration*fps);frame++){
  if(failed)throw failed;film.draw(ctx,start+frame/fps,width,height);
  let bytes=canvas.data();
  if(!ff.stdin.write(bytes))await once(ff.stdin,'drain');
  bytes=null;
  // Avoid retaining an ImageData allocation per frame; data() is the native RGBA path.
  if(frame%12===0&&global.gc){global.gc();await new Promise(setImmediate)}
  if(frame%(fps*15)===0)console.log(`segment ${start}s: ${frame/fps}s / ${duration}s`);
 }
 ff.stdin.end();const [code]=await done;if(code!==0)throw Error(`ffmpeg ${code}`);
}
(async()=>{
 if(process.argv.includes('--stills')){const c=createCanvas(width,height),ctx=c.getContext('2d'),film=makeFilm(createCanvas);const arg=process.argv.indexOf('--shots'),shots=arg>=0?process.argv[arg+1].split(',').map(Number):Array.from({length:40},(_,i)=>i);for(const i of shots){film.draw(ctx,i*7.5+4.5,width,height);fs.writeFileSync(`output/shot-${String(i).padStart(2,'0')}.jpg`,c.toBuffer('image/jpeg',90))}return}
 if(process.argv.includes('--chunk')){const i=Number(process.argv[process.argv.indexOf('--chunk')+1]);await renderFrames(i*75,75,`output/chunk-${i}.mp4`);return}
 const jobs=Math.max(1,Math.min(4,Number(process.env.JOBS||2))),queue=[0,1,2,3];
 async function worker(){while(queue.length){const i=queue.shift();const child=spawn(process.execPath,['--expose-gc',__filename,'--chunk',String(i)],{stdio:'inherit',env:process.env});const [code,signal]=await once(child,'close');if(code!==0)throw Error(`chunk ${i} failed: code=${code}, signal=${signal}`);}}
 if(!process.argv.includes('--mux'))await Promise.all(Array.from({length:jobs},worker));
 fs.writeFileSync('output/chunks.txt',[0,1,2,3].map(i=>`file 'chunk-${i}.mp4'`).join('\n'));
 const ff=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i','output/chunks.txt','-i','output/score.wav','-i','output/chapters.ffmeta','-map','0:v','-map','1:a','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','320k','-t','300','-movflags','+faststart','output/the-invisible-choreography.mp4'],{stdio:'inherit'});
 const [code]=await once(ff,'close');if(code!==0)throw Error(`mux failed: ${code}`);
 console.log('Completed 300-second 1080p film.');
})().catch(e=>{console.error(e);process.exitCode=1});
