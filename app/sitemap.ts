import {MetadataRoute} from "next";
import {exams} from "@/lib/exams";
export default function sitemap():MetadataRoute.Sitemap{
 const base="https://examadda.vercel.app";
 return [{url:base,priority:1},{url:base+"/exams",priority:.95},...exams.map(e=>({url:base+"/exams/"+e.slug,priority:.8}))];
}