import * as T from '../vendor/three/three.module.min.js';
import {solarCore} from './solar-core.js';

const turn = Math.PI * 2;

function wire(radius,gauge,material) {
  const mesh=new T.Mesh(new T.TorusGeometry(radius,gauge,8,192),material);
  mesh.rotation.x=Math.PI/2;
  return mesh;
}

function band(radius,width,satin,brass){
  const profile=[[0,.34],[0,-.34],[-.010,-.43],[-.012,-.50],[-.048,-.50],[-.056,-.35],
    [-.056,.35],[-.048,.50],[-.012,.50],[-.010,.43],[0,.34]];
  const positions=[],uv=[],indices=[];
  const geo=new T.BufferGeometry(),segments=144;
  for(let j=0;j<profile.length-1;j++){
    const first=indices.length;
    for(let i=0;i<=segments;i++){
      const a=i/segments*turn;
      for(let k=0;k<2;k++){
        const [dr,y]=profile[j+k],r=radius+dr;
        positions.push(r*Math.sin(a),y*width,r*Math.cos(a));
        uv.push(i/segments,k?0:1);
      }
      const v=positions.length/3-2;
      if(i>0)indices.push(v-2,v-1,v,v,v-1,v+1);
    }
    if(j===0)geo.addGroup(first,indices.length,0);
  }
  geo.addGroup(geo.groups[0].count,indices.length-geo.groups[0].count,1);
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new T.Mesh(geo,[satin,brass]);
}

export function armillary(brass,compact) {
  const group=new T.Group(), rings=[];
  const core=solarCore(compact);
  core.mesh.scale.setScalar(.98);
  group.add(core.mesh);
  const satin=new T.MeshPhysicalMaterial({metalness:.86,roughness:.36,clearcoat:.12,clearcoatRoughness:.28});
  const bead=new T.SphereGeometry(1,20,12);
  const collar=new T.TorusGeometry(.069,.013,8,40);
  const foot=new T.CylinderGeometry(.084,.092,.039,36);
  const bronze=new T.MeshStandardMaterial({color:0x5d401f,metalness:.87,roughness:.32});
  const specs=[
    [2.00,.176,.28,.10,-.30],
    [1.76,.148,1.13,-.28,.49],
    [1.47,.098,.81,.71,-.73],
    [2.12,.014,1.34,-.43,-.66],
    [1.94,.012,.57,.38,1.07]
  ];
  for(const [radius,width,tilt,yaw,roll] of specs) {
    const ring=new T.Group();
    ring.rotation.order='ZYX';
    ring.rotation.set(tilt,yaw,roll);
    if(width>.02) {
      ring.add(band(radius,width,satin,brass));
      for(const sign of [-1,1]) {
        const edge=wire(radius-.012,.009,brass);
        edge.position.y=sign*width/2;
        ring.add(edge);
      }
    } else ring.add(wire(radius,width*.65,brass));
    for(const angle of [.45, .45+Math.PI]) {
      const pivot=new T.Mesh(bead,brass);
      pivot.scale.setScalar(width>.02?.063:.041);
      pivot.position.set(radius*Math.cos(angle),0,radius*Math.sin(angle));
      ring.add(pivot);
      if(width>.02) {
        const socket=new T.Group();
        socket.position.copy(pivot.position);
        socket.rotation.y=Math.PI/2-angle;
        const bearing=new T.Mesh(foot,bronze);
        bearing.rotation.x=Math.PI/2;
        const lip=new T.Mesh(collar,brass);
        lip.position.z=.028;
        socket.add(bearing,lip);
        ring.add(socket);
      }
    }
    // Successive carriers inherit the rotation of the hoop that supports them.
    const parent=rings.length===1?rings[0].ring:rings.length===2?rings[1].ring:group;
    parent.add(ring);
    rings.push({ring,tilt,yaw,roll});
  }
  return {group,core,rings,ringMaterial:satin,
    animate(t) {
      core.update(t);
      core.mesh.rotation.set(.33+.10*Math.sin(t*.14),.42+.14*Math.sin(t*.16),-.24+.11*Math.sin(t*.18));
      rings.forEach(({ring,tilt,yaw,roll},i)=>{
        const swing=[.07,.46,.79,.15,.23][i];
        ring.rotation.set(tilt+swing*Math.sin(t*(.13+i*.043)),
          yaw+swing*.72*Math.sin(t*.21),roll+swing*.64*Math.sin(t*.27));
        ring.rotateY(t*[.033,-.17,.29,.068,-.092][i]);
      });
    }
  };
}
