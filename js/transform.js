// transform.js: syncing inputs to state for correct target separation
(function(){
  function bind(){
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

    [zoom, scaleX, scaleY, rotate].forEach(el=> el.addEventListener('input', ()=>{
      const target = document.getElementById('editTargetSelect').value;
      const isAdvanced = document.getElementById('advToggle').checked;
      
      // When advanced is OFF, sync scaleX/Y with zoom
      if(!isAdvanced && el === zoom){
        scaleX.value = zoom.value;
        scaleY.value = zoom.value;
      }
      
      if(target === 'symbol'){
        // symbol now uses transform zoom instead of symbolZoom
        if(!State.state.symbolMeta) State.state.symbolMeta = {zoom:100, scaleX:100, scaleY:100, rotate:0};
        if(isAdvanced){
          State.state.symbolMeta.scaleX = parseInt(scaleX.value,10);
          State.state.symbolMeta.scaleY = parseInt(scaleY.value,10);
        } else {
          State.state.symbolMeta.zoom = parseInt(zoom.value,10);
          State.state.symbolMeta.scaleX = parseInt(zoom.value,10);
          State.state.symbolMeta.scaleY = parseInt(zoom.value,10);
        }
        State.state.symbolMeta.rotate = parseFloat(rotate.value) || 0;
      } else if(target === 'individual'){
        if(isAdvanced){
          State.state.indMeta.scaleX = parseInt(scaleX.value,10);
          State.state.indMeta.scaleY = parseInt(scaleY.value,10);
        } else {
          State.state.indMeta.zoom = parseInt(zoom.value,10);
          State.state.indMeta.scaleX = parseInt(zoom.value,10);
          State.state.indMeta.scaleY = parseInt(zoom.value,10);
        }
        State.state.indMeta.rotate = parseFloat(rotate.value) || 0;
      } else if(target === 'marathon'){
        const sel = document.getElementById('editTargetSelect').dataset.slotIndex;
        if(sel){
          const assigned = State.state.marImages.find(m=>m.slot === parseInt(sel,10));
          if(assigned){
            if(isAdvanced){
              assigned.meta.scaleX = parseInt(scaleX.value,10);
              assigned.meta.scaleY = parseInt(scaleY.value,10);
            } else {
              assigned.meta.zoom = parseInt(zoom.value,10);
              assigned.meta.scaleX = parseInt(zoom.value,10);
              assigned.meta.scaleY = parseInt(zoom.value,10);
            }
            assigned.meta.rotate = parseFloat(rotate.value) || 0;
          }
        }
      }
      updateLabels();
      State.savePersistent();
      Render.render();
    }));

    // numeric inputs editable
    ['zoomVal','scaleXVal','scaleYVal','rotateVal'].forEach(id=>{
      const el = document.getElementById(id);
      el.addEventListener('change', ()=>{
        const val = parseFloat(el.value) || 0;
        if(id==='zoomVal') document.getElementById('zoom').value = val;
        if(id==='scaleXVal') document.getElementById('editScaleX').value = val;
        if(id==='scaleYVal') document.getElementById('editScaleY').value = val;
        if(id==='rotateVal') document.getElementById('editRotate').value = val;
        // trigger input
        document.getElementById('zoom').dispatchEvent(new Event('input'));
      });
    });
  }
  bind();
})();
