window.GAME_CONFIG=Object.freeze({
 debugMode:true
});

window.addEventListener("DOMContentLoaded",()=>{
 const loadRoute3Flow=()=>{
  if(document.querySelector('script[data-feature="route3-flow-fix"]'))return;
  const flowScript=document.createElement("script");
  flowScript.src="route3-flow-fix.js?v=1";
  flowScript.async=false;
  flowScript.dataset.feature="route3-flow-fix";
  flowScript.addEventListener("error",()=>console.error("Failed to load Route 3 flow fixes."),{once:true});
  document.body.appendChild(flowScript);
 };

 const loadHudLayout=()=>{
  const existing=document.querySelector('script[data-feature="hud-layout-fix"]');
  if(existing){loadRoute3Flow();return}
  const hudScript=document.createElement("script");
  hudScript.src="hud-layout-fix.js?v=1";
  hudScript.async=false;
  hudScript.dataset.feature="hud-layout-fix";
  hudScript.addEventListener("load",loadRoute3Flow,{once:true});
  hudScript.addEventListener("error",()=>{console.error("Failed to load HUD layout fix.");loadRoute3Flow()},{once:true});
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
  balanceScript.src="late-game-balance.js?v=2";
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

 const loadFinalMap=()=>{
  const files=[
   "final-map-data-01.js?v=4",
   "final-map-data-02.js?v=4",
   "final-map-data-03.js?v=4",
   "final-map-data-04.js?v=4",
   "final-map-data-05.js?v=4",
   "final-map-data-06.js?v=4",
   "final-map-data-07.js?v=4",
   "final-map-data-08.js?v=4",
   "final-map-data-09.js?v=4",
   "final-map-background.js?v=4",
   "final-map-layout-fix.js?v=1",
   "final-map-canvas-restore.js?v=1"
  ];
  let index=0;
  const next=()=>{
   if(index>=files.length){loadTargetingFix();return}
   const file=files[index++],feature=`final-map-hq-${index}`;
   if(document.querySelector(`script[data-feature="${feature}"]`)){next();return}
   const script=document.createElement("script");
   script.src=file;script.async=false;script.dataset.feature=feature;
   script.addEventListener("load",next,{once:true});
   script.addEventListener("error",()=>{console.error(`Failed to load ${file}.`);loadTargetingFix()},{once:true});
   document.body.appendChild(script);
  };
  next();
 };

 const existingWarehouse=document.querySelector('script[data-feature="snack-warehouse"]');
 if(existingWarehouse){loadFinalMap();return}
 const warehouseScript=document.createElement("script");
 warehouseScript.src="snack-warehouse-v5.js?v=7";
 warehouseScript.async=false;
 warehouseScript.dataset.feature="snack-warehouse";
 warehouseScript.addEventListener("load",loadFinalMap,{once:true});
 warehouseScript.addEventListener("error",()=>console.error("Failed to load snack warehouse feature."),{once:true});
 document.body.appendChild(warehouseScript);
});