(()=>{
 const warehouseFeature=window.SNACK_WAREHOUSE;
 if(!warehouseFeature?.route?.length||!warehouseFeature?.branchRoute?.length)return;

 const WIDTH=1200,HEIGHT=760;
 const layers={
  warehouse:createLayer(),
  branch:createLayer(),
  route3:createLayer(),
  route3Closed:createLayer()
 };

 function createLayer(){
  const canvas=document.createElement("canvas");
  canvas.width=WIDTH;canvas.height=HEIGHT;
  return{canvas,ctx:canvas.getContext("2d")};
 }

 function tracePath(g,points){
  g.beginPath();
  points.forEach(([x,y],index)=>index?g.lineTo(x,y):g.moveTo(x,y));
 }

 function drawSoftPath(g,points,width=34){
  g.save();g.lineCap="round";g.lineJoin="round";
  const layersToDraw=[
   [width+20,"rgba(45,54,27,.22)"],
   [width+13,"rgba(74,57,31,.48)"],
   [width+6,"rgba(126,91,49,.62)"],
   [width,"rgba(177,137,82,.72)"],
   [Math.max(8,width-11),"rgba(210,176,112,.34)"]
  ];
  layersToDraw.forEach(([lineWidth,strokeStyle])=>{
   g.lineWidth=lineWidth;g.strokeStyle=strokeStyle;tracePath(g,points);g.stroke();
  });
  g.restore();
 }

 function segmentPoint(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
 function drawPathTexture(g,points,step=2){
  g.save();
  for(let index=0;index<points.length-1;index+=step){
   const a=points[index],b=points[index+1];if(!b)continue;
   const [x,y]=segmentPoint(a,b,.5),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
   const side=index%2?1:-1,offset=24+(index%3)*3;
   g.translate(x,y);g.rotate(angle);
   g.globalAlpha=.42;
   g.fillStyle=index%3===0?"#6f7946":"#879454";
   g.beginPath();g.ellipse(-7,side*offset,8,2.7,-.4,0,Math.PI*2);g.fill();
   g.beginPath();g.ellipse(3,side*(offset+3),6,2.2,.45,0,Math.PI*2);g.fill();
   if(index%4===0){
    g.globalAlpha=.32;g.fillStyle="#7b6849";g.beginPath();g.ellipse(10,-side*(offset-5),5,3,.2,0,Math.PI*2);g.fill();
   }
   g.setTransform(1,0,0,1,0,0);
  }
  g.restore();
 }

 function drawWarehouseClearing(g){
  const {x,y}=warehouseFeature.position;
  g.save();
  const glow=g.createRadialGradient(x,y+22,20,x,y+22,128);
  glow.addColorStop(0,"rgba(177,139,83,.64)");
  glow.addColorStop(.55,"rgba(132,102,60,.42)");
  glow.addColorStop(1,"rgba(56,68,35,0)");
  g.fillStyle=glow;g.beginPath();g.ellipse(x,y+24,132,96,-.08,0,Math.PI*2);g.fill();
  g.globalAlpha=.34;g.fillStyle="#665134";
  [[52,282,40,12],[205,294,46,14],[106,322,54,12]].forEach(([px,py,rx,ry])=>{g.beginPath();g.ellipse(px,py,rx,ry,0,0,Math.PI*2);g.fill()});
  g.globalAlpha=.52;g.fillStyle="#8e6b3e";g.strokeStyle="rgba(66,45,25,.62)";g.lineWidth=2;
  [[54,276,30,25],[215,283,28,23]].forEach(([px,py,w,h],index)=>{
   g.beginPath();g.roundRect(px-w/2,py-h/2,w,h,4);g.fill();g.stroke();
   g.beginPath();g.moveTo(px-w/2+4,py);g.lineTo(px+w/2-4,py);g.stroke();
   if(index===0){g.beginPath();g.moveTo(px,py-h/2+3);g.lineTo(px,py+h/2-3);g.stroke()}
  });
  g.globalAlpha=.5;g.fillStyle="#72834a";
  [[35,214,18,8,-.4],[226,215,22,8,.3],[36,328,20,7,.2],[245,329,19,7,-.35]].forEach(([px,py,rx,ry,rot])=>{g.beginPath();g.ellipse(px,py,rx,ry,rot,0,Math.PI*2);g.fill()});
  g.restore();
 }

 function drawRouteEntrance(g,x,y,direction=1){
  g.save();g.translate(x,y);g.scale(direction,1);g.globalAlpha=.66;
  g.strokeStyle="#584229";g.fillStyle="#8d693d";g.lineWidth=2;
  g.fillRect(-3,-24,6,32);g.strokeRect(-3,-24,6,32);
  g.beginPath();g.roundRect(0,-23,38,17,4);g.fill();g.stroke();
  g.fillStyle="#d0b27a";g.beginPath();g.moveTo(31,-19);g.lineTo(38,-14.5);g.lineTo(31,-10);g.closePath();g.fill();
  g.restore();
 }

 function buildLayers(){
  drawWarehouseClearing(layers.warehouse.ctx);

  drawSoftPath(layers.branch.ctx,warehouseFeature.branchRoute,34);
  drawPathTexture(layers.branch.ctx,warehouseFeature.branchRoute,2);
  drawRouteEntrance(layers.branch.ctx,1158,535,-1);

  drawSoftPath(layers.route3.ctx,warehouseFeature.route,31);
  drawPathTexture(layers.route3.ctx,warehouseFeature.route,2);
  drawRouteEntrance(layers.route3.ctx,965,119,-1);

  const closed=warehouseFeature.route.slice(-6);
  drawSoftPath(layers.route3Closed.ctx,closed,25);
  drawPathTexture(layers.route3Closed.ctx,closed,2);
 }
 buildLayers();

 const originalDrawImage=ctx.drawImage.bind(ctx);
 const originalStroke=ctx.stroke.bind(ctx);
 const originalFillText=ctx.fillText.bind(ctx);
 const originalStrokeText=ctx.strokeText.bind(ctx);
 let legacyPass=false,skipBaseImage=false;

 const legacyRouteStrokes=new Set([
  "#765028|48","#b8844d|38","#d8b47a|28","#f3dfa9|5",
  "#694522|48","#9a6838|39","#d3aa70|29","#f3dda6|5",
  "#73502f|34","#d0ad78|24"
 ]);
 function legacyRouteStroke(){return legacyRouteStrokes.has(`${String(ctx.strokeStyle).toLowerCase()}|${Number(ctx.lineWidth)}`)}
 function legacySceneryText(text){
  if(text==="ルート3"||text==="新入口")return true;
  return(text==="🍃"||text==="🪵")&&/^(22|24)px serif/.test(ctx.font);
 }

 ctx.drawImage=function(...args){
  if(legacyPass&&skipBaseImage&&args.length>=5&&args[1]===0&&args[2]===0&&args[3]===WIDTH&&args[4]===HEIGHT)return;
  return originalDrawImage(...args);
 };
 ctx.stroke=function(...args){if(legacyPass&&legacyRouteStroke())return;return originalStroke(...args)};
 ctx.fillText=function(text,...args){if(legacyPass&&legacySceneryText(text))return;return originalFillText(text,...args)};
 ctx.strokeText=function(text,...args){if(legacyPass&&(text==="ルート3"||text==="新入口"))return;return originalStrokeText(text,...args)};

 function currentBackground(){
  const requested=gameMode==="normal"?art[`chapter${currentChapter}`]:art.map;
  if(requested?.complete&&requested.naturalWidth)return requested;
  if(art.chapter5?.complete&&art.chapter5.naturalWidth)return art.chapter5;
  if(art.map?.complete&&art.map.naturalWidth)return art.map;
  return null;
 }
 function route3Open(){return gameMode==="endless"&&wave+1>=(warehouseFeature.unlockWave||50)}

 const previousDrawField=drawField;
 drawField=function(){
  if(gameMode!=="endless")return previousDrawField();
  const background=currentBackground();
  if(background)originalDrawImage(background,0,0,WIDTH,HEIGHT);
  originalDrawImage(layers.warehouse.canvas,0,0);
  if(routeBranchActive)originalDrawImage(layers.branch.canvas,0,0);
  originalDrawImage(route3Open()?layers.route3.canvas:layers.route3Closed.canvas,0,0);

  legacyPass=true;skipBaseImage=!!background;
  try{return previousDrawField()}
  finally{legacyPass=false;skipBaseImage=false}
 };

 window.BACKGROUND_REFINEMENT=Object.freeze({
  route2Integrated:true,
  route3Integrated:true,
  warehouseClearingIntegrated:true,
  generatedImageAsset:false
 });
})();