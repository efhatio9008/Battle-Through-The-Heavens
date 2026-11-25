// A small, self-contained WebGL 2 player for the supplied uncompressed, skinned GLB.
// No CDN, external libraries, or runtime conversion services are required.
const I = () => new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(out,a,b) {
  for(let c=0;c<4;c++){const x=b[c*4],y=b[c*4+1],z=b[c*4+2],w=b[c*4+3];for(let r=0;r<4;r++)out[c*4+r]=a[r]*x+a[4+r]*y+a[8+r]*z+a[12+r]*w;}return out;
}
function trs(out,t,q,s){
  const [x,y,z,w]=q, x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  out.set([(1-yy-zz)*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,(xy-wz)*s[1],(1-xx-zz)*s[1],(yz+wx)*s[1],0,(xz+wy)*s[2],(yz-wx)*s[2],(1-xx-yy)*s[2],0,t[0],t[1],t[2],1]);return out;
}
function normalize(a){const n=Math.hypot(...a)||1;return a.map(x=>x/n)}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function look(eye,target){const z=normalize(eye.map((v,i)=>v-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function perspective(aspect){const f=1/Math.tan(Math.PI/9),near=.02,far=30;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
function parseGLB(buffer){const d=new DataView(buffer);if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2)throw Error('Invalid GLB');const n=d.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,n))),offset=28+n;return {j,buffer,offset};}
const VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;
layout(location=3) in vec4 joints;
layout(location=4) in vec4 weights;
uniform highp sampler2D boneTex; uniform mat4 vp;
out vec2 vUv; out vec3 vNormal; out vec3 vPos;
mat4 bone(int i){return mat4(texelFetch(boneTex,ivec2(0,i),0),texelFetch(boneTex,ivec2(1,i),0),texelFetch(boneTex,ivec2(2,i),0),texelFetch(boneTex,ivec2(3,i),0));}
void main(){mat4 skin=bone(int(joints.x))*weights.x+bone(int(joints.y))*weights.y+bone(int(joints.z))*weights.z+bone(int(joints.w))*weights.w;vec4 p=skin*vec4(position,1.0);vPos=p.xyz;vNormal=normalize(mat3(skin)*normal);vUv=uv;gl_Position=vp*p;}`;
const FS=`#version 300 es
precision highp float;
in vec2 vUv;in vec3 vNormal;in vec3 vPos;
uniform sampler2D baseTex,normalTex,mrTex;uniform vec3 eye;uniform bool lite;
out vec4 color;
void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
if(!lite){vec3 dp1=dFdx(vPos),dp2=dFdy(vPos);vec2 du1=dFdx(vUv),du2=dFdy(vUv);vec3 t=cross(dp2,n)*du1.x+cross(n,dp1)*du2.x;vec3 b=cross(dp2,n)*du1.y+cross(n,dp1)*du2.y;float m=max(dot(t,t),dot(b,b));if(m>0.00000001){vec3 map=texture(normalTex,vUv).xyz*2.0-1.0;n=normalize(mat3(t*inversesqrt(m),b*inversesqrt(m),n)*map);}}
vec3 albedo=pow(texture(baseTex,vUv).rgb,vec3(2.2));vec3 mr=texture(mrTex,vUv).rgb;float rough=clamp(mr.g,.18,1.0),metal=mr.b;vec3 v=normalize(eye-vPos),l=normalize(vec3(.4,.85,1.0)),f=normalize(vec3(-.8,.35,.65)),rim=normalize(vec3(.1,.6,-1.0));float nd=max(dot(n,l),0.0),nf=max(dot(n,f),0.0),nr=max(dot(n,rim),0.0);float spec=pow(max(dot(n,normalize(v+l)),0.0),mix(90.0,8.0,rough));vec3 c=albedo*(.53+nd*.83+nf*.26+nr*.23)+mix(vec3(.035),albedo,metal)*spec*(.5+(1.0-rough)*.5);color=vec4(pow(clamp(c,0.0,1.0),vec3(1.0/2.2)),1.0);}`;
function program(gl){const p=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,FS]]){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(sh);gl.deleteShader(sh);gl.deleteProgram(p);throw Error(error);}gl.attachShader(p,sh);gl.deleteShader(sh);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error(error);}return p;}
function imageFromBlob(blob){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(blob);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Texture decode failed'))};img.src=url;});}
function interpolate(track,t,out){const {times,values,size,step,rotation}=track;let a=0,b=times.length-1;if(t<=times[0])b=0;else if(t>=times[b])a=b;else{while(b-a>1){const m=(a+b)>>1;if(times[m]<=t)a=m;else b=m;}}let f=a===b||step?0:(t-times[a])/(times[b]-times[a]);let sign=1;if(rotation){let d=0;for(let i=0;i<4;i++)d+=values[a*4+i]*values[b*4+i];if(d<0){d=-d;sign=-1;}if(d<.9995&&f>0){const th=Math.acos(Math.min(1,d)),sin=Math.sin(th),wa=Math.sin((1-f)*th)/sin,wb=Math.sin(f*th)/sin*sign;for(let i=0;i<4;i++)out[i]=values[a*4+i]*wa+values[b*4+i]*wb;return;}}for(let i=0;i<size;i++)out[i]=values[a*size+i]*(1-f)+values[b*size+i]*f*sign;if(rotation){const n=Math.hypot(...out)||1;for(let i=0;i<4;i++)out[i]/=n;}}
export async function createPlayer(canvas,url,{lite,signal,onProgress=()=>{}}){
  const res=await fetch(url,{signal});if(!res.ok)throw Error('Model unavailable: '+res.status);const parsed=parseGLB(await res.arrayBuffer());const {j,buffer,offset}=parsed;signal.throwIfAborted();
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:!lite,depth:true,premultipliedAlpha:false,powerPreference:lite?'low-power':'default'});if(!gl)throw Error('WebGL 2 unavailable');
  const resources=[];let disposed=false;const keep=(obj,del)=>{resources.push(()=>gl[del](obj));return obj};
  function dispose(){if(disposed)return;disposed=true;for(const fn of resources.reverse())fn();}
  signal.addEventListener('abort',dispose,{once:true});
  try{
    const p=keep(program(gl),'deleteProgram');gl.useProgram(p);const loc=Object.fromEntries(['vp','boneTex','baseTex','normalTex','mrTex','eye','lite'].map(n=>[n,gl.getUniformLocation(p,n)]));
    const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},types={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
    function access(id){const a=j.accessors[id],v=j.bufferViews[a.bufferView];if(v.byteStride&&v.byteStride!==types[a.componentType].BYTES_PER_ELEMENT*sizes[a.type])throw Error('Unsupported interleaved accessor');return new types[a.componentType](buffer,offset+(v.byteOffset||0)+(a.byteOffset||0),a.count*sizes[a.type]);}
    const meshNode=j.nodes.find(n=>n.mesh!==undefined&&n.skin!==undefined),prim=j.meshes[meshNode.mesh].primitives[0],skin=j.skins[meshNode.skin],inv=access(skin.inverseBindMatrices),vao=keep(gl.createVertexArray(),'deleteVertexArray');gl.bindVertexArray(vao);
    for(const [index,name] of ['POSITION','NORMAL','TEXCOORD_0','JOINTS_0','WEIGHTS_0'].entries()){const id=prim.attributes[name],a=j.accessors[id],data=access(id),buf=keep(gl.createBuffer(),'deleteBuffer');gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,sizes[a.type],a.componentType,!!a.normalized,0,0);}
    const indices=access(prim.indices),ib=keep(gl.createBuffer(),'deleteBuffer');gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    const bones=keep(gl.createTexture(),'deleteTexture');gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,bones);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA32F,4,skin.joints.length);gl.uniform1i(loc.boneTex,0);
    onProgress('正在载入人物贴图……');
    const material=j.materials[prim.material],textureIds=[material.pbrMetallicRoughness.baseColorTexture.index,material.normalTexture.index,material.pbrMetallicRoughness.metallicRoughnessTexture.index];
    for(const [i,id] of textureIds.entries()){signal.throwIfAborted();const image=j.images[j.textures[id].source],v=j.bufferViews[image.bufferView],blob=new Blob([new Uint8Array(buffer,offset+(v.byteOffset||0),v.byteLength)],{type:image.mimeType}),img=await imageFromBlob(blob);signal.throwIfAborted();const tex=keep(gl.createTexture(),'deleteTexture');gl.activeTexture(gl.TEXTURE0+i+1);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);gl.uniform1i(loc[['baseTex','normalTex','mrTex'][i]],i+1);}
    gl.uniform1i(loc.lite,lite?1:0);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
    const nodes=j.nodes.map(n=>({translation:new Float32Array(n.translation||[0,0,0]),rotation:new Float32Array(n.rotation||[0,0,0,1]),scale:new Float32Array(n.scale||[1,1,1]),local:I(),world:I(),children:n.children||[]}));
    const initial=nodes.map(n=>({translation:n.translation.slice(),rotation:n.rotation.slice(),scale:n.scale.slice()}));
    const clips=j.animations.map(a=>{const tracks=a.channels.map(c=>{const s=a.samplers[c.sampler],path=c.target.path;return {node:c.target.node,path,times:access(s.input),values:access(s.output),size:path==='rotation'?4:3,rotation:path==='rotation',step:s.interpolation==='STEP'};});return {name:a.name,tracks,duration:Math.max(...tracks.map(t=>t.times[t.times.length-1]))};});
    const boneData=new Float32Array(skin.joints.length*16),boneViews=skin.joints.map((_,i)=>boneData.subarray(i*16,i*16+16)),invViews=skin.joints.map((_,i)=>inv.subarray(i*16,i*16+16));
    function updateWorld(i,parent){const n=nodes[i];trs(n.local,n.translation,n.rotation,n.scale);if(parent)mul(n.world,parent,n.local);else n.world.set(n.local);for(const c of n.children)updateWorld(c,n.world);}
    function pose(clipIndex,t){if(clipIndex===null){for(let i=0;i<nodes.length;i++)for(const key of ['translation','rotation','scale'])nodes[i][key].set(initial[i][key]);}else{const clip=clips[clipIndex];for(const tr of clip.tracks)interpolate(tr,t,nodes[tr.node][tr.path]);}for(const r of j.scenes[j.scene||0].nodes)updateWorld(r,null);for(let i=0;i<skin.joints.length;i++)mul(boneViews[i],nodes[skin.joints[i]].world,invViews[i]);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,bones);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,skin.joints.length,gl.RGBA,gl.FLOAT,boneData);}
    const vp=I();function draw({yaw,pitch,distance,visible}){if(disposed||gl.isContextLost())return;gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!visible)return;const target=[0,.50,0],eye=[distance*Math.cos(pitch)*Math.sin(yaw),target[1]+distance*Math.sin(pitch),distance*Math.cos(pitch)*Math.cos(yaw)];mul(vp,perspective(canvas.width/Math.max(1,canvas.height)),look(eye,target));gl.uniformMatrix4fv(loc.vp,false,vp);gl.uniform3fv(loc.eye,eye);gl.bindVertexArray(vao);gl.drawElements(gl.TRIANGLES,indices.length,j.accessors[prim.indices].componentType,0);}
    pose(null,0);return {clips,pose,draw,dispose};
  }catch(e){dispose();throw e;}
}
