(()=>{
 const previousWarehouse=window.SNACK_WAREHOUSE;
 if(!previousWarehouse||!Array.isArray(window.FINAL_MAP_CHUNKS)||!window.FINAL_MAP_CHUNKS.length)return;

 const WIDTH=1200,HEIGHT=760;
 const finalMap=new Image();
 finalMap.src=`data:image/webp;base64,${window.FINAL_MAP_CHUNKS.join("")}`;
 finalMap.addEventListener("error",()=>console.error("Failed to load the final endless map."),{once:true});

 const finalMainPath=[
  [1050,78],[1042,110],[1022,142],[990,172],[950,198],[905,219],
  [858,234],[810,245],[765,256],[720,272],[684,294],[660,322],
  [653,351],[668,377],[697,397],[724,418],[735,444],[726,469],
  [704,489],[672,502],[636,505],[600,496],[563,480],[526,464],
  [492,466],[468,486],[459,512],[468,541],[491,568],[520,595],
  [551,618],[581,637],[566,658],[530,676],[486,687],[440,690],
  [392,686],[347,678],[305,679],[265,690],[228,706],[190,720],
  [154,730]
 ];
 const finalBranchPath=[
  [1200,520],[1160,505],[1115,495],[1072,498],[1035,514],[1004,541],
  [983,570],[966,600],[943,625],[912,643],[876,652],[836,651],
  [794,644],[750,635],[706,632],[662,635],[620,642],[581,637],
  [566,658],[530,676],[486,687],[440,690],[392,686],[347,678],
  [305,679],[265,690],[228,706],[190,720],[154,730]
 ];
 const finalWarehouse={x:185,y:125,doorX:225,doorY:140};
 const finalWarehouseRoute=[
  [1050,78],[1018,103],[982,121],[942,131],[900,131],[858,122],
  [817,108],[777,98],[737,97],[697,108],[657,124],[617,141],
  [576,153],[536,159],[497,155],[458,145],[418,132],[378,121],
  [339,119],[302,126],[271,139],[246,145],[225,140]
 ];
 const finalWarehouseTraversal=[
  ...finalWarehouseRoute.map(point=>[...point]),
  ...finalWarehouseRoute.slice(0,-1).reverse().map(point=>[...point]),
  [1100,66]
 ];
 const originalSpots=spots.map(point=>[...point]);
 const finalSpots=[
  [970,205],[870,176],[760,178],[650,205],[540,220],[430,207],
  [330,220],[250,255],[1040,300],[930,320],[820,300],[760,350],
  [640,380],[560,340],[500,390],[420,340],[850,420],[760,470],
  [660,500],[560,500],[470,530],[390,500],[330,440],[260,400],
  [1120,400],[1060,570],[970,650],[870,610],[800,690],[700,700],
  [620,720],[280,570],[350,600],[240,650],[400,650],[500,600]
 ];
 let finalLayoutApplied=false;

 function endlessMode(){return gameMode==="endless"}
 function warehouseOpen(){return endlessMode()&&wave+1>=(previousWarehouse.unlockWave||50)}
 function imageReady(){return finalMap.complete&&finalMap.naturalWidth>0}
 function syncFinalLayout(){
  if(endlessMode()&&!finalLayoutApplied){
   finalSpots.forEach((point,index)=>{if(spots[index])spots[index]=[...point]});
   for(const tower of towers){
    const point=finalSpots[tower.spot];
    if(point){tower.x=point[0];tower.y=point[1]}
   }
   finalLayoutApplied=true;
   return;
  }
  if(endlessMode()||!finalLayoutApplied)return;
  originalSpots.forEach((point,index)=>{if(spots[index])spots[index]=[...point]});
  finalLayoutApplied=false;
 }

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
 routeBranchSystem.visualSegments=[finalBranchPath.slice(0,-9).map(point=>[...point])];

 const wallPoints=(previousWarehouse.barricade?.points||[]).map(point=>[...point]);
 const wallMax=Math.max(0,wallPoints.length-1);
 function wallProgress(){return warehouseOpen()?Math.max(0,Math.min(wallMax,wave-(previousWarehouse.unlockWave||50)+1)):0}
 function drawWallBlock(index){
  const a=wallPoints[index],b=wallPoints[index+1];if(!a||!b)return;
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
  ctx.save();ctx.translate((a[0]+b[0])/2,(a[1]+b[1])/2);ctx.rotate(angle);
  ctx.fillStyle="rgba(28,20,13,.32)";ctx.beginPath();ctx.ellipse(0,12,length*.47,10,0,0,Math.PI*2);ctx.fill();
  const wood=ctx.createLinearGradient(0,-13,0,14);wood.addColorStop(0,index%2?"#bd8248":"#cc9254");wood.addColorStop(1,index%2?"#654226":"#76502e");
  ctx.fillStyle=wood;ctx.strokeStyle="#3c2818";ctx.lineWidth=2.4;ctx.beginPath();ctx.roundRect(-length*.46,-13,length*.92,27,7);ctx.fill();ctx.stroke();
  ctx.fillStyle="#49311e";[-length*.31,length*.31].forEach(x=>{ctx.beginPath();ctx.roundRect(x-3,-18,6,36,2);ctx.fill()});ctx.restore();
 }
 function drawFinalWall(){
  if(!warehouseOpen()||wallPoints.length<2)return;
  const count=wallProgress();
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="rgba(245,222,166,.36)";ctx.lineWidth=2.5;ctx.setLineDash([8,9]);ctx.beginPath();wallPoints.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();
  for(let index=0;index<count;index++)drawWallBlock(index);
  const text=count>=wallMax?"倉庫防壁 完成｜越境攻撃を遮断":`倉庫防壁 ${count}/${wallMax}`;
  ctx.save();ctx.textAlign="center";ctx.font="bold 12px 'Mochiy Pop One',sans-serif";const width=ctx.measureText(text).width+22;const x=535,y=345;ctx.fillStyle="rgba(58,40,23,.82)";ctx.strokeStyle="rgba(255,225,163,.86)";ctx.lineWidth=1.7;ctx.beginPath();ctx.roundRect(x-width/2,y-14,width,25,8);ctx.fill();ctx.stroke();ctx.fillStyle="#fff0bd";ctx.fillText(text,x,y+3);ctx.restore();
 }

 let pendingSnackDelivery=0,lastDeliveryFrame=-Infinity;
 const snackFlights=[];
 function spawnSnackFlight(){
  if(pendingSnackDelivery<=0||snackFlights.length>=7)return;
  const amount=pendingSnackDelivery;pendingSnackDelivery=0;lastDeliveryFrame=Number.isFinite(frame)?frame:0;
  snackFlights.push({amount,t:0,x0:610+Math.random()*170,y0:42+Math.random()*40,curveX:390+Math.random()*80,curveY:65+Math.random()*45,phase:Math.random()*Math.PI*2});
 }
 function queueSnackDelivery(amount){
  if(!endlessMode())return;
  pendingSnackDelivery+=Math.max(0,Math.floor(Number(amount)||0));
  if(snackFlights.length<3&&(Number.isFinite(frame)?frame:0)-lastDeliveryFrame>10)spawnSnackFlight();
 }
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
 addSnacks=function(amount,category="normal"){
  const safeAmount=Math.max(0,Math.floor(Number(amount)||0));
  previousAddSnacks(amount,category);if(safeAmount>0)queueSnackDelivery(safeAmount);
 };

 const previousDrawField=drawField;
 drawField=function(){
  previousDrawField();syncFinalLayout();
  if(!endlessMode()||!imageReady())return;
  ctx.drawImage(finalMap,0,0,WIDTH,HEIGHT);drawFinalWall();drawSnackFlights();
 };

 window.SNACK_WAREHOUSE=Object.freeze({
  ...previousWarehouse,
  position:{...finalWarehouse},
  mainRoute:finalMainPath.map(point=>[...point]),
  branchRoute:finalBranchPath.map(point=>[...point]),
  route:finalWarehouseRoute.map(point=>[...point]),
  spotOverrides:Object.fromEntries(finalSpots.map((point,index)=>[index,[...point]])),
  barricade:{...previousWarehouse.barricade,points:wallPoints.map(point=>[...point])}
 });
 window.FINAL_ENDLESS_MAP=Object.freeze({imageReady,mainRoute:finalMainPath,branchRoute:finalBranchPath,warehouseRoute:finalWarehouseRoute});
})();