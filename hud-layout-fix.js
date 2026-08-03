(()=>{
 const mapColumn=document.querySelector(".map-column");
 const topbar=mapColumn?.querySelector(".topbar");
 const preparation=document.querySelector("#preparation-phase");
 const selected=document.querySelector("#selected-tower-indicator");
 if(!mapColumn||!topbar||!preparation||!selected)return;

 let rail=mapColumn.querySelector(".map-status-rail");
 if(!rail){
  rail=document.createElement("div");
  rail.className="map-status-rail";
  rail.setAttribute("aria-label","ゲーム状態");
  topbar.insertAdjacentElement("afterend",rail);
 }
 rail.append(preparation,selected);

 const style=document.createElement("style");
 style.dataset.feature="hud-layout-fix";
 style.textContent=`
  .map-status-rail{
   position:relative;
   z-index:7;
   flex:0 0 40px;
   min-height:40px;
   display:flex;
   align-items:center;
   justify-content:center;
   gap:10px;
   padding:5px 14px;
   border-top:1px solid rgba(255,239,184,.16);
   border-bottom:2px solid #5d3d1b;
   background:linear-gradient(180deg,#355726,#29461e);
   box-shadow:0 2px 5px rgba(31,22,10,.28);
   pointer-events:none;
  }
  .map-status-rail .preparation-phase,
  .map-status-rail .selected-tower-indicator{
   position:static!important;
   inset:auto!important;
   left:auto!important;
   right:auto!important;
   top:auto!important;
   bottom:auto!important;
   transform:none!important;
   width:auto!important;
   min-width:0!important;
   max-width:none!important;
   height:30px!important;
   margin:0!important;
   padding:4px 15px!important;
   display:flex;
   align-items:center;
   justify-content:center;
   gap:8px;
   border:2px solid #8d642d!important;
   border-radius:10px!important;
   background:linear-gradient(#fff0bd,#efd18b)!important;
   color:#4b3218!important;
   box-shadow:inset 0 0 0 1px rgba(255,249,218,.85),0 2px 0 rgba(28,18,8,.3)!important;
   white-space:nowrap;
   line-height:1!important;
   pointer-events:none;
  }
  .map-status-rail .preparation-phase.hidden,
  .map-status-rail .selected-tower-indicator.hidden{display:none!important}
  .map-status-rail .preparation-phase strong,
  .map-status-rail .preparation-phase span,
  .map-status-rail .selected-tower-indicator small,
  .map-status-rail .selected-tower-indicator strong{
   display:inline!important;
   margin:0!important;
   padding:0!important;
   line-height:1!important;
  }
  .map-status-rail .preparation-phase strong{font:12px "Mochiy Pop One",sans-serif!important}
  .map-status-rail .preparation-phase span{font:10px "Noto Sans JP",sans-serif!important;color:#6c5638!important}
  .map-status-rail .selected-tower-indicator small{font:9px "Noto Sans JP",sans-serif!important;color:#725735!important}
  .map-status-rail .selected-tower-indicator strong{font:12px "Mochiy Pop One",sans-serif!important;color:#4b3218!important}
  @media(max-width:1100px){
   .map-status-rail{gap:6px;padding-inline:8px}
   .map-status-rail .preparation-phase,
   .map-status-rail .selected-tower-indicator{padding-inline:9px!important}
   .map-status-rail .preparation-phase span{display:none!important}
  }
 `;
 document.head.appendChild(style);
})();