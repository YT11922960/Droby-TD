window.GAME_CONFIG=Object.freeze({
 debugMode:true
});

window.addEventListener("DOMContentLoaded",()=>{
 const loadHudLayout=()=>{
  if(document.querySelector('script[data-feature="hud-layout-fix"]'))return;
  const hudScript=document.createElement("script");
  hudScript.src="hud-layout-fix.js?v=1";
  hudScript.async=false;
  hudScript.dataset.feature="hud-layout-fix";
  hudScript.addEventListener("error",()=>console.error("Failed to load HUD layout fix."),{once:true});
  document.body.appendChild(hudScript);
 };

 const loadBarricadeCrossingFix=()=>{
  const existing=document.querySelector('script[data-feature="barricade-crossing-fix"]');
  if(existing){loadHudLayout();return}
  const crossingScript=document.createElement("script");
  crossingScript.src="barricade-crossing-fix.js?v=1";
  crossingScript.async=false;
  crossingScript.dataset.feature="barricade-crossing-fix";
  crossingScript.addEventListener("load",loadHudLayout,{once:true});
  crossingScript.addEventListener("error",()=>{console.error("Failed to load bidirectional barricade fix.");loadHudLayout()},{once:true});
  document.body.appendChild(crossingScript);
 };

 const loadLateGameBalance=()=>{
  const existing=document.querySelector('script[data-feature="late-game-balance"]');
  if(existing){loadBarricadeCrossingFix();return}
  const balanceScript=document.createElement("script");
  balanceScript.src="late-game-balance.js?v=1";
  balanceScript.async=false;
  balanceScript.dataset.feature="late-game-balance";
  balanceScript.addEventListener("load",loadBarricadeCrossingFix,{once:true});
  balanceScript.addEventListener("error",()=>{console.error("Failed to load late-game balance fixes.");loadBarricadeCrossingFix()},{once:true});
  document.body.appendChild(balanceScript);
 };

 const loadTargetingFix=()=>{
  const existing=document.querySelector('script[data-feature="route-targeting-fix"]');
  if(existing){loadLateGameBalance();return}
  const targetingScript=document.createElement("script");
  targetingScript.src="route-targeting-fix.js?v=2";
  targetingScript.async=false;
  targetingScript.dataset.feature="route-targeting-fix";
  targetingScript.addEventListener("load",loadLateGameBalance,{once:true});
  targetingScript.addEventListener("error",()=>console.error("Failed to load route targeting fix."),{once:true});
  document.body.appendChild(targetingScript);
 };

 const existingWarehouse=document.querySelector('script[data-feature="snack-warehouse"]');
 if(existingWarehouse){loadTargetingFix();return}
 const warehouseScript=document.createElement("script");
 warehouseScript.src="snack-warehouse-v5.js?v=7";
 warehouseScript.async=false;
 warehouseScript.dataset.feature="snack-warehouse";
 warehouseScript.addEventListener("load",loadTargetingFix,{once:true});
 warehouseScript.addEventListener("error",()=>console.error("Failed to load snack warehouse feature."),{once:true});
 document.body.appendChild(warehouseScript);
});