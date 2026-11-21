import * as T from '../vendor/three/three.module.min.js';

const cycle = 18;
const limit = 1.43;
function roundMax(a,b,r) {
  const h=Math.max(r-Math.abs(a-b),0);
  return Math.max(a,b)+h*h/(4*r);
}

// Three signed fields share one volume. Interpolating their zero sets allows
// openings to divide and close, including when every rotation is frozen.
function sampleFields(n,step) {
  const fields=Array.from({length:3},()=>new Float32Array(n**3));
  const v=[[.70,.70,.70],[.70,-.70,-.70],[-.70,.70,-.70],[-.70,-.70,.70]];
  const struts=[];
  for(let i=0;i<v.length;i++) for(let j=0;j<i;j++) {
    const a=v[i],d=v[j].map((x,k)=>x-a[k]);
    const mid=a.map((x,k)=>x+d[k]/2), radius=Math.hypot(...mid);
    struts.push({a,d,out:mid.map(x=>x/radius),length:d.reduce((s,x)=>s+x*x,0)});
  }
  for(let k=0;k<n;k++) for(let j=0;j<n;j++) for(let i=0;i<n;i++) {
    const id=i+n*(j+n*k), x=i*step-limit,y=j*step-limit,z=k*step-limit;
    const r=Math.hypot(x,y,z), f=3.08;
    const g=Math.sin(f*x)*Math.cos(f*y)+Math.sin(f*y)*Math.cos(f*z)+Math.sin(f*z)*Math.cos(f*x);
    // A thickened patch of a gyroid, with a rounded perimeter.
    // Round the medial ridge inside the shell. Outside |g| < .45 this
    // equals |g|, including at the gyroid's visible zero crossing.
    const q=Math.min(Math.abs(g)/.45,1);
    const magnitude=Math.abs(g)<.45 ? .45*(.375+q*q*(.75-.125*q*q)) : Math.abs(g);
    fields[0][id]=roundMax(magnitude*.245-.113,r-1.14,.14);
    let frame=2;
    for(const {a,d,out,length} of struts) {
      const px=x-a[0],py=y-a[1],pz=z-a[2];
      const t=Math.max(0,Math.min(1,(px*d[0]+py*d[1]+pz*d[2])/length));
      const bow=.21*4*t*(1-t);
      const gauge=.109+.072*(2*t-1)**2;
      const distance=Math.hypot(px-t*d[0]+bow*out[0],py-t*d[1]+bow*out[1],pz-t*d[2]+bow*out[2])-gauge;
      frame=-roundMax(-frame,-distance,.17);
    }
    fields[1][id]=frame;
    const angle=Math.atan2(y,x);
    const rho=Math.hypot(x,y);
    const nearAxis=Math.min(1,rho/.26);
    const angular=nearAxis*nearAxis*(3-2*nearAxis);
    const radial=rho-(.74+angular*.17*Math.cos(3*angle));
    const axial=z-angular*.48*Math.sin(2*angle+.28);
    fields[2][id]=Math.hypot(radial,axial*.84)-(.225+angular*.065*Math.cos(3*angle+.6));
  }
  return fields;
}

// Interpolation exposes parts of each distance field that are normally
// hidden inside the solid. Regularize those intermediate level sets in
// object space before extracting a mesh. The three end poses stay exact.
function transitionField(input,n,step) {
  const sigma=.16/step, radius=Math.ceil(3*sigma);
  const weights=Array.from({length:2*radius+1},(_,i)=>Math.exp(-.5*((i-radius)/sigma)**2));
  const sum=weights.reduce((a,b)=>a+b,0);
  let src=input;
  for(const stride of [1,n,n*n]) {
    const dst=new Float32Array(src.length);
    for(let base=0;base<src.length;base+=stride*n) for(let line=0;line<stride;line++) {
      const start=base+line;
      for(let j=0;j<n;j++) {
        let value=0;
        for(let k=-radius;k<=radius;k++)
          value+=weights[k+radius]*src[start+Math.min(n-1,Math.max(0,j+k))*stride];
        dst[start+j*stride]=value/sum;
      }
    }
    src=dst;
  }
  for(let i=0;i<src.length;i++)src[i]-=input[i];
  return src;
}

const gridSize=56;
let volumeFields;


// Reconstruct the scalar field with a cubic B-spline. Eight trilinear samples
// give a continuous surface and continuous normals even at a closing aperture.
const fieldShader = `
  uniform highp sampler3D morphVolume;
  uniform mat4 modelViewMatrix, projectionMatrix;
  uniform mat3 normalMatrix;
  varying vec3 rayOrigin, rayPoint;
  const float bound=${limit};
  const float resolution=${gridSize}.;
  vec3 grid(vec3 p){ return (p+bound)*((resolution-1.)/(2.*bound)); }
  float linearField(vec3 p){
    return texture(morphVolume,(grid(p)+.5)/resolution).r;
  }
  float field(vec3 p){
    vec3 g=grid(p), f=fract(g), h=1.-f;
    vec3 a=h*h*h/6., d=f*f*f/6.;
    vec3 b=(4.-6.*f*f+3.*f*f*f)/6.;
    vec3 c=1.-a-b-d, lo=a+b, hi=c+d;
    vec3 base=floor(g)+.5;
    vec3 p0=(base-1.+b/lo)/resolution, p1=(base+1.+d/hi)/resolution;
    float z0=mix(mix(texture(morphVolume,p0).r,texture(morphVolume,vec3(p1.x,p0.yz)).r,hi.x),
                 mix(texture(morphVolume,vec3(p0.x,p1.y,p0.z)).r,texture(morphVolume,vec3(p1.xy,p0.z)).r,hi.x),hi.y);
    float z1=mix(mix(texture(morphVolume,vec3(p0.xy,p1.z)).r,texture(morphVolume,vec3(p1.x,p0.y,p1.z)).r,hi.x),
                 mix(texture(morphVolume,vec3(p0.x,p1.yz)).r,texture(morphVolume,p1).r,hi.x),hi.y);
    return mix(z0,z1,hi.z);
  }
  bool firstHit(vec3 ro,vec3 rd,out vec3 hit){
    float b=dot(ro,rd), disc=b*b-dot(ro,ro)+bound*bound;
    if(disc<=0.)return false;
    float span=sqrt(disc), t=-b-span, end=-b+span, last=t;
    for(int i=0;i<160;i++){
      if(t>end)break;
      vec3 p=ro+t*rd;
      float v=linearField(p);
      if(v<.035)v=field(p);
      if(v<=0.){
        // Bracket a real sign change: a near miss in a narrow gap must
        // remain transparent, even if the field is very flat there.
        for(int k=0;k<6;k++){
          float mid=(last+t)*.5;
          if(field(ro+mid*rd)>0.)last=mid;else t=mid;
        }
        hit=ro+rd*((t+last)*.5);return true;
      }
      last=t;
      t+=clamp(v*.67,.012,.17);
    }
    return false;
  }
  vec3 fieldNormal(vec3 p){
    const vec2 e=vec2(.007,0.);
    return normalize(vec3(field(p+e.xyy)-field(p-e.xyy),
                          field(p+e.yxy)-field(p-e.yxy),
                          field(p+e.yyx)-field(p-e.yyx)));
  }
`;

export function solarCore() {
  const n=gridSize, step=2*limit/(n-1);
  if(!volumeFields){
    const fields=sampleFields(n,step);
    volumeFields={fields,corrections:fields.map(f=>transitionField(f,n,step))};
  }
  const {fields,corrections}=volumeFields;
  const data=new Uint16Array(n**3);
  const texture=new T.Data3DTexture(data,n,n,n);
  texture.format=T.RedFormat;
  texture.type=T.HalfFloatType;
  texture.minFilter=texture.magFilter=T.LinearFilter;
  texture.generateMipmaps=false;
  const material=new T.MeshPhysicalMaterial({metalness:.87,roughness:.34,clearcoat:.13,clearcoatRoughness:.27});
  material.onBeforeCompile=shader=>{
    shader.uniforms.morphVolume={value:texture};
    shader.vertexShader='varying vec3 rayOrigin,rayPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      rayOrigin=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;
      rayPoint=position;
    `);
    // Keep the existing physical material and lighting. Only substitute the
    // visible surface position, normal and depth for those of the proxy box.
    shader.fragmentShader=fieldShader+shader.fragmentShader
      .replace('void main() {',`void main() {
        vec3 hit;
        if(!firstHit(rayOrigin,normalize(rayPoint-rayOrigin),hit))discard;
        vec4 eye=modelViewMatrix*vec4(hit,1.);
        vec4 clip=projectionMatrix*eye;
        gl_FragDepth=.5*(clip.z/clip.w)+.5;
        #define vViewPosition (-eye.xyz)
      `)
      .replace('#include <normal_fragment_begin>',`
        float faceDirection=1.;
        vec3 normal=normalize(normalMatrix*fieldNormal(hit));
        vec3 nonPerturbedNormal=normal;
      `)
      // Neighbouring pixels can hit opposite walls of an aperture. A
      // screen-space roughness derivative there would paint a dotted seam.
      .replace('#include <lights_physical_fragment>',T.ShaderChunk.lights_physical_fragment
        .replace('float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );',
          'float geometryRoughness = 0.;'));
  };
  material.addEventListener('dispose',()=>texture.dispose());
  const mesh=new T.Mesh(new T.BoxGeometry(2*limit,2*limit,2*limit),material);
  let previous=-Infinity;
  function update(t){
    if(t===previous)return;
    previous=t;
    const phase=(t%cycle)*3/cycle,form=Math.floor(phase),next=(form+1)%3;
    const f=phase-form,w=f*f*(3-2*f),blend=4*w*(1-w);
    const a=fields[form],b=fields[next],ca=corrections[form],cb=corrections[next];
    const strength=1-(1-blend)**3,bridge=.155*blend;
    for(let i=0;i<data.length;i++)
      data[i]=T.DataUtils.toHalfFloat(a[i]+(b[i]-a[i])*w+strength*(ca[i]+(cb[i]-ca[i])*w)-bridge);
    texture.needsUpdate=true;
  }
  update(0);
  return {mesh,material,update,get time(){return previous;}};
}
