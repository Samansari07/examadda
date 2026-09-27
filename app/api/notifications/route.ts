import { NextResponse } from "next/server";
import { notifications } from "@/lib/notifications";

export async function GET() {
  return NextResponse.json({
    updatedAt: "2026-09-27",
    sourcePolicy: "Official-source verified; final details must be checked on authority portals.",
    count: notifications.length,
    items: notifications,
  });
}
