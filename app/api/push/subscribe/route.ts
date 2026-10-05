import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {createHash} from "node:crypto";
export const runtime="nodejs";
function key(endpoint:string){return createHash("sha256").update(endpoint).digest("hex")}
export async function POST(req:Request){try{const body=await req.json();const endpoint=body?.subscription?.endpoint;if(!endpoint)return NextResponse.json({error:"Invalid subscription"},{status:400});const record={subscription:body.subscription,examSlug:body.examSlug||null,examName:body.examName||null,updatedAt:new Date().toISOString()};await put("subscriptions/"+key(endpoint)+".json",JSON.stringify(record),{access:"private",allowOverwrite:true,contentType:"application/json"});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"Could not save subscription"},{status:500})}}
