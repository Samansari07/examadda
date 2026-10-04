"use client";

import {useEffect,useMemo,useState} from "react";
import {exams} from "@/lib/exams";
import {autoExamData} from "@/lib/auto-exam-data";
import {getApplicationState,getExamState} from "@/lib/exam-status";

type Profile={age:string;education:string;category:string;state:string};
type Task={id:string;label:string;done:boolean};

const quiz=[
 {q:"The Constitution of India came into force on:",a:["15 August 1947","26 January 1950","26 November 1949","2 October 1950"],correct:1},
 {q:"Which body conducts the Civil Services Examination?",a:["SSC","UPSC","NTA","IBPS"],correct:1},
 {q:"RRB is primarily associated with recruitment for:",a:["Railways","Banks","Defence","Universities"],correct:0}
];

function dateFrom(value?:string){
 if(!value)return null;
 const m=value.match(/20\d{2}-\d{2}-\d{2}/);
 if(m)return new Date(m[0]+"T23:59:59Z");
 const parsed=Date.parse(value);
 return Number.isFinite(parsed)?new Date(parsed):null;
}

export default function Dashboard(){
 const [profile,setProfile]=useState<Profile>({age:"",education:"",category:"General",state:""});
 const [saved,setSaved]=useState<string[]>([]);
 const [tasks,setTasks]=useState<Task[]>([
  {id:"quiz",label:"Complete today's 3-question quiz",done:false},
  {id:"discover",label:"Check new government opportunities",done:false},
  {id:"revise",label:"Revise one weak topic for 20 minutes",done:false},
  {id:"save",label:"Save at least one opportunity to your shortlist",done:false},
 ]);
 const [quizIndex,setQuizIndex]=useState(0);
 const [quizScore,setQuizScore]=useState<number|null>(null);
 const [profileOpen,setProfileOpen]=useState(false);

 useEffect(()=>{
   try{
     const p=localStorage.getItem("sarkariprep_profile");
     const s=localStorage.getItem("sarkariprep_saved");
     const t=localStorage.getItem("sarkariprep_tasks");
     if(p)setProfile(JSON.parse(p));
     if(s)setSaved(JSON.parse(s));
     if(t){
       const parsed=JSON.parse(t);
       if(Array.isArray(parsed))setTasks(parsed);
     }
   }catch{}
 },[]);

 function persistProfile(next:Profile){
   setProfile(next);
   try{localStorage.setItem("sarkariprep_profile",JSON.stringify(next));}catch{}
 }
 function toggleTask(id:string){
   const next=tasks.map(t=>t.id===id?{...t,done:!t.done}:t);
   setTasks(next);
   try{localStorage.setItem("sarkariprep_tasks",JSON.stringify(next));}catch{}
 }
 function saveExam(slug:string){
   const next=saved.includes(slug)?saved.filter(x=>x!==slug):[...saved,slug];
   setSaved(next);
   try{localStorage.setItem("sarkariprep_saved",JSON.stringify(next));}catch{}
 }
 function answerQuiz(i:number){
   if(i===quiz[quizIndex].correct){
     setQuizScore(s=>(s??0)+1);
   }
   if(quizIndex<quiz.length-1)setQuizIndex(x=>x+1);
   else setTasks(ts=>ts.map(t=>t.id==="quiz"?{...t,done:true}:t));
 }

 const statuses=useMemo(()=>exams.map(e=>{
   const o=autoExamData[e.slug];
   return {e,o,app:getApplicationState(e,o),exam:getExamState(e,o)};
 }),[]);
 const open=statuses.filter(x=>x.app==="open");
 const upcoming=statuses.filter(x=>x.exam==="upcoming").sort((a,b)=>(dateFrom(a.o?.examDate||a.e.examDate)?.getTime()??Infinity)-(dateFrom(b.o?.examDate||b.e.examDate)?.getTime()??Infinity));
 const savedRecords=saved.map(s=>exams.find(e=>e.slug===s)).filter(Boolean) as typeof exams;
 const completion=Math.round(tasks.filter(t=>t.done).length/tasks.length*100);
 const next=upcoming[0];

 const recommendations=useMemo(()=>{
   const q=profile.education.toLowerCase();
   return statuses.filter(x=>{
     if(x.app==="closed" && x.exam==="completed")return false;
     if(!q)return x.app==="open"||x.exam==="upcoming";
     const text=(x.e.qualifications+" "+x.e.category+" "+x.e.name).toLowerCase();
     return q.split(/[,\s]+/).some(word=>word.length>2&&text.includes(word)) || x.app==="open";
   }).slice(0,6);
 },[profile.education,statuses]);

 return <main className="dashboardPage">
   <div className="dashboardWrap">
    <a href="/" className="dashBack">← Back to SarkariPrep</a>

    <section className="dashHero">
      <div>
        <span className="eyebrow">MY SARKARIPREP</span>
        <h1>{profile.age||profile.education?"Your government-career command centre.":"Build your personal government-career command centre."}</h1>
        <p>Deadlines, eligible opportunities, daily practice and saved exams — ek jagah. Your progress is saved on this device.</p>
      </div>
      <button className="profileButton" onClick={()=>setProfileOpen(x=>!x)}>⚙ Profile</button>
    </section>

    {profileOpen&&<section className="profilePanel">
      <div><span className="eyebrow">PERSONALIZE</span><h2>Tell us about yourself</h2><p>Basic profile se recommendations better honge. Koi data server par send nahi hota is demo experience mein.</p></div>
      <div className="profileGrid">
        <label>Age<input value={profile.age} onChange={e=>persistProfile({...profile,age:e.target.value})} placeholder="e.g. 24"/></label>
        <label>Education<input value={profile.education} onChange={e=>persistProfile({...profile,education:e.target.value})} placeholder="e.g. B.Tech Mechanical"/></label>
        <label>Category<select value={profile.category} onChange={e=>persistProfile({...profile,category:e.target.value})}>{["General","OBC","SC","ST","EWS","PwBD"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>State<input value={profile.state} onChange={e=>persistProfile({...profile,state:e.target.value})} placeholder="e.g. Jharkhand"/></label>
      </div>
    </section>}

    <section className="dashStats">
      <div><b>{open.length}</b><span>Applications open</span></div>
      <div><b>{upcoming.length}</b><span>Upcoming exam cycles</span></div>
      <div><b>{saved.length}</b><span>Saved opportunities</span></div>
      <div><b>{completion}%</b><span>Today's mission</span></div>
    </section>

    <section className="dailyGrid">
      <article className="missionCard">
        <div className="missionHead"><div><span className="eyebrow">🔥 TODAY'S MISSION</span><h2>Make progress today.</h2></div><strong>{completion}%</strong></div>
        <div className="missionBar"><span style={{width:completion+"%"}}/></div>
        <div className="taskList">{tasks.map(t=><button className={"task "+(t.done?"done":"")} key={t.id} onClick={()=>toggleTask(t.id)}><span>{t.done?"✓":"○"}</span><b>{t.label}</b></button>)}</div>
      </article>

      <article className="nextCard">
        <span className="eyebrow">⏱ NEXT IMPORTANT EXAM</span>
        {next?<><h2>{next.e.name}</h2><p>{next.e.organization} · {next.app==="open"?"Application Open":"Upcoming"}</p><div className="nextDateLarge">{dateFrom(next.o?.examDate||next.e.examDate)?.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})||"Date TBA"}</div><a href={"/exams/"+next.e.slug}>Open exam command page →</a></>:<div className="dashEmpty">No upcoming exam date is currently confirmed in the catalogue.</div>}
      </article>
    </section>

    <section className="dashboardSection">
      <div className="dashSectionHead"><div><span className="eyebrow">🎯 FOR YOU</span><h2>Opportunities to check</h2></div><a href="/exams">Full directory →</a></div>
      <div className="opportunityGrid">{recommendations.map(({e,app,exam})=><article className="opportunity" key={e.slug}>
        <div className="oppTop"><span>{e.category}</span><button onClick={()=>saveExam(e.slug)}>{saved.includes(e.slug)?"★ Saved":"☆ Save"}</button></div>
        <h3>{e.name}</h3><small>{e.organization}</small>
        <div className="oppStatus"><b className={app}>{app==="open"?"🟢 Applications Open":app==="upcoming"?"🟡 Application Soon":app==="closed"?"🔴 Application Closed":"⚪ Status Unconfirmed"}</b><span>{exam==="upcoming"?"Exam upcoming":exam==="ongoing"?"Exam in progress":"Exam date TBA"}</span></div>
        <a href={"/exams/"+e.slug}>Check eligibility & details →</a>
      </article>)}</div>
    </section>

    <section className="dashboardSection">
      <div className="dashSectionHead"><div><span className="eyebrow">🧠 DAILY PRACTICE</span><h2>3-question quiz</h2></div><span className="quizScore">{quizScore===null?"Start now":"Score "+quizScore+"/"+quiz.length}</span></div>
      {quizIndex<quiz.length?<article className="quizCard"><span className="quizNumber">QUESTION {quizIndex+1} / {quiz.length}</span><h3>{quiz[quizIndex].q}</h3><div className="quizOptions">{quiz[quizIndex].a.map((a,i)=><button key={a} onClick={()=>answerQuiz(i)}>{String.fromCharCode(65+i)}. {a}</button>)}</div></article>:<article className="quizComplete"><b>🎉 Quiz complete!</b><p>You scored {quizScore}/{quiz.length}. Come back tomorrow for a fresh mission.</p><button onClick={()=>{setQuizIndex(0);setQuizScore(null)}}>Retry quiz</button></article>}
    </section>

    <section className="dashboardSection">
      <div className="dashSectionHead"><div><span className="eyebrow">🔖 YOUR SHORTLIST</span><h2>Saved exams</h2></div><a href="/">Manage from home →</a></div>
      {savedRecords.length?<div className="savedDashGrid">{savedRecords.slice(0,8).map(e=><a href={"/exams/"+e.slug} className="savedDashCard" key={e.slug}><b>{e.name}</b><span>{e.organization} · {e.category}</span></a>)}</div>:<div className="dashEmpty">Abhi kuch save nahi hai. Opportunity cards par ☆ Save tap karo.</div>}
    </section>

    <section className="dashBottom">
      <div><span className="eyebrow">🛡️ TRUST</span><h2>Official source first.</h2><p>SarkariPrep discovery aur organization mein help karta hai. Final eligibility, dates, fees, vacancies aur application instructions ke liye official notification controlling source hai.</p></div>
      <div className="bottomActions"><a href="/notifications">Open notification centre</a><a href="/upcoming-government-exams">View upcoming exams</a><a href="/jobs">Explore government jobs</a></div>
    </section>
   </div>
 </main>
}
