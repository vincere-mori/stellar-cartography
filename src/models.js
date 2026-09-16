import * as THREE from "three";

export function randomGenerator(seed = 42) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function particles(positions, colors, sizes, opacity = 1, soft = false) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uHeight: { value: 800 },
      uOpacity: { value: opacity },
      uSoft: { value: soft ? 1 : 0 },
    },
    vertexShader: `attribute float size;
      varying vec3 vColor; uniform float uHeight;
      void main(){ vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*uHeight/max(1.,-mv.z),1.,100.); }`,
    fragmentShader: `varying vec3 vColor; uniform float uOpacity; uniform float uSoft;
      void main(){float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard;
        float a=mix(exp(-d*d*7.)+.12*exp(-d*3.),exp(-d*d*5.)*.45,uSoft);
        a*=1.-smoothstep(.65,1.,d);gl_FragColor=vec4(vColor,a*uOpacity);}`,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

export function glow(color, size, opacity = 0.4) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,.65)");
  gradient.addColorStop(0.35, "rgba(255,255,255,.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sprite.scale.set(size, size, 1);
  return sprite;
}

export function makeGalaxy() {
  const group = new THREE.Group();
  const random = randomGenerator(1851);
  const positions = [],
    colors = [],
    sizes = [];
  const dustPositions = [],
    dustColors = [],
    dustSizes = [];
  const warm = new THREE.Color("#efd2a5"),
    cold = new THREE.Color("#8394ad"),
    white = new THREE.Color("#ccd4df");
  for (let i = 0; i < 67000; i++) {
    const bulge = i < 11000;
    const r = bulge
      ? Math.pow(random(), 1.4) * 9
      : 3 + Math.pow(random(), 0.75) * 30;
    const arm = i % 4;
    const scatter = random() + random() + random() - 1.5;
    const diffuse = !bulge && i % 4 === 0;
    const angle =
      bulge || diffuse
        ? random() * Math.PI * 2
        : (arm * Math.PI) / 2 +
          r * 0.16 +
          scatter * (0.21 + 3 / r) +
          Math.sin(r * 0.75 + arm) * 0.045;
    const x = Math.cos(angle) * r,
      z = Math.sin(angle) * r;
    const y =
      (random() + random() - 1) * (bulge ? 0.25 + r * 0.24 : 0.45 + r * 0.013);
    positions.push(x, y, z);
    const color = bulge
      ? warm.clone().lerp(white, random() * 0.5)
      : cold
          .clone()
          .lerp(white, random() * 0.75)
          .lerp(warm, Math.max(0, 1 - r / 18) * 0.4);
    color.multiplyScalar(
      bulge ? 0.42 + random() * 0.42 : 0.36 + random() * 0.7,
    );
    colors.push(color.r, color.g, color.b);
    sizes.push((bulge ? 0.055 : 0.065) + Math.pow(random(), 6) * 0.24);
    if (!bulge && !diffuse && i % 6 === 0) {
      dustPositions.push(x, y - 0.1, z);
      const c = new THREE.Color(i % 13 === 0 ? "#b2889e" : "#71859f");
      dustColors.push(c.r, c.g, c.b);
      dustSizes.push(0.9 + random() * 2.1);
    }
  }
  group.add(particles(dustPositions, dustColors, dustSizes, 0.13, true));
  group.add(particles(positions, colors, sizes, 0.84));
  const core = glow("#e8c497", 22, 0.32);
  core.position.y = 0.5;
  group.add(core);
  const coreSmall = glow("#fff0d2", 6, 0.35);
  coreSmall.position.y = 0.6;
  group.add(coreSmall);
  const grid = new THREE.Group();
  for (const radius of [12, 23, 35]) {
    const points = Array.from(
      { length: 193 },
      (_, i) =>
        new THREE.Vector3(
          Math.cos((i / 192) * Math.PI * 2) * radius,
          -1.5,
          Math.sin((i / 192) * Math.PI * 2) * radius,
        ),
    );
    grid.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: "#6486a4",
          transparent: true,
          opacity: 0.13,
        }),
      ),
    );
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const points = [
      new THREE.Vector3(Math.cos(a) * 34, -1.5, Math.sin(a) * 34),
      new THREE.Vector3(Math.cos(a) * 35.6, -1.5, Math.sin(a) * 35.6),
    ];
    grid.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: "#6486a4",
          transparent: true,
          opacity: 0.3,
        }),
      ),
    );
  }
  group.add(grid);
  return group;
}

export function makeBackground() {
  const random = randomGenerator(922);
  const positions = [],
    colors = [],
    sizes = [];
  for (let i = 0; i < 2600; i++) {
    const angle = random() * Math.PI * 2,
      y = random() * 2 - 1;
    const r = 180 + random() * 120,
      flat = Math.sqrt(1 - y * y);
    positions.push(
      Math.cos(angle) * flat * r,
      y * r,
      Math.sin(angle) * flat * r,
    );
    const c = new THREE.Color().setHSL(
      0.56 + random() * 0.12,
      0.08 + random() * 0.25,
      0.4 + random() * 0.45,
    );
    colors.push(c.r, c.g, c.b);
    sizes.push(0.13 + Math.pow(random(), 8) * 0.7);
  }
  return particles(positions, colors, sizes, 0.75);
}

const noiseGLSL = `
  float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=p*2.03+3.1;a*=.5;}return n;}
`;

function makeStar(red = false) {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRed: { value: red ? 1 : 0 } },
    vertexShader: `varying vec3 vPosition;varying vec3 vNormal;varying vec3 vView;
      void main(){vPosition=position;vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `${noiseGLSL}
      uniform float uTime;uniform float uRed;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vView;
      void main(){vec3 p=normalize(vPosition);float t=uTime*.022;
        float granules=fbm(p*29.+vec3(t,-t,t));float turbulence=fbm(p*7.+t*.3);
        float spots=smoothstep(.64,.79,fbm(p*5.+2.));
        float bright=clamp(granules*1.6+turbulence*.45-spots*.8,0.,1.);
        vec3 cool=mix(vec3(.74,.19,.025),vec3(.48,.065,.018),uRed);
        vec3 hot=mix(vec3(1.35,1.05,.55),vec3(1.15,.47,.18),uRed);
        vec3 col=mix(cool,hot,bright);float limb=pow(max(dot(normalize(vNormal),normalize(vView)),0.),.32);
        gl_FragColor=vec4(col*(.48+.6*limb),1.);}`,
  });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.45, 96, 64),
    material,
  );
  sphere.userData.spin = 0.014;
  group.add(sphere);
  const corona = glow(red ? "#da5434" : "#efac52", 12, 0.65);
  group.add(corona);
  const random = randomGenerator(55);
  for (let i = 0; i < 7; i++) {
    const a = random() * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 33 }, (_, j) => {
        const t = j / 32,
          angle = a + t * 0.2;
        const r = 2.43 + Math.sin(t * Math.PI) * (0.25 + i * 0.045);
        return new THREE.Vector3(
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          -0.3 + t * 0.6,
        );
      }),
    );
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.011, 4, false),
        new THREE.MeshBasicMaterial({
          color: red ? "#ee713d" : "#ffc381",
          transparent: true,
          opacity: 0.55,
        }),
      ),
    );
  }
  return group;
}

function makeSaturn() {
  const group = new THREE.Group();
  group.rotation.z = -0.32;
  const surface = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vPosition;varying vec3 vNormal;
      void main(){vPosition=position;vNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `${noiseGLSL}
      varying vec3 vPosition;varying vec3 vNormal;uniform float uTime;
      void main(){vec3 p=normalize(vPosition);float bands=sin(p.y*58.+fbm(p*5.)*4.);
        float fine=fbm(p*38.+vec3(uTime*.01,0.,0.));float lat=sin(p.y*17.+1.2);
        vec3 col=mix(vec3(.41,.34,.24),vec3(.79,.71,.55),.5+.09*bands+.16*lat+.12*fine);
        float light=max(dot(normalize(vNormal),normalize(vec3(-3.,4.,5.))),0.);
        gl_FragColor=vec4(col*(.10+light*.95),1.);}`,
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(2, 96, 64), surface);
  planet.scale.y = 0.9;
  group.add(planet);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.45, 4.65, 256),
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vPosition;
      void main(){float r=length(vPosition.xy);float fine=sin(r*135.)*.08+sin(r*49.)*.08;
        float cassini=smoothstep(.015,.06,abs(r-3.82));float edge=smoothstep(2.45,2.64,r)*(1.-smoothstep(4.5,4.65,r));
        float bands=.6+sin(r*9.)*.18+fine;vec3 col=mix(vec3(.38,.32,.24),vec3(.78,.7,.55),bands);
        vec3 light=normalize(vec3(-3.,-5.,4.));vec3 p=vec3(vPosition.xy,0.);
        float along=dot(-p,light);float shadow=step(0.,along)*(1.-smoothstep(1.75,2.,length(p+light*along)));
        gl_FragColor=vec4(col*(1.-shadow*.85),edge*cassini*(.5+bands*.35));}`,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);
  return group;
}

function makeNebula(type) {
  const seed = { orion: 31, crab: 152, eagle: 852, pleiades: 451 }[type];
  const random = randomGenerator(seed);
  const group = new THREE.Group();
  const positions = [],
    colors = [],
    sizes = [];
  const starPositions = [],
    starColors = [],
    starSizes = [];
  const blue = new THREE.Color("#6d91b2"),
    pink = new THREE.Color("#b27d94"),
    gold = new THREE.Color("#bb9068");
  const centers = [
    [-3, 1.2, 1],
    [1.6, 2, -0.4],
    [3, -0.8, 0.8],
    [-0.5, -0.2, 1.3],
    [-1.6, -2.1, -0.6],
    [2, -2.5, 0],
    [0, 3.1, 0],
  ];
  const count = type === "pleiades" ? 8000 : 23000;
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2,
      b = Math.acos(random() * 2 - 1);
    const r = Math.pow(random(), 0.48) * 6.2;
    let x, y, z, c, size;
    if (type === "pleiades") {
      const center = centers[i % centers.length];
      const radius = Math.pow(random(), 0.4) * 2.4;
      x = center[0] + Math.cos(a) * radius;
      y = center[1] + Math.sin(a) * radius * 0.6;
      z = center[2] + (random() - 0.5) * radius;
      c = blue.clone().lerp(new THREE.Color("#b3cbef"), random() * 0.35);
      size = 0.5 + random() * 1.3;
    } else if (type === "eagle") {
      const pillar = i % 3,
        h = random();
      const width = 0.38 + (1 - h) * 0.95 + Math.sin(h * 24 + pillar) * 0.18;
      x =
        (pillar - 1) * 2.7 +
        Math.cos(a) * width +
        Math.sin(h * 5 + pillar) * 0.45;
      y = -5 + h * (pillar === 1 ? 10.5 : pillar === 0 ? 8.2 : 6.7);
      z = Math.sin(a) * width + Math.sin(h * 8) * 0.5;
      c = gold
        .clone()
        .lerp(blue, Math.max(0, Math.cos(a)) * 0.9)
        .multiplyScalar(0.45 + Math.pow(h, 3) * 0.32);
      size = 0.3 + random() * 0.75;
    } else if (type === "crab") {
      const filament = Math.sin(a * 13 + b * 7) * Math.cos(b * 18 + a * 4);
      const shell = 4.2 + filament * 0.7 + (random() - 0.5) * 0.8;
      const radius = i % 4 === 0 ? r * 0.72 : shell;
      x = Math.cos(a) * Math.sin(b) * radius;
      y = Math.cos(b) * radius * 1.22;
      z = Math.sin(a) * Math.sin(b) * radius * 0.76;
      c =
        i % 4 === 0
          ? blue.clone().multiplyScalar(0.15)
          : gold.clone().lerp(pink, (filament + 1) * 0.3);
      size = i % 4 === 0 ? 1.4 : 0.15 + random() * 0.35;
    } else {
      x = Math.cos(a) * Math.sin(b) * r * 1.3;
      y = Math.cos(b) * r * 0.65;
      z = Math.sin(a) * Math.sin(b) * r * 0.62;
      const folds =
        Math.sin(x * 1.3 + Math.sin(y * 1.4)) +
        Math.sin(y * 1.7 + z * 0.7) +
        Math.cos(z * 1.5 + x * 0.4);
      if (folds < -0.5 || (x * x + (y + 1.2) ** 2 < 2.3 && z > -0.7)) continue;
      c = blue
        .clone()
        .lerp(pink, Math.min(1, r / 5))
        .multiplyScalar(0.5 + random() * 0.6);
      size = 0.5 + random() * 1.2;
    }
    positions.push(x, y, z);
    colors.push(c.r, c.g, c.b);
    sizes.push(size);
  }
  group.add(
    particles(
      positions,
      colors,
      sizes,
      type === "pleiades"
        ? 0.055
        : type === "crab"
          ? 0.28
          : type === "eagle"
            ? 0.07
            : 0.14,
      true,
    ),
  );
  if (type === "eagle") {
    const mistPos = [],
      mistCol = [],
      mistSize = [];
    for (let i = 0; i < 4000; i++) {
      const a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * 8;
      mistPos.push(
        Math.cos(a) * r,
        Math.sin(a) * r * 0.7 - 1,
        -3 - random() * 2,
      );
      mistCol.push(0.12, 0.22, 0.23);
      mistSize.push(1 + random() * 2);
    }
    group.add(particles(mistPos, mistCol, mistSize, 0.055, true));
  }
  if (type === "crab") {
    const threads = [],
      threadColors = [],
      threadSizes = [];
    for (let i = 0; i < 100; i++) {
      const a0 = random() * Math.PI * 2,
        b0 = 0.2 + random() * 2.6;
      const drift = (random() - 0.5) * 1.6,
        spread = 0.25 + random() * 0.6;
      for (let j = 0; j < 80; j++) {
        const t = j / 80,
          a = a0 + t * spread,
          b = b0 + drift * t;
        const radius =
          4.2 + Math.sin(a * 13 + b * 7) * Math.cos(b * 18 + a * 4) * 0.7;
        threads.push(
          Math.cos(a) * Math.sin(b) * radius,
          Math.cos(b) * radius * 1.22,
          Math.sin(a) * Math.sin(b) * radius * 0.76,
        );
        threadColors.push(0.65, 0.32 + random() * 0.1, 0.2);
        threadSizes.push(0.045 + Math.sin(t * Math.PI) * 0.055);
      }
    }
    group.add(particles(threads, threadColors, threadSizes, 0.6));
  }
  const countStars = type === "pleiades" ? 900 : 450;
  for (let i = 0; i < countStars; i++) {
    const p =
      type === "pleiades" && i < 7
        ? centers[i]
        : [(random() - 0.5) * 19, (random() - 0.5) * 14, (random() - 0.5) * 14];
    starPositions.push(...p);
    starColors.push(0.65 + random() * 0.35, 0.77 + random() * 0.23, 1);
    starSizes.push(i < 7 ? 0.18 : 0.015 + Math.pow(random(), 7) * 0.095);
    if (i < (type === "pleiades" ? 7 : 4)) {
      const halo = glow("#9cceff", type === "pleiades" ? 2.5 : 1.2, 0.6);
      halo.position.set(...p);
      group.add(halo);
    }
  }
  group.add(particles(starPositions, starColors, starSizes, 0.95));
  if (type === "crab") {
    group.add(glow("#9fd9ff", 3.5, 0.7));
    const pulsar = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 16),
      new THREE.MeshBasicMaterial({ color: "#e2f2ff" }),
    );
    group.add(pulsar);
  }
  return group;
}

export function makeObject(object) {
  if (object.model === "sun" || object.model === "proxima")
    return makeStar(object.model === "proxima");
  if (object.model === "saturn") return makeSaturn();
  if (object.model === "blackhole") return new THREE.Group();
  return makeNebula(object.model);
}

export function disposeGroup(group) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  group.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (child.material)
      for (const material of [].concat(child.material)) {
        materials.add(material);
        if (material.map) textures.add(material.map);
      }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

export const blackHoleFragment = `
  precision highp float;
  uniform vec3 uCamera;uniform mat4 uWorld;uniform mat4 uProjection;
  uniform float uTime;uniform vec2 uResolution;
  ${noiseGLSL}
  vec3 sky(vec3 d){vec3 cell=floor(d*650.);float s=hash(cell);float star=pow(s,190.);
    return vec3(.012,.018,.027)+vec3(.47,.58,.73)*star;}
  void main(){vec2 uv=gl_FragCoord.xy/uResolution*2.-1.;
    vec4 view=uProjection*vec4(uv,1.,1.);vec3 dir=normalize((uWorld*vec4(normalize(view.xyz/view.w),0.)).xyz);
    vec3 p=uCamera,v=dir,col=vec3(0.);float alpha=0.;bool hit=false;
    for(int i=0;i<150;i++){
      float r=length(p);if(r<1.05){hit=true;break;}if(r>65.)break;
      float stepSize=clamp((r-1.)*.10,.025,.8);
      vec3 angular=cross(p,v);v=normalize(v-1.5*dot(angular,angular)*p/pow(r,5.)*stepSize);
      vec3 nextP=p+v*stepSize;
      if(p.y*nextP.y<0.){
        float f=abs(p.y)/(abs(p.y)+abs(nextP.y));vec3 crossP=mix(p,nextP,f);float diskR=length(crossP.xz);
        if(diskR>2.2&&diskR<8.5){
          float a=atan(crossP.z,crossP.x);float spin=uTime*.18/sqrt(diskR);
          float grain=fbm(vec3(diskR*3.,sin(a-spin)*9.,cos(a-spin)*9.));
          float rings=.8+.2*sin(diskR*31.+grain*6.);float fade=smoothstep(2.2,2.65,diskR)*(1.-smoothstep(6.,8.5,diskR));
          float intensity=(.25+grain*1.2)*rings*fade;float beaming=1.+dot(normalize(vec3(-crossP.z,0.,crossP.x)),-v)*.48;
          vec3 hot=mix(vec3(1.8,1.25,.7),vec3(.8,.32,.09),smoothstep(2.2,8.5,diskR));
          float opacity=.82*fade;col+=hot*intensity*beaming*(1.-alpha);alpha+=opacity*(1.-alpha);
        }
      }
      p=nextP;
    }
    if(!hit)col+=sky(v)*(1.-alpha);
    float impact=length(cross(uCamera,dir));float photon=exp(-pow((impact-2.68)*8.,2.))*.35;
    col+=vec3(1.,.65,.32)*photon;col=col/(.7+col);col=pow(col,vec3(.8));
    gl_FragColor=vec4(col,1.);
  }
`;
