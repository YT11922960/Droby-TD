(()=>{
 const EXTRA_SLOT_COSTS=[1000,2500,6000,12000,24000,48000];
 const MAX_SLOT_RESEARCH_LEVEL=6;
 const MAX_LATE_GAME_TOWER_SLOTS=28;

 // Extend the existing placement-slot research without adding artificial Wave gates.
 researchDefinitions.slots.max=MAX_SLOT_RESEARCH_LEVEL;
 researchDefinitions.slots.effect="タワー配置上限 +2 / Lv（最大28基）";

 const originalLoadResearch=loadResearch;
 loadResearch=function(){
  const levels=originalLoadResearch();
  levels.slots=Math.max(0,Math.min(MAX_SLOT_RESEARCH_LEVEL,Math.floor(Number(levels.slots)||0)));
  if(debugSession)levels.slots=MAX_SLOT_RESEARCH_LEVEL;
  return levels;
 };

 const originalResearchCostFor=researchCostFor;
 researchCostFor=function(key,level){
  if(key==="slots")return EXTRA_SLOT_COSTS[level]||0;
  return originalResearchCostFor(key,level);
 };

 towerSlotsForResearchLevel=function(level){
  const safeLevel=Math.max(0,Math.min(MAX_SLOT_RESEARCH_LEVEL,Math.floor(Number(level)||0)));
  return Math.min(MAX_LATE_GAME_TOWER_SLOTS,INITIAL_TOWER_SLOTS+safeLevel*2);
 };

 function isPriorityPeaceCandidate(enemy){
  if(
   !enemy||
   enemy.warehouseReturning||
   enemy.dead||
   enemy.returningHome||
   enemy.returningHomeBoss||
   enemy.hp<=0||
   enemy.boss
  )return false;

  // Small-shield mice are the only special enemy added to the return-home pool.
  // Giant shields and other support/special enemies remain excluded.
  if(enemy.kind==="shield")return true;
  return isPeaceReturnCandidate(enemy);
 }

 function peaceReturnPriority(enemy){
  if(enemy.kind==="shield"&&(enemy.shieldHp||0)>0)return 3;
  if(enemy.kind==="shield")return 2;
  return enemy.hp/enemy.maxHp>=.7?1:0;
 }

 function selectPriorityPeaceTargets(candidates,count){
  return [...candidates].sort((a,b)=>
   peaceReturnPriority(b)-peaceReturnPriority(a)||
   enemyPathProgress(b)-enemyPathProgress(a)
  ).slice(0,count);
 }

 // "おかえり" is a call, not a projectile. It ignores the warehouse wall,
 // while thieves already carrying snacks home remain ineligible.
 activatePeaceTower=function(t){
  const range=effectiveRange(t);
  const candidates=enemies.filter(enemy=>
   isPriorityPeaceCandidate(enemy)&&
   Math.hypot(enemy.x-t.x,enemy.y-t.y)<=range
  );
  const returnTargets=selectPriorityPeaceTargets(candidates,t.type.returnHomeCount||3);
  if(!returnTargets.length)return;
  spawnPeaceCallEffect(t);
  playPeaceCallSound();
  returnTargets.forEach(sendEnemyHome);
  console.log("Peace tower activated",{
   returned:returnTargets.length,
   wallIgnored:true,
   smallShieldCandidates:candidates.filter(enemy=>enemy.kind==="shield").length,
   healthyCandidates:candidates.filter(enemy=>enemy.hp/enemy.maxHp>=.7).length,
   range:Math.round(range),
   targets:returnTargets.map(enemy=>({
    kind:enemy.kind,
    routeId:enemy.routeId,
    shieldHp:Math.max(0,Math.round(enemy.shieldHp||0)),
    priority:peaceReturnPriority(enemy),
    hpRate:Number((enemy.hp/enemy.maxHp).toFixed(2)),
    progress:Number(enemyPathProgress(enemy).toFixed(2))
   }))
  });
 };

 function drawPeaceWallBypassPreview(source){
  const route=window.SNACK_WAREHOUSE?.route;
  if(!route?.length||!source||source.range<=0)return;
  ctx.save();
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.strokeStyle="rgba(255,225,92,.98)";
  ctx.shadowColor="#ffe05b";
  ctx.shadowBlur=10;
  ctx.lineWidth=9;
  for(let index=0;index<route.length-1;index++){
   const a=route[index],b=route[index+1];
   const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
   const segmentLength=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(Math.hypot(source.x-mx,source.y-my)>source.range+segmentLength*.55)continue;
   ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
  }
  ctx.shadowBlur=0;
  const text="♡ おかえり：防壁を無視";
  const x=Math.max(165,Math.min(1035,source.x));
  const y=Math.max(95,Math.min(700,source.y+72));
  ctx.font="bold 12px 'Mochiy Pop One',sans-serif";
  ctx.textAlign="center";
  const width=ctx.measureText(text).width+20;
  ctx.fillStyle="rgba(44,31,20,.86)";
  ctx.strokeStyle="rgba(255,238,185,.85)";
  ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(x-width/2,y-15,width,25,8);ctx.fill();ctx.stroke();
  ctx.fillStyle="#fff2bd";ctx.fillText(text,x,y+3);
  ctx.restore();
 }

 const previousDrawSelectedTowerRanges=drawSelectedTowerRanges;
 drawSelectedTowerRanges=function(tower){
  previousDrawSelectedTowerRanges(tower);
  if(tower?.kind!=="peace")return;
  drawPeaceWallBypassPreview({x:tower.x,y:tower.y-35,range:effectiveRange(tower)});
 };

 const previousDraw=draw;
 draw=function(){
  previousDraw();
  if(selectedTower||selectedType!=="peace"||hoveredSpot<0)return;
  const spot=spots[hoveredSpot],type=types.peace;
  if(!spot||!type)return;
  const range=(type.range||0)*weather("range")*(1+researchLevel("range")*.03);
  drawPeaceWallBypassPreview({x:spot[0],y:spot[1]-35,range});
 };

 try{refreshUI()}catch(error){console.warn("Late-game balance UI refresh skipped",error)}

 window.LATE_GAME_BALANCE=Object.freeze({
  maxSlotResearchLevel:MAX_SLOT_RESEARCH_LEVEL,
  maxTowerSlots:MAX_LATE_GAME_TOWER_SLOTS,
  slotCosts:[...EXTRA_SLOT_COSTS],
  peaceIgnoresWarehouseWall:true,
  peacePrioritizesSmallShields:true
 });
})();