import { createPlayer } from './character-renderer.js';
export function mount(root,signal){
  const q=s=>root.querySelector(s),canvas=q('[data-model-canvas]'),viewport=q('[data-viewport]'),overlay=q('[data-overlay]'),message=q('[data-load-message]'),retry=q('[data-retry]'),controls=q('[data-controls]'),status=q('[data-character-status]'),play=q('[data-play]'),spin=q('[data-spin]'),visibleButton=q('[data-visible]');
  const lite=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>1&&matchMedia('(max-width: 1024px)').matches||/iPhone|iPad|iPod/.test(navigator.userAgent);
  q('[data-quality]').textContent=lite?'移动轻量 · 30 FPS':'高清 · 4K';
  let player,request,frame=0,last=0,dirty=true,playing=false,spinning=false,visible=true,selected=0,time=0,speed=1,yaw=0,pitch=.05,distance=1.75,onScreen=true,loading=false,poseDirty=false;
  const opts={signal},pointers=new Map();const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function setStatus(text){status.textContent=text;}
  function ui(){play.textContent=playing?'暂停动画':'播放动画';play.setAttribute('aria-pressed',String(playing));spin.textContent=`自动旋转：${spinning?'开':'关'}`;spin.setAttribute('aria-pressed',String(spinning));visibleButton.textContent=`显示：${visible?'开':'关'}`;visibleButton.setAttribute('aria-pressed',String(visible));for(const b of root.querySelectorAll('[data-motion]'))b.setAttribute('aria-pressed',String(Number(b.dataset.motion)===selected));}
  function resize(){const dpr=Math.min(devicePixelRatio||1,lite?1.25:2),w=Math.max(1,Math.round(viewport.clientWidth*dpr)),h=Math.max(1,Math.round(viewport.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}dirty=true;wake();}
  function wake(){if(!frame&&player&&!signal.aborted&&!document.hidden&&onScreen&&(dirty||visible&&(playing||spinning)))frame=requestAnimationFrame(tick);}
  function tick(now){frame=0;if(!player||signal.aborted||document.hidden||!onScreen){last=0;return;}const elapsed=last?now-last:0;if(lite&&last&&elapsed<31&&!dirty){wake();return;}last=now;const dt=Math.min(elapsed/1000,.12);if(visible&&playing){time=(time+dt*speed)%player.clips[selected].duration;poseDirty=true;dirty=true;}if(visible&&spinning){yaw+=dt*.65;dirty=true;}if(poseDirty){player.pose(selected,time);poseDirty=false;}if(dirty){player.draw({yaw,pitch,distance,visible});dirty=false;}if(visible&&(playing||spinning))wake();else last=0;}
  function update(){dirty=true;ui();wake();}
  function zoom(factor){distance=clamp(distance*factor,.58,4);update();}
  function resetView(){yaw=0;pitch=.05;distance=1.75;update();}
  function stop(){playing=false;time=0;poseDirty=false;player?.pose(null,0);update();setStatus('动画已停止，恢复初始姿势。');}
  function select(i){if(!player)return;selected=i;time=0;poseDirty=true;update();setStatus(`已选择：${['拳击','前踢','跑步'][i]}。${playing?'正在播放。':'点击播放开始。'}`);}
  async function load(){if(loading||signal.aborted)return;loading=true;request?.abort();request=new AbortController();overlay.hidden=false;retry.hidden=true;overlay.querySelector('.character-loader').hidden=false;message.textContent='正在载入炎帝模型……';controls.disabled=true;try{const url=new URL(lite?'../models/xiao-yan-mobile.glb':'../models/xiao-yan.glb',import.meta.url);const result=await createPlayer(canvas,url,{lite,signal:request.signal,onProgress:text=>message.textContent=text});if(signal.aborted||request.signal.aborted){result.dispose();return;}player=result;overlay.hidden=true;controls.disabled=false;setStatus('模型已就绪。请选择动作并播放。');resize();update();}catch(e){if(signal.aborted||request.signal.aborted)return;console.error(e);message.textContent='暂时无法载入 3D 模型，请重试或使用支持 WebGL 2 的浏览器。';overlay.querySelector('.character-loader').hidden=true;retry.hidden=false;setStatus('模型未能载入。');}finally{loading=false;}}
  retry.addEventListener('click',load,opts);
  for(const b of root.querySelectorAll('[data-motion]'))b.addEventListener('click',()=>select(Number(b.dataset.motion)),opts);
  play.addEventListener('click',()=>{if(!player)return;playing=!playing;last=0;if(playing)poseDirty=true;update();setStatus(playing?'动画播放中。':'动画已暂停。');},opts);
  q('[data-stop]').addEventListener('click',stop,opts);
  q('[data-speed]').addEventListener('input',e=>{speed=Number(e.target.value);q('[data-speed-output]').textContent=`${speed.toFixed(1)}×`;},opts);
  spin.addEventListener('click',()=>{spinning=!spinning;last=0;update();},opts);
  visibleButton.addEventListener('click',()=>{visible=!visible;last=0;update();setStatus(visible?'模型已显示。':'模型已隐藏，暂停渲染。');},opts);
  q('[data-reset-view]').addEventListener('click',resetView,opts);
  for(const b of root.querySelectorAll('[data-turn]'))b.addEventListener('click',()=>{yaw+=Number(b.dataset.turn)*Math.PI/6;update();},opts);
  for(const b of root.querySelectorAll('[data-zoom]'))b.addEventListener('click',()=>zoom(Number(b.dataset.zoom)>0?.83:1.2),opts);
  canvas.addEventListener('pointerdown',e=>{if(!player||!visible)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);},opts);
  canvas.addEventListener('pointermove',e=>{const prev=pointers.get(e.pointerId);if(!prev)return;const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];if(other){const a=Math.hypot(prev[0]-other[0],prev[1]-other[1]),b=Math.hypot(e.clientX-other[0],e.clientY-other[1]);if(a>4&&b>4)distance=clamp(distance*a/b,.58,4);}else{yaw-=(e.clientX-prev[0])*.012;pitch=clamp(pitch+(e.clientY-prev[1])*.01,-1.2,1.2);}pointers.set(e.pointerId,[e.clientX,e.clientY]);dirty=true;wake();},opts);
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>pointers.delete(e.pointerId),opts);
  canvas.addEventListener('wheel',e=>{if(!player||!visible)return;e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-150,150)*.0025));},{signal,passive:false});
  canvas.addEventListener('keydown',e=>{if(!player)return;if(e.key==='ArrowLeft')yaw-=.2;else if(e.key==='ArrowRight')yaw+=.2;else if(e.key==='ArrowUp')pitch=clamp(pitch+.12,-1.2,1.2);else if(e.key==='ArrowDown')pitch=clamp(pitch-.12,-1.2,1.2);else if(e.key==='+'||e.key==='=')zoom(.85);else if(e.key==='-')zoom(1.2);else return;e.preventDefault();update();},opts);
  function suspend(){cancelAnimationFrame(frame);frame=0;last=0;}function resume(){dirty=true;last=0;wake();}
  const ro=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;ro?.observe(viewport);window.addEventListener('resize',resize,{signal,passive:true});
  const io=typeof IntersectionObserver==='function'?new IntersectionObserver(([entry])=>{onScreen=entry.isIntersecting;if(onScreen)resume();else suspend();},{threshold:0}):null;io?.observe(viewport);
  document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume(),opts);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();suspend();player?.dispose();player=null;playing=false;spinning=false;controls.disabled=true;overlay.hidden=false;overlay.querySelector('.character-loader').hidden=true;message.textContent='图形资源暂时中断，正在等待恢复……';retry.hidden=true;ui();},opts);
  canvas.addEventListener('webglcontextrestored',()=>{void load();},opts);
  signal.addEventListener('abort',()=>{suspend();request?.abort();ro?.disconnect();io?.disconnect();pointers.clear();player?.dispose();player=null;},{once:true});
  resize();void load();
}
