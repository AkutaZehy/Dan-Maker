// borderControls.js
(function(){
  const tabsRoot = document.getElementById('borderTabs');
  const addBorderBtn = document.getElementById('addBorderBtn');
  const borderUpload = document.getElementById('borderUpload');
  const borderPreview = document.getElementById('borderPreview');
  const tR = document.getElementById('tR'), tG = document.getElementById('tG'), tB = document.getElementById('tB');
  const borderColorPreview = document.getElementById('borderColorPreview');
  const applyTint = document.getElementById('applyBorderTint');

  function buildTabs(){
    tabsRoot.innerHTML = '';
    const tabs = [];
    tabs.push({key:'reform',label:'Reform'});
    tabs.push({key:'rip',label:'RIP'});
    State.state.customBorders.forEach((b,idx)=> tabs.push({key:'custom:'+idx,label:b.name}));
    tabs.forEach(t=>{
      const btn = document.createElement('button'); btn.textContent = t.label;
      btn.addEventListener('click', ()=> selectTab(t.key));
      tabsRoot.appendChild(btn);
    });
    updateActive();
  }

  function updateActive(){
    Array.from(tabsRoot.children).forEach(ch=>ch.classList.remove('active'));
    const key = State.state.marBorderMode;
    Array.from(tabsRoot.children).forEach(ch=>{
      if(ch.textContent.toLowerCase().includes(String(key).replace('custom:','').toLowerCase())) ch.classList.add('active');
    });
  }

  async function selectTab(key){
    if(key.startsWith('custom:')){
      const idx = parseInt(key.split(':')[1],10);
      const cb = State.state.customBorders[idx];
      if(cb){ State.state.marBorderImg = cb.img; State.state.marBorderMode = key; borderPreview.innerHTML = ''; const im = cb.img.cloneNode(); im.style.width='100%'; im.style.height='100%'; im.style.objectFit='cover'; borderPreview.appendChild(im); document.getElementById('borderTintControls').style.display='block'; Render.render(); }
    } else {
      State.state.marBorderMode = key;
      try{
        const fname = key === 'reform' ? 'reform.png' : 'rip.png';
        const img = await Utils.loadImage('assets/borders/' + fname);
        State.state.marBorderImg = img;
        borderPreview.innerHTML = ''; const im = img.cloneNode(); im.style.width='100%'; im.style.height='100%'; im.style.objectFit='cover'; borderPreview.appendChild(im);
        const detected = Utils.averageColor(img);
        const cur = State.state.borderTint;
        if(cur.r===255 && cur.g===255 && cur.b===255){
          State.state.borderTint = detected;
          tR.value = detected.r; tG.value = detected.g; tB.value = detected.b;
          borderColorPreview.style.background = `rgb(${detected.r},${detected.g},${detected.b})`;
        }
        document.getElementById('borderTintControls').style.display='block';
        Render.render();
      }catch(e){
        State.state.marBorderImg = null;
        borderPreview.innerHTML = '';
        document.getElementById('borderTintControls').style.display='none';
      }
    }
    updateActive();
    State.savePersistent();
  }

  addBorderBtn.addEventListener('click', ()=> borderUpload.click());
  borderUpload.addEventListener('change', async (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const img = await Utils.loadImageFromFile(f);
    State.addCustomBorder(img, f.name);
    buildTabs();
    selectTab('custom:' + (State.state.customBorders.length - 1));
  });

  [tR,tG,tB].forEach(el=>{
    el.addEventListener('input', ()=>{
      State.state.borderTint = { r: parseInt(tR.value,10), g: parseInt(tG.value,10), b: parseInt(tB.value,10) };
      document.getElementById('tRval').value = tR.value;
      document.getElementById('tGval').value = tG.value;
      document.getElementById('tBval').value = tB.value;
      borderColorPreview.style.background = `rgb(${tR.value},${tG.value},${tB.value})`;
      State.savePersistent();
      Render.render();
    });
  });
  applyTint.addEventListener('change', ()=> { State.state.applyBorderTint = applyTint.checked; Render.render(); });

  buildTabs();
  selectTab('reform');

  window.BorderControls = { buildTabs, selectTab };
})();
