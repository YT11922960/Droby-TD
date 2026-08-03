(()=>{
 const chunks=window.FINAL_MAP_V3_CHUNKS;
 const data=Array.isArray(chunks)?chunks.join(""):"";
 let hash=2166136261;
 for(let index=0;index<data.length;index++){hash^=data.charCodeAt(index);hash=Math.imul(hash,16777619)>>>0}
 const valid=chunks?.length===4&&data.length===53052&&hash===3484280254&&data.startsWith("AAAAIGZ0eXBhdmlmAAAA")&&data.endsWith("TuWxZYmUe9CZXy4I/wFKPA==");
 if(!valid)throw new Error(`Illustrated endless map data is incomplete: chunks=${chunks?.length||0}, length=${data.length}, hash=${hash.toString(16)}`);
})();