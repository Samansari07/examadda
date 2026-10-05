"use client";

import {useEffect,useState} from "react";

type Props={examSlug?:string;examName?:string};

function b64ToUint8(value:string){
  const pad="=".repeat((4-value.length%4)%4);
  const raw=atob((value+pad).replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}

export default function EngagementAlerts({examSlug,examName}:Props){
  const [installEvent,setInstallEvent]=useState<any>(null);
  const [installed,setInstalled]=useState(false);
  const [permission,setPermission]=useState<NotificationPermission|"unsupported">("unsupported");
  const [subscribed,setSubscribed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [hidden,setHidden]=useState(false);

  useEffect(()=>{
    if(typeof window==="undefined") return;
    const onBefore=(e:any)=>{e.preventDefault();setInstallEvent(e)};
    window.addEventListener("beforeinstallprompt",onBefore);
    const syncInstalled=()=>setInstalled(window.matchMedia("(display-mode: standalone)").matches||(navigator as any).standalone===true);
    syncInstalled();
    setPermission("Notification" in window?Notification.permission:"unsupported");
    let registration: ServiceWorkerRegistration|undefined;
    navigator.serviceWorker?.register("/sw.js").then(reg=>{
      registration=reg;
      reg.update().catch(()=>{});
      reg.addEventListener("updatefound",()=>{
        const worker=reg.installing;
        if(!worker) return;
        worker.addEventListener("statechange",()=>{
          if(worker.state==="installed" && navigator.serviceWorker.controller) worker.postMessage({type:"SKIP_WAITING"});
        });
      });
    }).catch(()=>{});
    const onVisible=()=>{if(document.visibilityState==="visible") registration?.update().catch(()=>{})};
    document.addEventListener("visibilitychange",onVisible);
    const onControllerChange=()=>window.location.reload();
    navigator.serviceWorker?.addEventListener("controllerchange",onControllerChange);
    return()=>{window.removeEventListener("beforeinstallprompt",onBefore);window.removeEventListener("appinstalled",onInstalled);document.removeEventListener("visibilitychange",onVisible);navigator.serviceWorker?.removeEventListener("controllerchange",onControllerChange)};
  },[]);

  async function install(){
    if(!installEvent){
      setMessage("Install prompt abhi browser ne nahi diya. Chrome ke ⋮ menu se “Install app” / “Add to Home screen” choose karein.");
      return;
    }
    await installEvent.prompt();
    const result=await installEvent.userChoice;
    if(result?.outcome==="accepted"){
      setInstalled(true);
      setMessage("✓ Install request accept ho gaya. SarkariPrep app launcher/home screen mein available hoga.");
    }else{
      setMessage("Install cancel hua. Jab ready ho, Install App par dobara tap kar sakte ho.");
    }
    setInstallEvent(null);
  }

  async function enableAlerts(){
    setBusy(true);setMessage("");
    try{
      if(!("Notification"in window)||!("serviceWorker"in navigator)||!("PushManager"in window))
        throw new Error("Is browser mein push alerts available nahi hain.");
      if(Notification.permission==="denied"){
        setPermission("denied");
        setMessage("Notifications blocked hain. Chrome → Site settings → Notifications → Allow karke dobara try karein.");
        return;
      }
      const p=await Notification.requestPermission();
      setPermission(p);
      if(p!=="granted"){
        setMessage("Notifications allow nahi hui. Aap browser settings se SarkariPrep alerts ON kar sakte hain.");
        return;
      }
      const reg=await navigator.serviceWorker.ready;
      const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if(!key) throw new Error("Push service abhi configure nahi hua hai.");
      let subscription=await reg.pushManager.getSubscription();
      if(!subscription)
        subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(key)});
      const res=await fetch("/api/push/subscribe",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subscription,examSlug,examName})});
      if(!res.ok) throw new Error("Alert subscription save nahi ho paya.");
      setSubscribed(true);
      setMessage(examSlug?"✓ Is exam ke alerts ON ho gaye.":"✓ Government job & exam alerts ON ho gaye.");
    }catch(e:any){
      setMessage(e?.message||"Alerts enable nahi ho paye.");
    }finally{setBusy(false)}
  }

  async function share(){
    const data={
      title:examName?examName+" | SarkariPrep":"SarkariPrep",
      text:examName?("🚨 "+examName+" ka latest government exam update. Official details SarkariPrep par check karo."):"🇮🇳 Government jobs & exams miss mat karo — SarkariPrep share karo.",
      // Always share the public SarkariPrep domain, even when the page is opened from a Vercel preview URL.
      url:new URL(window.location.pathname+window.location.search,"https://sarkariprep.online").toString()
    };
    try{
      if(navigator.share) await navigator.share(data);
      else window.open("https://wa.me/?text="+encodeURIComponent(data.text+" "+data.url),"_blank","noopener,noreferrer");
    }catch{}
  }

  if(hidden) return null;

  const title=examName?(examName+" ke alerts ON rakho"):"Government Jobs & Exams — Never Miss an Update";
  const description=examName?"Form dates, admit cards, results aur official notices ka alert seedha pao.":"Important jobs, exams, admit cards, results aur deadlines ki useful updates seedha pao.";

  return <section className="engagementPanel" aria-label="SarkariPrep alerts">
    <div className="engagementIcon" aria-hidden="true">🔔</div>
    <div className="engagementCopy">
      <div className="engagementEyebrow">NEVER MISS AN UPDATE</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {message&&<div className={"engagementMessage "+(permission==="denied"?"isWarning":"")}>{message}</div>}
    </div>
    <div className="engagementActions">
      {!installed&&<button className="engagementInstall" onClick={install}>📲 Install App</button>}
      <button className="engagementPrimary" onClick={enableAlerts} disabled={busy||subscribed}>
        {busy?"Enabling…":subscribed?"✓ Alerts ON":"Turn on Free Alerts"}
      </button>
      <button className="engagementShare" onClick={share}>↗ Share</button>
    </div>
    <button className="engagementClose" onClick={()=>setHidden(true)} aria-label="Dismiss alerts banner">×</button>
  </section>;
}
