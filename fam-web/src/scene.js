import * as T from '../vendor/three/three.module.min.js';

// One projected 4D hypercube: 16 vertices, 32 edges. All light belongs to this object.
export class MathScene {
  constructor(container,{compact=false,theme='dark',motion=true}={}) {
    Object.assign(this,{container,compact,theme,motion,time:0,alive:true,pointer:{x:0,y:0}});
    try { this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
    catch { container.classList.add('scene-fallback');container.innerHTML='<div class="fallback-cube"><i></i><i></i><i></i></div>';return; }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.4:1.8));
    this.renderer.setClearColor(0,0);this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-hidden','true');
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(36,1,.1,60);this.group=new T.Group();this.scene.add(this.group);
    this.scene.add(new T.AmbientLight(0xffe8bb,1.6));
    for(const [color,power,x,y,z] of [[0xfff3ce,70,2,4,4],[0xffb42e,45,-3,-1,2],[0xffffff,55,-2,3,-3]]){const light=new T.PointLight(color,power);light.position.set(x,y,z);this.scene.add(light);}
    // Broad studio reflections give the gold volume rather than a flat yellow outline.
    const env=document.createElement('canvas');env.width=512;env.height=256;const ec=env.getContext('2d');ec.fillStyle='#33200a';ec.fillRect(0,0,512,256);
    for(const [x,w] of [[35,70],[205,14],[300,95],[455,20]]){const g=ec.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#33200a');g.addColorStop(.4,'#fff4d2');g.addColorStop(.6,'#fff9ec');g.addColorStop(1,'#33200a');ec.fillStyle=g;ec.fillRect(x,0,w,256);}
    const texture=new T.CanvasTexture(env);texture.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromEquirectangular(texture);this.scene.environment=this.environment.texture;texture.dispose();pmrem.dispose();
    const glow=document.createElement('canvas');glow.width=glow.height=128;const gc=glow.getContext('2d'),gradient=gc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,236,1)');gradient.addColorStop(.07,'rgba(255,238,173,1)');gradient.addColorStop(.18,'rgba(255,197,65,.55)');gradient.addColorStop(.45,'rgba(240,156,31,.13)');gradient.addColorStop(1,'rgba(220,129,12,0)');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);this.glowTexture=new T.CanvasTexture(glow);
    this.vertices=Array.from({length:16},(_,n)=>[0,1,2,3].map(i=>(n>>i&1)?1:-1));this.edges=[];
    for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)if(!((i^j)&((i^j)-1)))this.edges.push([i,j]);
    this.gold=new T.MeshStandardMaterial({color:0xe8b34d,metalness:1,roughness:.19,emissive:0xc88216,emissiveIntensity:.17});
    this.core=new T.MeshBasicMaterial({color:0xffefbd,transparent:true,opacity:.82});
    this.halo=new T.MeshBasicMaterial({color:0xffc34e,transparent:true,opacity:.065,blending:T.AdditiveBlending,depthWrite:false});
    this.rods=this.edges.map(()=>{const g=new T.Group();for(const [radius,material] of [[.021,this.gold],[.006,this.core],[.065,this.halo],[.12,this.halo]])g.add(new T.Mesh(new T.CylinderGeometry(radius,radius,1,10),material));this.group.add(g);return g;});
    this.nodes=this.vertices.map(()=>{const g=new T.Group();g.add(new T.Mesh(new T.IcosahedronGeometry(.047,1),this.gold));const s=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color:0xffdc8c,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));s.scale.set(.7,.7,1);g.add(s);this.group.add(g);return g;});
    const faces=[];for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let n=0;n<16;n++)if(!(n&(1<<a))&&!(n&(1<<b)))faces.push([n,n|1<<a,n|1<<a|1<<b,n|1<<b]);this.faces=faces;
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(faces.length*18),3));this.face=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xe6be67,transparent:true,opacity:.025,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));this.group.add(this.face);
    const aura=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color:0xe5a943,transparent:true,opacity:.17,blending:T.AdditiveBlending,depthWrite:false}));aura.scale.set(6.7,6.7,1);aura.position.z=-1;this.scene.add(aura);this.aura=aura;
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
    this.move=e=>{const r=container.getBoundingClientRect();this.pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5};};container.addEventListener('pointermove',this.move);
    this.visibility=()=>{cancelAnimationFrame(this.raf);this.last=0;if(!document.hidden)this.frame();};document.addEventListener('visibilitychange',this.visibility);
    this.set(0,theme);this.resize();this.frame();
  }
  update(){const t=this.time,a=.34+t*.24,b=.16+Math.sin(t*.31)*.44;
    const points=this.vertices.map(v=>{let [x,y,z,w]=v;[x,w]=[x*Math.cos(a)-w*Math.sin(a),x*Math.sin(a)+w*Math.cos(a)];[y,w]=[y*Math.cos(b)-w*Math.sin(b),y*Math.sin(b)+w*Math.cos(b)];const k=2.6/(3.2-w);return new T.Vector3(x*k,y*k,z*k);});
    const axis=new T.Vector3(0,1,0);this.edges.forEach(([i,j],n)=>{const rod=this.rods[n],d=new T.Vector3().subVectors(points[j],points[i]);rod.position.copy(points[i]).add(points[j]).multiplyScalar(.5);rod.scale.y=d.length();rod.quaternion.setFromUnitVectors(axis,d.normalize());});
    this.nodes.forEach((node,i)=>node.position.copy(points[i]));const pos=this.face.geometry.attributes.position;this.faces.forEach((ids,n)=>[0,1,2,0,2,3].forEach((v,j)=>pos.setXYZ(n*6+j,...points[ids[v]].toArray())));pos.needsUpdate=true;
    this.group.rotation.set(.36+Math.sin(t*.22)*.13+(this.motion?this.pointer.y*.08:0),.52+t*.16+(this.motion?this.pointer.x*.1:0),-.17+Math.sin(t*.19)*.08);this.group.position.y=Math.sin(t*.65)*.075;
  }
  resize(){if(!this.renderer)return;const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.position.z=Math.max(8.7,8.7/this.camera.aspect);this.camera.updateProjectionMatrix();}
  frame=()=>{if(!this.alive||!this.renderer||document.hidden)return;const now=performance.now();if(!this.last||now-this.last>30){if(this.motion&&this.last)this.time+=Math.min((now-this.last)/1000,.1);this.update();this.renderer.render(this.scene,this.camera);this.last=now;}this.raf=requestAnimationFrame(this.frame);};
  set(_mode,theme=this.theme){this.theme=theme;if(!this.renderer)return;const dark=theme==='dark';this.aura.material.opacity=dark?.17:.09;this.halo.opacity=dark?.065:.035;this.gold.emissiveIntensity=dark?.17:.05;this.nodes.forEach(n=>n.children[1].material.opacity=dark?.8:.45);}
  destroy(){this.alive=false;cancelAnimationFrame(this.raf);this.observer?.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.container.removeEventListener('pointermove',this.move);if(!this.renderer)return;const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.glowTexture.dispose();this.environment.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
