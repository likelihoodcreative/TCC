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
  // amt 0..1. Returns false if the image is still loading (done() is called when it arrives).
  apply(c,w,h,seed,amt,done){
    if(!(amt>0))return true;
    if(!this.img){this.load(done);return false}
    const i=this.img,r=this.rng(seed),fx=r()<.5,fy=r()<.5;
    const k=Math.max(w/i.width,h/i.height),sw=w/k,sh=h/k;
    const sx=r()*(i.width-sw),sy=r()*(i.height-sh);
    c.save();c.globalAlpha=amt;
    c.translate(fx?w:0,fy?h:0);c.scale(fx?-1:1,fy?-1:1);
    c.drawImage(i,sx,sy,sw,sh,0,0,w,h);
    c.restore();
    return true;
  }
};
