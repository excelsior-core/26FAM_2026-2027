import * as T from '../vendor/three/three.module.min.js';
import {armillary} from './armillary.js';
import {galleryLight, Optics} from './optics.js';

let elapsed = 0;
const palettes = {
  dark:  {metal:0xc9a875, patina:0x9c805a, core:0xd1bfa0, exposure:.83, bloom:.16},
  light: {metal:0xb39469, patina:0x907859, core:0xb39d7a, exposure:.91, bloom:.11},
  sepia: {metal:0xc39e6c, patina:0x987d5d, core:0xc4aa84, exposure:.87, bloom:.13}
};

export class MathScene {
  constructor(container,{compact=false,theme='dark',motion=true}={}) {
    this.container=container;
    this.compact=compact;
    this.theme=theme;
    this.moving=motion;
    this.active=true;
    this.pointer=new T.Vector2();
    this.smoothed=new T.Vector2();
    container.dataset.figure='armillary';
    try {
      this.renderer=new T.WebGLRenderer({alpha:true,premultipliedAlpha:false,antialias:false,powerPreference:'default'});
    } catch {
      this.fallback=document.createElement('div');
      this.fallback.style.cssText='position:absolute;inset:0;pointer-events:none';
      this.poster=new Image();
      this.poster.alt='';
      const fit='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;';
      this.poster.style.cssText=fit;
      this.fallback.append(this.poster);
      const clip=document.createElement('video');
      if(clip.canPlayType('video/webm; codecs="vp9"')) {
        this.clip=clip;
        clip.style.cssText=fit+'opacity:0';
        clip.muted=true;
        clip.loop=true;
        clip.playsInline=true;
        clip.setAttribute('aria-hidden','true');
        clip.onloadedmetadata=()=>{clip.currentTime=elapsed%clip.duration;};
        clip.onplaying=()=>{this.poster.style.visibility='hidden';clip.style.opacity='1';};
        clip.onerror=()=>{this.poster.style.visibility='';clip.style.opacity='0';};
        this.fallback.append(clip);
      }
      container.append(this.fallback);
    }
    if(this.renderer) {
      this.renderer.setClearColor(0,0);
      this.renderer.toneMapping=T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=1.08;
      const canvas=this.renderer.domElement;
      canvas.setAttribute('aria-hidden','true');
      container.append(canvas);
      this.camera=new T.PerspectiveCamera(32,1,.1,40);
      this.scene=new T.Scene();
      this.environment=galleryLight(this.renderer);
      this.scene.environment=this.environment.texture;
      this.brass=new T.MeshPhysicalMaterial({metalness:.91,roughness:.25,clearcoat:.16,clearcoatRoughness:.2});
      this.scene.add(new T.HemisphereLight(0xffebcd,0x6c441e,.68));
      const windowLight=new T.DirectionalLight(0xffebc4,1.75);
      windowLight.position.set(4,5,2);
      this.scene.add(windowLight);
      this.scene.environmentIntensity=.82;
      this.art=armillary(this.brass,compact);
      this.optics=new Optics(this.renderer);
      this.scene.add(this.art.group);
    }
    this.events=new AbortController();
    const listen=(node,event,handler)=>node.addEventListener(event,handler,{passive:true,signal:this.events.signal});
    // Mobile layout lets touches pass through the artwork to support native scrolling.
    const surface=container.closest('.entry-main,.catalog-hero') || container;
    listen(surface,'pointermove',this.point);
    listen(surface,'pointerdown',this.point);
    listen(surface,'pointerleave',this.resetPointer);
    listen(surface,'pointercancel',this.resetPointer);
    listen(surface,'pointerup',event=>{if(event.pointerType!=='mouse')this.resetPointer();});
    listen(document,'visibilitychange',this.schedule);
    this.sizeObserver=new ResizeObserver(()=>this.resize());
    this.sizeObserver.observe(container);
    this.visibilityObserver=new IntersectionObserver(([entry])=>{
      this.active=entry.isIntersecting;
      this.schedule();
    });
    this.visibilityObserver.observe(container);
    this.set(0,theme);
    this.resize();
  }

  get motion(){return this.moving;}
  set motion(value){
    this.moving=value;
    this.schedule();
  }

  resetPointer=()=>this.pointer.set(0,0);
  point=event=>{
    if(!this.moving)return;
    const r=this.container.getBoundingClientRect();
    const clamp=T.MathUtils.clamp;
    this.pointer.set(clamp(2*(event.clientX-r.left)/r.width-1,-1,1),
      clamp(2*(event.clientY-r.top)/r.height-1,-1,1));
  };

  set(_mode,theme=this.theme) {
    this.theme=theme;
    if(this.poster) {
      this.poster.src=new URL('../assets/armillary-v4-'+theme+'.webp',import.meta.url);
      if(this.clip)this.clip.style.filter=theme==='dark'?'none':
        theme==='light'?'brightness(.78) saturate(.78)':'brightness(.86) saturate(.88)';
      this.schedule();
      return;
    }
    const p=palettes[theme] || palettes.dark;
    this.brass.color.setHex(p.metal);
    this.art.ringMaterial.color.setHex(p.patina);
    this.art.core.material.color.setHex(p.core);
    this.renderer.toneMappingExposure=p.exposure;
    this.optics.resolve.uniforms.strength.value=p.bloom;
    this.schedule();
  }

  resize(){
    const w=this.container.clientWidth,h=this.container.clientHeight;
    if(!w||!h||!this.renderer)return;
    const budget=this.moving?820000:1350000;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65,Math.sqrt(budget/(w*h)))*(this.resolutionScale??1));
    this.renderer.setSize(w,h);
    const aspect=w/h;
    const height=Math.max(4.92,4.95/aspect);
    this.camera.aspect=aspect;
    this.camera.position.z=height/(2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2)));
    const canvas=this.renderer.domElement;
    this.optics.resize(canvas.width,canvas.height);
    this.camera.updateProjectionMatrix();
    this.schedule();
  }

  schedule=()=>{
    cancelAnimationFrame(this.raf);
    this.last=0;
    if(this.clip) {
      if(this.active && this.moving && !document.hidden) {
        if(!this.clip.src)this.clip.src=new URL('../assets/armillary-motion-v4.webm',import.meta.url);
        this.clip.play().catch(()=>{});
      } else this.clip.pause();
    }
    if(this.active&&!document.hidden)this.raf=requestAnimationFrame(this.frame);
  };

  frame=now=>{
    if(!this.active||document.hidden)return;
    const delta=this.last?(now-this.last)/1000:0;
    if(!this.last||delta>=1/32) {
      this.last=now;
      if(this.moving) {
        elapsed+=Math.min(delta,.28);
        this.smoothed.lerp(this.pointer,1-Math.exp(-delta*6));
        if(this.renderer && delta>.065)this.slowFrames=(this.slowFrames||0)+1;
        else this.slowFrames=0;
        if(this.slowFrames>=7 && (this.resolutionScale??1)>.86) {
          this.resolutionScale=(this.resolutionScale??1)*.9;
          this.slowFrames=0;
          this.resize();
          return;
        }
      }
      const x=this.smoothed.x,y=this.smoothed.y,t=elapsed;
      if(this.poster) {
        this.fallback.style.transform='perspective(800px) rotateY('+(x*8+2*Math.sin(t*.18))+'deg) rotateX('+(-y*6)+'deg) translateY('+(2*Math.sin(t*.34))+'px)';
      } else {
        const root=this.art.group;
        root.position.y=.038*Math.sin(t*.43);
        root.rotation.set(.12+.12*Math.sin(t*.19)+y*.34,
          -.14+.23*Math.sin(t*.15)+x*.46,.24+.06*Math.sin(t*.16));
        this.art.animate(t);
        this.optics.render(this.scene,this.camera);
      }
    }
    if(this.moving)this.raf=requestAnimationFrame(this.frame);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    this.events.abort();
    this.sizeObserver.disconnect();
    this.visibilityObserver.disconnect();
    if(this.clip) {
      this.clip.pause();
      this.clip.removeAttribute('src');
      this.clip.load();
    }
    this.fallback?.remove();
    if(!this.renderer)return;
    const geometry=new Set(),materials=new Set();
    this.scene.traverse(item=>{
      if(item.geometry)geometry.add(item.geometry);
      if(item.material)[].concat(item.material).forEach(material=>materials.add(material));
    });
    geometry.forEach(item=>item.dispose());
    materials.forEach(item=>{item.map?.dispose();item.dispose();});
    this.optics.dispose();
    this.environment.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
