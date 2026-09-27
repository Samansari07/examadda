import { exams } from "@/lib/exams";

export default function JobsPage(){
 const categories=Array.from(new Set(exams.map(e=>e.category)));
 return <main className="directoryPage"><div className="wrap"><a className="backLink" href="/">Back to SarkariPrep</a><div className="directoryHero"><span className="tag">CAREER DISCOVERY</span><h1>Government Jobs</h1><p>Qualification aur recruitment family ke hisaab se government career routes explore karo.</p></div><section className="section compact"><div className="categoryGrid">{categories.map(c=><a className="categoryTile" href={"/exams?category="+encodeURIComponent(c)} key={c}><b>{c}</b><span>{exams.filter(e=>e.category===c).length} guides</span></a>)}</div></section></div></main>;