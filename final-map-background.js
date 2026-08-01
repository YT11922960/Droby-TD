(()=>{
 const previousWarehouse=window.SNACK_WAREHOUSE;
 const mapChunks=window.FINAL_MAP_CHUNKS;
 if(!previousWarehouse||!Array.isArray(mapChunks)||!mapChunks.length)return;

 const WIDTH=1200,HEIGHT=760;
 const finalMapData=`data:image/avif;base64,${mapChunks.join("")}`;
 const finalMap=new Image();
 finalMap.decoding="async";
 finalMap.src=finalMapData;
 finalMap.addEventListener("error",()=>console.error("Failed to load the high-quality endless map."),{once:true});

 const finalMainPath=[
  [1070,78],[1060,105],[1038,135],[1010,168],[980,198],[945,225],
  [905,245],[860,252],[815,250],[770,246],[728,252],[690,270],
  [660,296],[650,325],[663,352],[695,372],[730,392],[754,420],
  [750,447],[724,466],[686,473],[645,466],[604,452],[563,441],
  [526,445],[497,465],[482,492],[484,520],[504,548],[535,575],
  [568,600],[590,620],[574,641],[540,655],[497,661],[450,657],
  [405,648],[365,643],[326,650],[290,667],[254,687],[218,708],
  [180,724],[148,735]
 ];
 const finalBranchPath=[
  [1200,555],[1168,520],[1135,480],[1100,450],[1060,442],[1025,455],
  [996,482],[979,517],[970,554],[955,590],[930,618],[895,637],
  [854,646],[812,643],[770,633],[728,620],[685,612],[640,612],
  [600,618],[574,641],[540,655],[497,661],[450,657],[405,648],
  [365,643],[326,650],[290,667],[254,687],[218,708],[180,724],[148,735]
 ];
 const finalWarehouse={x:188,y:125,doorX:298,doorY:145};
 const finalWarehouseRoute=[
  [1070,78],[1048,105],[1018,132],[982,154],[942,168],[900,166],
  [858,151],[816,132],[772,121],[728,123],[685,138],[642,157],
  [598,173],[554,177],[510,169],[466,153],[424,143],[386,148],
  [354,163],[334,181],[320,178],[310,164],[303,151],[298,145]
 ];
 const finalWarehouseTraversal=[
  ...finalWarehouseRoute.map(point=>[...point]),
  ...finalWarehouseRoute.slice(0,-1).reverse().map(point=>[...point]),
  [1110,66]
 ];
 const finalSpots=[
  [235,245],[330,235],[415,235],[500,225],[585,215],[670,205],
  [755,195],[840,205],[925,215],[1010,255],[1090,280],[950,315],
  [860,325],[780,315],[710,340],[610,325],[565,375],[650,400],
  [820,395],[900,380],[1010,365],[430,350],[500,390],[590,420],
  [675,520],[575,515],[470,535],[385,495],[320,435],[250,400],
  [1090,520],[1020,600],[900,700],[795,700],[690,685],[390,600]
 ];
 const wallPoints=[
  [960,194],[900,204],[840,207],[780,207],[720,211],[660,219],
  [600,232],[540,248],[480,265],[420,281],[360,297]
 ];
 const originalMainPath=path.map(point=>[...point]);
 const originalBranchPath=endlessBranchPath.map(point=>[...point]);
 const originalSpots=spots.map(point=>[...point]);
 let finalLayoutApplied=false;

 function endlessMode(){return gameMode==="endless"}
 function warehouseOpen(){return endlessMode()&&wave+1>=(previousWarehouse.unlockWave||50)}
 function imageReady(){return finalMap.complete&&finalMap.naturalWidth>0}
 function applyCssBackground(){
  if(canvas.style.backgroundImage!==`url("${finalMapData}")`)canvas.style.backgroundImage=`url("${finalMapData}")`;
  canvas.style.backgroundSize="100% 100%";
  canvas.style.backgroundPosition="center";
  canvas.style.backgroundRepeat="no-repeat";
 }
 function clearCssBackground(){
  if(!canvas.style.backgroundImage)return;
  canvas.style.backgroundImage="";
  canvas.style.backgroundSize="";
  canvas.style.backgroundPosition="";
  canvas.style.backgroundRepeat="";
 }
 function replacePoints(target,source){target.splice(0,target.length,...source.map(point=>[...point]))}
 function syncFinalLayout(){
  if(endlessMode()&&!finalLayoutApplied){
   replacePoints(path,finalMainPath);
   replacePoints(endlessBranchPath,finalBranchPath);
   finalSpots.forEach((point,index)=>{if(spots[index])spots[index]=[...point]});
   for(const tower of towers){const point=finalSpots[tower.spot];if(point){tower.x=point[0];tower.y=point[1]}}
   finalLayoutApplied=true;
   return;
  }
  if(endlessMode()||!finalLayoutApplied)return;
  replacePoints(path,originalMainPath);
  replacePoints(endlessBranchPath,originalBranchPath);
  originalSpots.forEach((point,index)=>{if(spots[index])spots[index]=[...point]});
  finalLayoutApplied=false;
 }
 finalMap.addEventListener("load",()=>{if(endlessMode())applyCssBackground()},{once:true});

 const previousRoutePathById=routePathById;
 routePathById=function(routeId){
  if(endlessMode()){
   if(routeId==="branch")return finalBranchPath;
   if(routeId==="warehouse")return finalWarehouseTraversal;
   return finalMainPath;
  }
  return previousRoutePathById(routeId);
 };
 const previousActiveEnemyPaths=activeEnemyPaths;
 activeEnemyPaths=function(){
  if(!endlessMode())return previousActiveEnemyPaths();
  const routes=[finalMainPath];
  if(routeBranchActive)routes.push(finalBranchPath);
  if(warehouseOpen())routes.push(finalWarehouseRoute);
  return routes;
 };
 routeBranchSystem.visualSegments=[finalBranchPath.slice(0,-12).map(point=>[...point])];

 function wallProgress(){const max=wallPoints.length-1;return warehouseOpen()?Math.max(0,Math.min(max,wave-(previousWarehouse.unlockWave||50)+1)):0}
 function wallSegments(){const segments=[];for(let index=0;index<wallProgress();index++)segments.push({index,a:wallPoints[index],b:wallPoints[index+1]});return segments}
 function cross(ax,ay,bx,by,cx,cy){return(bx-ax)*(cy-ay)-(by-ay)*(cx-ax)}
 function pointOnSegment(px,py,ax,ay,bx,by){return Math.abs(cross(ax,ay,bx,by,px,py))<.001&&px>=Math.min(ax,bx)-.001&&px<=Math.max(ax,bx)+.001&&py>=Math.min(ay,by)-.001&&py<=Math.max(ay,by)+.001}
 function segmentsIntersect(a,b,c,d){
  const c1=cross(a[0],a[1],b[0],b[1],c[0],c[1]),c2=cross(a[0],a[1],b[0],b[1],d[0],d[1]),c3=cross(c[0],c[1],d[0],d[1],a[0],a[1]),c4=cross(c[0],c[1],d[0],d[1],b[0],b[1]);
  if(((c1>0&&c2<0)||(c1<0&&c2>0))&&((c3>0&&c4<0)||(c3<0&&c4>0)))return true;
  return Math.abs(c1)<.001&&pointOnSegment(c[0],c[1],a[0],a[1],b[0],b[1])||Math.abs(c2)<.001&&pointOnSegment(d[0],d[1],a[0],a[1],b[0],b[1])||Math.abs(c3)<.001&&pointOnSegment(a[0],a[1],c[0],c[1],d[0],d[1])||Math.abs(c4)<.001&&pointOnSegment(b[0],b[1],c[0],c[1],d[0],d[1]);
 }
 function blocksShot(x1,y1,x2,y2){return wallSegments().some(({a,b})=>segmentsIntersect([x1,y1],[x2,y2],a,b))}
 function drawWallBlock(segment){
  const [ax,ay]=segment.a,[bx,by]=segment.b,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
  ctx.save();ctx.translate((ax+bx)/2,(ay+by)/2);ctx.rotate(angle);
  ctx.fillStyle="rgba(28,20,13,.30)";ctx.beginPath();ctx.ellipse(0,11,length*.47,9,0,0,Math.PI*2);ctx.fill();
  const wood=ctx.createLinearGradient(0,-12,0,13);wood.addColorStop(0,segment.index%2?"#bd8248":"#cc9254");wood.addColorStop(1,segment.index%2?"#654226":"#76502e");
  ctx.fillStyle=wood;ctx.strokeStyle="#3c2818";ctx.lineWidth=2.2;ctx.beginPath();ctx.roundRect(-length*.46,-12,length*.92,25,7);ctx.fill();ctx.stroke();
  ctx.fillStyle="#49311e";[-length*.31,length*.31].forEach(x=>{ctx.beginPath();ctx.roundRect(x-3,-17,6,34,2);ctx.fill()});ctx.restore();
 }
 function drawFinalWall(){
  if(!warehouseOpen())return;
  const segments=wallSegments();
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="rgba(245,222,166,.32)";ctx.lineWidth=2;ctx.setLineDash([8,9]);ctx.beginPath();wallPoints.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();
  segments.forEach(drawWallBlock);
  const max=wallPoints.length-1,count=segments.length,text=count>=max?"倉庫防壁 完成｜越境攻撃を遮断":`倉庫防壁 ${count}/${max}`;
  ctx.save();ctx.textAlign="center";ctx.font="bold 12px 'Mochiy Pop One',sans-serif";const width=ctx.measureText(text).width+22;const x=650,y=268;ctx.fillStyle="rgba(58,40,23,.82)";ctx.strokeStyle="rgba(255,225,163,.86)";ctx.lineWidth=1.7;ctx.beginPath();ctx.roundRect(x-width/2,y-14,width,25,8);ctx.fill();ctx.stroke();ctx.fillStyle="#fff0bd";ctx.fillText(text,x,y+3);ctx.restore();
 }

 let pendingSnackDelivery=0,lastDeliveryFrame=-Infinity;
 const snackFlights=[];
 function spawnSnackFlight(){
  if(pendingSnackDelivery<=0||snackFlights.length>=7)return;
  const amount=pendingSnackDelivery;pendingSnackDelivery=0;lastDeliveryFrame=Number.isFinite(frame)?frame:0;
  snackFlights.push({amount,t:0,x0:610+Math.random()*170,y0:42+Math.random()*40,curveX:420+Math.random()*90,curveY:70+Math.random()*50,phase:Math.random()*Math.PI*2});
 }
 function queueSnackDelivery(amount){if(!endlessMode())return;pendingSnackDelivery+=Math.max(0,Math.floor(Number(amount)||0));if(snackFlights.length<3&&(Number.isFinite(frame)?frame:0)-lastDeliveryFrame>10)spawnSnackFlight()}
 function drawSnackFlights(){
  if(!warehouseOpen())return;
  const now=Number.isFinite(frame)?frame:0;if(pendingSnackDelivery>0&&now-lastDeliveryFrame>14)spawnSnackFlight();
  for(let index=snackFlights.length-1;index>=0;index--){
   const flight=snackFlights[index];flight.t=Math.min(1,flight.t+.026);const t=flight.t,inv=1-t;
   const x=inv*inv*flight.x0+2*inv*t*flight.curveX+t*t*finalWarehouse.doorX;
   const y=inv*inv*flight.y0+2*inv*t*flight.curveY+t*t*finalWarehouse.doorY+Math.sin(t*Math.PI*4+flight.phase)*4;
   ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*2.4);ctx.font="18px serif";ctx.textAlign="center";ctx.shadowColor="#ffe38b";ctx.shadowBlur=8;ctx.fillText("🍖",x,y);
   if(flight.amount>=20){ctx.font="bold 10px sans-serif";ctx.fillStyle="#fff2bd";ctx.strokeStyle="rgba(70,40,16,.8)";ctx.lineWidth=3;ctx.strokeText(`+${flight.amount}`,x,y-15);ctx.fillText(`+${flight.amount}`,x,y-15)}
   ctx.restore();if(t>=1)snackFlights.splice(index,1);
  }
 }
 const previousAddSnacks=addSnacks;
 addSnacks=function(amount,category="normal"){const safeAmount=Math.max(0,Math.floor(Number(amount)||0));previousAddSnacks(amount,category);if(safeAmount>0)queueSnackDelivery(safeAmount)};

 const previousDrawField=drawField;
 drawField=function(){
  syncFinalLayout();
  previousDrawField();
  if(!endlessMode()){
   clearCssBackground();
   return;
  }
  if(!imageReady())return;
  applyCssBackground();
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();
  drawFinalWall();drawSnackFlights();
 };

 window.SNACK_WAREHOUSE=Object.freeze({
  ...previousWarehouse,
  position:{...finalWarehouse},
  mainRoute:finalMainPath.map(point=>[...point]),
  branchRoute:finalBranchPath.map(point=>[...point]),
  route:finalWarehouseRoute.map(point=>[...point]),
  spotOverrides:Object.fromEntries(finalSpots.map((point,index)=>[index,[...point]])),
  barricade:{...previousWarehouse.barricade,points:wallPoints.map(point=>[...point])},
  blocksShot
 });
 window.FINAL_ENDLESS_MAP=Object.freeze({imageReady,mainRoute:finalMainPath,branchRoute:finalBranchPath,warehouseRoute:finalWarehouseRoute});
})();