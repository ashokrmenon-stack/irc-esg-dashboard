import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const OPENAI_BASE = "https://api.openai.com/v1";
const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIMS  = 1024;            // must match document_chunks.embedding dim
const CHAT_MODEL  = "gpt-4o-mini";   // cheap, fast; switch to gpt-4o for higher quality
const MATCH_COUNT = 6;
const MATCH_THRESHOLD = 0.25;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not set on the server." }, { status: 500 });
    }

    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { question, history = [] } = (await req.json()) as { question: string; history?: Msg[] };
    if (!question?.trim()) {
      return NextResponse.json({ error: "Empty question" }, { status: 400 });
    }

    // 1) Embed the question
    const embedRes = await fetch(`${OPENAI_BASE}/embeddings`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: question, dimensions: EMBED_DIMS })
    });
    if (!embedRes.ok) {
      const text = await embedRes.text();
      return NextResponse.json({ error: `OpenAI embedding failed: ${text}` }, { status: 502 });
    }
    const embedJson = await embedRes.json();
    const embedding: number[] = embedJson.data[0].embedding;

    // 2) Vector search via Supabase RPC
    const { data: matches, error: matchErr } = await supabase.rpc("match_documents", {
      query_embedding: embedding as unknown as string,
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT
    });
    if (matchErr) {
      return NextResponse.json({ error: `Supabase RPC failed: ${matchErr.message}` }, { status: 500 });
    }

    type Match = {
      chunk_id: string; document_id: string; document_title: string;
      doc_type: string; source_path: string; chunk_index: number;
      content: string; similarity: number;
    };
    const m = (matches ?? []) as Match[];

    // 3) Build prompt with retrieved context
    const context = m.length
      ? m.map((x, i) => `[Source ${i + 1}: ${x.document_title} (${x.doc_type}), chunk ${x.chunk_index}]\n${x.content}`).join("\n\n---\n\n")
      : "(no relevant documents found)";

    const systemPrompt =
      "You are an ESG analyst assistant for Indorama Corporation (IRC). " +
      "Answer the user's question using ONLY the SOURCES below. " +
      "Cite each fact with bracketed source numbers like [Source 1]. " +
      "If the sources don't contain the answer, say so clearly — do not invent figures. " +
      "Prefer concise, structured answers with units (tCO2e, GJ, m³, etc.).\n\n" +
      "SOURCES:\n" + context;

    // 4) Chat completion
    const chatRes = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-6),
          { role: "user", content: question }
        ]
      })
    });
    if (!chatRes.ok) {
      const text = await chatRes.text();
      return NextResponse.json({ error: `OpenAI chat failed: ${text}` }, { status: 502 });
    }
    const chatJson = await chatRes.json();
    const answer: string = chatJson.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      answer,
      sources: m.map(x => ({
        document_title: x.document_title,
        doc_type: x.doc_type,
        chunk_index: x.chunk_index,
        similarity: x.similarity
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
