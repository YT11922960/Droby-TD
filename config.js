window.GAME_CONFIG=Object.freeze({
 debugMode:true
});

window.addEventListener("DOMContentLoaded",()=>{
 if(document.querySelector('script[data-feature="snack-warehouse"]'))return;
 const warehouseScript=document.createElement("script");
 warehouseScript.src="snack-warehouse-v5.js?v=7";
 warehouseScript.async=false;
 warehouseScript.dataset.feature="snack-warehouse";
 warehouseScript.addEventListener("error",()=>console.error("Failed to load snack warehouse feature."),{once:true});
 warehouseScript.addEventListener("load",()=>{
  if(document.querySelector('script[data-feature="route-targeting-fix"]'))return;
  const targetingScript=document.createElement("script");
  targetingScript.src="route-targeting-fix.js?v=1";
  targetingScript.async=false;
  targetingScript.dataset.feature="route-targeting-fix";
  targetingScript.addEventListener("error",()=>console.error("Failed to load route targeting fix."),{once:true});
  document.body.appendChild(targetingScript);
 },{once:true});
 document.body.appendChild(warehouseScript);
});