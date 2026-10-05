import {NextResponse} from "next/server";
import {Redis} from "@upstash/redis";
export const runtime="nodejs";
function getRedis(){if(!process.env.KV_REST_API_URL||!process.env.KV_REST_API_TOKEN)return null;return new Redis({url:process.env.KV_REST_API_URL,token:process.env.KV_REST_API_TOKEN})}
export async function POST(req:Request){try{const body=await req.json();const endpoint=body?.subscription?.endpoint;if(!endpoint)return NextResponse.json({error:"Invalid subscription"},{status:400});const redis=getRedis();if(!redis)return NextResponse.json({error:"Push storage is not configured"},{status:503});const record={subscription:body.subscription,examSlug:body.examSlug||null,examName:body.examName||null,updatedAt:new Date().toISOString()};await redis.hset("sarkariprep:push:subscriptions",{[endpoint]:JSON.stringify(record)});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"Could not save subscription"},{status:500})}}
