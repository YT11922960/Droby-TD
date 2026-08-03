(()=>{
 const ROUTE3_RATIO=Number(window.SNACK_WAREHOUSE?.routeRatio)||.10;
 const ROUTE3_NORMAL_SPEED=2;
 const ROUTE3_SMALL_SHIELD_SPEED=1.4;
 const ROUTE3_BLOCKED_KINDS=new Set([
  "giantShield","mainBoss","armorBoss","midBoss","golden"
 ]);

 function route3Eligible(index){
  const kind=spawnQueue[index];
  return !!kind&&!ROUTE3_BLOCKED_KINDS.has(kind);
 }

 function groupSizesFor(total){
  if(total<=0)return[];
  const groupCount=Math.max(1,Math.ceil(total/3));
  const base=Math.floor(total/groupCount),remainder=total%groupCount;
  return Array.from({length:groupCount},(_,index)=>base+(index>=groupCount-remainder?1:0));
 }

 function candidateWindows(count,size,selected,requireGap){
  const windows=[];
  for(let start=0;start+size<=count;start++){
   const end=start+size-1;
   let valid=true;
   for(let index=start;index<=end;index++){
    if(!route3Eligible(index)||selected.has(index)){valid=false;break}
   }
   if(!valid)continue;
   if(requireGap){
    for(let index=Math.max(0,start-2);index<=Math.min(count-1,end+2);index++){
     if(selected.has(index)){valid=false;break}
    }
   }
   if(valid)windows.push({start,end,center:(start+end)/2});
  }
  return windows;
 }

 function chooseWindow(count,size,targetCenter,selected){
  for(const requireGap of [true,false]){
   for(let actualSize=size;actualSize>=1;actualSize--){
    const windows=candidateWindows(count,actualSize,selected,requireGap);
    if(!windows.length)continue;
    windows.sort((a,b)=>Math.abs(a.center-targetCenter)-Math.abs(b.center-targetCenter));
    return windows[0];
   }
  }
  return null;
 }

 function clusteredRoute3Indices(count){
  if(count<=0)return[];
  const eligibleCount=Array.from({length:count},(_,index)=>index).filter(route3Eligible).length;
  if(!eligibleCount)return[];
  const targetCount=Math.min(eligibleCount,Math.max(1,Math.round(eligibleCount*ROUTE3_RATIO)));
  const sizes=groupSizesFor(targetCount),selected=new Set();

  sizes.forEach((size,groupIndex)=>{
   const targetCenter=(groupIndex+.5)*count/sizes.length;
   const window=chooseWindow(count,size,targetCenter,selected);
   if(!window)return;
   for(let index=window.start;index<=window.end;index++)selected.add(index);
  });

  // If a mixed roster prevented a full group, fill the remaining quota from
  // the nearest eligible entries without changing the total Route 3 ratio.
  if(selected.size<targetCount){
   const candidates=Array.from({length:count},(_,index)=>index)
    .filter(index=>route3Eligible(index)&&!selected.has(index))
    .sort((a,b)=>{
     const distanceA=selected.size?Math.min(...[...selected].map(index=>Math.abs(index-a))):0;
     const distanceB=selected.size?Math.min(...[...selected].map(index=>Math.abs(index-b))):0;
     return distanceA-distanceB||a-b;
    });
   while(selected.size<targetCount&&candidates.length)selected.add(candidates.shift());
  }
  return [...selected].sort((a,b)=>a-b);
 }

 const previousRouteAssignmentsForWave=routeAssignmentsForWave;
 routeAssignmentsForWave=function(waveNumber,count){
  const assignments=previousRouteAssignmentsForWave(waveNumber,count);
  if(gameMode!=="endless"||waveNumber<(window.SNACK_WAREHOUSE?.unlockWave||50))return assignments;

  // Remove the former evenly spaced Route 3 assignments, then rebuild them as
  // short consecutive raid groups. Giant shields always remain on Routes 1/2.
  for(let index=0;index<assignments.length;index++){
   if(assignments[index]!=="warehouse")continue;
   assignments[index]=routeBranchActive&&index%2?"branch":"main";
  }
  const route3Indices=clusteredRoute3Indices(count);
  route3Indices.forEach(index=>assignments[index]="warehouse");
  console.log("Route 3 raid groups",{
   wave:waveNumber,
   total:count,
   warehouse:route3Indices.length,
   indices:route3Indices,
   kinds:route3Indices.map(index=>spawnQueue[index])
  });
  return assignments;
 };

 const previousSpawnEnemy=spawnEnemy;
 spawnEnemy=function(){
  previousSpawnEnemy();
  const enemy=enemies.at(-1);
  if(!enemy||enemy.routeId!=="warehouse")return;
  const baseSpeed=enemy.warehouseBaseSpeed||enemy.speed/ROUTE3_NORMAL_SPEED;
  enemy.warehouseBaseSpeed=baseSpeed;
  enemy.warehouseOutboundSpeedMultiplier=enemy.kind==="shield"?ROUTE3_SMALL_SHIELD_SPEED:ROUTE3_NORMAL_SPEED;
  enemy.speed=baseSpeed*enemy.warehouseOutboundSpeedMultiplier;
 };

 function onlyReturnedHomeEnemiesRemain(){
  return active&&spawned>=spawnQueue.length&&enemies.length>0&&enemies.every(enemy=>
   !enemy.dead&&enemy.returningHome&&!enemy.returningHomeBoss&&!enemy.warehouseReturning
  );
 }

 const previousUpdate=update;
 update=function(){
  if(!onlyReturnedHomeEnemiesRemain())return previousUpdate();

  // Temporarily remove harmless returners so the original Wave-complete path
  // runs normally. Restore them afterward; they keep walking during preparation
  // and may still be visible when the next Wave starts.
  const returningEnemies=enemies.slice();
  enemies=[];
  try{
   previousUpdate();
  }finally{
   const survivors=returningEnemies.filter(enemy=>!enemy.dead);
   if(survivors.length)enemies.push(...survivors);
  }
 };

 window.ROUTE3_FLOW=Object.freeze({
  ratio:ROUTE3_RATIO,
  normalSpeed:ROUTE3_NORMAL_SPEED,
  smallShieldSpeed:ROUTE3_SMALL_SHIELD_SPEED,
  giantShieldAllowed:false,
  groupSize:"2-3",
  returningHomeAllowsWaveClear:true
 });
})();