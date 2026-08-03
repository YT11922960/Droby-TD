(()=>{
 const warehouse=window.SNACK_WAREHOUSE;
 if(!warehouse?.route?.length||!warehouse?.branchRoute?.length)return;

 const WIDTH=1200,HEIGHT=760;
 const PHASE2_WAVE=35;
 const PHASE3_WAVE=warehouse.unlockWave||50;
 const phase2Background=new Image();
 const phase3Background=new Image();
 phase2Background.src="assets/forest-map-wave35.svg?v=2";
 phase3Background.src="assets/forest-map-wave50.svg?v=2";
 phase2Background.addEventListener("error",()=>console.error("Failed to load WAVE35 background."),{once:true});
 phase3Background.addEventListener("error",()=>console.error("Failed to load WAVE50 background."),{once:true});

 function imageReady(image){return image.complete&&image.naturalWidth>0}
 function currentWaveNumber(){return wave+1}
 function phase3Active(){return gameMode==="endless"&&currentWaveNumber()>=PHASE3_WAVE}
 function phase2Active(){return gameMode==="endless"&&(routeBranchActive||currentWaveNumber()>=PHASE2_WAVE)}
 function baseMap(){return art.map?.complete&&art.map.naturalWidth?art.map:null}
 function stageBackground(){
  if(phase3Active()&&imageReady(phase3Background))return phase3Background;
  if(phase2Active()&&imageReady(phase2Background))return phase2Background;
  return baseMap();
 }

 const barricadePoints=warehouse.barricade?.points||[];
 const barricadeMax=Math.max(0,barricadePoints.length-1);
 function barricadeProgress(){
  if(!phase3Active())return 0;
  return Math.max(0,Math.min(barricadeMax,wave-PHASE3_WAVE+1));
 }

 function drawBarricadeGuide(){
  if(!phase3Active()||barricadePoints.length<2)return;
  ctx.save();
  ctx.lineCap="round";ctx.lineJoin="round";
  ctx.strokeStyle="rgba(243,218,164,.42)";ctx.lineWidth=3;ctx.setLineDash([8,9]);
  ctx.beginPath();barricadePoints.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  ctx.setLineDash([]);
  ctx.font="bold 11px 'Mochiy Pop One',sans-serif";ctx.textAlign="center";
  ctx.fillStyle="rgba(255,241,199,.9)";ctx.strokeStyle="rgba(62,39,20,.82)";ctx.lineWidth=3;
  ctx.strokeText("倉庫側",535,260);ctx.fillText("倉庫側",535,260);
  ctx.strokeText("中央側",535,330);ctx.fillText("中央側",535,330);
  ctx.restore();
 }

 function drawBarricadeBlock(index){
  const a=barricadePoints[index],b=barricadePoints[index+1];
  if(!a||!b)return;
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
  ctx.save();ctx.translate((a[0]+b[0])/2,(a[1]+b[1])/2);ctx.rotate(angle);
  ctx.fillStyle="rgba(38,27,17,.32)";ctx.beginPath();ctx.ellipse(0,13,length*.48,11,0,0,Math.PI*2);ctx.fill();
  const wood=ctx.createLinearGradient(0,-13,0,14);
  wood.addColorStop(0,index%2?"#c28a4e":"#b77a43");wood.addColorStop(1,index%2?"#72502f":"#654326");
  ctx.fillStyle=wood;ctx.strokeStyle="#3e2918";ctx.lineWidth=2.5;
  ctx.beginPath();ctx.roundRect(-length*.46,-13,length*.92,27,7);ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(244,208,141,.36)";ctx.lineWidth=1.2;
  [-6,3].forEach(y=>{ctx.beginPath();ctx.moveTo(-length*.4,y);ctx.lineTo(length*.4,y+(index%3)-1);ctx.stroke()});
  ctx.fillStyle="#49311e";
  [-length*.31,length*.31].forEach(x=>{ctx.beginPath();ctx.roundRect(x-3,-18,6,36,2);ctx.fill()});
  ctx.restore();
 }

 function drawNextBarricadeSite(count){
  if(count>=barricadeMax)return;
  const a=barricadePoints[count],b=barricadePoints[count+1];if(!a||!b)return;
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
  ctx.save();ctx.translate((a[0]+b[0])/2,(a[1]+b[1])/2);ctx.rotate(angle);
  ctx.globalAlpha=.46;ctx.strokeStyle="#ffe1a0";ctx.lineWidth=2.3;ctx.setLineDash([7,7]);
  ctx.beginPath();ctx.roundRect(-length*.43,-12,length*.86,24,6);ctx.stroke();ctx.restore();
 }

 function drawBarricadeStatus(count){
  if(!phase3Active())return;
  const complete=count>=barricadeMax;
  const text=complete?"倉庫防壁 完成｜越境攻撃を遮断":`倉庫防壁 ${count}/${barricadeMax}`;
  const x=535,y=345;
  ctx.save();ctx.textAlign="center";ctx.font="bold 12px 'Mochiy Pop One',sans-serif";
  const width=ctx.measureText(text).width+22;
  ctx.fillStyle="rgba(58,40,23,.84)";ctx.strokeStyle="rgba(255,225,163,.86)";ctx.lineWidth=1.8;
  ctx.beginPath();ctx.roundRect(x-width/2,y-14,width,25,8);ctx.fill();ctx.stroke();
  ctx.fillStyle="#fff0bd";ctx.fillText(text,x,y+3);ctx.restore();
 }

 function drawDynamicBarricade(){
  if(!phase3Active())return;
  const count=barricadeProgress();
  drawBarricadeGuide();
  for(let index=0;index<count;index++)drawBarricadeBlock(index);
  drawNextBarricadeSite(count);
  drawBarricadeStatus(count);
 }

 let pendingSnackDelivery=0,lastDeliveryFrame=-Infinity;
 const snackFlights=[];
 function queueSnackDelivery(amount){
  if(!phase3Active())return;
  pendingSnackDelivery+=Math.max(0,Math.floor(Number(amount)||0));
  const now=Number.isFinite(frame)?frame:0;
  if(snackFlights.length<3&&now-lastDeliveryFrame>10)spawnSnackFlight();
 }
 function spawnSnackFlight(){
  if(pendingSnackDelivery<=0||snackFlights.length>=7)return;
  const amount=pendingSnackDelivery;pendingSnackDelivery=0;lastDeliveryFrame=Number.isFinite(frame)?frame:0;
  snackFlights.push({amount,t:0,x0:610+Math.random()*170,y0:42+Math.random()*42,curveX:355+Math.random()*90,curveY:45+Math.random()*50,phase:Math.random()*Math.PI*2});
 }
 function drawSnackFlights(){
  if(!phase3Active())return;
  const now=Number.isFinite(frame)?frame:0;if(pendingSnackDelivery>0&&now-lastDeliveryFrame>14)spawnSnackFlight();
  const door=warehouse.position||{x:132,y:235};
  const targetX=(door.doorX??198),targetY=(door.doorY??242);
  for(let index=snackFlights.length-1;index>=0;index--){
   const flight=snackFlights[index];flight.t=Math.min(1,flight.t+.026);
   const t=flight.t,inv=1-t;
   const x=inv*inv*flight.x0+2*inv*t*flight.curveX+t*t*targetX;
   const y=inv*inv*flight.y0+2*inv*t*flight.curveY+t*t*targetY+Math.sin(t*Math.PI*4+flight.phase)*4;
   ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*2.4);ctx.textAlign="center";ctx.shadowColor="#ffe38b";ctx.shadowBlur=8;ctx.font="18px serif";ctx.fillText("🍖",x,y);
   if(flight.amount>=20){ctx.font="bold 10px sans-serif";ctx.fillStyle="#fff2bd";ctx.strokeStyle="rgba(70,40,16,.8)";ctx.lineWidth=3;ctx.strokeText(`+${flight.amount}`,x,y-15);ctx.fillText(`+${flight.amount}`,x,y-15)}
   ctx.restore();if(t>=1)snackFlights.splice(index,1);
  }
 }

 const previousAddSnacks=addSnacks;
 addSnacks=function(amount,category="normal"){
  const safeAmount=Math.max(0,Math.floor(Number(amount)||0));
  previousAddSnacks(amount,category);
  if(safeAmount>0)queueSnackDelivery(safeAmount);
 };

 const previousDrawField=drawField;
 drawField=function(){
  previousDrawField();
  if(gameMode!=="endless")return;
  const background=stageBackground();
  if(background)ctx.drawImage(background,0,0,WIDTH,HEIGHT);
  drawDynamicBarricade();
  drawSnackFlights();
 };

 window.BACKGROUND_REFINEMENT=Object.freeze({
  stageBackgroundAssets:true,
  phase2Asset:"assets/forest-map-wave35.svg",
  phase3Asset:"assets/forest-map-wave50.svg",
  warehouseBakedIntoPhase3:true,
  runtimeRouteOverlay:false
 });
})();