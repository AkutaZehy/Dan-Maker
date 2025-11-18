// app.js: main wiring
(async function(){
  // UI refs
  const modeToggleRoot = document.getElementById('modeToggle');
  const downloadBtn = document.getElementById('downloadBtn');
  const exportOverlay = document.getElementById('exportOverlay');
  const exportModal = document.getElementById('exportModal');
  const exportBtn = document.getElementById('doExport');
  const cancelExport = document.getElementById('cancelExport');

  // mode buttons
  ['individual','marathon'].forEach(m=>{
    const btn = document.createElement('button');
    btn.textContent = m[0].toUpperCase() + m.slice(1);
    btn.addEventListener('click', ()=>{
      State.state.mode = m;
      Array.from(modeToggleRoot.children).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      updateUIForMode();
      Render.render();
    });
    modeToggleRoot.appendChild(btn);
  });
  modeToggleRoot.children[0].classList.add('active');

  function updateUIForMode(){
    const isInd = State.state.mode === 'individual';
    document.getElementById('borderPanel').style.display = isInd ? 'none' : 'block';
    document.getElementById('marListWrap').style.display = isInd ? 'none' : 'block';
    if(isInd){
      document.getElementById('editTargetSelect').querySelectorAll('option').forEach(o=>{ if(o.value==='marathon') o.disabled=true; if(o.value==='individual') o.disabled=false; });
    } else {
      document.getElementById('editTargetSelect').querySelectorAll('option').forEach(o=>{ if(o.value==='marathon') o.disabled=false; if(o.value==='individual') o.disabled=true; });
    }
  }
  updateUIForMode();

  // symbol UI
  document.getElementById('symbolZoom').addEventListener('input', (e)=>{
    document.getElementById('symbolZoomVal').value = e.target.value;
    Render.render();
  });
  document.getElementById('symbolZoomVal').addEventListener('change', (e)=>{ document.getElementById('symbolZoom').value = e.target.value; Render.render(); });

  ['sR','sG','sB'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=>{
      State.state.symbolTint = { r: parseInt(document.getElementById('sR').value,10), g: parseInt(document.getElementById('sG').value,10), b: parseInt(document.getElementById('sB').value,10) };
      document.getElementById('sRval').value = document.getElementById('sR').value;
      document.getElementById('sGval').value = document.getElementById('sG').value;
      document.getElementById('sBval').value = document.getElementById('sB').value;
      document.getElementById('symbolColorPreview').style.background = `rgb(${State.state.symbolTint.r},${State.state.symbolTint.g},${State.state.symbolTint.b})`;
      State.savePersistent();
      Render.render();
    });
  });

  // symbol eye toggle
  document.getElementById('toggleSymbolEye').addEventListener('click', ()=>{
    State.state.showSymbol = !State.state.showSymbol;
    Render.render();
  });

  // editing target dropdown behavior
  document.getElementById('editTargetSelect').addEventListener('change', ()=>{
    const v = document.getElementById('editTargetSelect').value;
    if(v === 'marathon'){ document.getElementById('selectedLabel').textContent = 'Selected: Marathon (click a slot)'; }
    else if(v === 'individual'){ document.getElementById('selectedLabel').textContent = 'Selected: Individual background'; }
    else { document.getElementById('selectedLabel').textContent = 'Selected: Symbol'; }
    // clear dataset slot index if needed
    if(v !== 'marathon') document.getElementById('editTargetSelect').removeAttribute('data-slot-index');
  });

  // canvas drop (limit marathon to 4)
  const canvas = Render.canvas;
  function prevent(e){ e.preventDefault(); e.stopPropagation(); }
  ['dragenter','dragover','dragleave','drop'].forEach(ev => { canvas.addEventListener(ev, prevent); });
  canvas.addEventListener('drop', async (e)=>{
    const files = Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));
    if(files.length===0) return;
    if(State.state.mode === 'individual'){
      const img = await Utils.loadImageFromFile(files[0]);
      State.state.indBg = img;
      Render.render();
    } else {
      const available = 4 - State.state.marImages.length;
      if(available <= 0){ alert('Marathon supports up to 4 images. Remove one to add another.'); return; }
      const toAdd = files.slice(0, available);
      for(const f of toAdd){
        const img = await Utils.loadImageFromFile(f);
        State.addMarImage(img, f.name);
      }
      refreshMarList();
      Render.render();
    }
  });

  // canvas click selection with alpha-test for symbol
  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (1920 / rect.width);
    const my = (e.clientY - rect.top) * (1080 / rect.height);
    // symbol detection
    const sidx = State.state.selGreekIndex;
    if(sidx >= 0 && State.state.greekList[sidx] && State.state.greekList[sidx].img){
      const sym = State.state.greekList[sidx].img;
      const sizePerc = parseFloat(document.getElementById('symbolZoom').value) / 100;
      const targetH = 1080 * sizePerc;
      const targetW = targetH * (sym.width / sym.height);
      const sx = (1920 - targetW)/2, sy = (1080 - targetH)/2;
      if(mx >= sx && mx <= sx + targetW && my >= sy && my <= sy + targetH){
        const off = document.createElement('canvas'); off.width = Math.round(targetW); off.height = Math.round(targetH);
        const oc = off.getContext('2d');
        oc.drawImage(sym, 0, 0, off.width, off.height);
        const px = Math.floor(mx - sx), py = Math.floor(my - sy);
        if(px >=0 && px < off.width && py >=0 && py < off.height){
          const d = oc.getImageData(px,py,1,1).data;
          if(d[3] >= 12){
            document.getElementById('editTargetSelect').value = 'symbol';
            document.getElementById('editTargetSelect').removeAttribute('data-slot-index');
            document.getElementById('selectedLabel').textContent = 'Selected: Symbol';
            return;
          }
        }
      }
    }

    if(State.state.mode === 'individual'){
      document.getElementById('editTargetSelect').value = 'individual';
      document.getElementById('editTargetSelect').removeAttribute('data-slot-index');
      document.getElementById('selectedLabel').textContent = 'Selected: Individual background';
      return;
    } else {
      // marathon slot detection
      const slots = State.state.SLOTS[State.state.marBorderMode] || State.state.SLOTS.reform;
      for(let i=0;i<slots.length;i++){
        const s = slots[i];
        if(mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h){
          document.getElementById('editTargetSelect').value = 'marathon';
          document.getElementById('editTargetSelect').dataset.slotIndex = (i+1);
          document.getElementById('selectedLabel').textContent = 'Selected: Marathon (Slot ' + (i+1) + ')';
          return;
        }
      }
    }
    document.getElementById('editTargetSelect').value = 'symbol';
    document.getElementById('editTargetSelect').removeAttribute('data-slot-index');
    document.getElementById('selectedLabel').textContent = 'Selected: Symbol';
  });

  // marathon list & assignment
  const marList = document.getElementById('marList');
  function refreshMarList(){
    marList.innerHTML = '';
    const arr = [...State.state.marImages].sort((a,b)=> (a.slot||999) - (b.slot||999));
    arr.forEach(it=>{
      const item = document.createElement('div'); item.className='marItem';
      const img = document.createElement('img'); img.src = it.img.src;
      const controls = document.createElement('div'); controls.style.display='flex'; controls.style.flexDirection='column';
      const sel = document.createElement('select'); sel.className='slotSelect';
      const none = document.createElement('option'); none.value='none'; none.textContent='(no slot)'; sel.appendChild(none);
      for(let s=1;s<=4;s++){ const o=document.createElement('option'); o.value=s; o.textContent='Slot '+s; sel.appendChild(o); }
      sel.value = it.slot ? String(it.slot) : 'none';
      sel.addEventListener('change', ()=>{
        const chosen = sel.value === 'none' ? null : parseInt(sel.value,10);
        assignSlot(it.id, chosen);
      });
      const rem = document.createElement('button'); rem.className='smallBtn'; rem.textContent='✕';
      rem.addEventListener('click', ()=>{
        State.state.marImages = State.state.marImages.filter(m=>m.id !== it.id);
        refreshMarList(); Render.render(); State.savePersistent();
      });
      controls.appendChild(sel); controls.appendChild(rem);
      item.appendChild(img); item.appendChild(controls);
      // clicking thumbnail selects slot
      img.addEventListener('click', ()=>{
        if(it.slot) {
          document.getElementById('editTargetSelect').value = 'marathon';
          document.getElementById('editTargetSelect').dataset.slotIndex = it.slot;
          document.getElementById('selectedLabel').textContent = 'Selected: Marathon (Slot ' + it.slot + ')';
        }
      });
      marList.appendChild(item);
    });
  }
  function assignSlot(id,slot){
    const target = State.findMarById(id);
    if(!target) return;
    if(slot === null){ target.slot = null; refreshMarList(); Render.render(); State.savePersistent(); return; }
    const occupant = State.state.marImages.find(m=>m.slot === slot);
    if(occupant && occupant.id !== target.id){
      occupant.slot = target.slot; target.slot = slot;
    } else target.slot = slot;
    refreshMarList(); Render.render(); State.savePersistent();
  }

  // slot snap button
  document.getElementById('snapSlots').addEventListener('click', ()=>{
    // reassign slots in order of marImages array top to bottom
    const imgs = State.state.marImages;
    for(let i=0;i<imgs.length;i++){
      imgs[i].slot = i+1;
    }
    refreshMarList(); Render.render(); State.savePersistent();
  });

  // reset transform button resets for current target
  document.getElementById('resetTransform').addEventListener('click', ()=>{
    const target = document.getElementById('editTargetSelect').value;
    if(target === 'individual'){
      State.state.indMeta = { zoom:100, scaleX:100, scaleY:100, rotate:0, offsetX:0, offsetY:0 };
    } else if(target === 'marathon'){
      const slot = document.getElementById('editTargetSelect').dataset.slotIndex;
      if(slot){
        const assigned = State.state.marImages.find(m=>m.slot === parseInt(slot,10));
        if(assigned) assigned.meta = {zoom:100,scaleX:100,scaleY:100,rotate:0};
      }
    } else {
      // symbol resets are DOM controls only
      document.getElementById('symbolZoom').value = 36;
      document.getElementById('symbolZoomVal').value = 36;
    }
    State.savePersistent();
    Render.render();
  });

  // shaders UI binding
  document.getElementById('masterShaders').addEventListener('change', (e)=>{
    document.getElementById('shadersPanel').style.display = e.target.checked ? 'block' : 'none';
    Render.render();
  });
  document.getElementById('regenGlitch').addEventListener('click', ()=> { Effects.regenerateGlitch(); Render.render(); });

  // border controls initial
  BorderControls.buildTabs();

  // export modal wiring
  downloadBtn.addEventListener('click', ()=> {
    exportOverlay.style.display = 'block';
    exportModal.style.display = 'block';
  });
  cancelExport.addEventListener('click', ()=> { exportOverlay.style.display='none'; exportModal.style.display='none'; });
  exportBtn.addEventListener('click', ()=>{
    // compute size
    const radios = Array.from(exportModal.querySelectorAll('input[name="sizeOpt"]'));
    let chosen = radios.find(r=>r.checked).value;
    const [wstr,hstr] = chosen.split('x');
    let W = parseInt(wstr,10), H = parseInt(hstr,10);
    const customW = parseInt(document.getElementById('customW').value,10);
    const customH = parseInt(document.getElementById('customH').value,10);
    if(customW && customH) { W = customW; H = customH; }
    // render at size
    const out = Render.renderAtSize(W,H);
    out.toBlob(blob=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dan_export_${W}x${H}.png`;
      a.click();
    });
    exportOverlay.style.display='none'; exportModal.style.display='none';
  });

  // initial hydration
  refreshMarList();
  Render.render();

  // debounce render on interval for interactive feel
  const deb = Utils.debounce(()=> Render.render(), 50);
  setInterval(deb, 150);
})();
