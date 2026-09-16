import * as THREE from "three";

export function makeCloud(type) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uKind: { value: ["orion", "eagle", "crab", "pleiades"].indexOf(type) },
      },
      vertexShader: `varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
      fragmentShader: `
      varying vec3 vWorld;uniform float uTime;uniform int uKind;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fbm(vec3 p){return noise(p)*.57+noise(p*2.07+4.)*.28+noise(p*4.13+9.)*.15;}
      void main(){
        vec3 rd=normalize(vWorld-cameraPosition),inv=1./rd;
        vec3 ta=(-vec3(9.)-cameraPosition)*inv,tb=(vec3(9.)-cameraPosition)*inv;
        vec3 lo=min(ta,tb),hi=max(ta,tb);
        float start=max(0.,max(lo.x,max(lo.y,lo.z))),end=min(hi.x,min(hi.y,hi.z));
        if(end<=start)discard;
        float stepSize=(end-start)/80.;vec4 sum=vec4(0.);
        float jitter=hash(vec3(gl_FragCoord.xy,0.));
        for(int i=0;i<80;i++){
          vec3 p=cameraPosition+rd*(start+(float(i)+jitter)*stepSize);
          float n=fbm(p*.85+vec3(uTime*.006,0.,0.));
          float detail=fbm(p*2.8);float density=0.;vec3 tint=vec3(0.);
          if(uKind==0){
            vec3 q=p/vec3(7.2,4.1,4.0);float r=length(q);
            float cavity=1.-exp(-dot(p-vec3(.5,-.5,1.),p-vec3(.5,-.5,1.))*.22);
            density=max(0.,n-.34)*3.2*(1.-smoothstep(.5,1.15,r))*cavity;
            float dust=smoothstep(.48,.7,fbm(p*.47+7.));
            tint=mix(vec3(.22,.65,.85),vec3(1.1,.23,.36),smoothstep(.1,.95,r));
            tint*=mix(1.1,.06,dust)*(.5+detail);
          }else if(uKind==1){
            float pillar=0.;
            for(int k=0;k<3;k++){
              float fk=float(k),h=p.y+5.;float top=7.3+sin(fk*2.)*2.;
              float x=(fk-1.)*2.8+sin(h*.48+fk)*.48;
              float width=mix(1.25,.5,clamp(h/top,0.,1.));
              float d=length(vec2(p.x-x,p.z-sin(h*.7+fk)*.5));
              pillar=max(pillar,(1.-smoothstep(width-.35,width+.4+(n-.5)*1.7,d))*smoothstep(-.5,.8,h)*(1.-smoothstep(top-.6,top+.5,h)));
            }
            float mist=max(0.,n-.39)*(1.-smoothstep(5.,9.,length(p)))*.6;
            density=pillar*1.7+mist;
            tint=mix(vec3(.10,.38,.42),vec3(.25,.13,.045),smoothstep(.05,.7,pillar));
            tint+=vec3(.9,.51,.19)*pow(1.-pillar,3.)*step(.02,pillar)*(.5+n);
          }else if(uKind==2){
            float r=length(p/vec3(4.4,5.5,3.5));
            float shell=exp(-pow((r-.86+(n-.5)*.28)*9.,2.));
            float web=pow(1.-abs(detail-.5)*2.,12.);
            density=shell*(.2+web*1.8)+max(0.,1.-r)*.13;
            tint=mix(vec3(.1,.42,.6),vec3(1.2,.39,.16),shell)*(.5+web);
          }else{
            float r=length(p/vec3(6.8,5.,3.6));
            float streak=pow(noise(p*vec3(.6,3.8,1.4)),3.);
            density=max(0.,n-.34)*streak*2.3*(1.-smoothstep(.4,1.,r));
            tint=vec3(.2,.46,1.)*(.7+detail);
          }
          float alpha=1.-exp(-density*stepSize*1.5);
          sum.rgb+=(1.-sum.a)*tint*alpha;sum.a+=(1.-sum.a)*alpha;
          if(sum.a>.985)break;
        }
        if(sum.a<.002)discard;
        gl_FragColor=vec4(sum.rgb/max(sum.a,.001),sum.a);
      }`,
    }),
  );
}
