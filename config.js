window.GAME_CONFIG=Object.freeze({
 debugMode:true
});

window.addEventListener("DOMContentLoaded",()=>{
 if(document.querySelector('script[data-feature="snack-warehouse"]'))return;
 const script=document.createElement("script");
 script.src="snack-warehouse-v3.js?v=5";
 script.async=false;
 script.dataset.feature="snack-warehouse";
 script.addEventListener("error",()=>console.error("Failed to load snack warehouse feature."),{once:true});
 document.body.appendChild(script);
});