(()=>{
 const WAREHOUSE_ROUTE_UNLOCK_WAVE=50;
 const WAREHOUSE_ROUTE_RATIO=.10;
 const WAREHOUSE_OUTBOUND_SPEED_MULTIPLIER=2;
 const WAREHOUSE_RETURN_SPEED_MULTIPLIER=.5;
 const WAREHOUSE_THEFT_RATE=.02;
 const WAREHOUSE_RECOVERY_RATE=.6;
 const BARRICADE_BLOCK_COUNT=10;
 const warehouse={x:132,y:190,doorX:198,doorY:202};
 const warehouseRoute=[
  [953,100],[914,82],[858,68],[790,60],[716,62],[642,73],
  [568,91],[497,113],[428,137],[362,160],[305,179],[254,194],[198,202]
 ];
 const warehouseTurnIndex=warehouseRoute.length-1;
 const warehouseReturnEntranceIndex=warehouseTurnIndex+(warehouseRoute.length-1);
 const warehouseTraversalRoute=[
  ...warehouseRoute.map(point=>[...point]),
  ...warehouseRoute.slice(0,-1).reverse().map(point=>[...point]),
  [1010,90]
 ];
 const warehouseBuildSpots=[
  [105,332],[215,330],[318,286],[374,214],[382,104],[282,72],[492,82]
 ];
 const warehouseBarricade={
  label:"倉庫ルート",
  startWave:WAREHOUSE_ROUTE_UNLOCK_WAVE,
  labelPosition:[690,198],
  points:[[900,150],[830,145],[760,145],[690,153],[620,168],[550,190],[485,215],[420,238],[355,257],[290,267],[230,270]]
 };
 const warehouseBlockedKinds=new Set(["mainBoss","armorBoss","midBoss","golden"]);
 let warehouseSpotStart=-1;
 let pendingSnackDelivery=0;
 let lastDeliveryFrame=-Infinity;
 const snackFlights=[];

 function warehouseModeActive(){return gameMode==="endless"}
 function warehouseRouteOpen(waveNumber=wave+1){return warehouseModeActive()&&waveNumber>=WAREHOUSE_ROUTE_UNLOCK_WAVE}
 function barricadeProgress(){
  if(!warehouseRouteOpen())return 0;
  return Math.max(0,Math.min(BARRICADE_BLOCK_COUNT,wave-WAREHOUSE_ROUTE_UNLOCK_WAVE+1));
 }
 function barricadeSegments(count=barricadeProgress()){
  const segments=[];
  for(let index=0;index<Math.min(count,warehouseBarricade.points.length-1);index++)segments.push({index,a:warehouseBarricade.points[index],b:warehouseBarricade.points[index+1]});
  return segments;
 }

 function syncWarehouseBuildSpots(){
  if(warehouseModeActive()){
   if(warehouseSpotStart>=0)return;
   warehouseSpotStart=spots.length;
   warehouseBuildSpots.forEach(point=>spots.push([...point]));
   return;
  }
  if(warehouseSpotStart<0)return;
  const occupied=towers?.some(tower=>tower.spot>=warehouseSpotStart&&tower.spot<warehouseSpotStart+warehouseBuildSpots.length);
  if(occupied)return;
  spots.splice(warehouseSpotStart,warehouseBuildSpots.length);
  warehouseSpotStart=-1;
 }

 function strokeRoute(points,color,width,alpha=1,dash=[]){
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";ctx.setLineDash(dash);ctx.beginPath();
  points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.stroke();ctx.restore();
 }

 function drawClosedWarehouseApproach(){
  const apron=warehouseRoute.slice(-3);
  strokeRoute(apron,"#73502f",34,.22);strokeRoute(apron,"#d0ad78",24,.24);
  ctx.save();ctx.translate(257,194);ctx.globalAlpha=.8;ctx.strokeStyle="#654522";ctx.fillStyle="#a8753d";ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(-18,-13);ctx.lineTo(18,13);ctx.moveTo(-18,13);ctx.lineTo(18,-13);ctx.stroke();
  [-19,19].forEach(x=>ctx.fillRect(x-3,-20,6,40));ctx.restore();
 }

 function drawOpenWarehouseRoute(){
  strokeRoute(warehouseRoute,"#694522",48,.48);strokeRoute(warehouseRoute,"#9a6838",39,.58);strokeRoute(warehouseRoute,"#d3aa70",29,.68);strokeRoute(warehouseRoute,"#f3dda6",5,.36,[15,18]);
  ctx.save();ctx.globalAlpha=.78;ctx.font="22px serif";ctx.textAlign="center";
  [[896,81],[540,99],[276,188]].forEach(([x,y])=>{ctx.fillText("🍃",x-18,y-12);ctx.fillText("🪵",x+18,y-8)});
  ctx.font="bold 14px 'Mochiy Pop One',sans-serif";ctx.fillStyle="#5b3a1d";ctx.strokeStyle="rgba(255,239,190,.9)";ctx.lineWidth=4;ctx.strokeText("ルート3・おやつ倉庫",850,49);ctx.fillText("ルート3・おやつ倉庫",850,49);ctx.restore();
 }

 function drawBarricadeBlock(segment){
  const [ax,ay]=segment.a,[bx,by]=segment.b,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),variant=(segment.index+1)%3;
  ctx.save();ctx.translate((ax+bx)/2,(ay+by)/2);ctx.rotate(angle);ctx.fillStyle="rgba(35,24,14,.3)";ctx.beginPath();ctx.ellipse(0,12,length*.46,10,0,0,Math.PI*2);ctx.fill();
  const wood=ctx.createLinearGradient(0,-13,0,14);wood.addColorStop(0,variant===0?"#b77c43":variant===1?"#a96d3a":"#c08a50");wood.addColorStop(1,variant===0?"#76502e":variant===1?"#684426":"#805432");
  ctx.fillStyle=wood;ctx.strokeStyle="#4e321e";ctx.lineWidth=2.2;ctx.beginPath();ctx.roundRect(-length*.46,-13,length*.92,27,7);ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(236,190,111,.28)";ctx.lineWidth=1.2;[-6,3].forEach(y=>{ctx.beginPath();ctx.moveTo(-length*.4,y);ctx.lineTo(length*.4,y+variant-1);ctx.stroke()});
  ctx.fillStyle="#4a321f";[-length*.31,length*.31].forEach(x=>{ctx.beginPath();ctx.roundRect(x-3,-18,6,36,2);ctx.fill()});
  ctx.fillStyle="#c6a061";[-length*.31,length*.31].forEach(x=>{ctx.beginPath();ctx.arc(x,-5,1.8,0,Math.PI*2);ctx.fill()});
  if(segment.index%3===1){ctx.globalAlpha=.72;ctx.font="15px serif";ctx.textAlign="center";ctx.fillText("🍃",0,-14)}ctx.restore();
 }

 function drawNextBarricadeSite(count){
  if(count>=BARRICADE_BLOCK_COUNT)return;
  const a=warehouseBarricade.points[count],b=warehouseBarricade.points[count+1];if(!a||!b)return;
  const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,angle=Math.atan2(b[1]-a[1],b[0]-a[0]),length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=.34;ctx.strokeStyle="#e7c98d";ctx.lineWidth=2;ctx.setLineDash([7,7]);ctx.beginPath();ctx.roundRect(-length*.43,-12,length*.86,24,6);ctx.stroke();ctx.setLineDash([]);ctx.rotate(-angle);ctx.globalAlpha=.72;ctx.font="18px serif";ctx.textAlign="center";ctx.fillText("🪵",0,-13);ctx.restore();
 }

 function drawBarricadeStatus(count){
  if(!warehouseRouteOpen())return;
  const [x,y]=warehouseBarricade.labelPosition,complete=count>=BARRICADE_BLOCK_COUNT,text=complete?"倉庫防壁 完成":`倉庫防壁 ${count}/${BARRICADE_BLOCK_COUNT}`;
  ctx.save();ctx.textAlign="center";ctx.font="bold 12px 'Mochiy Pop One',sans-serif";const width=ctx.measureText(text).width+20;ctx.fillStyle="rgba(58,40,23,.76)";ctx.strokeStyle="rgba(242,216,156,.72)";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-width/2,y-14,width,24,8);ctx.fill();ctx.stroke();ctx.fillStyle="#fff0bd";ctx.fillText(text,x,y+3);ctx.restore();
 }

 function drawBarricade(){
  if(!warehouseRouteOpen())return;
  const count=barricadeProgress();barricadeSegments(count).forEach(drawBarricadeBlock);drawNextBarricadeSite(count);drawBarricadeStatus(count);
 }

 function cross(ax,ay,bx,by,cx,cy){return(bx-ax)*(cy-ay)-(by-ay)*(cx-ax)}
 function pointOnSegment(px,py,ax,ay,bx,by){return Math.abs(cross(ax,ay,bx,by,px,py))<.001&&px>=Math.min(ax,bx)-.001&&px<=Math.max(ax,bx)+.001&&py>=Math.min(ay,by)-.001&&py<=Math.max(ay,by)+.001}
 function segmentsIntersect(a,b,c,d){
  const c1=cross(a[0],a[1],b[0],b[1],c[0],c[1]),c2=cross(a[0],a[1],b[0],b[1],d[0],d[1]),c3=cross(c[0],c[1],d[0],d[1],a[0],a[1]),c4=cross(c[0],c[1],d[0],d[1],b[0],b[1]);
  if(((c1>0&&c2<0)||(c1<0&&c2>0))&&((c3>0&&c4<0)||(c3<0&&c4>0)))return true;
  return Math.abs(c1)<.001&&pointOnSegment(c[0],c[1],a[0],a[1],b[0],b[1])||Math.abs(c2)<.001&&pointOnSegment(d[0],d[1],a[0],a[1],b[0],b[1])||Math.abs(c3)<.001&&pointOnSegment(a[0],a[1],c[0],c[1],d[0],d[1])||Math.abs(c4)<.001&&pointOnSegment(b[0],b[1],c[0],c[1],d[0],d[1]);
 }
 function lineBlocked(x1,y1,x2,y2){return barricadeSegments().some(({a,b})=>segmentsIntersect([x1,y1],[x2,y2],a,b))}
 function enemyBlockedFrom(x,y,enemy){return enemy?.routeId==="warehouse"&&lineBlocked(x,y,enemy.x,enemy.y)}
 function withVisibleEnemiesFrom(x,y,callback,{excludeWarehouseReturning=false}={}){
  const allEnemies=enemies;
  enemies=allEnemies.filter(enemy=>!enemyBlockedFrom(x,y,enemy)&&(!excludeWarehouseReturning||!enemy.warehouseReturning));
  try{return callback()}finally{enemies=allEnemies}
 }

 function snackStackCount(){const current=Math.max(0,Number(coins)||0);return Math.max(1,Math.min(9,Math.floor(Math.log2(current/80+1))+1))}
 function drawSnackSack(x,y,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle="#d6ad69";ctx.strokeStyle="#75512c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-11);ctx.quadraticCurveTo(-13,0,-10,13);ctx.quadraticCurveTo(0,20,10,13);ctx.quadraticCurveTo(13,0,8,-11);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle="#8c6032";ctx.beginPath();ctx.moveTo(-8,-9);ctx.lineTo(8,-9);ctx.stroke();ctx.fillStyle="#6e4426";ctx.font="11px serif";ctx.textAlign="center";ctx.fillText("🍖",0,7);ctx.restore();
 }

 function drawWarehouse(){
  const {x,y}=warehouse;ctx.save();ctx.translate(x,y);ctx.fillStyle="rgba(34,25,15,.28)";ctx.beginPath();ctx.ellipse(0,54,83,20,0,0,Math.PI*2);ctx.fill();
  const wall=ctx.createLinearGradient(0,-28,0,58);wall.addColorStop(0,"#b98750");wall.addColorStop(1,"#76502f");ctx.fillStyle=wall;ctx.strokeStyle="#52351f";ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-62,-25,124,82,11);ctx.fill();ctx.stroke();ctx.strokeStyle="rgba(76,47,25,.38)";ctx.lineWidth=1.5;[-40,-14,14,40].forEach(px=>{ctx.beginPath();ctx.moveTo(px,-22);ctx.lineTo(px,54);ctx.stroke()});
  ctx.fillStyle="#614023";ctx.strokeStyle="#3d2818";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-76,-23);ctx.lineTo(0,-72);ctx.lineTo(76,-23);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle="rgba(225,181,105,.32)";ctx.lineWidth=2;[-48,-24,0,24,48].forEach(px=>{ctx.beginPath();ctx.moveTo(px,-29);ctx.lineTo(0,-68);ctx.stroke()});
  ctx.fillStyle="#4d321e";ctx.strokeStyle="#2c1c11";ctx.beginPath();ctx.roundRect(28,4,30,53,5);ctx.fill();ctx.stroke();ctx.fillStyle="#d9b467";ctx.beginPath();ctx.arc(49,31,2.6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f1d98f";ctx.strokeStyle="#6b4b27";ctx.beginPath();ctx.roundRect(-43,-2,27,24,4);ctx.fill();ctx.stroke();ctx.strokeStyle="#8c6a3e";ctx.beginPath();ctx.moveTo(-29,-2);ctx.lineTo(-29,22);ctx.moveTo(-43,10);ctx.lineTo(-16,10);ctx.stroke();
  ctx.fillStyle="#a46f35";ctx.strokeStyle="#5c3b1f";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-57,34,30,23,3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.roundRect(-30,40,27,17,3);ctx.fill();ctx.stroke();
  const sacks=snackStackCount();for(let i=0;i<sacks;i++){const row=i<5?0:1,index=row===0?i:i-5;drawSnackSack(-47+index*21+row*11,48-row*26,row?0.78:0.9)}
  ctx.shadowColor="rgba(255,225,137,.7)";ctx.shadowBlur=7;ctx.fillStyle="#f0d28b";ctx.strokeStyle="#765126";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-57,-69,114,27,6);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#56381d";ctx.font="bold 15px 'Mochiy Pop One',sans-serif";ctx.textAlign="center";ctx.fillText("🍖 おやつ倉庫",0,-50);ctx.restore();
 }

 function spawnSnackFlight(){
  if(pendingSnackDelivery<=0||snackFlights.length>=7)return;const amount=pendingSnackDelivery;pendingSnackDelivery=0;lastDeliveryFrame=Number.isFinite(frame)?frame:0;
  snackFlights.push({amount,t:0,x0:610+Math.random()*170,y0:40+Math.random()*45,curveX:360+Math.random()*80,curveY:20+Math.random()*45,phase:Math.random()*Math.PI*2});
 }
 function queueSnackDelivery(amount){pendingSnackDelivery+=Math.max(0,Math.floor(Number(amount)||0));if(snackFlights.length<3&&(Number.isFinite(frame)?frame:0)-lastDeliveryFrame>10)spawnSnackFlight()}
 function drawSnackDeliveries(){
  const now=Number.isFinite(frame)?frame:0;if(pendingSnackDelivery>0&&now-lastDeliveryFrame>14)spawnSnackFlight();
  for(let index=snackFlights.length-1;index>=0;index--){const flight=snackFlights[index];flight.t=Math.min(1,flight.t+.026);const t=flight.t,inv=1-t,x=inv*inv*flight.x0+2*inv*t*flight.curveX+t*t*warehouse.doorX,y=inv*inv*flight.y0+2*inv*t*flight.curveY+t*t*warehouse.doorY+Math.sin(t*Math.PI*4+flight.phase)*4;ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*2.4);ctx.font="18px serif";ctx.textAlign="center";ctx.shadowColor="#ffe38b";ctx.shadowBlur=8;ctx.fillText("🍖",x,y);if(flight.amount>=20){ctx.font="bold 10px sans-serif";ctx.fillStyle="#fff2bd";ctx.strokeStyle="rgba(70,40,16,.8)";ctx.lineWidth=3;ctx.strokeText(`+${flight.amount}`,x,y-15);ctx.fillText(`+${flight.amount}`,x,y-15)}ctx.restore();if(t>=1)snackFlights.splice(index,1)}
 }

 function selectWarehouseIndices(waveNumber,count){
  if(!warehouseRouteOpen(waveNumber)||count<=0)return[];
  const eligible=[];
  for(let index=0;index<count;index++)if(!warehouseBlockedKinds.has(spawnQueue[index]))eligible.push(index);
  const targetCount=Math.max(1,Math.round(eligible.length*WAREHOUSE_ROUTE_RATIO)),selected=[];
  for(let slot=0;slot<targetCount;slot++){const position=Math.min(eligible.length-1,Math.floor((slot+.5)*eligible.length/targetCount)),index=eligible[position];if(index!==undefined&&!selected.includes(index))selected.push(index)}
  return selected;
 }

 function theftAmount(){const available=Math.max(0,Math.floor(Number(coins)||0));return available>0?Math.min(available,Math.max(1,Math.floor(available*WAREHOUSE_THEFT_RATE))):0}
 function spawnTheftEffect(enemy,amount){
  addEffectParticle({type:"marchText",text:`🍖 -${amount}`,x:enemy.x,y:enemy.y-72,vx:0,vy:-.2,life:72,size:16,color:"#ffd29a"},true);
  addEffectParticle({type:"ring",x:enemy.x,y:enemy.y-5,vx:0,vy:0,life:48,size:28,color:"#e7b76c"},true);
 }
 function stealFromWarehouse(enemy){
  if(enemy.warehouseStolen)return;
  const amount=theftAmount();enemy.warehouseStolen=true;enemy.warehouseStolenAmount=amount;
  if(amount>0){coins=Math.max(0,coins-amount);savePersistentSnacks();ui.coins.textContent=coins;refreshResearchLabLive();refreshMouseTrapPurchaseUI();showEconomyNotice(`🐭 おやつを${amount}盗まれた！`);playSe("error")}
  spawnTheftEffect(enemy,amount);
 }
 function beginWarehouseReturn(enemy){
  if(enemy.warehouseReturning)return;
  stealFromWarehouse(enemy);
  enemy.warehouseReturning=true;
  enemy.speed=(enemy.warehouseBaseSpeed||enemy.speed/WAREHOUSE_OUTBOUND_SPEED_MULTIPLIER)*WAREHOUSE_RETURN_SPEED_MULTIPLIER;
  enemy.freezeUntilFrame=0;enemy.trapStunUntilFrame=0;enemy.slowUntilFrame=0;enemy.slowMultiplier=1;
  addEffectParticle({type:"marchText",text:"にげろ！",x:enemy.x,y:enemy.y-58,vx:0,vy:-.16,life:48,size:14,color:"#ffe0a1"},true);
 }
 function finishWarehouseEscape(enemy){
  if(enemy.dead)return;
  enemy.dead=true;enemy.warehouseEscaped=true;resetEndlessCombo("warehouse thief escaped");
  addEffectParticle({type:"marchText",text:"おやつを持ち逃げ！",x:enemy.x,y:enemy.y-58,vx:0,vy:-.18,life:58,size:14,color:"#ffd29a"},true);
  addEffectParticle({type:"ring",x:enemy.x,y:enemy.y,vx:0,vy:0,life:44,size:26,color:"#e7b76c"},true);
 }
 function prepareWarehouseThefts(){
  for(const enemy of enemies){
   if(enemy.dead||enemy.routeId!=="warehouse"||enemy.warehouseStolen)continue;
   if(Math.hypot(enemy.x-warehouse.doorX,enemy.y-warehouse.doorY)<=62)stealFromWarehouse(enemy);
  }
 }
 function finalizeWarehouseMovement(){
  let removed=false;
  for(const enemy of enemies){
   if(enemy.dead||enemy.routeId!=="warehouse")continue;
   if(!enemy.warehouseReturning&&enemy.segment>=warehouseTurnIndex)beginWarehouseReturn(enemy);
   if(enemy.warehouseReturning&&enemy.segment>=warehouseReturnEntranceIndex){finishWarehouseEscape(enemy);removed=true}
  }
  if(removed)enemies=enemies.filter(enemy=>!enemy.dead);
 }

 const originalRoutePathById=routePathById;
 routePathById=function(routeId){return routeId==="warehouse"?warehouseTraversalRoute:originalRoutePathById(routeId)};

 const originalActiveEnemyPaths=activeEnemyPaths;
 activeEnemyPaths=function(){const paths=originalActiveEnemyPaths();return warehouseRouteOpen()?[...paths,warehouseRoute]:paths};

 const originalRouteAssignmentsForWave=routeAssignmentsForWave;
 routeAssignmentsForWave=function(waveNumber,count){
  const assignments=originalRouteAssignmentsForWave(waveNumber,count);
  const warehouseIndices=selectWarehouseIndices(waveNumber,count);warehouseIndices.forEach(index=>assignments[index]="warehouse");
  if(warehouseIndices.length)console.log("Route 3 assignments",{wave:waveNumber,total:count,warehouse:warehouseIndices.length,main:assignments.filter(route=>route==="main").length,branch:assignments.filter(route=>route==="branch").length});
  return assignments;
 };

 const originalSpawnEnemy=spawnEnemy;
 spawnEnemy=function(){
  originalSpawnEnemy();
  const enemy=enemies.at(-1);
  if(!enemy||enemy.routeId!=="warehouse"||enemy.warehouseSpeedConfigured)return;
  enemy.warehouseSpeedConfigured=true;enemy.warehouseBaseSpeed=enemy.speed;enemy.speed*=WAREHOUSE_OUTBOUND_SPEED_MULTIPLIER;
 };

 const originalUpdate=update;
 update=function(){
  if(warehouseModeActive())prepareWarehouseThefts();
  originalUpdate();
  if(warehouseModeActive())finalizeWarehouseMovement();
 };

 const originalDrawField=drawField;
 drawField=function(){syncWarehouseBuildSpots();originalDrawField();if(!warehouseModeActive())return;if(warehouseRouteOpen())drawOpenWarehouseRoute();else drawClosedWarehouseApproach();drawBarricade();drawWarehouse();drawSnackDeliveries()};

 const originalDrawEnemy=drawEnemy;
 drawEnemy=function(enemy){
  originalDrawEnemy(enemy);
  if(enemy.dead||enemy.routeId!=="warehouse")return;
  ctx.save();ctx.textAlign="center";ctx.shadowColor="rgba(65,38,16,.75)";ctx.shadowBlur=5;
  if(enemy.warehouseReturning){ctx.font="19px serif";ctx.fillText("🎒",enemy.x,enemy.y-52);ctx.font="bold 10px sans-serif";ctx.fillStyle="#fff0bd";ctx.strokeStyle="rgba(68,40,18,.85)";ctx.lineWidth=3;const label=`-${enemy.warehouseStolenAmount||0}`;ctx.strokeText(label,enemy.x,enemy.y-66);ctx.fillText(label,enemy.x,enemy.y-66)}
  else{ctx.globalAlpha=.82;ctx.font="17px serif";ctx.fillText("💨",enemy.x,enemy.y-53)}
  ctx.restore();
 };

 const originalSelectTowerTarget=selectTowerTarget;
 selectTowerTarget=function(t,targets){if(t.kind==="star")return originalSelectTowerTarget(t,targets);return originalSelectTowerTarget(t,targets.filter(enemy=>!enemyBlockedFrom(t.x,t.y-35,enemy)))};

 const originalActivatePeaceTower=activatePeaceTower;
 activatePeaceTower=function(t){return withVisibleEnemiesFrom(t.x,t.y-18,()=>originalActivatePeaceTower(t),{excludeWarehouseReturning:true})};

 const originalApplyHimawariAreaSlow=applyHimawariAreaSlow;
 applyHimawariAreaSlow=function(center,profile){return withVisibleEnemiesFrom(center.x,center.y,()=>originalApplyHimawariAreaSlow(center,profile))};

 const originalUpdateShot=updateShot;
 updateShot=function(s){
  if(s.dead)return;if(s.kind==="star")return originalUpdateShot(s);
  if(s.spread){const nextX=s.x+Math.cos(s.angle)*7,nextY=s.y+Math.sin(s.angle)*7;if(lineBlocked(s.x,s.y,nextX,nextY)){addEffectParticle({type:"spark",x:(s.x+nextX)/2,y:(s.y+nextY)/2,vx:0,vy:0,life:18,size:3,color:"#e7c78c"},true);s.dead=true;return}return originalUpdateShot(s)}
  if(!s.target||s.target.dead||s.target.returningHome)return originalUpdateShot(s);
  const dx=s.target.x-s.x,dy=s.target.y-s.y,d=Math.hypot(dx,dy);if(d<10+s.target.hitRadius*.4){if(s.area||s.kind==="hima")return withVisibleEnemiesFrom(s.target.x,s.target.y,()=>originalUpdateShot(s));return originalUpdateShot(s)}
  const nextX=s.x+dx/d*7,nextY=s.y+dy/d*7;if(s.target.routeId==="warehouse"&&lineBlocked(s.x,s.y,nextX,nextY)){addEffectParticle({type:"spark",x:(s.x+nextX)/2,y:(s.y+nextY)/2,vx:0,vy:0,life:18,size:3,color:"#e7c78c"},true);s.dead=true;return}return originalUpdateShot(s);
 };

 const originalAwardEnemySnacks=awardEnemySnacks;
 awardEnemySnacks=function(enemy){
  originalAwardEnemySnacks(enemy);
  if(!enemy.warehouseStolenAmount||enemy.warehouseRecovered)return;
  enemy.warehouseRecovered=true;
  const recovered=Math.floor(enemy.warehouseStolenAmount*WAREHOUSE_RECOVERY_RATE);
  if(recovered<=0)return;
  addSnacks(recovered,"normal");
  showEconomyNotice(`🎒 盗まれたおやつを${recovered}取り返した！`,true);
  addEffectParticle({type:"rewardText",text:`回収 +${recovered}`,x:enemy.x,y:enemy.y-78,vx:0,vy:-.3,life:68,size:15,color:"#ffe27a"},true);
 };

 const originalAddSnacks=addSnacks;
 addSnacks=function(amount,category="normal"){const safeAmount=Math.max(0,Math.floor(Number(amount)||0));originalAddSnacks(amount,category);if(warehouseModeActive()&&safeAmount>0)queueSnackDelivery(safeAmount)};

 window.SNACK_WAREHOUSE=Object.freeze({
  unlockWave:WAREHOUSE_ROUTE_UNLOCK_WAVE,
  routeRatio:WAREHOUSE_ROUTE_RATIO,
  outboundSpeedMultiplier:WAREHOUSE_OUTBOUND_SPEED_MULTIPLIER,
  returnSpeedMultiplier:WAREHOUSE_RETURN_SPEED_MULTIPLIER,
  theftRate:WAREHOUSE_THEFT_RATE,
  recoveryRate:WAREHOUSE_RECOVERY_RATE,
  position:{...warehouse},
  route:warehouseRoute.map(point=>[...point]),
  buildSpots:warehouseBuildSpots.map(point=>[...point]),
  barricade:{startWave:warehouseBarricade.startWave,completeWave:WAREHOUSE_ROUTE_UNLOCK_WAVE+BARRICADE_BLOCK_COUNT,points:warehouseBarricade.points.map(point=>[...point])},
  blocksShot:(x1,y1,x2,y2)=>lineBlocked(x1,y1,x2,y2)
 });
})();