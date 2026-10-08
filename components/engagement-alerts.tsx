"use client";

import {useEffect,useState} from "react";
import {trackEvent} from "@/components/analytics";

type Props={examSlug?:string;examName?:string};
type ReminderState="show"|"remind-later"|"hidden";

function b64ToUint8(value:string){
  const pad="=".repeat((4-value.length%4)%4);
  const raw=atob((value+pad).replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}

const REMINDER_KEY="sarkariprep_alert_reminder_at";
const HIDDEN_KEY="sarkariprep_alert_hidden";

export default function EngagementAlerts({examSlug,examName}:Props){
  const [installEvent,setInstallEvent]=useState<any>(null);
  const [installed,setInstalled]=useState(false);
  const [permission,setPermission]=useState<NotificationPermission|"unsupported">("unsupported");
  const [subscribed,setSubscribed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [hidden,setHidden]=useState(false);
  const [isIOS,setIsIOS]=useState(false);
  const [isStandalone,setIsStandalone]=useState(false);
  const [reminder,setReminder]=useState<ReminderState>("show");
  const [supported,setSupported]=useState(false);

  useEffect(()=>{
    if(typeof window==="undefined") return;

    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    setIsIOS(ios);

    const standalone=window.matchMedia("(display-mode: standalone)").matches||(navigator as any).standalone===true;
    setInstalled(standalone);
    setIsStandalone(standalone);

    const onBefore=(e:any)=>{e.preventDefault();setInstallEvent(e)};
    window.addEventListener("beforeinstallprompt",onBefore);

    setPermission("Notification" in window?Notification.permission:"unsupported");
    setSupported("Notification" in window&&"serviceWorker" in navigator&&"PushManager" in window);

    try{
      if(localStorage.getItem(HIDDEN_KEY)==="1"){
        setHidden(true);
      }else{
        const remindAt=Number(localStorage.getItem(REMINDER_KEY)||0);
        if(remindAt>Date.now()) setReminder("remind-later");
      }
    }catch{}

    const onInstalled=()=>{
      setInstalled(true);
      setIsStandalone(true);
      setInstallEvent(null);
      setMessage("✓ SarkariPrep app install ho gaya. Ab Free Alerts ON karke deadlines, admit cards aur results miss na karein.");
      try{localStorage.removeItem(REMINDER_KEY)}catch{}
    };
    window.addEventListener("appinstalled",onInstalled);

    let registration:ServiceWorkerRegistration|undefined;
    navigator.serviceWorker?.register("/sw.js").then(async reg=>{
      registration=reg;
      reg.update().catch(()=>{});
      try{
        const existing=await reg.pushManager.getSubscription();
        setSubscribed(!!existing);
      }catch{}

      reg.addEventListener("updatefound",()=>{
        const worker=reg.installing;
        if(!worker) return;
        worker.addEventListener("statechange",()=>{
          if(worker.state==="installed"&&navigator.serviceWorker.controller)
            worker.postMessage({type:"SKIP_WAITING"});
        });
      });
    }).catch(()=>{});

    const onVisible=()=>{
      if(document.visibilityState==="visible"){
        registration?.update().catch(()=>{});
        try{
          const remindAt=Number(localStorage.getItem(REMINDER_KEY)||0);
          if(remindAt&&remindAt<=Date.now()){
            localStorage.removeItem(REMINDER_KEY);
            setReminder("show");
          }
        }catch{}
      }
    };
    document.addEventListener("visibilitychange",onVisible);
    const onControllerChange=()=>window.location.reload();
    navigator.serviceWorker?.addEventListener("controllerchange",onControllerChange);

    return()=>{
      window.removeEventListener("beforeinstallprompt",onBefore);
      window.removeEventListener("appinstalled",onInstalled);
      document.removeEventListener("visibilitychange",onVisible);
      navigator.serviceWorker?.removeEventListener("controllerchange",onControllerChange);
    };
  },[]);

  async function install(){
    trackEvent("install_cta_click",{location:examName?"exam_alerts":"alerts_banner"});
    if(!installEvent){
      if(isIOS){
        setMessage("iPhone/iPad: Share (↑) → Add to Home Screen → Open as Web App → Add. Phir SarkariPrep ko Home Screen se open karke Free Alerts ON karein.");
      }else{
        setMessage("Install prompt abhi browser ne nahi diya. Chrome ke ⋮ menu se “Install app” / “Add to Home screen” choose karein.");
      }
      return;
    }
    await installEvent.prompt();
    const result=await installEvent.userChoice;
    if(result?.outcome==="accepted"){
      trackEvent("install_prompt_accepted",{platform:isIOS?"ios":/Android/i.test(navigator.userAgent)?"android":"web"});
      setInstalled(true);
      setMessage("✓ Install request accept ho gaya. Ab Free Alerts ON karein.");
      try{localStorage.removeItem(REMINDER_KEY)}catch{}
    }else{
      setMessage("Install cancel hua. Jab ready ho, Install App par dobara tap kar sakte ho.");
    }
    setInstallEvent(null);
  }

  async function enableAlerts(){
    trackEvent("notification_prompt",{location:examName?"exam_alerts":"alerts_banner"});
    setBusy(true);
    setMessage("");
    try{
      if(isIOS&&!isStandalone){
        setMessage("iPhone/iPad par pehle SarkariPrep ko Home Screen par “Open as Web App” ke saath install karein, phir Alerts ON karein.");
        return;
      }
      if(!supported) throw new Error("Is browser mein push alerts available nahi hain.");
      if(Notification.permission==="denied"){
        setPermission("denied");
        setMessage("Notifications blocked hain. Browser/Site Settings → Notifications → Allow karke dobara try karein.");
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

      const res=await fetch("/api/push/subscribe",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          subscription,
          examSlug,
          examName,
          platform:isIOS?"ios":/Android/i.test(navigator.userAgent)?"android":"web",
          preferences:["new-jobs","application-deadlines","admit-card","result","answer-key","important-notice"]
        })
      });
      if(!res.ok) throw new Error("Alert subscription save nahi ho paya.");

      setSubscribed(true);
      trackEvent("push_subscription_success",{platform:isIOS?"ios":/Android/i.test(navigator.userAgent)?"android":"web",exam:examSlug||"all"});
      setMessage(examSlug?"✓ Is exam ke alerts ON ho gaye.":"✓ Government job & exam alerts ON ho gaye.");
      try{localStorage.removeItem(REMINDER_KEY)}catch{}
    }catch(e:any){
      setMessage(e?.message||"Alerts enable nahi ho paye.");
    }finally{
      setBusy(false);
    }
  }

  function remindLater(){
    trackEvent("alert_remind_later");
    try{localStorage.setItem(REMINDER_KEY,String(Date.now()+24*60*60*1000))}catch{}
    setReminder("remind-later");
    setMessage("Theek hai — hum is device par alert setup reminder baad mein dikhayenge.");
  }

  function dismiss(){
    trackEvent("alert_banner_dismiss");
    try{localStorage.setItem(HIDDEN_KEY,"1")}catch{}
    setHidden(true);
  }

  async function share(){
    trackEvent("share_click",{location:examName?"exam_alerts":"alerts_banner"});
    const data={
      title:examName?examName+" | SarkariPrep":"SarkariPrep",
      text:examName?("🚨 "+examName+" ka latest government exam update. Official details SarkariPrep par check karo."):"🇮🇳 Government jobs & exams miss mat karo — SarkariPrep share karo.",
      url:new URL(window.location.pathname+window.location.search,"https://sarkariprep.online").toString()
    };
    try{
      if(navigator.share) await navigator.share(data);
      else window.open("https://wa.me/?text="+encodeURIComponent(data.text+" "+data.url),"_blank","noopener,noreferrer");
    }catch{}
  }

  if(hidden) return null;

  const title=examName?(examName+" ke alerts ON rakho"):"Government Jobs & Exams — Never Miss an Update";
  const description=examName
    ?"Form dates, admit cards, results aur official notices ka alert seedha pao."
    :"Important jobs, exams, admit cards, results aur deadlines ki useful updates seedha pao.";

  const showInstall=!installed;
  const showAlerts=!subscribed;
  const statusText=subscribed
    ?"Alerts ON — important updates ke liye ready."
    :permission==="denied"
      ?"Alerts blocked — browser settings se Allow karein."
      :isIOS&&!isStandalone
        ?"iPhone/iPad: pehle Home Screen par install karein."
        :"Alerts OFF — important updates ke liye ON karein.";

  return <section className="engagementPanel" aria-label="SarkariPrep alerts">
    <div className="engagementIcon" aria-hidden="true">🔔</div>
    <div className="engagementCopy">
      <div className="engagementEyebrow">✓ VERIFIED GOVERNMENT UPDATES · NEVER MISS AN UPDATE</div>
      <h2>{title}</h2>
      <p>{description} Application open/closing, admit card, result, answer key aur important notice updates ke liye free alerts ON rakho.</p>
      <div className="engagementMissRow" aria-label="Updates covered by alerts">
        <span>🆕 New jobs</span><span>⏰ Deadlines</span><span>🎫 Admit card</span><span>🏆 Results</span>
      </div>
      <div className={"engagementStatus "+(permission==="denied"?"isWarning":"")}>{statusText}</div>
      {message&&<div className={"engagementMessage "+(permission==="denied"?"isWarning":"")}>{message}</div>}
    </div>
    <div className="engagementActions">
      {showInstall&&<button className="engagementInstall" onClick={install}>📲 {isIOS?"Add to Home Screen":"Install App"}</button>}
      {showAlerts&&<button className="engagementPrimary" onClick={enableAlerts} disabled={busy}>
        {busy?"Enabling…":"Turn on Free Alerts"}
      </button>}
      <button className="engagementShare" onClick={share}>↗ Share</button>
      {!subscribed&&reminder==="show"&&<button className="engagementLater" onClick={remindLater}>Baad mein</button>}
    </div>
    <button className="engagementClose" onClick={dismiss} aria-label="Dismiss alerts banner">×</button>
  </section>;
}
