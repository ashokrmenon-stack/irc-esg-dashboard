import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";
const CHAT_MODEL  = "claude-3-5-sonnet-20241022";
const MAX_ROWS    = 200;

type Msg = { role: "user" | "assistant"; content: string };

// Map keywords in the question to ESG categories / metrics in esg_data
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "EMISSIONS":      ["emission", "ghg", "co2", "carbon", "scope 1", "scope 2", "scope 3", "tco2"],
  "ENERGY":         ["energy", "fuel", "electricity", "power", "consumption", "gj", "kwh", "natural gas"],
  "WATER":          ["water withdrawal", "water consumption", "water intake", "fresh water", "groundwater"],
  "WATER DISCHARGE":["discharge", "effluent", "wastewater"],
  "WASTE":          ["waste", "hazardous", "non-hazardous", "recycled", "landfill"],
  "PRODUCTION":     ["production", "output", "produced", "throughput", "tonnes produced"],
  "AIR POLLUTANTS": ["sox", "nox", "pm", "particulate", "air pollutant", "vocs", "voc"],
};

function detectCategories(q: string): string[] {
  const lower = q.toLowerCase();
  const hits: string[] = [];
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(k => lower.includes(k))) hits.push(cat);
  }
  return hits;
}

function detectYears(q: string): number[] {
  const matches = q.match(/\b(20\d{2})\b/g) ?? [];
  const yrs = matches.map(Number).filter(y => y >= 2021 && y <= 2025);
  return Array.from(new Set(yrs));
}

function detectLocationHints(q: string): string[] {
  // Common IRC location code fragments — used as ILIKE patterns
  const candidates = ["IPI", "IPHL", "IVL", "IRPL", "IPCL", "PET", "PTA", "MEG", "INDIA", "NIGERIA", "USA", "EUROPE", "ASIA"];
  const lower = q.toUpperCase();
  return candidates.filter(c => lower.includes(c));
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set on the server." }, { status: 500 });
    }

    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { question, history = [] } = (await req.json()) as { question: string; history?: Msg[] };
    if (!question?.trim()) {
      return NextResponse.json({ error: "Empty question" }, { status: 400 });
    }

    // 1) Parse the question for structured filters
    const categories = detectCategories(question);
    const years      = detectYears(question);
    const locHints   = detectLocationHints(question);

    // 2) Build esg_data query
    let q = supabase
      .from("esg_data")
      .select("year, location_code, category, metric, unit, value")
      .order("year", { ascending: true })
      .limit(MAX_ROWS);

    if (categories.length > 0) {
      q = q.in("category", categories);
    }
    if (years.length > 0) {
      q = q.in("year", years);
    }
    if (locHints.length > 0) {
      const orClauses = locHints.map(l => `location_code.ilike.%${l}%`).join(",");
      q = q.or(orClauses);
    }

    const { data: rows, error: rowErr } = await q;
    if (rowErr) {
      return NextResponse.json({ error: `Supabase query failed: ${rowErr.message}` }, { status: 500 });
    }

    // 3) Format rows as compact CSV-style context for Claude
    type Row = { year: number; location_code: string; category: string; metric: string; unit: string; value: number | null };
    const r = (rows ?? []) as Row[];

    const context = r.length
      ? "year,location,category,metric,unit,value\n" +
        r.map(x => `${x.year},${x.location_code},${x.category},${x.metric},${x.unit},${x.value ?? ""}`).join("\n")
      : "(no rows matched your filters)";

    const filterSummary = [
      categories.length ? `categories: ${categories.join(", ")}` : "all categories",
      years.length      ? `years: ${years.join(", ")}`           : "all years 2021-2025",
      locHints.length   ? `locations matching: ${locHints.join(", ")}` : "all locations",
    ].join(" | ");

    const systemPrompt =
      "You are an ESG analyst assistant for Indorama Corporation (IRC). " +
      "Answer the user's question using ONLY the DATA TABLE below. " +
      "Aggregate (sum, average, growth %) as needed, and always show units. " +
      "If the data doesn't cover the question, say so clearly — do not invent figures. " +
      "Keep answers concise, with key numbers in **bold** and grouped by year or location where useful.\n\n" +
      `FILTERS APPLIED: ${filterSummary}\n` +
      `ROWS RETURNED: ${r.length}${r.length === MAX_ROWS ? " (truncated)" : ""}\n\n` +
      "DATA TABLE (CSV):\n" + context;

    // 4) Anthropic chat completion
    const messages = [
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: question }
    ];

    const chatRes = await fetch(ANTHROPIC_BASE, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 1024,
        temperature: 0.2,
        system: systemPrompt,
        messages
      })
    });

    if (!chatRes.ok) {
      const text = await chatRes.text();
      return NextResponse.json({ error: `Anthropic chat failed: ${text}` }, { status: 502 });
    }
    const chatJson = await chatRes.json();
    const answer: string = chatJson.content?.[0]?.text ?? "";

    return NextResponse.json({
      answer,
      sources: {
        filters: { categories, years, locationHints: locHints },
        rowsReturned: r.length,
        truncated: r.length === MAX_ROWS,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
