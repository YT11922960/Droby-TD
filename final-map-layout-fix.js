(()=>{
 const map=window.FINAL_ENDLESS_MAP;
 const warehouse=window.SNACK_WAREHOUSE;
 if(!map||!warehouse?.spotOverrides)return;
 const finalSpots=Object.entries(warehouse.spotOverrides).map(([index,point])=>[Number(index),point]);
 const previousDrawField=drawField;
 drawField=function(...args){
  const result=previousDrawField(...args);
  if(gameMode!=="endless")return result;
  for(const [index,point] of finalSpots){
   if(!spots[index]||!Array.isArray(point))continue;
   spots[index]=[point[0],point[1]];
  }
  for(const tower of towers){
   const point=warehouse.spotOverrides[tower.spot];
   if(point){tower.x=point[0];tower.y=point[1]}
  }
  return result;
 };
})();