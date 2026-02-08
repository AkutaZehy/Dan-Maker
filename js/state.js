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
    symbolMeta: { zoom:100, scaleX:100, scaleY:100, rotate:0 },
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
    glitchSeed: 0,
    SLOTS
  };

  const defaultGreek = {
    reform: [
      "1st.png","2nd.png","3rd.png","4th.png","5th.png","6th.png","7th.png","8th.png","9th.png","10th.png","alpha.png","alpha-jack.png","Alpha-tech.png","alpha-speed.png","alpha-stamina.png","beta.png","beta-jack.png","beta-tech.png","beta-speed.png","beta-stamina.png","gamma.png","gamma-glitch.png","gamma-jack.png","gamma-tech.png","gamma-tech2.png","gamma-speed.png","gamma-stamina.png","gamma-missing.png","delta.png","delta-p.png","delta-sample.png","epsilon.png","epsilon-sample.png","zeta.png","thaumiel_zeta.png","eta.png","theta.png","iota.png","kappa.png"
    ],
    rip: [
      "rip_alpha_low.png","rip_alpha.png","rip_alpha_high.png",
      "rip_beta_low.png","rip_beta.png","rip_beta_high.png",
      "rip_gamma_low.png","rip_gamma.png","rip_gamma_high.png",
      "rip_delta_low.png","rip_delta.png","rip_delta_high.png","rip_delta_doubleplus.png",
      "rip_epsilon_low.png","rip_epsilon.png",
      "rip_zeta_low.png","rip_zeta.png","rip_zeta_high.png",
      "RIP_Kappa_low.png", "RIP_Kappa_high.png", "RIP_Eta.png", "Iota-jkzee.png"
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
