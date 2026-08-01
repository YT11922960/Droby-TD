(()=>{
 const chunks=window.FINAL_MAP_V3_CHUNKS;
 const data=Array.isArray(chunks)?chunks.join(""):"";
 const valid=chunks?.length===4&&data.length===53052&&data.startsWith("AAAAIGZ0eXBhdmlmAAAA")&&data.endsWith("TuWxZYmUe9CZXy4I/wFKPA==");
 if(!valid)throw new Error(`Illustrated endless map data is incomplete: chunks=${chunks?.length||0}, length=${data.length}`);
})();