// cropEditor.js - wire live transform updates to the correct target
(function(){
  const editScaleX = document.getElementById('editScaleX');
  const editScaleY = document.getElementById('editScaleY');
  const editRotate = document.getElementById('editRotate');
  const zoom = document.getElementById('zoom');

  function bindLiveUpdates(){
    const inputs = [document.getElementById('zoom'), document.getElementById('editScaleX'), document.getElementById('editScaleY'), document.getElementById('editRotate')];
    inputs.forEach(el=>{
      el.addEventListener('input', ()=>{
        const target = document.getElementById('editTargetSelect').value;
        if(target === 'symbol'){
          // symbol uses DOM sliders directly (render reads them)
        } else if(target === 'individual'){
          State.state.indMeta.zoom = parseInt(document.getElementById('zoom').value,10);
          State.state.indMeta.scaleX = parseInt(document.getElementById('editScaleX').value,10);
          State.state.indMeta.scaleY = parseInt(document.getElementById('editScaleY').value,10);
          State.state.indMeta.rotate = parseFloat(document.getElementById('editRotate').value) || 0;
        } else if(target === 'marathon'){
          const sel = document.getElementById('editTargetSelect').dataset.slotIndex;
          if(sel){
            const assigned = State.state.marImages.find(m=>m.slot === parseInt(sel,10));
            if(assigned){
              assigned.meta.zoom = parseInt(document.getElementById('zoom').value,10);
              assigned.meta.scaleX = parseInt(document.getElementById('editScaleX').value,10);
              assigned.meta.scaleY = parseInt(document.getElementById('editScaleY').value,10);
              assigned.meta.rotate = parseFloat(document.getElementById('editRotate').value) || 0;
            }
          }
        }
        // update value labels
        document.getElementById('zoomVal').textContent = document.getElementById('zoom').value + '%';
        document.getElementById('scaleXVal').textContent = document.getElementById('editScaleX').value + '%';
        document.getElementById('scaleYVal').textContent = document.getElementById('editScaleY').value + '%';
        document.getElementById('rotateVal').textContent = document.getElementById('editRotate').value + '°';
        State.savePersistent();
        Render.render();
      });
    });
  }
  bindLiveUpdates();

  document.getElementById('resetTransform').addEventListener('click', ()=>{
    document.getElementById('zoom').value = 100;
    document.getElementById('editScaleX').value = 100;
    document.getElementById('editScaleY').value = 100;
    document.getElementById('editRotate').value = 0;
    // apply to current target
    const target = document.getElementById('editTargetSelect').value;
    if(target === 'individual'){ State.state.indMeta = { zoom:100, scaleX:100, scaleY:100, rotate:0 }; }
    else if(target === 'marathon'){
      const sel = document.getElementById('editTargetSelect').dataset.slotIndex;
      if(sel){
        const assigned = State.state.marImages.find(m=>m.slot === parseInt(sel,10));
        if(assigned) assigned.meta = {zoom:100,scaleX:100,scaleY:100,rotate:0};
      }
    }
    State.savePersistent();
    Render.render();
  });

  // Advanced toggle UI
  document.getElementById('advToggle').addEventListener('change', (e)=>{
    document.getElementById('advancedControls').style.display = e.target.checked ? 'block' : 'none';
  });

  window.CropEditor = {};
})();
