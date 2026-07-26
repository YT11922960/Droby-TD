(()=>{
 const warehouse=window.SNACK_WAREHOUSE;
 if(!warehouse?.blocksShot)return;

 const blocked=(x1,y1,x2,y2)=>warehouse.blocksShot(x1,y1,x2,y2);
 const towerSource=tower=>({
  x:tower.x,
  y:tower.y-35,
  range:effectiveRange(tower),
  kind:tower.kind
 });
 const placementSource=()=>{
  if(!selectedType||hoveredSpot<0)return null;
  const type=types[selectedType],spot=spots[hoveredSpot];
  if(!type||!spot||!(type.damage>0||selectedType==="peace"))return null;
  return{
   x:spot[0],
   y:spot[1]-35,
   range:(type.range||0)*weather("range")*(1+researchLevel("range")*.03),
   kind:selectedType
  };
 };
 const ignoresBarricade=kind=>kind==="star"||kind==="peace";
 const enemyVisibleFrom=(x,y,enemy)=>!blocked(x,y,enemy.x,enemy.y);

 function withBarricadeVisibleEnemies(x,y,callback,{excludeWarehouseReturning=false}={}){
  const allEnemies=enemies;
  enemies=allEnemies.filter(enemy=>
   enemyVisibleFrom(x,y,enemy)&&
   (!excludeWarehouseReturning||!enemy.warehouseReturning)
  );
  try{return callback()}finally{enemies=allEnemies}
 }

 // The barricade is a true boundary: it blocks attacks in both directions.
 // Star attacks and the Peace tower's "おかえり" remain special exceptions.
 const previousSelectTowerTarget=selectTowerTarget;
 selectTowerTarget=function(tower,targets){
  if(ignoresBarricade(tower.kind))return previousSelectTowerTarget(tower,targets);
  const visible=targets.filter(enemy=>enemyVisibleFrom(tower.x,tower.y-35,enemy));
  return previousSelectTowerTarget(tower,visible);
 };

 const previousApplyHimawariAreaSlow=applyHimawariAreaSlow;
 applyHimawariAreaSlow=function(center,profile){
  return withBarricadeVisibleEnemies(center.x,center.y,()=>previousApplyHimawariAreaSlow(center,profile));
 };

 const previousUpdateShot=updateShot;
 updateShot=function(shot){
  if(shot.dead||shot.kind==="star")return previousUpdateShot(shot);

  if(shot.spread){
   const nextX=shot.x+Math.cos(shot.angle)*7;
   const nextY=shot.y+Math.sin(shot.angle)*7;
   if(blocked(shot.x,shot.y,nextX,nextY)){
    addEffectParticle({type:"spark",x:(shot.x+nextX)/2,y:(shot.y+nextY)/2,vx:0,vy:0,life:18,size:3,color:"#e7c78c"},true);
    shot.dead=true;
    return;
   }
   return previousUpdateShot(shot);
  }

  if(!shot.target||shot.target.dead||shot.target.returningHome)return previousUpdateShot(shot);
  const dx=shot.target.x-shot.x,dy=shot.target.y-shot.y,distance=Math.hypot(dx,dy);

  if(distance<10+shot.target.hitRadius*.4&&(shot.area||shot.kind==="hima")){
   return withBarricadeVisibleEnemies(shot.target.x,shot.target.y,()=>previousUpdateShot(shot));
  }

  if(distance>0){
   const nextX=shot.x+dx/distance*7;
   const nextY=shot.y+dy/distance*7;
   if(blocked(shot.x,shot.y,nextX,nextY)){
    addEffectParticle({type:"spark",x:(shot.x+nextX)/2,y:(shot.y+nextY)/2,vx:0,vy:0,life:18,size:3,color:"#e7c78c"},true);
    shot.dead=true;
    return;
   }
  }
  return previousUpdateShot(shot);
 };

 function previewRoutes(){
  const routes=[{id:"main",points:path}];
  if(routeBranchActive)routes.push({id:"branch",points:routePathById("branch")});
  const nextWave=wave+1;
  if(gameMode==="endless"&&nextWave>=warehouse.unlockWave)routes.push({id:"warehouse",points:warehouse.route});
  return routes;
 }

 function drawAllRouteVisibility(source){
  if(!source||source.range<=0)return;
  const bypass=ignoresBarricade(source.kind);
  let visibleCount=0,blockedCount=0;

  ctx.save();
  ctx.lineCap="round";
  ctx.lineJoin="round";

  for(const route of previewRoutes()){
   const points=route.points;
   for(let index=0;index<points.length-1;index++){
    const a=points[index],b=points[index+1];
    const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
    const halfLength=Math.hypot(b[0]-a[0],b[1]-a[1])*.55;
    if(Math.hypot(source.x-mx,source.y-my)>source.range+halfLength)continue;

    const isBlocked=!bypass&&blocked(source.x,source.y,mx,my);
    if(isBlocked)blockedCount++;else visibleCount++;
    ctx.strokeStyle=isBlocked?"rgba(239,103,91,.96)":"rgba(255,225,92,.96)";
    ctx.shadowColor=isBlocked?"#d6554c":"#ffe05b";
    ctx.shadowBlur=8;
    ctx.lineWidth=8;
    ctx.setLineDash(isBlocked?[7,6]:[]);
    ctx.beginPath();
    ctx.moveTo(a[0],a[1]);
    ctx.lineTo(b[0],b[1]);
    ctx.stroke();
   }
  }

  ctx.setLineDash([]);
  ctx.shadowBlur=0;
  if(visibleCount||blockedCount){
   const text=source.kind==="star"
    ?"★ 全ルート攻撃可｜防壁を無視"
    :source.kind==="peace"
     ?"♡ おかえり：全ルート有効｜防壁を無視"
     :blockedCount
      ?"全ルート　黄色：攻撃可　赤：防壁で遮断"
      :"全ルート　黄色：攻撃可能";
   const x=Math.max(190,Math.min(1010,source.x));
   const y=Math.max(95,Math.min(700,source.y+76));
   ctx.font="bold 12px 'Mochiy Pop One',sans-serif";
   ctx.textAlign="center";
   const width=ctx.measureText(text).width+22;
   ctx.fillStyle="rgba(44,31,20,.84)";
   ctx.strokeStyle="rgba(255,238,185,.84)";
   ctx.lineWidth=1.5;
   ctx.beginPath();
   ctx.roundRect(x-width/2,y-15,width,25,8);
   ctx.fill();
   ctx.stroke();
   ctx.fillStyle="#fff2bd";
   ctx.fillText(text,x,y+3);
  }
  ctx.restore();
 }

 const previousDrawSelectedTowerRanges=drawSelectedTowerRanges;
 drawSelectedTowerRanges=function(tower){
  previousDrawSelectedTowerRanges(tower);
  if(tower&&(tower.damage>0||tower.kind==="peace"))drawAllRouteVisibility(towerSource(tower));
 };

 const previousDraw=draw;
 draw=function(){
  previousDraw();
  if(!selectedTower)drawAllRouteVisibility(placementSource());
 };

 window.BARRICADE_CROSSING_FIX=Object.freeze({
  bidirectional:true,
  allRoutePreview:true,
  ignoresBarricade:["star","peace"]
 });
})();