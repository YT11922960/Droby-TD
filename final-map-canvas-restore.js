(()=>{
 const chunks=window.FINAL_MAP_CHUNKS;
 if(!Array.isArray(chunks)||!chunks.length)return;

 const mapImage=new Image();
 mapImage.decoding="async";
 mapImage.src=`data:image/avif;base64,${chunks.join("")}`;
 mapImage.addEventListener("error",()=>console.error("Failed to restore the illustrated endless map."),{once:true});

 const previousDrawField=drawField;
 drawField=function(...args){
  const result=previousDrawField(...args);
  if(gameMode!=="endless"||!mapImage.complete||mapImage.naturalWidth<=0)return result;

  canvas.style.backgroundImage="";
  canvas.style.backgroundSize="";
  canvas.style.backgroundPosition="";
  canvas.style.backgroundRepeat="";

  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation="destination-over";
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(mapImage,0,0,canvas.width,canvas.height);
  ctx.restore();
  return result;
 };
})();