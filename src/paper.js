// ---------- paper texture ----------
// Overlays assets/images/paper.webp (1240 x 1712, transparent) at normal blend.
// Loaded only when first switched on. Each seed picks a different crop and flip of the image,
// so "New texture" gives a different-looking sheet; the same seed always gives the same result.
const Paper={
  url:'assets/images/paper.webp',img:null,loading:false,
  rng(s){return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},
  newSeed(){return 1+Math.floor(Math.random()*2147483646)},
  load(done){
    if(this.img||this.loading)return;
    this.loading=true;
    const i=new Image();
    i.onload=()=>{this.img=i;this.loading=false;done&&done()};
    i.onerror=()=>{this.loading=false};
    i.src=this.url;
  },
  // Draws this seed's crop and flip of the texture into context c.
  place(c,w,h,seed){
    const i=this.img,r=this.rng(seed),fx=r()<.5,fy=r()<.5;
    const k=Math.max(w/i.width,h/i.height),sw=w/k,sh=h/k;
    const sx=r()*(i.width-sw),sy=r()*(i.height-sh);
    c.translate(fx?w:0,fy?h:0);c.scale(fx?-1:1,fy?-1:1);
    c.drawImage(i,sx,sy,sw,sh,0,0,w,h);
  },
  // Displacement field from the texture: its darkness, lightly blurred, normalised;
  // x uses the field as is, y the field read 61/97 px away so the two directions differ.
  dmap:null,dkey:'',
  field(w,h,seed){
    const key=w+'x'+h+':'+seed;
    if(this.dkey===key)return this.dmap;
    const t=document.createElement('canvas');t.width=w;t.height=h;
    const tc=t.getContext('2d');this.place(tc,w,h,seed);
    const D=tc.getImageData(0,0,w,h).data,n=w*h;
    let V=new Float32Array(n);
    for(let i=0,j=0;i<n;i++,j+=4)V[i]=D[j+3]*(255-D[j])/65025; // ink-like darkness 0..1
    const blur=A=>{const B=new Float32Array(n); // 3x3 box
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=0,c=0;
        for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){s+=A[yy*w+xx];c++}
        B[y*w+x]=s/c}return B};
    V=blur(blur(V));
    let m=0;for(let i=0;i<n;i++)m+=V[i];m/=n;
    let sd=0;for(let i=0;i<n;i++)sd+=(V[i]-m)**2;sd=Math.sqrt(sd/n)||1;
    const X=new Float32Array(n),Y=new Float32Array(n);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;
      X[i]=Math.max(-3,Math.min(3,(V[i]-m)/sd));
      const j=((y+97)%h)*w+(x+61)%w;Y[i]=Math.max(-3,Math.min(3,(V[j]-m)/sd))}
    this.dmap={X,Y};this.dkey=key;return this.dmap;
  },
  // Shift each pixel of c by up to about px pixels (bilinear), following the texture.
  displace(c,w,h,seed,px,done){
    if(!(px>0))return true;
    if(!this.img){this.load(done);return false}
    const {X,Y}=this.field(w,h,seed),k=px/3;
    const src=c.getImageData(0,0,w,h),S=src.data,out=c.createImageData(w,h),O=out.data;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x;let sx=x+X[i]*k,sy=y+Y[i]*k;
      sx=sx<0?0:sx>w-1.001?w-1.001:sx;sy=sy<0?0:sy>h-1.001?h-1.001:sy;
      const x0=sx|0,y0=sy|0,fx=sx-x0,fy=sy-y0,a=(y0*w+x0)*4,b=a+4,cc=a+w*4,d=cc+4,o=i*4;
      for(let ch=0;ch<4;ch++){const top=S[a+ch]+(S[b+ch]-S[a+ch])*fx,bot=S[cc+ch]+(S[d+ch]-S[cc+ch])*fx;O[o+ch]=top+(bot-top)*fy}
    }
    c.putImageData(out,0,0);return true;
  },
  // amt 0..1. Returns false if the image is still loading (done() is called when it arrives).
  apply(c,w,h,seed,amt,done){
    if(!(amt>0))return true;
    if(!this.img){this.load(done);return false}
    c.save();c.globalAlpha=amt;this.place(c,w,h,seed);c.restore();
    return true;
  }
};
