(()=>{
 const ROUTE_LOCK_FRAMES=180;
 const routeDistanceCache=new WeakMap();

 function routeMetrics(route){
  let cached=routeDistanceCache.get(route);
  if(cached)return cached;
  const segmentLengths=[];
  const suffixDistances=Array(route.length).fill(0);
  for(let index=0;index<route.length-1;index++){
   const a=route[index],b=route[index+1];
   segmentLengths[index]=Math.hypot(b[0]-a[0],b[1]-a[1]);
  }
  for(let index=route.length-2;index>=0;index--)suffixDistances[index]=suffixDistances[index+1]+segmentLengths[index];
  cached={segmentLengths,suffixDistances};
  routeDistanceCache.set(route,cached);
  return cached;
 }

 function remainingDistanceToObjective(enemy){
  const route=enemyRoutePath(enemy);
  if(!route?.length)return Infinity;
  const segment=Math.max(0,Math.min(route.length-1,Math.floor(enemy.segment||0)));
  const next=route[segment+1];
  if(!next)return 0;
  const {suffixDistances}=routeMetrics(route);
  return Math.hypot(next[0]-enemy.x,next[1]-enemy.y)+suffixDistances[segment+1];
 }

 // The original target selector sorts by enemyPathProgress in descending order.
 // Returning negative remaining distance keeps the existing warehouse wall filter,
 // Star priorities, and Peace-tower helpers while making different routes comparable.
 enemyPathProgress=function(enemy){
  const distance=remainingDistanceToObjective(enemy);
  return Number.isFinite(distance)?-distance:-Infinity;
 };

 const previousSelectTowerTarget=selectTowerTarget;
 selectTowerTarget=function(t,targets){
  if(!targets?.length)return undefined;

  // Star keeps its global shield/boss role and does not lock to one route.
  if(t.kind==="star")return previousSelectTowerTarget(t,targets);

  const now=Number.isFinite(frame)?frame:0;
  if(t.targetRouteId&&now<(t.targetRouteLockUntil||0)){
   const sameRouteTargets=targets.filter(enemy=>enemy.routeId===t.targetRouteId);
   if(sameRouteTargets.length){
    const lockedTarget=previousSelectTowerTarget(t,sameRouteTargets);
    if(lockedTarget)return lockedTarget;
   }
  }

  const target=previousSelectTowerTarget(t,targets);
  if(!target){
   t.targetRouteId=null;
   t.targetRouteLockUntil=0;
   return undefined;
  }

  t.targetRouteId=target.routeId;
  t.targetRouteLockUntil=now+ROUTE_LOCK_FRAMES;
  return target;
 };

 window.ROUTE_TARGETING_FIX=Object.freeze({
  remainingDistanceToObjective,
  routeLockFrames:ROUTE_LOCK_FRAMES
 });
})();