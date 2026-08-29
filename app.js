const songs=[{title:'Prototype in G',artist:'PlayMaster development track',key:'G major · 1♯',tempo:100,section:'Verse',chords:['G','D','Em','C','G','D','C','C','G','D','Em','C','Am','D','G','G']},{title:'Practice Progression in D',artist:'PlayMaster development track',key:'D major · 2♯',tempo:96,section:'Verse',chords:['D','A','Bm','G','D','A','G','G','Em','G','D','A','Bm','G','D','D']}];
let model=songs[0],follow=true;const $=id=>document.getElementById(id),audio=$('audio'),seek=$('seek');
function draw(){ $('title').textContent=model.title;$('artist').textContent=model.artist;$('key').textContent=model.key;$('tempo').textContent=model.tempo+' BPM';$('sectionName').textContent=model.section;$('bars').innerHTML=model.chords.map((c,i)=>`<div class="bar" data-i="${i}"><span class="n">BAR ${i+1}</span><div class="chord">${c}</div></div>`).join(''); update(); }
function fmt(s){if(!isFinite(s))return'0:00';return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')}
function index(){let d=audio.duration||((60/model.tempo)*4*model.chords.length);return Math.min(model.chords.length-1,Math.floor((audio.currentTime/d)*model.chords.length)||0)}
function update(){let i=index();document.querySelectorAll('.bar').forEach((b,n)=>b.classList.toggle('active',n===i));$('current').textContent=model.chords[i];$('next').textContent='Next: '+model.chords[Math.min(i+1,model.chords.length-1)];$('elapsed').textContent=fmt(audio.currentTime);$('duration').textContent=fmt(audio.duration);if(audio.duration)seek.value=audio.currentTime/audio.duration*1000;if(follow&&document.querySelector('.bar.active'))document.querySelector('.bar.active').scrollIntoView({block:'nearest',behavior:'smooth'});}
$('file').onchange=e=>{let f=e.target.files[0];if(f){audio.src=URL.createObjectURL(f);audio.load();}};$('play').onclick=()=>{if(!audio.src)return alert('Choose an audio file first.');if(audio.paused){audio.play();$('play').textContent='❚❚ Pause'}else{audio.pause();$('play').textContent='▶ Play'}};$('back').onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-5);$('forward').onclick=()=>audio.currentTime=Math.min(audio.duration||0,audio.currentTime+5);seek.oninput=()=>{if(audio.duration)audio.currentTime=seek.value/1000*audio.duration};audio.ontimeupdate=update;audio.onloadedmetadata=update;audio.onended=()=>$('play').textContent='▶ Play';$('song').onchange=e=>{model=songs[e.target.selectedIndex];audio.currentTime=0;draw()};$('follow').onclick=()=>{follow=!follow;$('follow').textContent='Auto-follow '+(follow?'✓':'Off')};draw();

// --- v0.1 real tonal-analysis pipeline (Essentia.js / WASM) ---
let essentia=null, selectedFile=null, analysisObjectURL=null;
async function initAnalysis(){
  try{
    if(typeof EssentiaWASM==='undefined'||typeof Essentia==='undefined') throw new Error('analysis library unavailable');
    const wasm=await EssentiaWASM(); essentia=new Essentia(wasm); $('engine').textContent='Essentia '+essentia.version; $('analysisStatus').textContent='Analysis engine ready. Choose an audio file.';
  }catch(err){$('engine').textContent='Unavailable';$('analysisStatus').textContent='Could not load the analysis engine. Internet access is needed the first time.';console.error(err)}
}
const oldFileHandler=$('file').onchange;
$('file').onchange=e=>{ selectedFile=e.target.files[0]||null; oldFileHandler(e); if(selectedFile){$('analysisStatus').textContent='Audio loaded: '+selectedFile.name+'. Press Analyse audio.';$('analyse').disabled=false;} };
function monoFromBuffer(buffer){
  const n=buffer.length, ch=buffer.numberOfChannels, out=new Float32Array(n);
  for(let c=0;c<ch;c++){const d=buffer.getChannelData(c);for(let i=0;i<n;i++)out[i]+=d[i]/ch;} return out;
}
function compressChordFrames(chords,strengths,duration){
  if(!chords||!chords.length)return [];
  const frameDur=duration/chords.length, runs=[]; let start=0, cur=chords[0], vals=[strengths?.[0]??0];
  for(let i=1;i<=chords.length;i++){
    if(i===chords.length||chords[i]!==cur){runs.push({chord:cur,start:start*frameDur,end:i*frameDur,confidence:vals.reduce((a,b)=>a+b,0)/vals.length});start=i;cur=chords[i];vals=[];} if(i<chords.length)vals.push(strengths?.[i]??0);
  } return runs.filter(r=>r.end-r.start>=0.35);
}
function renderDetected(runs,key,scale,bpm){
  if(!runs.length)return;
  model={title:selectedFile?.name?.replace(/\.[^.]+$/,'')||'Analysed recording',artist:'Local audio · machine analysed',key:`${key} ${scale}`,tempo:bpm||model.tempo,section:'Detected harmony',chords:runs.map(r=>r.chord),timeline:runs};
  $('song').value=''; draw(); $('bars').innerHTML=runs.map((r,i)=>`<div class="bar detected" data-i="${i}"><span class="n">${fmt(r.start)}–${fmt(r.end)}</span><div class="chord">${r.chord}</div><div class="confidence">${Math.round((r.confidence||0)*100)}% strength</div></div>`).join('');
}
const baseIndex=index;
index=function(){if(model.timeline&&model.timeline.length){const t=audio.currentTime;let i=model.timeline.findIndex(r=>t>=r.start&&t<r.end);return i<0?Math.max(0,model.timeline.length-1):i;}return baseIndex();};
$('analyse').onclick=async()=>{
  if(!selectedFile)return alert('Choose an audio file first.'); if(!essentia){await initAnalysis();if(!essentia)return;}
  $('analyse').disabled=true;$('analysisStatus').textContent='Decoding audio…';
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)(); const ab=await selectedFile.arrayBuffer(); const buffer=await ctx.decodeAudioData(ab.slice(0));
    $('analysisStatus').textContent='Analysing key and chord progression…'; await new Promise(r=>setTimeout(r,30));
    const mono=monoFromBuffer(buffer); const vec=essentia.arrayToVector(mono);
    const keyOut=essentia.KeyExtractor(vec,true,4096,4096,12,3500,60,25,0.2,'bgate',buffer.sampleRate);
    const tonal=essentia.TonalExtractor(vec,4096,2048,440);
    const chords=Array.from(tonal.chords_progression||[]), strengths=Array.from(tonal.chords_strength||[]); const runs=compressChordFrames(chords,strengths,buffer.duration);
    $('detectedKey').textContent=`${keyOut.key} ${keyOut.scale}`;$('keyConfidence').textContent=Math.round((keyOut.strength||0)*100)+'%';$('chordCount').textContent=String(runs.length);
    renderDetected(runs,keyOut.key,keyOut.scale,null); $('analysisStatus').textContent=`Analysis complete — ${runs.length} harmonic regions detected. These are machine estimates, not hand-entered chords.`;
    try{vec.delete?.()}catch{} await ctx.close();
  }catch(err){console.error(err);$('analysisStatus').textContent='Analysis failed on this file: '+err.message;}
  finally{$('analyse').disabled=false;}
};
initAnalysis();
