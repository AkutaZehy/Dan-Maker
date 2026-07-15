// transform.js: all transforms apply to symbol (symbolMeta)
(function(){
  const zoom = document.getElementById('zoom');
  const zoomVal = document.getElementById('zoomVal');
  const scaleX = document.getElementById('editScaleX');
  const scaleY = document.getElementById('editScaleY');
  const scaleXVal = document.getElementById('scaleXVal');
  const scaleYVal = document.getElementById('scaleYVal');
  const rotate = document.getElementById('editRotate');
  const rotateVal = document.getElementById('rotateVal');
  const advToggle = document.getElementById('advToggle');

  function updateLabels(){
    zoomVal.value = zoom.value;
    scaleXVal.value = scaleX.value;
    scaleYVal.value = scaleY.value;
    rotateVal.value = rotate.value;
  }

  // ── Flip buttons ──
  function syncFlipButtons(){
    const meta = State.state.symbolMeta;
    const fh = document.getElementById('flipHBtn');
    const fv = document.getElementById('flipVBtn');
    if(fh) fh.dataset.active = meta.flipH ? 'true' : 'false';
    if(fv) fv.dataset.active = meta.flipV ? 'true' : 'false';
  }

  document.getElementById('flipHBtn').addEventListener('click', ()=>{
    State.state.symbolMeta.flipH = !State.state.symbolMeta.flipH;
    syncFlipButtons();
    State.savePersistent();
    Render.render();
  });
  document.getElementById('flipVBtn').addEventListener('click', ()=>{
    State.state.symbolMeta.flipV = !State.state.symbolMeta.flipV;
    syncFlipButtons();
    State.savePersistent();
    Render.render();
  });

  // ── Main transform sliders ──
  [zoom, scaleX, scaleY, rotate].forEach(el=> el.addEventListener('input', ()=>{
    const isAdvanced = advToggle.checked;
    const m = State.state.symbolMeta;

    if(!isAdvanced && el === zoom){
      scaleX.value = zoom.value;
      scaleY.value = zoom.value;
    }
    if(isAdvanced){
      m.scaleX = parseInt(scaleX.value,10);
      m.scaleY = parseInt(scaleY.value,10);
    } else {
      m.zoom = parseInt(zoom.value,10);
      m.scaleX = parseInt(zoom.value,10);
      m.scaleY = parseInt(zoom.value,10);
    }
    m.rotate = parseFloat(rotate.value) || 0;

    updateLabels();
    syncFlipButtons();
    State.savePersistent();
    Render.render();
  }));

  // numeric inputs
  ['zoomVal','scaleXVal','scaleYVal','rotateVal'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('change', ()=>{
      const val = parseFloat(el.value) || 0;
      if(id==='zoomVal') zoom.value = val;
      if(id==='scaleXVal') scaleX.value = val;
      if(id==='scaleYVal') scaleY.value = val;
      if(id==='rotateVal') rotate.value = val;
      zoom.dispatchEvent(new Event('input'));
    });
  });

  // initial flip sync
  syncFlipButtons();
  window.TransformSync = { syncFlipButtons };
})();
