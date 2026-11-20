// ---------- photo processing ----------
let src=null,srcData=null,proc=null,procQueued=false,grainCv=null;
function grainTile(){
  if(grainCv)return grainCv;
  const gw=Math.round(W/1.3),gh=Math.round(H/1.3);
  grainCv=document.createElement('canvas');grainCv.width=gw;grainCv.height=gh;
  const g=grainCv.getContext('2d'),d=g.createImageData(gw,gh);
  let seed=1337;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<d.data.length;i+=4){
    const n=(rnd()+rnd()+rnd()-1.5)*2; // approx gaussian
    const v=Math.max(0,Math.min(255,128+n*50));
    d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;
  }
  g.putImageData(d,0,0);return grainCv;
}
function setPhoto(i){
  const k=Math.min(1,1600/Math.max(i.width,i.height));
  src=document.createElement('canvas');src.width=Math.round(i.width*k);src.height=Math.round(i.height*k);
  const g=src.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(i,0,0,src.width,src.height);
  srcData=g.getImageData(0,0,src.width,src.height);
  proc=document.createElement('canvas');proc.width=src.width;proc.height=src.height;
  img=i;pan={x:0,y:0};zoom=1;$('zoom').value=100;$('zoomV').textContent='100%';
  cv.style.cursor='grab';processPhoto(true);
}
function processPhoto(now){
  if(!srcData)return;
  if(!now){if(procQueued)return;procQueued=true;requestAnimationFrame(()=>{procQueued=false;processPhoto(true)});return}
  const lut=buildLUT(S.film,S.exposure/100+(S.film?0.5:0),S.tone||(S.bw?'bw':'color'));
  const N=LUT_N,M=N-1,o=new ImageData(srcData.width,srcData.height),a=srcData.data,b=o.data;
  for(let i=0;i<a.length;i+=4){
    const r=a[i]/255*M,g=a[i+1]/255*M,bl=a[i+2]/255*M;
    const r0=r|0,g0=g|0,b0=bl|0,r1=r0<M?r0+1:M,g1=g0<M?g0+1:M,b1=b0<M?b0+1:M;
    const fr=r-r0,fg=g-g0,fb=bl-b0;
    for(let c=0;c<3;c++){
      const L=(x,y,z)=>lut[((x*N+y)*N+z)*3+c];
      const c00=L(r0,g0,b0)*(1-fr)+L(r1,g0,b0)*fr, c10=L(r0,g1,b0)*(1-fr)+L(r1,g1,b0)*fr;
      const c01=L(r0,g0,b1)*(1-fr)+L(r1,g0,b1)*fr, c11=L(r0,g1,b1)*(1-fr)+L(r1,g1,b1)*fr;
      const v=(c00*(1-fg)+c10*fg)*(1-fb)+(c01*(1-fg)+c11*fg)*fb;
      b[i+c]=v*255;
    }
    b[i+3]=a[i+3];
  }
  proc.getContext('2d').putImageData(o,0,0);render();
}

// Approximation of the Lightroom preset "+0.5 Funsaver Kodak Ultramax 800 no grain"
const XMP={hl:-45,sh:20,wh:-30,sat:-5,
  hue:[15,-5,5,20,10,-5,20,20], satB:[-30,-25,-25,-55,0,-20,-35,-35], lum:[5,5,10,0,10,-20,20,15],
  calib:{rH:25,rS:65,gH:25,gS:-20,bH:-10,bS:-15},
  curve:[[0,26],[25,33],[79,75],[133,133],[189,191],[255,245]],
  curveR:[[0,0],[33,14],[79,64],[117,121],[174,195],[255,255]],
  curveG:[[0,0],[35,18],[115,119],[177,204],[255,255]],
  curveB:[[0,0],[33,14],[113,118],[175,200],[255,249]]};
const LUT_N=33;
function curveLUT(pts){ // monotone cubic (Fritsch-Carlson), 1024 steps
  const x=pts.map(p=>p[0]/255),y=pts.map(p=>p[1]/255),n=x.length,d=[],m=[];
  for(let i=0;i<n-1;i++)d.push((y[i+1]-y[i])/(x[i+1]-x[i]));
  m[0]=d[0];m[n-1]=d[n-2];for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=m[i+1]=0;continue}const a=m[i]/d[i],b=m[i+1]/d[i],h=a*a+b*b;if(h>9){const t=3/Math.sqrt(h);m[i]=t*a*d[i];m[i+1]=t*b*d[i]}}
  const out=new Float32Array(1025);
  for(let k=0;k<=1024;k++){const t=k/1024;let i=0;while(i<n-2&&t>x[i+1])i++;
    const h=x[i+1]-x[i],u=(t-x[i])/h,u2=u*u,u3=u2*u;
    out[k]=Math.min(1,Math.max(0,(2*u3-3*u2+1)*y[i]+(u3-2*u2+u)*h*m[i]+(-2*u3+3*u2)*y[i+1]+(u3-u2)*h*m[i+1]))}
  return out;
}
const CURVES={m:curveLUT(XMP.curve),r:curveLUT(XMP.curveR),g:curveLUT(XMP.curveG),b:curveLUT(XMP.curveB)};
const cv1=(L,v)=>L[Math.round(Math.min(1,Math.max(0,v))*1024)];
const toLin=v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);
const toGam=v=>v<=0.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-0.055;
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function rgb2hsl(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
  if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);h*=60}
  return[h,s,l]}
function hsl2rgb(h,s,l){h=((h%360)+360)%360/360;if(s===0)return[l,l,l];
  const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t<0&&(t+=1);t>1&&(t-=1);return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
  return[f(h+1/3),f(h),f(h-1/3)]}
const BAND=[0,30,60,120,180,240,270,300,360];
function bandW(h){const w=new Float32Array(8);
  for(let i=0;i<8;i++){const a=BAND[i],b=BAND[i+1];if(h>=a&&h<=b){const t=(h-a)/(b-a);w[i]+=1-t;w[(i+1)%8]+=t;break}}return w}
function calibMatrix(){
  const c=XMP.calib,prim=[[1,0,0,c.rH,c.rS],[0,1,0,c.gH,c.gS],[0,0,1,c.bH,c.bS]],cols=[];
  for(const [r,g,b,hh,ss] of prim){
    const [h,s,l]=rgb2hsl(r,g,b);let [r2,g2,b2]=hsl2rgb(h+hh*0.25,s,l);
    const sum=r2+g2+b2,gr=sum/3,k=1+ss/100*0.35;
    cols.push([gr+(r2-gr)*k,gr+(g2-gr)*k,gr+(b2-gr)*k].map(v=>v/sum));
  }
  const Mx=[0,1,2].map(i=>[cols[0][i],cols[1][i],cols[2][i]]);
  return Mx.map(row=>{const t=row[0]+row[1]+row[2];return row.map(v=>v/t)});
}
const CALIB=calibMatrix();
function pixel(r,g,b,film,ev){
  r=toLin(r);g=toLin(g);b=toLin(b);
  if(film){const C=CALIB;[r,g,b]=[C[0][0]*r+C[0][1]*g+C[0][2]*b,C[1][0]*r+C[1][1]*g+C[1][2]*b,C[2][0]*r+C[2][1]*g+C[2][2]*b]}
  const e=Math.pow(2,ev);r*=e;g*=e;b*=e;
  // soft shoulder so exposure lifts roll off instead of clipping hard
  const sh=v=>v<=0.8?v:0.8+0.2*(1-Math.exp(-(v-0.8)/0.2));
  r=toGam(sh(Math.max(0,r)));g=toGam(sh(Math.max(0,g)));b=toGam(sh(Math.max(0,b)));
  if(!film)return[r,g,b];
  // highlights / shadows / whites
  const l=0.2126*r+0.7152*g+0.0722*b;
  const d=XMP.hl/100*0.3*sm(0.4,1,l)+XMP.sh/100*0.2*(1-sm(0,0.55,l))*Math.min(1,l*6)+XMP.wh/100*0.14*sm(0.75,1,l);
  if(l>0.02){const k=(l+d)/l;r*=k;g*=k;b*=k}else{r+=d;g+=d;b+=d}
  // tone curves: master then channels
  r=cv1(CURVES.r,cv1(CURVES.m,r));g=cv1(CURVES.g,cv1(CURVES.m,g));b=cv1(CURVES.b,cv1(CURVES.m,b));
  // HSL bands + global saturation
  let [h,s,ll]=rgb2hsl(r,g,b);
  if(s>0.001){const w=bandW(h);let dh=0,ds=0,dl=0;
    for(let i=0;i<8;i++){dh+=w[i]*XMP.hue[i];ds+=w[i]*XMP.satB[i];dl+=w[i]*XMP.lum[i]}
    const s0=s;h+=dh*0.3;s=Math.min(1,s*(1+ds/100));ll=Math.min(1,Math.max(0,ll+dl/100*0.22*s0*(1-Math.abs(2*ll-1))));}
  s*=1+XMP.sat/100;
  return hsl2rgb(h,s,ll);
}
let lutKey='',lutCache=null;
// black / blue gradient map, sampled from the Sade reference
const MAP_LO=[0x23/255,0x25/255,0x23/255],MAP_HI=[0x64/255,0x6F/255,0xFB/255];
function buildLUT(film,ev,tone){const bw=tone==='bw',map=tone==='map';
  const key=film+':'+ev+':'+tone;if(key===lutKey)return lutCache;
  const N=LUT_N,M=N-1,out=new Float32Array(N*N*N*3);let o=0;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(let k=0;k<N;k++){
    let v=pixel(i/M,j/M,k/M,film,ev);if(bw||map){const y=0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
      if(bw)v=[y,y,y];else{const u=sm(0.12,0.8,y);v=[0,1,2].map(c=>MAP_LO[c]+(MAP_HI[c]-MAP_LO[c])*u)}}out[o++]=v[0];out[o++]=v[1];out[o++]=v[2]}
  lutKey=key;return lutCache=out;
}

