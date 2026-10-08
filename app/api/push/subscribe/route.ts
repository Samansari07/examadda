import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {createHash} from "node:crypto";
export const runtime="nodejs";
function key(endpoint:string){return createHash("sha256").update(endpoint).digest("hex")}
export async function POST(req:Request){try{const body=await req.json();const endpoint=body?.subscription?.endpoint;if(!endpoint)return NextResponse.json({error:"Invalid subscription"},{status:400});const record={subscription:body.subscription,examSlug:body.examSlug||null,examName:body.examName||null,platform:body.platform||"web",preferences:Array.isArray(body.preferences)?body.preferences.slice(0,20):["new-jobs","application-deadlines","admit-card","result","answer-key","important-notice"],updatedAt:new Date().toISOString()};await put("subscriptions/"+key(endpoint)+".json",JSON.stringify(record),{access:"private",allowOverwrite:true,contentType:"application/json"});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"Could not save subscription"},{status:500})}}
