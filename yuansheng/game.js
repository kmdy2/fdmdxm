// ================================================================
//  工具
// ================================================================
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

const noiseGrid=[];
for(let i=0;i<256;i++) noiseGrid[i]=Math.random();
function noise2D(x,y){
  const xi=Math.floor(x)&255, yi=Math.floor(y)&255;
  const xf=x-Math.floor(x), yf=y-Math.floor(y);
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const aa=noiseGrid[(xi+yi*17)&255], bb=noiseGrid[((xi+1)+yi*17)&255];
  const cc=noiseGrid[(xi+(yi+1)*17)&255], dd=noiseGrid[((xi+1)+(yi+1)*17)&255];
  return lerp(lerp(aa,bb,u),lerp(cc,dd,u),v);
}
function fbm(x,y){
  let v=0,amp=1,freq=1;
  for(let i=0;i<4;i++){v+=noise2D(x*freq,y*freq)*amp;amp*=0.5;freq*=2;}
  return v;
}
function terrainHeight(x,z){
  return fbm(x*0.015,z*0.015)*8 + fbm(x*0.04,z*0.04)*2 - 2;
}

// ================================================================
//  精细程序化贴图（128x128，多层噪声+细节）
// ================================================================
function makeTex(size,drawFn){
  const c=document.createElement("canvas");
  c.width=size;c.height=size;
  const ctx=c.getContext("2d");
  drawFn(ctx,size);
  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  tex.anisotropy=4;
  return tex;
}
function pxNoise(ctx,size,base,variants,count){
  ctx.fillStyle=base;ctx.fillRect(0,0,size,size);
  for(let i=0;i<count;i++){
    ctx.fillStyle=variants[Math.floor(Math.random()*variants.length)];
    ctx.fillRect(Math.floor(Math.random()*size),Math.floor(Math.random()*size),1,1);
  }
}

// 草地：深绿基底+多层噪声+小草叶+泥土斑块
const texGrass=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#3d7a2c",["#356b25","#458a33","#2f5f22","#4a9238"],3000);
  for(let i=0;i<400;i++){
    const x=Math.random()*s,y=Math.random()*s;
    const h=2+Math.random()*5;
    ctx.strokeStyle=Math.random()<0.5?"#5ca844":"#6bb850";
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand(-1,1),y-h);ctx.stroke();
  }
  for(let i=0;i<8;i++){
    const x=Math.random()*s,y=Math.random()*s,r=4+Math.random()*10;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"rgba(101,67,33,0.35)");
    g.addColorStop(1,"rgba(101,67,33,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
});
// 泥土：棕色+石子+裂纹
const texDirt=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#6b4423",["#5a3818","#7a5230","#4e2e15","#85603a"],2500);
  for(let i=0;i<60;i++){
    const x=Math.random()*s,y=Math.random()*s,r=1+Math.random()*3;
    ctx.fillStyle=Math.random()<0.5?"#888":"#666";
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<12;i++){
    ctx.strokeStyle="rgba(40,25,10,0.4)";ctx.lineWidth=1;
    ctx.beginPath();
    let x=Math.random()*s,y=Math.random()*s;
    ctx.moveTo(x,y);
    for(let j=0;j<4;j++){x+=rand(-15,15);y+=rand(-15,15);ctx.lineTo(x,y);}
    ctx.stroke();
  }
});
// 岩石：灰色+层理+裂纹+苔藓
const texRock=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#7a7a7a",["#6a6a6a","#8a8a8a","#5e5e5e","#909090"],2500);
  for(let i=0;i<8;i++){
    const y=Math.random()*s;
    ctx.strokeStyle="rgba(50,50,50,0.3)";ctx.lineWidth=1+Math.random();
    ctx.beginPath();ctx.moveTo(0,y);
    for(let x=0;x<s;x+=10) ctx.lineTo(x,y+rand(-2,2));
    ctx.stroke();
  }
  for(let i=0;i<15;i++){
    ctx.strokeStyle="rgba(30,30,30,0.5)";ctx.lineWidth=1;
    ctx.beginPath();
    let x=Math.random()*s,y=Math.random()*s;ctx.moveTo(x,y);
    for(let j=0;j<5;j++){x+=rand(-12,12);y+=rand(-12,12);ctx.lineTo(x,y);}
    ctx.stroke();
  }
  for(let i=0;i<30;i++){
    const x=Math.random()*s,y=Math.random()*s,r=2+Math.random()*6;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"rgba(60,100,40,0.4)");g.addColorStop(1,"rgba(60,100,40,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
});
// 树皮：棕色+纵向纹理+节疤
const texBark=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#5a3a1a",["#4a2e12","#6b4828","#3e2510","#7a5530"],2000);
  for(let i=0;i<40;i++){
    const x=Math.random()*s;
    ctx.strokeStyle=Math.random()<0.5?"rgba(30,18,8,0.5)":"rgba(90,60,30,0.4)";
    ctx.lineWidth=1+Math.random()*2;
    ctx.beginPath();ctx.moveTo(x,0);
    for(let y=0;y<s;y+=8) ctx.lineTo(x+rand(-3,3),y);
    ctx.stroke();
  }
  for(let i=0;i<4;i++){
    const x=Math.random()*s,y=Math.random()*s,r=4+Math.random()*8;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"#2a1808");g.addColorStop(0.6,"#4a2e12");g.addColorStop(1,"rgba(74,46,18,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
});
// 树叶：深绿+深浅变化+透光斑点
const texLeaf=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#2d5a27",["#254d20","#357030","#1f4218","#3a7a33"],3000);
  for(let i=0;i<80;i++){
    const x=Math.random()*s,y=Math.random()*s,r=3+Math.random()*8;
    ctx.fillStyle=Math.random()<0.5?"rgba(70,130,50,0.5)":"rgba(40,90,30,0.5)";
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<50;i++){
    const x=Math.random()*s,y=Math.random()*s,r=1+Math.random()*3;
    ctx.fillStyle="rgba(150,200,100,0.3)";
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
});
// 沙地：黄色+颗粒+波纹
const texSand=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#d4b87a",["#c4a868","#e0c888","#b89c5c","#e8d098"],3000);
  for(let i=0;i<500;i++){
    ctx.fillStyle=Math.random()<0.5?"rgba(160,130,80,0.4)":"rgba(240,220,170,0.4)";
    ctx.fillRect(Math.random()*s,Math.random()*s,1,1);
  }
  for(let i=0;i<6;i++){
    const y=Math.random()*s;
    ctx.strokeStyle="rgba(180,150,90,0.3)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,y);
    for(let x=0;x<s;x+=8) ctx.lineTo(x,y+Math.sin(x*0.1)*3);
    ctx.stroke();
  }
});
// 雪地：白色+淡蓝阴影+颗粒
const texSnow=makeTex(128,(ctx,s)=>{
  pxNoise(ctx,s,"#e8eef5",["#dce5f0","#f0f4fa","#d0dae8","#f5f8fc"],2000);
  for(let i=0;i<100;i++){
    const x=Math.random()*s,y=Math.random()*s,r=2+Math.random()*8;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"rgba(150,180,220,0.15)");g.addColorStop(1,"rgba(150,180,220,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<80;i++){
    ctx.fillStyle="rgba(255,255,255,0.8)";
    ctx.fillRect(Math.random()*s,Math.random()*s,1,1);
  }
});

// ================================================================
//  Three.js
// ================================================================
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);
scene.fog=new THREE.Fog(0x87ceeb,60,180);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,500);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById("gameCanvasWrap").appendChild(renderer.domElement);
const canvas=renderer.domElement;

scene.add(new THREE.HemisphereLight(0xbfdfff,0x556644,0.7));
const sun=new THREE.DirectionalLight(0xfff4e0,1.2);
sun.position.set(50,80,30);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-80;sun.shadow.camera.right=80;
sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
sun.shadow.camera.near=1;sun.shadow.camera.far=200;
scene.add(sun);

// ================================================================
//  地形
// ================================================================
const TERRAIN_SIZE=200,TERRAIN_SEG=100;
const terrainGeo=new THREE.PlaneGeometry(TERRAIN_SIZE,TERRAIN_SIZE,TERRAIN_SEG,TERRAIN_SEG);
terrainGeo.rotateX(-Math.PI/2);
{
  const posAttr=terrainGeo.attributes.position;
  const colors=[];
  for(let i=0;i<posAttr.count;i++){
    const x=posAttr.getX(i),z=posAttr.getZ(i);
    const h=terrainHeight(x,z);
    posAttr.setY(i,h);
    let c;
    if(h<0) c=new THREE.Color(0xd4b87a);
    else if(h<3) c=new THREE.Color(0x4a8a38);
    else if(h<6) c=new THREE.Color(0x6b8e5a);
    else if(h<9) c=new THREE.Color(0x888888);
    else c=new THREE.Color(0xeeeeee);
    const v=0.9+Math.random()*0.2;
    colors.push(c.r*v,c.g*v,c.b*v);
  }
  terrainGeo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
}
terrainGeo.computeVertexNormals();
texGrass.repeat.set(40,40);
const terrainMat=new THREE.MeshLambertMaterial({map:texGrass,vertexColors:true});
const terrain=new THREE.Mesh(terrainGeo,terrainMat);
terrain.receiveShadow=true;
scene.add(terrain);

const water=new THREE.Mesh(
  new THREE.PlaneGeometry(TERRAIN_SIZE,TERRAIN_SIZE).rotateX(-Math.PI/2),
  new THREE.MeshStandardMaterial({color:0x3388cc,transparent:true,opacity:.7,metalness:.3,roughness:.2})
);
water.position.y=-1.5;
scene.add(water);

// ================================================================
//  场景物体
// ================================================================
const sceneObjects=[],interactables=[];

function makeTree(x,z){
  const h=terrainHeight(x,z);
  if(h<0||h>8) return;
  const g=new THREE.Group();
  const trunkH=rand(2,4);
  texBark.repeat.set(1,2);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,trunkH,8),
    new THREE.MeshLambertMaterial({map:texBark}));
  trunk.position.y=trunkH/2;trunk.castShadow=true;g.add(trunk);
  texLeaf.repeat.set(2,2);
  const leafMat=new THREE.MeshLambertMaterial({map:texLeaf});
  for(let i=0;i<3;i++){
    const leaf=new THREE.Mesh(new THREE.ConeGeometry(rand(1,1.8)-i*0.3,rand(1.5,2.5),8),leafMat);
    leaf.position.y=trunkH+i*1.1;leaf.castShadow=true;g.add(leaf);
  }
  g.position.set(x,h,z);
  g.userData={type:"tree",radius:0.5};
  scene.add(g);sceneObjects.push(g);
}
function makeRock(x,z){
  const h=terrainHeight(x,z);
  const g=new THREE.Group();
  const s=rand(0.5,2);
  texRock.repeat.set(1,1);
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),
    new THREE.MeshLambertMaterial({map:texRock}));
  rock.position.y=s*0.5;rock.rotation.set(rand(0,3),rand(0,3),rand(0,3));
  rock.castShadow=true;rock.receiveShadow=true;g.add(rock);
  g.position.set(x,h,z);
  g.userData={type:"rock",radius:s*0.7};
  scene.add(g);sceneObjects.push(g);
}
for(let i=0;i<120;i++){const x=rand(-90,90),z=rand(-90,90);if(Math.hypot(x,z)>8)makeTree(x,z);}
for(let i=0;i<50;i++){const x=rand(-90,90),z=rand(-90,90);if(Math.hypot(x,z)>10)makeRock(x,z);}

function makeChest(x,z){
  const h=terrainHeight(x,z);
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1,0.7,0.6),
    new THREE.MeshStandardMaterial({color:0x8b6914,metalness:.3,roughness:.6}));
  body.position.y=0.35;body.castShadow=true;g.add(body);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(1.05,0.3,0.65),
    new THREE.MeshStandardMaterial({color:0xa07828,metalness:.3,roughness:.6}));
  lid.position.y=0.85;lid.castShadow=true;g.add(lid);
  const lock=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.15,0.05),
    new THREE.MeshStandardMaterial({color:0xffd700,metalness:.8}));
  lock.position.set(0,0.7,0.33);g.add(lock);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,4,8,1,true),
    new THREE.MeshBasicMaterial({color:0xffd700,transparent:true,opacity:.15,side:THREE.DoubleSide}));
  beam.position.y=2.5;g.add(beam);
  g.position.set(x,h,z);
  g.userData={type:"chest",opened:false,radius:1.5,name:"宝箱",lid:lid,beam:beam};
  scene.add(g);interactables.push(g);sceneObjects.push(g);
}
[[15,10],[-20,15],[25,-20],[-15,-25],[30,25],[-30,-10],[0,35],[-35,20]].forEach(p=>makeChest(p[0],p[1]));

function makeTeleporter(x,z){
  const h=terrainHeight(x,z);
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.5,0.3,8),
    new THREE.MeshStandardMaterial({color:0x445566,metalness:.7,roughness:.3}));
  base.position.y=0.15;base.castShadow=true;g.add(base);
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,3,8),
    new THREE.MeshStandardMaterial({color:0x6688aa,metalness:.6,roughness:.3}));
  pillar.position.y=1.7;g.add(pillar);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(0.5,0),
    new THREE.MeshStandardMaterial({color:0x66ccff,emissive:0x3388cc,emissiveIntensity:.6,metalness:.3,roughness:.2}));
  crystal.position.y=3.5;g.add(crystal);
  g.position.set(x,h,z);
  g.userData={type:"teleporter",unlocked:false,radius:2.5,name:"传送锚点",crystal:crystal};
  scene.add(g);interactables.push(g);
}
[[0,0],[40,0],[-40,0],[0,40],[0,-40]].forEach(p=>makeTeleporter(p[0],p[1]));

function makeStatue(x,z){
  const h=terrainHeight(x,z);
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2,2.5,0.5,8),
    new THREE.MeshStandardMaterial({color:0xdddddd,metalness:.2,roughness:.6}));
  base.position.y=0.25;base.castShadow=true;g.add(base);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.8,2.5,8),
    new THREE.MeshStandardMaterial({color:0xeeeeee,metalness:.1,roughness:.7}));
  body.position.y=1.75;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.4,8,8),
    new THREE.MeshStandardMaterial({color:0xffffff,metalness:.1,roughness:.6}));
  head.position.y=3.3;g.add(head);
  const orb=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8),
    new THREE.MeshStandardMaterial({color:0x66ffaa,emissive:0x33cc66,emissiveIntensity:.8}));
  orb.position.set(0,2.5,0.7);g.add(orb);
  g.position.set(x,h,z);
  g.userData={type:"statue",radius:3,name:"七天神像",orb:orb};
  scene.add(g);interactables.push(g);
}
makeStatue(-20,-20);

function makeQuestMarker(x,z,color=0xffd700){
  const h=terrainHeight(x,z);
  const g=new THREE.Group();
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.8,8,8,1,true),
    new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.2,side:THREE.DoubleSide}));
  beam.position.y=4;g.add(beam);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1,0.1,8,16),
    new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.5}));
  ring.rotation.x=Math.PI/2;ring.position.y=0.1;g.add(ring);
  g.position.set(x,h,z);
  g.userData={type:"questMarker",ring:ring,beam:beam};
  scene.add(g);
  return g;
}

// ================================================================
//  玩家
// ================================================================
function buildPlayer(){
  const g=new THREE.Group();
  const skinMat=new THREE.MeshLambertMaterial({color:0xf0c8a0});
  const clothMat=new THREE.MeshLambertMaterial({color:0x4466aa});
  const darkMat=new THREE.MeshLambertMaterial({color:0x333344});
  const hairMat=new THREE.MeshLambertMaterial({color:0x553322});
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.7,0.3),clothMat);
  body.position.y=1.1;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),skinMat);
  head.position.y=1.65;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(0.24,8,8,0,Math.PI*2,0,Math.PI*0.6),hairMat);
  hair.position.y=1.7;g.add(hair);
  const armL=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.55,0.12),skinMat);
  armL.position.set(-0.32,1.15,0);g.add(armL);
  const armR=armL.clone();armR.position.x=0.32;g.add(armR);
  const legL=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.6,0.14),darkMat);
  legL.position.set(-0.13,0.5,0);g.add(legL);
  const legR=legL.clone();legR.position.x=0.13;g.add(legR);
  const sword=new THREE.Group();
  const blade=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.8,0.02),
    new THREE.MeshStandardMaterial({color:0xccccff,metalness:.8,roughness:.2}));
  blade.position.y=0.4;sword.add(blade);
  const guard=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.04,0.06),
    new THREE.MeshStandardMaterial({color:0xffd700,metalness:.8}));
  sword.add(guard);
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.15,6),darkMat);
  handle.position.y=-0.08;sword.add(handle);
  sword.position.set(0.35,1.0,0.1);sword.rotation.z=-0.3;
  g.add(sword);
  g.userData={armL,armR,legL,legR,sword,body,head};
  return g;
}
const playerMesh=buildPlayer();
playerMesh.position.set(0,terrainHeight(0,0),0);
scene.add(playerMesh);

const player={
  pos:playerMesh.position,vel:new THREE.Vector3(),onGround:false,
  hp:100,maxHp:100,stamina:100,maxStamina:100,energy:0,maxEnergy:100,
  level:1,exp:0,expToNext:100,atk:15,radius:0.4,yaw:0,
  attackCd:0,comboStep:0,comboTimer:0,skillCd:0,burstCd:0,invincible:0,sprinting:false,
};

// ================================================================
//  第三人称相机
// ================================================================
const camState={yaw:0,pitch:0.35,dist:7,targetDist:7};
function updateCamera(dt){
  const ox=Math.sin(camState.yaw)*Math.cos(camState.pitch)*camState.dist;
  const oy=Math.sin(camState.pitch)*camState.dist+1.5;
  const oz=Math.cos(camState.yaw)*Math.cos(camState.pitch)*camState.dist;
  const targetPos=new THREE.Vector3(player.pos.x+ox,player.pos.y+oy,player.pos.z+oz);
  camera.position.lerp(targetPos,0.15);
  camera.lookAt(player.pos.x,player.pos.y+1.3,player.pos.z);
  camState.dist=lerp(camState.dist,camState.targetDist,dt*5);
}

// ================================================================
//  敌人
// ================================================================
const enemies=[];
const ENEMY_TYPES={
  slime:{hp:40,atk:8,speed:2,exp:15,radius:0.6,color:0x66ff66,name:"史莱姆"},
  hilichurl:{hp:80,atk:12,speed:3,exp:30,radius:0.5,color:0x886644,name:"丘丘人"},
  guard:{hp:300,atk:25,speed:1.8,exp:100,radius:1.0,color:0x777788,name:"遗迹守卫"},
};
class Enemy{
  constructor(type,x,z){
    const base=ENEMY_TYPES[type];
    this.type=type;this.hp=base.hp;this.maxHp=base.hp;
    this.atk=base.atk;this.speed=base.speed;this.exp=base.exp;this.radius=base.radius;
    this.dead=false;this.hitFlash=0;this.attackCd=rand(1,2);this.state="idle";
    this.walkPhase=Math.random()*Math.PI*2;
    const h=terrainHeight(x,z);
    this.group=new THREE.Group();
    if(type==="slime"){
      const body=new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8),
        new THREE.MeshLambertMaterial({color:base.color,transparent:true,opacity:.8}));
      body.position.y=0.5;body.castShadow=true;this.group.add(body);
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6),new THREE.MeshBasicMaterial({color:0x000}));
      eye.position.set(0,0.6,0.5);this.group.add(eye);
      this.body=body;
    } else if(type==="hilichurl"){
      const body=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.6,0.28),new THREE.MeshLambertMaterial({color:base.color}));
      body.position.y=0.9;body.castShadow=true;this.group.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8),new THREE.MeshLambertMaterial({color:0xaa8866}));
      head.position.y=1.4;this.group.add(head);
      const mask=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.05),new THREE.MeshLambertMaterial({color:0x222}));
      mask.position.set(0,1.4,0.18);this.group.add(mask);
      const armL=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.45,0.1),new THREE.MeshLambertMaterial({color:0xaa8866}));
      armL.position.set(-0.28,0.95,0);this.group.add(armL);
      const armR=armL.clone();armR.position.x=0.28;this.group.add(armR);
      const legL=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.5,0.12),new THREE.MeshLambertMaterial({color:0x554433}));
      legL.position.set(-0.12,0.4,0);this.group.add(legL);
      const legR=legL.clone();legR.position.x=0.12;this.group.add(legR);
      this.parts={armL,armR,legL,legR};
    } else {
      const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.5,0.8),
        new THREE.MeshStandardMaterial({color:base.color,metalness:.6,roughness:.4}));
      body.position.y=1.5;body.castShadow=true;this.group.add(body);
      const head=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,0.5),
        new THREE.MeshStandardMaterial({color:0x9999aa,metalness:.7,roughness:.3}));
      head.position.y=2.5;this.group.add(head);
      const eye=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.1,0.05),new THREE.MeshBasicMaterial({color:0xff3333}));
      eye.position.set(0,2.55,0.26);this.group.add(eye);
      const armL=new THREE.Mesh(new THREE.BoxGeometry(0.3,1.2,0.3),
        new THREE.MeshStandardMaterial({color:base.color,metalness:.6,roughness:.4}));
      armL.position.set(-0.8,1.5,0);this.group.add(armL);
      const armR=armL.clone();armR.position.x=0.8;this.group.add(armR);
      const legL=new THREE.Mesh(new THREE.BoxGeometry(0.35,1.0,0.35),
        new THREE.MeshStandardMaterial({color:base.color,metalness:.6,roughness:.4}));
      legL.position.set(-0.35,0.5,0);this.group.add(legL);
      const legR=legL.clone();legR.position.x=0.35;this.group.add(legR);
      this.parts={armL,armR,legL,legR};
    }
    this.hpBg=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.1),
      new THREE.MeshBasicMaterial({color:0x222,transparent:true,opacity:.7,depthTest:false}));
    this.hpBg.position.y=type==="guard"?3.2:2.2;this.hpBg.renderOrder=999;this.group.add(this.hpBg);
    this.hpFill=new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.07),
      new THREE.MeshBasicMaterial({color:0x33dd33,depthTest:false}));
    this.hpFill.position.y=type==="guard"?3.2:2.2;this.hpFill.position.z=0.001;
    this.hpFill.renderOrder=1000;this.group.add(this.hpFill);
    this.group.position.set(x,h);
    scene.add(this.group);
  }
  update(dt){
    if(this.dead) return;
    const toPlayer=new THREE.Vector3(player.pos.x-this.group.position.x,0,player.pos.z-this.group.position.z);
    const dist=toPlayer.length();toPlayer.normalize();
    this.group.rotation.y=Math.atan2(toPlayer.x,toPlayer.z);
    const detectRange=this.type==="guard"?20:15;
    if(dist<detectRange){
      this.state="chase";
      if(dist>this.radius+player.radius+0.3){
        const nx=this.group.position.x+toPlayer.x*this.speed*dt;
        const nz=this.group.position.z+toPlayer.z*this.speed*dt;
        if(!this.collidesAt(nx,this.group.position.z)) this.group.position.x=nx;
        if(!this.collidesAt(this.group.position.x,nz)) this.group.position.z=nz;
        this.group.position.y=terrainHeight(this.group.position.x,this.group.position.z);
        this.walkPhase+=dt*8;
      } else {
        this.attackCd-=dt;
        if(this.attackCd<=0){this.attackCd=this.type==="guard"?1.8:1.2;this.attack();}
      }
    } else {this.state="idle";this.walkPhase+=dt*2;}
    if(this.type==="slime"){
      this.body.scale.y=1+Math.sin(this.walkPhase)*0.15;
      this.body.scale.x=1-Math.sin(this.walkPhase)*0.08;
    } else if(this.parts){
      const swing=this.state==="chase"?Math.sin(this.walkPhase)*0.5:0;
      this.parts.legL.rotation.x=swing;
      this.parts.legR.rotation.x=-swing;
      this.parts.armL.rotation.x=-swing*0.5;
      this.parts.armR.rotation.x=swing*0.5;
    }
    if(this.hitFlash>0){
      this.hitFlash-=dt*4;
      this.group.traverse(c=>{
        if(c.material&&c.material.emissive!==undefined){
          c.material.emissive=new THREE.Color(0xff0000);
          c.material.emissiveIntensity=Math.max(0,this.hitFlash)*0.6;
        }
      });
    }
    this.hpBg.lookAt(camera.position);
    this.hpFill.lookAt(camera.position);
    const ratio=Math.max(0,this.hp/this.maxHp);
    this.hpFill.scale.x=ratio;
    this.hpFill.position.x=-(1.1*(1-ratio))/2;
    this.hpFill.material.color.setHex(ratio>0.5?0x33dd33:ratio>0.25?0xffaa00:0xdd3333);
  }
  attack(){
    if(this.type==="guard"){
      const from=this.group.position.clone();from.y=2.5;
      const to=new THREE.Vector3(player.pos.x,player.pos.y+1,player.pos.z);
      spawnEnemyProjectile(from,to,this.atk);
    } else {
      const dx=player.pos.x-this.group.position.x,dz=player.pos.z-this.group.position.z;
      if(Math.hypot(dx,dz)<this.radius+player.radius+1) damagePlayer(this.atk);
    }
  }
  collidesAt(x,z){
    for(const obj of sceneObjects){
      if(obj.userData.type==="tree"||obj.userData.type==="rock"||obj.userData.type==="chest"){
        const dx=x-obj.position.x,dz=z-obj.position.z;
        const r=(obj.userData.radius||0.5)+this.radius;
        if(dx*dx+dz*dz<r*r) return true;
      }
    }
    return false;
  }
  takeDamage(dmg){
    this.hp-=dmg;this.hitFlash=1;
    showDmgNum(this.group.position,dmg,false);
    spawnHitParticles(this.group.position.clone().add(new THREE.Vector3(0,1,0)));
    if(this.hp<=0) this.die();
  }
  die(){
    this.dead=true;
    this.group.rotation.z=Math.PI/2;
    this.group.position.y+=0.3;
    this.hpBg.visible=false;this.hpFill.visible=false;
    player.exp+=this.exp;
    player.energy=Math.min(player.maxEnergy,player.energy+25);
    onEnemyKilled(this.type);
    checkLevelUp();updateUI();
    setTimeout(()=>{scene.remove(this.group);},2000);
  }
}

const enemyProjectiles=[];
function spawnEnemyProjectile(from,to,dmg){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.15,6,6),new THREE.MeshBasicMaterial({color:0xff4400}));
  m.position.copy(from);
  const dir=to.clone().sub(from).normalize();
  enemyProjectiles.push({mesh:m,vel:dir.multiplyScalar(15),dmg,life:4});
  scene.add(m);
}
function updateEnemyProjectiles(dt){
  for(let i=enemyProjectiles.length-1;i>=0;i--){
    const p=enemyProjectiles[i];
    p.mesh.position.addScaledVector(p.vel,dt);
    p.life-=dt;
    const dx=p.mesh.position.x-player.pos.x;
    const dy=p.mesh.position.y-(player.pos.y+1);
    const dz=p.mesh.position.z-player.pos.z;
    if(dx*dx+dy*dy+dz*dz<0.8){damagePlayer(p.dmg);scene.remove(p.mesh);enemyProjectiles.splice(i,1);continue;}
    if(p.life<=0||p.mesh.position.y<terrainHeight(p.mesh.position.x,p.mesh.position.z)){
      scene.remove(p.mesh);enemyProjectiles.splice(i,1);
    }
  }
}

[[10,5],[-8,12],[15,-10]].forEach(s=>enemies.push(new Enemy("slime",s[0],s[1])));
[[20,8],[-18,-15],[25,-20],[-25,18]].forEach(s=>enemies.push(new Enemy("hilichurl",s[0],s[1])));
[[-12,-8]].forEach(s=>enemies.push(new Enemy("slime",s[0],s[1])));
[[35,-30],[-35,30]].forEach(s=>enemies.push(new Enemy("guard",s[0],s[1])));

// ================================================================
//  怪物刷新系统
// ================================================================
const MAX_ENEMIES=14;
let spawnTimer=5;
function trySpawnEnemy(){
  const alive=enemies.filter(e=>!e.dead).length;
  if(alive>=MAX_ENEMIES) return;
  // 在玩家周围 35~60 米外随机位置刷新
  const angle=rand(0,Math.PI*2);
  const dist=rand(35,60);
  const x=clamp(player.pos.x+Math.cos(angle)*dist,-90,90);
  const z=clamp(player.pos.z+Math.sin(angle)*dist,-90,90);
  const h=terrainHeight(x,z);
  if(h<0) return; // 不在水里刷新
  // 随机类型：史莱姆50% / 丘丘人35% / 遗迹守卫15%
  const r=Math.random();
  const type=r<0.5?"slime":r<0.85?"hilichurl":"guard";
  enemies.push(new Enemy(type,x,z));
}

// ================================================================
//  粒子
// ================================================================
const particles=[];
function spawnHitParticles(pos){
  for(let i=0;i<6;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.06,4,4),
      new THREE.MeshBasicMaterial({color:Math.random()<0.5?0xffaa00:0xff6600}));
    m.position.copy(pos);
    particles.push({mesh:m,vel:new THREE.Vector3(rand(-2,2),rand(1,4),rand(-2,2)),life:rand(.3,.6)});
    scene.add(m);
  }
}
function spawnSkillParticles(pos){
  for(let i=0;i<20;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),
      new THREE.MeshBasicMaterial({color:Math.random()<0.5?0xff6600:0xffcc00,transparent:true}));
    m.position.copy(pos);
    const a=rand(0,Math.PI*2);
    particles.push({mesh:m,vel:new THREE.Vector3(Math.cos(a)*rand(2,6),rand(1,5),Math.sin(a)*rand(2,6)),life:rand(.5,1)});
    scene.add(m);
  }
}
function spawnBurstParticles(pos){
  for(let i=0;i<40;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(rand(0.1,0.25),6,6),
      new THREE.MeshBasicMaterial({color:[0xff4400,0xffaa00,0xffee66,0xff8800][Math.floor(Math.random()*4)],transparent:true}));
    m.position.copy(pos);
    const a=rand(0,Math.PI*2),el=rand(-0.3,0.8),r=rand(3,10);
    particles.push({mesh:m,vel:new THREE.Vector3(Math.cos(a)*Math.sqrt(1-el*el)*r,el*r,Math.sin(a)*Math.sqrt(1-el*el)*r),life:rand(.8,1.5)});
    scene.add(m);
  }
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.vel.y-=10*dt;
    p.mesh.position.addScaledVector(p.vel,dt);
    p.life-=dt;
    p.mesh.material.opacity=Math.max(0,p.life);
    if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}
  }
}
function showDmgNum(worldPos,dmg,crit){
  const v=worldPos.clone().project(camera);
  const x=(v.x*0.5+0.5)*innerWidth,y=(-v.y*0.5+0.5)*innerHeight;
  const el=document.createElement("div");
  el.className="dmg-float";el.textContent=Math.floor(dmg);
  el.style.left=x+"px";el.style.top=y+"px";
  el.style.color=crit?"#ffcc00":"#ff6666";
  if(crit) el.style.fontSize="30px";
  document.getElementById("damageFloatWrap").appendChild(el);
  setTimeout(()=>el.remove(),1000);
}

// ================================================================
//  音效
// ================================================================
let actx=null;
function initAudio(){
  if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state==="suspended") actx.resume();
}
function sfxSwing(){
  if(!actx)return;
  const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();
  o.type="sawtooth";o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(200,t+.1);
  g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);
  o.connect(g).connect(actx.destination);o.start(t);o.stop(t+.12);
}
function sfxHit(){
  if(!actx)return;
  const t=actx.currentTime,n=actx.createBufferSource();
  const len=Math.floor(actx.sampleRate*.08);
  const buf=actx.createBuffer(1,len,actx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);
  n.buffer=buf;
  const ng=actx.createGain();ng.gain.value=.15;
  const f=actx.createBiquadFilter();f.type="lowpass";f.frequency.value=1500;
  n.connect(f).connect(ng).connect(actx.destination);n.start(t);
}
function sfxSkill(){
  if(!actx)return;
  const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();
  o.type="square";o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(800,t+.15);
  g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);
  o.connect(g).connect(actx.destination);o.start(t);o.stop(t+.2);
}
function sfxBurst(){
  if(!actx)return;
  const t=actx.currentTime;
  [0,.1,.2].forEach((delay,i)=>{
    const o=actx.createOscillator(),g=actx.createGain();
    o.type="sawtooth";o.frequency.setValueAtTime(100+i*50,t+delay);
    o.frequency.exponentialRampToValueAtTime(40,t+delay+.3);
    g.gain.setValueAtTime(.15,t+delay);g.gain.exponentialRampToValueAtTime(.001,t+delay+.35);
    o.connect(g).connect(actx.destination);o.start(t+delay);o.stop(t+delay+.35);
  });
}
function sfxHurt(){
  if(!actx)return;
  const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();
  o.type="sine";o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(80,t+.15);
  g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);
  o.connect(g).connect(actx.destination);o.start(t);o.stop(t+.18);
}
function sfxLevelUp(){
  if(!actx)return;
  const t=actx.currentTime;
  [523,659,784,1047].forEach((f,i)=>{
    const o=actx.createOscillator(),g=actx.createGain();
    o.type="sine";o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*.1);g.gain.linearRampToValueAtTime(.12,t+i+.02);
    g.gain.exponentialRampToValueAtTime(.001,t+i+.25);
    o.connect(g).connect(actx.destination);o.start(t+i*.1);o.stop(t+i*.1+.25);
  });
}
function sfxChest(){
  if(!actx)return;
  const t=actx.currentTime;
  [659,784,988,1319].forEach((f,i)=>{
    const o=actx.createOscillator(),g=actx.createGain();
    o.type="triangle";o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*.08);g.gain.linearRampToValueAtTime(.1,t+i*.08+.02);
    g.gain.exponentialRampToValueAtTime(.001,t+i*.08+.3);
    o.connect(g).connect(actx.destination);o.start(t+i*.08);o.stop(t+i*.08+.3);
  });
}

// ================================================================
//  战斗
// ================================================================
function playerAttack(){
  if(player.attackCd>0) return;
  player.comboStep=(player.comboStep+1)%3;
  player.comboTimer=0.8;player.attackCd=0.35;
  sfxSwing();
  const parts=playerMesh.userData;
  const swingAngle=player.comboStep===0?-1.2:player.comboStep===1?1.2:-1.5;
  parts.armR.rotation.x=swingAngle;
  parts.sword.rotation.x=swingAngle*0.8;
  setTimeout(()=>{parts.armR.rotation.x=0;parts.sword.rotation.x=0;},200);
  const fwd=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  const dmg=player.atk*(player.comboStep===2?1.5:1);
  for(const e of enemies){
    if(e.dead) continue;
    const toE=new THREE.Vector3(e.group.position.x-player.pos.x,0,e.group.position.z-player.pos.z);
    const dist=toE.length();toE.normalize();
    if(dist<3&&fwd.dot(toE)>0.3){e.takeDamage(dmg);sfxHit();}
  }
}
function playerSkill(){
  if(player.skillCd>0) return;
  player.skillCd=6;sfxSkill();
  const dmg=player.atk*2.5;
  const skillPos=player.pos.clone().add(new THREE.Vector3(-Math.sin(player.yaw)*2,0.5,-Math.cos(player.yaw)*2));
  spawnSkillParticles(skillPos);
  for(const e of enemies){
    if(e.dead) continue;
    const dist=e.group.position.distanceTo(skillPos);
    if(dist<5){e.takeDamage(dmg*(1-dist/5));sfxHit();}
  }
}
function playerBurst(){
  if(player.burstCd>0) return;
  if(player.energy<player.maxEnergy){showToast("元素能量不足（击杀敌人积攒）");return;}
  player.burstCd=12;player.energy=0;sfxBurst();
  const dmg=player.atk*5;
  spawnBurstParticles(player.pos.clone().add(new THREE.Vector3(0,1,0)));
  for(const e of enemies){
    if(e.dead) continue;
    const dist=e.group.position.distanceTo(player.pos);
    if(dist<10) e.takeDamage(dmg*(1-dist/12));
  }
  updateUI();
}
function damagePlayer(dmg){
  if(player.invincible>0) return;
  player.hp-=dmg;player.invincible=0.5;sfxHurt();updateUI();
  if(player.hp<=0){player.hp=0;gameOver();}
}
function checkLevelUp(){
  while(player.exp>=player.expToNext){
    player.exp-=player.expToNext;player.level++;
    player.expToNext=Math.floor(player.expToNext*1.3);
    player.maxHp+=20;player.hp=player.maxHp;player.atk+=3;
    sfxLevelUp();showToast("升级！Lv."+player.level+"  攻击+3  生命+20");
  }
}

// ================================================================
//  任务
// ================================================================
const quests=[
  {id:0,name:"序章 · 苏醒",desc:"跟随小星的指引，前往前方的光点",target:new THREE.Vector3(8,0,5),radius:4,done:false},
  {id:1,name:"第一章 · 低语森林",desc:"击败森林中的3只史莱姆",killType:"slime",killNeed:3,killCount:0,done:false},
  {id:2,name:"第二章 · 风啸高地",desc:"解锁附近的传送锚点（靠近金色光柱按F）",unlockTeleporter:true,done:false},
  {id:3,name:"第三章 · 深渊来袭",desc:"击败被污染的丘丘人营地（消灭5只丘丘人）",killType:"hilichurl",killNeed:5,killCount:0,done:false},
  {id:4,name:"终章 · 天空之岛",desc:"击败遗迹守卫，封印深渊裂痕",killType:"guard",killNeed:2,killCount:0,done:false},
];
let currentQuest=0,questMarker=null;
function updateQuest(){
  const q=quests[currentQuest];
  if(!q) return;
  document.getElementById("questText").textContent=q.killType?q.desc+"（"+q.killCount+"/"+q.killNeed+"）":q.desc;
  if(q.target&&!questMarker) questMarker=makeQuestMarker(q.target.x,q.target.z);
  if(q.target){
    const dist=Math.hypot(player.pos.x-q.target.x,player.pos.z-q.target.z);
    if(dist<q.radius&&!q.done) completeQuest();
  }
  if(q.killType&&q.killCount>=q.killNeed&&!q.done) completeQuest();
  if(q.unlockTeleporter){
    const unlocked=interactables.filter(i=>i.userData.type==="teleporter"&&i.userData.unlocked).length;
    if(unlocked>0&&!q.done) completeQuest();
  }
}
function completeQuest(){
  const q=quests[currentQuest];q.done=true;
  if(questMarker){scene.remove(questMarker);questMarker=null;}
  showToast("任务完成："+q.name+"  奖励：经验+50");
  player.exp+=50;checkLevelUp();
  currentQuest++;
  if(currentQuest>=quests.length){setTimeout(gameVictory,1500);}
  else setTimeout(()=>{showToast("新任务："+quests[currentQuest].name);
    if(quests[currentQuest].target) questMarker=makeQuestMarker(quests[currentQuest].target.x,quests[currentQuest].target.z);
  },1000);
  updateQuest();
}
function onEnemyKilled(type){
  const q=quests[currentQuest];
  if(q&&q.killType===type&&!q.done){q.killCount++;updateQuest();}
}

// ================================================================
//  交互
// ================================================================
let nearestInteractable=null;
function updateInteract(){
  nearestInteractable=null;let minDist=3;
  for(const obj of interactables){
    const dist=Math.hypot(player.pos.x-obj.position.x,player.pos.z-obj.position.z);
    if(dist<minDist){minDist=dist;nearestInteractable=obj;}
  }
  const hint=document.getElementById("tipBox");
  if(nearestInteractable){
    hint.classList.add("show");
    const t=nearestInteractable.userData.type;
    if(t==="chest"&&nearestInteractable.userData.opened) hint.textContent="宝箱已开启";
    else if(t==="teleporter"&&nearestInteractable.userData.unlocked) hint.textContent="按 F 传送";
    else hint.textContent="按 F "+nearestInteractable.userData.name;
  } else hint.classList.remove("show");
}
function doInteract(){
  if(!nearestInteractable) return;
  const obj=nearestInteractable,t=obj.userData.type;
  if(t==="chest"){
    if(obj.userData.opened) return;
    obj.userData.opened=true;
    obj.userData.lid.rotation.x=-1.2;
    obj.userData.beam.visible=false;
    sfxChest();
    const reward=Math.floor(rand(30,80));
    player.exp+=reward;checkLevelUp();
    showToast("开启宝箱！获得经验+"+reward);
  } else if(t==="teleporter"){
    if(!obj.userData.unlocked){
      obj.userData.unlocked=true;
      obj.userData.crystal.material.emissiveIntensity=1.2;
      sfxChest();showToast("解锁传送锚点！");updateQuest();
    } else {
      const others=interactables.filter(i=>i.userData.type==="teleporter"&&i.userData.unlocked&&i!==obj);
      if(others.length>0){
        const target=others[0];
        player.pos.set(target.position.x,terrainHeight(target.position.x,target.position.z)+0.5,target.position.z);
        player.vel.set(0,0,0);showToast("传送完成");
      } else showToast("没有其他已解锁的锚点");
    }
  } else if(t==="statue"){
    player.hp=player.maxHp;player.stamina=player.maxStamina;sfxChest();
    showToast("七天神像：生命与体力已完全恢复");updateUI();
  }
}

// ================================================================
//  UI
// ================================================================
function updateUI(){
  document.getElementById("hpFill").style.width=(player.hp/player.maxHp*100)+"%";
  document.getElementById("staminaFill").style.width=(player.stamina/player.maxStamina*100)+"%";
  document.getElementById("energyFill").style.width=(player.energy/player.maxEnergy*100)+"%";
  const eCd=document.getElementById("eCd");
  eCd.style.display=player.skillCd>0?"flex":"none";
  eCd.textContent=Math.ceil(player.skillCd);
  const qCd=document.getElementById("qCd");
  qCd.style.display=player.burstCd>0?"flex":"none";
  qCd.textContent=Math.ceil(player.burstCd);
}
function showToast(text){
  const el=document.createElement("div");
  el.textContent=text;
  el.style.cssText="position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);padding:10px 24px;border-radius:24px;font-size:14px;color:#ffd700;border:1px solid rgba(255,215,0,.4);z-index:70;pointer-events:none;";
  document.body.appendChild(el);
  setTimeout(()=>{el.style.opacity="0";el.style.transition="opacity .5s";setTimeout(()=>el.remove(),500);},2500);
}

// 小地图
const mmCanvas=document.getElementById("minimap");
const mmCtx=mmCanvas.getContext("2d");
function resizeMinimap(){
  const dpr=Math.min(devicePixelRatio,2);
  mmCanvas.width=mmCanvas.offsetWidth*dpr;
  mmCanvas.height=mmCanvas.offsetHeight*dpr;
  mmCtx.setTransform(dpr,0,0,dpr,0,0);
}
resizeMinimap();
window.addEventListener("resize",resizeMinimap);
function drawMinimap(){
  const w=mmCanvas.offsetWidth,h=mmCanvas.offsetHeight,cx=w/2,cy=h/2,scale=0.6;
  mmCtx.clearRect(0,0,w,h);
  mmCtx.fillStyle="rgba(20,40,30,.8)";
  mmCtx.beginPath();mmCtx.arc(cx,cy,cx-2,0,Math.PI*2);mmCtx.fill();
  mmCtx.save();
  mmCtx.beginPath();mmCtx.arc(cx,cy,cx-4,0,Math.PI*2);mmCtx.clip();
  for(let gx=-50;gx<=50;gx+=8){
    for(let gz=-50;gz<=50;gz+=8){
      const wx=player.pos.x+gx,wz=player.pos.z+gz;
      const hgt=terrainHeight(wx,wz);
      const sx=cx+(wx-player.pos.x)*scale,sy=cy+(wz-player.pos.z)*scale;
      mmCtx.fillStyle=hgt<0?"#c2b280":hgt<3?"#4a7c3f":hgt<6?"#6b8e5a":"#888";
      mmCtx.fillRect(sx-2,sy-2,5,5);
    }
  }
  for(const e of enemies){
    if(e.dead) continue;
    const sx=cx+(e.group.position.x-player.pos.x)*scale,sy=cy+(e.group.position.z-player.pos.z)*scale;
    if(sx>4&&sx<w-4&&sy>4&&sy<h-4){
      mmCtx.fillStyle="#ff4444";mmCtx.beginPath();mmCtx.arc(sx,sy,3,0,Math.PI*2);mmCtx.fill();
    }
  }
  for(const obj of interactables){
    let color=null;
    if(obj.userData.type==="chest"&&!obj.userData.opened) color="#ffd700";
    else if(obj.userData.type==="teleporter") color=obj.userData.unlocked?"#66ccff":"#666";
    else if(obj.userData.type==="statue") color="#66ffaa";
    if(color){
      const sx=cx+(obj.position.x-player.pos.x)*scale,sy=cy+(obj.position.z-player.pos.z)*scale;
      if(sx>4&&sx<w-4&&sy>4&&sy<h-4){
        mmCtx.fillStyle=color;mmCtx.beginPath();mmCtx.arc(sx,sy,4,0,Math.PI*2);mmCtx.fill();
      }
    }
  }
  if(questMarker){
    const sx=cx+(questMarker.position.x-player.pos.x)*scale,sy=cy+(questMarker.position.z-player.pos.z)*scale;
    if(sx>4&&sx<w-4&&sy>4&&sy<h-4){
      mmCtx.strokeStyle="#ffd700";mmCtx.lineWidth=2;
      mmCtx.beginPath();mmCtx.arc(sx,sy,6,0,Math.PI*2);mmCtx.stroke();
    }
  }
  mmCtx.restore();
  mmCtx.save();mmCtx.translate(cx,cy);mmCtx.rotate(-player.yaw);
  mmCtx.fillStyle="#fff";
  mmCtx.beginPath();mmCtx.moveTo(0,-7);mmCtx.lineTo(5,6);mmCtx.lineTo(-5,6);mmCtx.closePath();mmCtx.fill();
  mmCtx.restore();
  mmCtx.strokeStyle="rgba(255,255,255,.3)";mmCtx.lineWidth=2;
  mmCtx.beginPath();mmCtx.arc(cx,cy,cx-2,0,Math.PI*2);mmCtx.stroke();
}

// ================================================================
//  对话
// ================================================================
const dialogQueue=[];
let dialogActive=false;
function showDialog(speaker,text){dialogQueue.push({speaker,text});if(!dialogActive)nextDialog();}
function nextDialog(){
  if(dialogQueue.length===0){dialogActive=false;return;}
  dialogActive=true;
  const d=dialogQueue.shift();
  showToast(d.speaker+"："+d.text);
  setTimeout(nextDialog,2500);
}
function startIntroDialog(){
  showDialog("小星","旅行者！你终于醒了！我是向导精灵小星。");
  showDialog("小星","星辉大陆正在被深渊侵蚀，天空中的裂痕越来越大了……");
  showDialog("小星","你一定是被召唤来的救世主！请跟我来，先去前面的光点看看。");
}

// ================================================================
//  输入（Pointer Lock + W/S修复）
// ================================================================
const keys={};
const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart" in window;
document.addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="KeyF") doInteract();
  if(e.code==="KeyE") playerSkill();
  if(e.code==="KeyQ") playerBurst();
  if(e.code==="Escape"){
    if(document.pointerLockElement===canvas) document.exitPointerLock();
    togglePause();
  }
});
document.addEventListener("keyup",e=>keys[e.code]=false);

// Pointer Lock：点击画面锁定鼠标，移动鼠标直接转视角
canvas.addEventListener("click",()=>{
  if(gameStarted&&!gamePaused&&!isMobile){
    canvas.requestPointerLock();
  }
});
document.addEventListener("mousemove",e=>{
  if(document.pointerLockElement===canvas&&!gamePaused){
    camState.yaw-=e.movementX*0.0025;
    camState.pitch=clamp(camState.pitch+e.movementY*0.002,0.1,1.2);
  }
});
document.addEventListener("mousedown",e=>{
  if(e.button===0&&document.pointerLockElement===canvas&&!gamePaused) playerAttack();
});
canvas.addEventListener("wheel",e=>{
  camState.targetDist=clamp(camState.targetDist+e.deltaY*0.01,4,15);
},{passive:true});
document.addEventListener("pointerlockchange",()=>{
  if(document.pointerLockElement!==canvas&&gameStarted&&!gamePaused&&!isMobile){
    togglePause();
  }
});

// 虚拟摇杆（手机）
const joyEl=document.getElementById("joystick"),joyKnob=document.getElementById("joyKnob");
let joy={active:false,id:null,dx:0,dy:0,cx:0,cy:0};
joyEl.addEventListener("touchstart",e=>{
  e.preventDefault();const t=e.changedTouches[0];
  joy.active=true;joy.id=t.identifier;
  const r=joyEl.getBoundingClientRect();
  joy.cx=r.left+r.width/2;joy.cy=r.top+r.height/2;
},{passive:false});
document.addEventListener("touchmove",e=>{
  for(const t of e.changedTouches){
    if(t.identifier===joy.id){
      let dx=t.clientX-joy.cx,dy=t.clientY-joy.cy;
      const d=Math.hypot(dx,dy),max=45;
      if(d>max){dx=dx/d*max;dy=dy/d*max;}
      joy.dx=dx/max;joy.dy=dy/max;
      joyKnob.style.transform=`translate(${dx}px,${dy}px)`;
    }
  }
},{passive:false});
document.addEventListener("touchend",e=>{
  for(const t of e.changedTouches){
    if(t.identifier===joy.id){joy.active=false;joy.dx=joy.dy=0;joyKnob.style.transform="translate(0,0)";}
  }
});
let look={active:false,id:null,lx:0,ly:0};
document.addEventListener("touchstart",e=>{
  for(const t of e.changedTouches){
    if(t.target.closest("#joystick")||t.target.closest(".m-btn")||t.target.closest(".overlay")) continue;
    if(t.clientX>innerWidth*0.35){look.active=true;look.id=t.identifier;look.lx=t.clientX;look.ly=t.clientY;}
  }
});
document.addEventListener("touchmove",e=>{
  for(const t of e.changedTouches){
    if(t.identifier===look.id){
      camState.yaw-=(t.clientX-look.lx)*0.006;
      camState.pitch=clamp(camState.pitch+(t.clientY-look.ly)*0.005,0.1,1.2);
      look.lx=t.clientX;look.ly=t.clientY;
    }
  }
},{passive:false});
document.addEventListener("touchend",e=>{
  for(const t of e.changedTouches) if(t.identifier===look.id) look.active=false;
});
document.getElementById("mJump").addEventListener("touchstart",e=>{e.preventDefault();if(player.onGround){player.vel.y=7;player.onGround=false;}},{passive:false});
document.getElementById("mSprint").addEventListener("touchstart",e=>{e.preventDefault();player.sprinting=true;},{passive:false});
document.getElementById("mSprint").addEventListener("touchend",e=>{e.preventDefault();player.sprinting=false;},{passive:false});
document.getElementById("mAtk").addEventListener("touchstart",e=>{e.preventDefault();playerAttack();},{passive:false});
document.getElementById("mSkillE").addEventListener("touchstart",e=>{e.preventDefault();playerSkill();},{passive:false});
document.getElementById("mSkillQ").addEventListener("touchstart",e=>{e.preventDefault();playerBurst();},{passive:false});
document.getElementById("mInteract").addEventListener("touchstart",e=>{e.preventDefault();doInteract();},{passive:false});

// ================================================================
//  游戏状态
// ================================================================
let gameStarted=false,gamePaused=false;
function togglePause(){
  if(!gameStarted) return;
  gamePaused=!gamePaused;
  document.getElementById("pauseMenu").classList.toggle("show",gamePaused);
}
document.getElementById("resumeBtn").addEventListener("click",()=>{
  togglePause();
  if(!isMobile) setTimeout(()=>canvas.requestPointerLock(),100);
});
document.getElementById("restartBtn").addEventListener("click",()=>location.reload());
function gameOver(){
  gamePaused=true;
  document.querySelector("#pauseMenu h2").textContent="你倒下了……";
  document.getElementById("pauseMenu").classList.add("show");
}
function gameVictory(){
  gamePaused=true;
  document.querySelector("#pauseMenu h2").textContent="🎉 冒险完成！";
  document.getElementById("pauseMenu").classList.add("show");
  showToast("恭喜！你封印了深渊裂痕，拯救了星辉大陆！");
}

// ================================================================
//  碰撞
// ================================================================
function collidesAt(x,z){
  for(const obj of sceneObjects){
    if(obj.userData.type==="tree"||obj.userData.type==="rock"||obj.userData.type==="chest"){
      const dx=x-obj.position.x,dz=z-obj.position.z;
      const r=(obj.userData.radius||0.5)+player.radius;
      if(dx*dx+dz*dz<r*r) return true;
    }
  }
  return false;
}

// ================================================================
//  主循环
// ================================================================
let lastTime=performance.now();
function loop(){
  requestAnimationFrame(loop);
  const now=performance.now();
  let dt=(now-lastTime)/1000;lastTime=now;
  if(dt>0.1)dt=0.1;
  if(gameStarted&&!gamePaused&&!dialogActive){
    // 关键修复：fwd = (-sin(yaw), 0, -cos(yaw))
    const fwd=new THREE.Vector3(-Math.sin(camState.yaw),0,-Math.cos(camState.yaw));
    const right=new THREE.Vector3(Math.cos(camState.yaw),0,-Math.sin(camState.yaw));
    const move=new THREE.Vector3();
    // W=前进, S=后退
    if(keys["KeyW"]||keys["ArrowUp"]) move.add(fwd);
    if(keys["KeyS"]||keys["ArrowDown"]) move.sub(fwd);
    if(keys["KeyD"]||keys["ArrowRight"]) move.add(right);
    if(keys["KeyA"]||keys["ArrowLeft"]) move.sub(right);
    if(joy.active){move.addScaledVector(fwd,-joy.dy);move.addScaledVector(right,joy.dx);}
    const wantSprint=(keys["ShiftLeft"]||keys["ShiftRight"]||player.sprinting)&&move.length()>0&&player.stamina>0;
    const speed=wantSprint?10:6;
    if(wantSprint) player.stamina=Math.max(0,player.stamina-25*dt);
    else player.stamina=Math.min(player.maxStamina,player.stamina+15*dt);
    if(move.length()>0){
      move.normalize().multiplyScalar(speed);
      player.yaw=Math.atan2(move.x,move.z);
      playerMesh.rotation.y=player.yaw;
    }
    player.vel.x=move.x;player.vel.z=move.z;
    player.vel.y-=20*dt;
    if(keys["Space"]&&player.onGround){player.vel.y=7;player.onGround=false;}
    const nx=player.pos.x+player.vel.x*dt;
    const nz=player.pos.z+player.vel.z*dt;
    if(!collidesAt(nx,player.pos.z)) player.pos.x=nx;
    if(!collidesAt(player.pos.x,nz)) player.pos.z=nz;
    player.pos.y+=player.vel.y*dt;
    const groundY=terrainHeight(player.pos.x,player.pos.z);
    if(player.pos.y<=groundY){player.pos.y=groundY;player.vel.y=0;player.onGround=true;}
    else player.onGround=false;
    player.pos.x=clamp(player.pos.x,-95,95);
    player.pos.z=clamp(player.pos.z,-95,95);
    const parts=playerMesh.userData;
    const walking=move.length()>0.5;
    if(walking){
      const walkPhase=performance.now()*0.01*(wantSprint?1.5:1);
      parts.legL.rotation.x=Math.sin(walkPhase)*0.6;
      parts.legR.rotation.x=-Math.sin(walkPhase)*0.6;
      if(player.attackCd<=0){
        parts.armL.rotation.x=-Math.sin(walkPhase)*0.4;
        parts.armR.rotation.x=Math.sin(walkPhase)*0.4;
      }
    } else {
      parts.legL.rotation.x=lerp(parts.legL.rotation.x,0,0.2);
      parts.legR.rotation.x=lerp(parts.legR.rotation.x,0,0.2);
    }
    if(player.attackCd>0) player.attackCd-=dt;
    if(player.comboTimer>0){player.comboTimer-=dt;if(player.comboTimer<=0)player.comboStep=0;}
    if(player.skillCd>0) player.skillCd-=dt;
    if(player.burstCd>0) player.burstCd-=dt;
    if(player.invincible>0) player.invincible-=dt;
    for(const e of enemies) e.update(dt);
    // 清理死亡超过3秒的敌人
    for(let i=enemies.length-1;i>=0;i--){
      if(enemies[i].dead&&enemies[i].group.rotation.z>=Math.PI/2){
        if(!enemies[i]._removeAt) enemies[i]._removeAt=performance.now()+3000;
        if(performance.now()>enemies[i]._removeAt){scene.remove(enemies[i].group);enemies.splice(i,1);}
      }
    }
    spawnTimer-=dt;
    if(spawnTimer<=0){spawnTimer=rand(4,7);trySpawnEnemy();}
    updateEnemyProjectiles(dt);
    updateParticles(dt);
    updateInteract();updateQuest();updateUI();drawMinimap();
    water.position.y=-1.5+Math.sin(performance.now()*0.001)*0.1;
  }
  if(gameStarted) updateCamera(dt);
  renderer.render(scene,camera);
}

// ================================================================
//  开始游戏
// ================================================================
document.getElementById("startBtn").addEventListener("click",()=>{
  initAudio();
  document.getElementById("startMenu").classList.remove("show");
  gameStarted=true;
  startIntroDialog();
  updateQuest();updateUI();
  if(!isMobile) setTimeout(()=>canvas.requestPointerLock(),300);
});

// 加载进度条 + 自动隐藏
(function(){
  let p=0;
  const fill=document.querySelector(".load-bar");
  const timer=setInterval(()=>{
    p+=rand(8,18);
    if(p>=100){p=100;clearInterval(timer);}
    fill.style.width=p+"%";
  },80);
  setTimeout(()=>{
    const loading=document.getElementById("loading");
    loading.style.opacity="0";
    loading.style.transition="opacity .5s";
    setTimeout(()=>{
      loading.style.display="none";
      document.getElementById("startMenu").classList.add("show");
    },500);
  },1200);
})();

window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
loop();
//（注：内容由AI生成）
