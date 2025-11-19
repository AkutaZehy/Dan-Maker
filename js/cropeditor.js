// cropEditor.js - additional UI bindings (main transform logic is in transform.js)
(function(){
  // Note: Main transform event listeners are in transform.js to avoid duplicate bindings
  // Note: resetTransform button is handled in app.js

  // Advanced toggle UI (only defined here, not in transform.js)
  document.getElementById('advToggle').addEventListener('change', (e)=>{
    document.getElementById('advancedControls').style.display = e.target.checked ? 'block' : 'none';
  });

  window.CropEditor = {};
})();
