import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{r as t}from"./index-B8_9psXK.js";import{a as n,m as r}from"./vendor-leaflet-YPp5pIHn.js";var i=e(r(),1),a=`/MudFPVAssistant/assets/drone-icon-CKC8Kfbe.svg`,o=new Map;function s(e){let{category:r,badgeCount:s=0,outlined:c=!1}=e,l=`${r??``}-${s}-${c}`,u=o.get(l);if(u)return u;let d=r?t[r]:void 0;if(!d){let e=i.default.icon({iconUrl:a,iconSize:[32,32],iconAnchor:[16,16],shadowUrl:n,shadowSize:[32,32],shadowAnchor:[16,16]});return o.set(l,e),e}let f=s>0?`<div style="position:absolute;top:-6px;right:-8px;background:#1971c2;color:white;font-size:8px;font-weight:700;padding:1px 4px;border-radius:8px;min-width:14px;text-align:center;line-height:14px;pointer-events:none;">${s}</div>`:``,p=c?`outline:2px solid ${d};outline-offset:2px;`:``,m=c?16:18,h=`
    <div style="position:relative;width:28px;height:28px;overflow:visible;">
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${d};border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        ${p}">
        <img src="${a}" width="${m}" height="${m}" style="filter:brightness(0) invert(1);" alt="" />
      </div>
      ${f}
    </div>`,g=i.default.divIcon({html:h,className:``,iconSize:[28,28],iconAnchor:[14,14]});return o.set(l,g),g}function c(e,t){let n=new URL(`https://www.google.com/maps/dir/`);return n.searchParams.set(`api`,`1`),n.searchParams.set(`destination`,`${e},${t}`),n.searchParams.set(`travelmode`,`driving`),n.toString()}var l=/iP(hone|ad|od)/i.test(navigator.userAgent);function u(e,t){window.open(c(e,t),`_blank`,`noopener,noreferrer`)}function d(e,t){if(l)window.open(`maps://?daddr=${e},${t}&dirflg=d`);else{let n=new URL(`https://maps.apple.com/`);n.searchParams.set(`daddr`,`${e},${t}`),n.searchParams.set(`dirflg`,`d`),window.open(n.toString(),`_blank`,`noopener,noreferrer`)}}export{u as n,s as r,d as t};