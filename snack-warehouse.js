(()=>{
 const WAREHOUSE_ROUTE_UNLOCK_WAVE=50;
 const warehouse={x:132,y:190,doorX:198,doorY:202};
 const warehouseRoute=[
  [953,100],[914,82],[858,68],[790,60],[716,62],[642,73],
  [568,91],[497,113],[428,137],[362,160],[305,179],[254,194],[198,202]
 ];
 const warehouseBuildSpots=[
  [105,332],[215,330],[318,286],[374,214],[382,104],[282,72],[492,82]
 ];
 let warehouseSpotStart=-1;
 let pendingSnackDelivery=0;
 let lastDeliveryFrame=-Infinity;
 const snackFlights=[];

 function warehouseModeActive(){return gameMode==="endless"}
 function warehouseRouteOpen(){return warehouseModeActive()&&wave+1>=WAREHOUSE_ROUTE_UNLOCK_WAVE}

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
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.strokeStyle=color;
  ctx.lineWidth=width;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.stroke();
  ctx.restore();
 }

 function drawClosedWarehouseApproach(){
  const apron=warehouseRoute.slice(-3);
  strokeRoute(apron,"#73502f",34,.22);
  strokeRoute(apron,"#d0ad78",24,.24);
  ctx.save();
  ctx.translate(257,194);
  ctx.globalAlpha=.8;
  ctx.strokeStyle="#654522";
  ctx.fillStyle="#a8753d";
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(-18,-13);ctx.lineTo(18,13);
  ctx.moveTo(-18,13);ctx.lineTo(18,-13);
  ctx.stroke();
  [-19,19].forEach(x=>ctx.fillRect(x-3,-20,6,40));
  ctx.restore();
 }

 function drawOpenWarehouseRoute(){
  strokeRoute(warehouseRoute,"#694522",48,.48);
  strokeRoute(warehouseRoute,"#9a6838",39,.58);
  strokeRoute(warehouseRoute,"#d3aa70",29,.68);
  strokeRoute(warehouseRoute,"#f3dda6",5,.36,[15,18]);
  ctx.save();
  ctx.globalAlpha=.78;
  ctx.font="22px serif";
  ctx.textAlign="center";
  [[896,81],[540,99],[276,188]].forEach(([x,y])=>{
   ctx.fillText("🍃",x-18,y-12);
   ctx.fillText("🪵",x+18,y-8);
  });
  ctx.font="bold 14px 'Mochiy Pop One',sans-serif";
  ctx.fillStyle="#5b3a1d";
  ctx.strokeStyle="rgba(255,239,190,.9)";
  ctx.lineWidth=4;
  ctx.strokeText("倉庫への分岐",888,51);
  ctx.fillText("倉庫への分岐",888,51);
  ctx.restore();
 }

 function snackStackCount(){
  const current=Math.max(0,Number(coins)||0);
  return Math.max(1,Math.min(9,Math.floor(Math.log2(current/80+1))+1));
 }

 function drawSnackSack(x,y,scale=1){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.fillStyle="#d6ad69";
  ctx.strokeStyle="#75512c";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(-8,-11);ctx.quadraticCurveTo(-13,0,-10,13);ctx.quadraticCurveTo(0,20,10,13);ctx.quadraticCurveTo(13,0,8,-11);ctx.closePath();
  ctx.fill();ctx.stroke();
  ctx.strokeStyle="#8c6032";
  ctx.beginPath();ctx.moveTo(-8,-9);ctx.lineTo(8,-9);ctx.stroke();
  ctx.fillStyle="#6e4426";
  ctx.font="11px serif";
  ctx.textAlign="center";
  ctx.fillText("🍖",0,7);
  ctx.restore();
 }

 function drawWarehouse(){
  const {x,y}=warehouse;
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle="rgba(34,25,15,.28)";
  ctx.beginPath();ctx.ellipse(0,54,83,20,0,0,Math.PI*2);ctx.fill();

  const wall=ctx.createLinearGradient(0,-28,0,58);
  wall.addColorStop(0,"#b98750");wall.addColorStop(1,"#76502f");
  ctx.fillStyle=wall;ctx.strokeStyle="#52351f";ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(-62,-25,124,82,11);ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(76,47,25,.38)";ctx.lineWidth=1.5;
  [-40,-14,14,40].forEach(px=>{ctx.beginPath();ctx.moveTo(px,-22);ctx.lineTo(px,54);ctx.stroke()});

  ctx.fillStyle="#614023";ctx.strokeStyle="#3d2818";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-76,-23);ctx.lineTo(0,-72);ctx.lineTo(76,-23);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(225,181,105,.32)";ctx.lineWidth=2;
  [-48,-24,0,24,48].forEach(px=>{ctx.beginPath();ctx.moveTo(px,-29);ctx.lineTo(0,-68);ctx.stroke()});

  ctx.fillStyle="#4d321e";ctx.strokeStyle="#2c1c11";
  ctx.beginPath();ctx.roundRect(28,4,30,53,5);ctx.fill();ctx.stroke();
  ctx.fillStyle="#d9b467";ctx.beginPath();ctx.arc(49,31,2.6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f1d98f";ctx.strokeStyle="#6b4b27";
  ctx.beginPath();ctx.roundRect(-43,-2,27,24,4);ctx.fill();ctx.stroke();
  ctx.strokeStyle="#8c6a3e";ctx.beginPath();ctx.moveTo(-29,-2);ctx.lineTo(-29,22);ctx.moveTo(-43,10);ctx.lineTo(-16,10);ctx.stroke();

  ctx.fillStyle="#a46f35";ctx.strokeStyle="#5c3b1f";ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-57,34,30,23,3);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.roundRect(-30,40,27,17,3);ctx.fill();ctx.stroke();

  const sacks=snackStackCount();
  for(let i=0;i<sacks;i++){
   const row=i<5?0:1,index=row===0?i:i-5;
   drawSnackSack(-47+index*21+row*11,48-row*26,row?0.78:0.9);
  }

  ctx.shadowColor="rgba(255,225,137,.7)";ctx.shadowBlur=7;
  ctx.fillStyle="#f0d28b";ctx.strokeStyle="#765126";ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-57,-69,114,27,6);ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#56381d";ctx.font="bold 15px 'Mochiy Pop One',sans-serif";ctx.textAlign="center";
  ctx.fillText("🍖 おやつ倉庫",0,-50);
  ctx.restore();
 }

 function spawnSnackFlight(){
  if(pendingSnackDelivery<=0||snackFlights.length>=7)return;
  const amount=pendingSnackDelivery;
  pendingSnackDelivery=0;
  lastDeliveryFrame=Number.isFinite(frame)?frame:0;
  snackFlights.push({
   amount,
   t:0,
   x0:610+Math.random()*170,
   y0:40+Math.random()*45,
   curveX:360+Math.random()*80,
   curveY:20+Math.random()*45,
   phase:Math.random()*Math.PI*2
  });
 }

 function queueSnackDelivery(amount){
  pendingSnackDelivery+=Math.max(0,Math.floor(Number(amount)||0));
  if(snackFlights.length<3&&(Number.isFinite(frame)?frame:0)-lastDeliveryFrame>10)spawnSnackFlight();
 }

 function drawSnackDeliveries(){
  const now=Number.isFinite(frame)?frame:0;
  if(pendingSnackDelivery>0&&now-lastDeliveryFrame>14)spawnSnackFlight();
  for(let index=snackFlights.length-1;index>=0;index--){
   const flight=snackFlights[index];
   flight.t=Math.min(1,flight.t+.026);
   const t=flight.t,inv=1-t;
   const x=inv*inv*flight.x0+2*inv*t*flight.curveX+t*t*warehouse.doorX;
   const y=inv*inv*flight.y0+2*inv*t*flight.curveY+t*t*warehouse.doorY+Math.sin(t*Math.PI*4+flight.phase)*4;
   ctx.save();
   ctx.globalAlpha=Math.min(1,(1-t)*2.4);
   ctx.font="18px serif";ctx.textAlign="center";
   ctx.shadowColor="#ffe38b";ctx.shadowBlur=8;
   ctx.fillText("🍖",x,y);
   if(flight.amount>=20){ctx.font="bold 10px sans-serif";ctx.fillStyle="#fff2bd";ctx.strokeStyle="rgba(70,40,16,.8)";ctx.lineWidth=3;ctx.strokeText(`+${flight.amount}`,x,y-15);ctx.fillText(`+${flight.amount}`,x,y-15)}
   ctx.restore();
   if(t>=1)snackFlights.splice(index,1);
  }
 }

 const originalDrawField=drawField;
 drawField=function(){
  syncWarehouseBuildSpots();
  originalDrawField();
  if(!warehouseModeActive())return;
  if(warehouseRouteOpen())drawOpenWarehouseRoute();else drawClosedWarehouseApproach();
  drawWarehouse();
  drawSnackDeliveries();
 };

 const originalAddSnacks=addSnacks;
 addSnacks=function(amount,category="normal"){
  const safeAmount=Math.max(0,Math.floor(Number(amount)||0));
  originalAddSnacks(amount,category);
  if(warehouseModeActive()&&safeAmount>0)queueSnackDelivery(safeAmount);
 };

 window.SNACK_WAREHOUSE=Object.freeze({
  unlockWave:WAREHOUSE_ROUTE_UNLOCK_WAVE,
  position:{...warehouse},
  route:warehouseRoute.map(point=>[...point]),
  buildSpots:warehouseBuildSpots.map(point=>[...point])
 });
})();
