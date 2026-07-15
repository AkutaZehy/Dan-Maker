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
    const marPanel = document.getElementById('marathonPanel');
    const indPanel = document.getElementById('individualPanel');
    if(marPanel) marPanel.style.display = isInd ? 'none' : 'block';
    if(indPanel) indPanel.style.display = isInd ? 'block' : 'none';
  }
  updateUIForMode();

  // init symbol color preview + glob offset from state
  (function initStateUI(){
    const t = State.state.textOverlay;
    const g = document.getElementById('globOffset');
    const gv = document.getElementById('globOffsetVal');
    if(g){ g.value = t.symOffset || 0; if(gv) gv.value = t.symOffset || 0; }
  })();
  (function initColorPreview(){
    const t = State.state.symbolTint;
    document.getElementById('sR').value = t.r; document.getElementById('sRval').value = t.r;
    document.getElementById('sG').value = t.g; document.getElementById('sGval').value = t.g;
    document.getElementById('sB').value = t.b; document.getElementById('sBval').value = t.b;
    document.getElementById('symbolColorPreview').style.background = `rgb(${t.r},${t.g},${t.b})`;
  })();

  // symbol color UI
  ['sR','sG','sB'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
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

  // canvas drop (limit marathon to 4)
  const canvas = Render.canvas;
  canvas.addEventListener('dragover', e => { e.preventDefault(); });
  canvas.addEventListener('drop', async e => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
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

  // canvas click — selects slot in slot editor
  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (1920 / rect.width);
    const my = (e.clientY - rect.top) * (1080 / rect.height);

    if(State.state.mode === 'marathon'){
      const slots = State.state.SLOTS[State.state.marBorderMode] || State.state.SLOTS.reform;
      for(let i=0;i<slots.length;i++){
        const s = slots[i];
        if(mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h){
          const sel = document.getElementById('slotTargetSelect');
          if(sel) { sel.value = String(i+1); sel.dispatchEvent(new Event('change')); }
          return;
        }
      }
    }
  });

  // ── Slot Editor (right panel) ──
  const slotTarget = document.getElementById('slotTargetSelect');
  const slotName = document.getElementById('slotAssignedName');
  const slotCtrls = document.getElementById('slotControls');
  const slotFlipH = document.getElementById('slotFlipH');
  const slotFlipV = document.getElementById('slotFlipV');
  const slotXOff = document.getElementById('slotXOffset');
  const slotXOffVal = document.getElementById('slotXOffsetVal');
  const slotVOff = document.getElementById('slotVOffset');
  const slotVOffVal = document.getElementById('slotVOffsetVal');
  const slotScale = document.getElementById('slotScale');
  const slotScaleVal = document.getElementById('slotScaleVal');

  function getAssigned(){
    const v = parseInt(slotTarget.value,10);
    if(!v) return null;
    return State.state.marImages.find(m=>m.slot === v);
  }

  function syncSlotUI(){
    const a = getAssigned();
    if(!a){
      slotName.textContent = 'No image assigned';
      slotCtrls.style.display = 'none';
      return;
    }
    slotName.textContent = a.name || 'Image #' + slotTarget.value;
    slotCtrls.style.display = 'block';
    // flip
    slotFlipH.dataset.active = a.meta.flipH ? 'true' : 'false';
    slotFlipV.dataset.active = a.meta.flipV ? 'true' : 'false';
    // offsets
    const ox = Math.round((a.offsetX || 0) * 100);
    slotXOff.value = ox; if(slotXOffVal) slotXOffVal.value = ox;
    const oy = Math.round((a.offsetY || 0) * 100);
    slotVOff.value = oy; if(slotVOffVal) slotVOffVal.value = oy;
    // scale
    const sc = a.meta.zoom || 100;
    slotScale.value = sc; if(slotScaleVal) slotScaleVal.value = sc;
  }

  function onChangeSlot(){ Render.render(); State.savePersistent(); }

  if(slotTarget) slotTarget.addEventListener('change', syncSlotUI);

  // flip
  if(slotFlipH) slotFlipH.addEventListener('click', ()=>{
    const a = getAssigned(); if(!a) return;
    a.meta.flipH = !a.meta.flipH;
    slotFlipH.dataset.active = a.meta.flipH ? 'true' : 'false';
    onChangeSlot();
  });
  if(slotFlipV) slotFlipV.addEventListener('click', ()=>{
    const a = getAssigned(); if(!a) return;
    a.meta.flipV = !a.meta.flipV;
    slotFlipV.dataset.active = a.meta.flipV ? 'true' : 'false';
    onChangeSlot();
  });

  // X.Offset
  if(slotXOff) slotXOff.addEventListener('input', ()=>{
    const a = getAssigned(); if(!a) return;
    a.offsetX = parseFloat(slotXOff.value) / 100;
    if(slotXOffVal) slotXOffVal.value = slotXOff.value;
    onChangeSlot();
  });
  if(slotXOffVal) slotXOffVal.addEventListener('change', ()=>{
    const v = Utils.clamp(parseFloat(slotXOffVal.value)||0, -100, 100);
    slotXOffVal.value = v; slotXOff.value = v; slotXOff.dispatchEvent(new Event('input'));
  });

  // V.Offset
  if(slotVOff) slotVOff.addEventListener('input', ()=>{
    const a = getAssigned(); if(!a) return;
    a.offsetY = parseFloat(slotVOff.value) / 100;
    if(slotVOffVal) slotVOffVal.value = slotVOff.value;
    onChangeSlot();
  });
  if(slotVOffVal) slotVOffVal.addEventListener('change', ()=>{
    const v = Utils.clamp(parseFloat(slotVOffVal.value)||0, -100, 100);
    slotVOffVal.value = v; slotVOff.value = v; slotVOff.dispatchEvent(new Event('input'));
  });

  // Scale
  if(slotScale) slotScale.addEventListener('input', ()=>{
    const a = getAssigned(); if(!a) return;
    const val = parseInt(slotScale.value,10);
    a.meta.zoom = val; a.meta.scaleX = val; a.meta.scaleY = val;
    if(slotScaleVal) slotScaleVal.value = val;
    onChangeSlot();
  });
  if(slotScaleVal) slotScaleVal.addEventListener('change', ()=>{
    const v = Utils.clamp(parseFloat(slotScaleVal.value)||100, 50, 200);
    slotScaleVal.value = v; slotScale.value = v; slotScale.dispatchEvent(new Event('input'));
  });

  // marathon list & assignment
  function refreshMarList(){
    const container = document.querySelector('.marListCompact');
    if(!container) return;
    container.innerHTML = '';
    const arr = [...State.state.marImages].sort((a,b)=> (a.slot||999) - (b.slot||999));
    arr.forEach(it=>{
      const item = document.createElement('div'); item.className='marItem';
      const img = document.createElement('img'); img.src = it.img.src;
      const controls = document.createElement('div'); controls.style.display='flex'; controls.style.flexDirection='column'; controls.style.gap='2px';
      const sel = document.createElement('select'); sel.className='slotSelect'; sel.style.fontSize='11px'; sel.style.padding='2px 4px';
      const none = document.createElement('option'); none.value='none'; none.textContent='(no slot)'; sel.appendChild(none);
      for(let s=1;s<=4;s++){ const o=document.createElement('option'); o.value=s; o.textContent='Slot '+s; sel.appendChild(o); }
      sel.value = it.slot ? String(it.slot) : 'none';
      sel.addEventListener('change', ()=>{
        const chosen = sel.value === 'none' ? null : parseInt(sel.value,10);
        assignSlot(it.id, chosen);
      });
      const rem = document.createElement('button'); rem.className='smallBtn'; rem.textContent='✕'; rem.style.padding='2px 6px'; rem.style.fontSize='11px';
      rem.addEventListener('click', ()=>{
        State.state.marImages = State.state.marImages.filter(m=>m.id !== it.id);
        refreshMarList(); Render.render(); State.savePersistent(); syncSlotUI();
      });
      controls.appendChild(sel); controls.appendChild(rem);
      item.appendChild(img); item.appendChild(controls);
      // clicking thumbnail selects slot
      img.addEventListener('click', ()=>{
        if(it.slot && slotTarget) {
          slotTarget.value = String(it.slot);
          slotTarget.dispatchEvent(new Event('change'));
        }
      });
      container.appendChild(item);
    });
  }
  function assignSlot(id,slot){
    const target = State.findMarById(id);
    if(!target) return;
    if(slot === null){ target.slot = null; refreshMarList(); Render.render(); State.savePersistent(); syncSlotUI(); return; }
    const occupant = State.state.marImages.find(m=>m.slot === slot);
    if(occupant && occupant.id !== target.id){
      occupant.slot = target.slot; target.slot = slot;
    } else target.slot = slot;
    refreshMarList(); Render.render(); State.savePersistent(); syncSlotUI();
  }

  // slot snap button
  document.getElementById('snapSlots').addEventListener('click', ()=>{
    const imgs = State.state.marImages;
    for(let i=0;i<imgs.length;i++){
      imgs[i].slot = i+1;
    }
    refreshMarList(); Render.render(); State.savePersistent(); syncSlotUI();
  });

  // slot reset — resets currently selected slot's image transform
  document.getElementById('slotReset').addEventListener('click', ()=>{
    const a = getAssigned();
    if(!a) return;
    a.offsetX = 0; a.offsetY = 0;
    a.meta = {zoom:100, scaleX:100, scaleY:100, rotate:0, flipH:false, flipV:false};
    syncSlotUI();
    State.savePersistent();
    Render.render();
  });

  // Glob.V slider — adjusts symbol vertical offset
  const globOff = document.getElementById('globOffset');
  const globOffVal = document.getElementById('globOffsetVal');
  if(globOff){
    globOff.addEventListener('input', ()=>{
      State.state.textOverlay.symOffset = parseInt(globOff.value,10);
      if(globOffVal) globOffVal.value = globOff.value;
      State.savePersistent();
      Render.render();
    });
  }
  if(globOffVal){
    globOffVal.addEventListener('change', ()=>{
      const v = Utils.clamp(parseInt(globOffVal.value,10)||0, -200, 200);
      globOffVal.value = v; globOff.value = v; globOff.dispatchEvent(new Event('input'));
    });
  }

  // Reset Values — reset sliders + flip only, not text/checkboxes/slots
  document.getElementById('resetAllBtn').addEventListener('click', ()=>{
    State.state.symbolMeta = {zoom:100, scaleX:100, scaleY:100, rotate:0, flipH:false, flipV:false};
    State.state.textOverlay.symOffset = 0;
    State.state.textOverlay.textOffset = 0;
    State.state.textOverlay.scale = 100;
    // reset slider UI
    document.getElementById('zoom').value = 100; document.getElementById('zoomVal').value = 100;
    document.getElementById('editScaleX').value = 100; document.getElementById('scaleXVal').value = 100;
    document.getElementById('editScaleY').value = 100; document.getElementById('scaleYVal').value = 100;
    document.getElementById('editRotate').value = 0; document.getElementById('rotateVal').value = 0;
    if(globOff){ globOff.value = 0; globOffVal.value = 0; }
    const fh = document.getElementById('flipHBtn'); if(fh) fh.dataset.active = 'false';
    const fv = document.getElementById('flipVBtn'); if(fv) fv.dataset.active = 'false';
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
    const radios = Array.from(exportModal.querySelectorAll('input[name="sizeOpt"]'));
    let chosen = radios.find(r=>r.checked).value;
    const [wstr,hstr] = chosen.split('x');
    let W = parseInt(wstr,10), H = parseInt(hstr,10);
    const customW = parseInt(document.getElementById('customW').value,10);
    const customH = parseInt(document.getElementById('customH').value,10);
    if(customW && customH) { W = customW; H = customH; }
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

  const deb = Utils.debounce(()=> Render.render(), 50);
  setInterval(deb, 150);
})();
