import { NextRequest, NextResponse } from "next/server";
import { REGIONS } from "@/lib/regions";
import { getWeatherPrediction } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const regionCode = searchParams.get("region");
  const dateStr = searchParams.get("date");

  if (!regionCode || !dateStr) {
    return NextResponse.json({ error: "region and date are required" }, { status: 400 });
  }

  const region = REGIONS.find((r) => r.code === regionCode);
  if (!region) {
    return NextResponse.json({ error: "invalid region code" }, { status: 400 });
  }

  const targetDate = new Date(dateStr + "T00:00:00+09:00");
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: "invalid date format" }, { status: 400 });
  }

  try {
    const result = await getWeatherPrediction(region, targetDate);
    return NextResponse.json({
      region: region.name,
      date: dateStr,
      ...result,
    });
  } catch (e) {
    console.error("Weather API error:", e);
    return NextResponse.json({ error: "failed to fetch weather data" }, { status: 500 });
  }
}
