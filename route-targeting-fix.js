(()=>{
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

 function compareFrontmost(a,b){
  const distanceDifference=remainingDistanceToObjective(a)-remainingDistanceToObjective(b);
  if(Math.abs(distanceDifference)>.01)return distanceDifference;
  // Stable fallback for enemies at effectively the same location.
  return (a.hp/a.maxHp)-(b.hp/b.maxHp);
 }

 selectTowerTarget=function(t,targets){
  if(!targets?.length)return undefined;
  if(t.kind!=="star")return targets.sort(compareFrontmost)[0];

  const shieldTargets=targets.filter(enemy=>starShieldPriority(enemy)>0&&enemy.shieldHp>0);
  if(shieldTargets.length){
   return shieldTargets.sort((a,b)=>
    starShieldPriority(b)-starShieldPriority(a)||
    b.shieldHp-a.shieldHp||
    compareFrontmost(a,b)
   )[0];
  }

  return targets.sort((a,b)=>(b.boss?1:0)-(a.boss?1:0)||compareFrontmost(a,b))[0];
 };

 window.ROUTE_TARGETING_FIX=Object.freeze({remainingDistanceToObjective});
})();