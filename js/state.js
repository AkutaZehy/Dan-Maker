// state.js
const State = (function(){
  const SLOTS = {
    rip: [{x:68,y:0,w:381,h:1080},{x:513,y:0,w:415,h:1080},{x:994,y:0,w:415,h:1080},{x:1474,y:0,w:381,h:1080}],
    reform: [{x:70,y:0,w:437,h:1080},{x:572,y:0,w:350,h:1080},{x:990,y:0,w:361,h:1080},{x:1416,y:0,w:437,h:1080}]
  };

  const state = {
    mode: 'individual',
    indBg: null,
    indMeta: { zoom:100, scaleX:100, scaleY:100, rotate:0, offsetX:0, offsetY:0 },
    marImages: [], // {id,img,name,slot:null,offsetX:0,meta:{zoom:100,scaleX:100,scaleY:100,rotate:0}}
    marBorderImg: null,
    marBorderMode: 'reform',
    customBorders: [],
    greekList: [],
    selGreekIndex: -1,
    borderTint: {r:255,g:255,b:255},
    symbolTint: {r:255,g:255,b:255},
    applyBorderTint: true,
    applySymbolTint: true,
    showSymbol: true,
    SLOTS
  };

  const defaultGreek = {
    reform: [
      "alpha.png","beta.png","gamma.png","delta.png","epsilon.png","zeta.png","thaumiel_zeta.png","eta.png","theta.png","iota.png","kappa.png"
    ],
    rip: [
      "RIP_Alpha_low.png","RIP_Alpha.png","RIP_Alpha_high.png",
      "RIP_Beta_low.png","RIP_Beta.png","RIP_Beta_high.png",
      "RIP_Gamma_low.png","RIP_Gamma.png","RIP_Gamma_high.png",
      "RIP_Delta_low.png","RIP_Delta.png","RIP_Delta_high.png","RIP_Delta_doubleplus.png",
      "RIP_Epsilon_low.png","RIP_Epsilon.png",
      "RIP_Zeta_low.png","RIP_Zeta.png","RIP_Zeta_high.png"
    ]
  };

  function savePersistent(){
    try{
      const packed = {
        customSymbols: state.greekList.filter(g=>g.custom).map(g=>({name:g.name,data:g.img.src})),
        customBorders: state.customBorders.map(b=>({name:b.name,data:b.img.src})),
        borderTint: state.borderTint,
        symbolTint: state.symbolTint,
        marMeta: state.marImages.map(m=>({id:m.id,slot:m.slot,offsetX:m.offsetX,meta:m.meta}))
      };
      localStorage.setItem('danmaker_final', JSON.stringify(packed));
    }catch(e){}
  }
  function loadPersistent(){
    try{
      const raw = localStorage.getItem('danmaker_final');
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(parsed.customSymbols){
        parsed.customSymbols.forEach(s=>{
          const img = new Image(); img.src = s.data;
          state.greekList.push({ filename: s.name, name: s.name, img, custom: true, group:'custom' });
        });
      }
      if(parsed.customBorders){
        parsed.customBorders.forEach(b=>{
          const img = new Image(); img.src = b.data;
          state.customBorders.push({ name: b.name, img });
        });
      }
      if(parsed.borderTint) state.borderTint = parsed.borderTint;
      if(parsed.symbolTint) state.symbolTint = parsed.symbolTint;
      if(parsed.marMeta){
        parsed.marMeta.forEach(mmeta=>{
          const found = state.marImages.find(x=>x.id===mmeta.id);
          if(found){ found.slot = mmeta.slot; found.offsetX = mmeta.offsetX; found.meta = mmeta.meta || found.meta; }
        });
      }
    }catch(e){}
  }

  loadPersistent();

  function addMarImage(img, name){
    state.marImages.push({ id: Date.now()+Math.random(), img, name, slot: null, offsetX:0, meta:{zoom:100,scaleX:100,scaleY:100,rotate:0} });
  }
  function findMarById(id){ return state.marImages.find(m=>m.id===id); }
  function addCustomSymbol(img, name){ state.greekList.push({ filename: name, name, img, custom:true, group:'custom' }); savePersistent(); }
  function addCustomBorder(img, name){ state.customBorders.push({ name, img }); savePersistent(); }

  return { state, addMarImage, findMarById, savePersistent, addCustomSymbol, addCustomBorder, defaultGreek };
})();
