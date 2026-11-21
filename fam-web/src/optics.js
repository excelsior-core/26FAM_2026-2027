import * as T from '../vendor/three/three.module.min.js';

const quadVertex = `
  varying vec2 st;
  void main(){ st=uv; gl_Position=vec4(position.xy,0.,1.); }`;

// A transparent HDR scene needs its own resolve: bloom must illuminate the
// page behind the canvas without filling its transparent corners with black.
export class Optics {
  constructor(renderer) {
    this.renderer=renderer;
    const gl=renderer.getContext();
    const hdr=renderer.extensions.has('EXT_color_buffer_float');
    const type=hdr ? T.HalfFloatType : T.UnsignedByteType;
    const samples=gl.getInternalformatParameter(gl.RENDERBUFFER,hdr?gl.RGBA16F:gl.RGBA8,gl.SAMPLES);
    this.beauty=new T.WebGLRenderTarget(1,1,{type,samples:Math.min(4,samples[0] || 0)});
    this.levels=Array.from({length:2},()=>new T.WebGLRenderTarget(1,1,{type,depthBuffer:false}));
    this.scene=new T.Scene();
    this.camera=new T.Camera();
    this.quad=new T.Mesh(new T.PlaneGeometry(2,2));
    this.quad.material.dispose();
    this.quad.frustumCulled=false;
    this.scene.add(this.quad);
    const material=(uniforms,fragmentShader)=>new T.ShaderMaterial({
      uniforms,vertexShader:quadVertex,fragmentShader,depthTest:false,depthWrite:false,
      blending:T.NoBlending
    });
    this.down=material({src:{value:null},stepUV:{value:new T.Vector2()},cut:{value:1}},`
      varying vec2 st;
      uniform sampler2D src;
      uniform vec2 stepUV;
      uniform float cut;
      void main(){
        vec3 c=texture2D(src,st).rgb*4.;
        c+=(texture2D(src,st+stepUV).rgb+texture2D(src,st-stepUV).rgb
           +texture2D(src,st+vec2(stepUV.x,-stepUV.y)).rgb
           +texture2D(src,st+vec2(-stepUV.x,stepUV.y)).rgb);
        c*=.125;
        float peak=max(c.r,max(c.g,c.b));
        gl_FragColor=vec4(c*mix(1.,smoothstep(.9,2.0,peak),cut),1.);
      }`);
    this.resolve=material({
      src:{value:this.beauty.texture},nearGlow:{value:this.levels[1].texture},
      strength:{value:1}
    },`
      varying vec2 st;
      uniform sampler2D src,nearGlow;
      uniform float strength;
      void main(){
        vec4 surface=texture2D(src,st);
        vec3 bloom=texture2D(nearGlow,st).rgb*strength;
        float haze=1.-exp(-max(bloom.r,max(bloom.g,bloom.b))*1.9);
        float coverage=surface.a+(1.-surface.a)*haze;
        gl_FragColor=vec4((surface.rgb+bloom)/max(.0001,coverage),coverage);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`);
  }

  resize(w,h) {
    this.beauty.setSize(w,h);
    for(const level of this.levels){
      w=Math.max(1,Math.ceil(w/2));
      h=Math.max(1,Math.ceil(h/2));
      level.setSize(w,h);
    }
  }

  render(scene,camera) {
    const r=this.renderer;
    r.setRenderTarget(this.beauty);
    r.render(scene,camera);
    this.quad.material=this.down;
    let src=this.beauty;
    for(const level of this.levels) {
      this.down.uniforms.src.value=src.texture;
      this.down.uniforms.stepUV.value.set(1.45/src.width,1.45/src.height);
      this.down.uniforms.cut.value=src===this.beauty?1:0;
      r.setRenderTarget(level);
      r.render(this.scene,this.camera);
      src=level;
    }
    r.setRenderTarget(null);
    this.quad.material=this.resolve;
    r.render(this.scene,this.camera);
  }

  dispose() {
    this.beauty.dispose();
    this.levels.forEach(level=>level.dispose());
    this.quad.geometry.dispose();
    this.down.dispose();
    this.resolve.dispose();
  }
}

// Linear-radiance sky: a tall conservatory window, its mullions, an amber
// bounce card and a narrow rim light stay fixed as the instrument turns.
export function galleryLight(renderer) {
  const w=512,h=256, pixels=new Uint16Array(w*h*4);
  const gaussian=(x,s)=>Math.exp(-x*x/(s*s));
  for(let j=0;j<h;j++) for(let i=0;i<w;i++) {
    const a=(i/w-.5)*2*Math.PI, b=(j/h-.5)*Math.PI;
    const window=gaussian(a-.85,.45)*gaussian(b-.48,.73)
      * (.27+.73*Math.min(1,Math.abs(Math.sin((a-.8)*26))*3))
      * (.5+.5*Math.min(1,Math.abs(Math.sin(b*11))*4));
    const sill=gaussian(a+1.8,.41)*gaussian(b-.35,.54);
    const rim=gaussian(a-2.55,.15)*gaussian(b-.22,.86);
    const floor=gaussian(b+.78,.32);
    const o=4*(j*w+i);
    const values=[.074+window*11+sill*3.2+rim*7+floor*.48,
      .071+window*9+sill*2.6+rim*3.5+floor*.24,
      .061+window*6+sill*2.3+rim*1.4+floor*.095,1];
    for(let k=0;k<4;k++)pixels[o+k]=T.DataUtils.toHalfFloat(values[k]);
  }
  const sky=new T.DataTexture(pixels,w,h,T.RGBAFormat,T.HalfFloatType);
  sky.mapping=T.EquirectangularReflectionMapping;
  sky.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer);
  const target=generator.fromEquirectangular(sky);
  sky.dispose();generator.dispose();
  return target;
}
