/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createClient } from "@supabase/supabase-js";

// --- Schema for ATS report ---
const feedbackSchema = z.object({
  atsScore: z.number().min(0).max(100).default(0),
  strongPoints: z.array(z.string()).default([]),
  weakPoints: z.array(z.string()).default([]),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser = StructuredOutputParser.fromZodSchema(feedbackSchema as any);

const promptTemplate = PromptTemplate.fromTemplate(`
You are an ATS (Applicant Tracking System). Analyze the resume text below. and provides strict score and strong and weak points.

Resume:
{resume_text}

Provide:
- ATS score (0-100) based on relevance, clarity, and completeness.
- Strong points as points.
- Weak points as points.

Return ONLY raw JSON. Do NOT include markdown code blocks (like \`\`\`json), explanations, or extra text.

{format_instructions}
`);

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENAI_KEY,
  model: "gemini-1.5-flash",
  temperature: 0.3,
  maxOutputTokens: 800,
});

// --- Supabase admin client for signing URLs ---
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

const urlRegex = /\/storage\/v1\/object\/(public|private|authenticated)\/([^/]+)\/(.+)/;

async function ensureSignedUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) throw new Error("No resume URL provided");

  // If already signed (token present), return as-is
  if (rawUrl.includes("token=")) return rawUrl;

  // Only sign Supabase storage URLs we can parse
  const match = rawUrl.match(urlRegex);
  if (!match) return rawUrl;

  const [, , bucket, filePath] = match;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to sign resume URL: ${error?.message ?? "unknown"} `);
  }

  return data.signedUrl;
}

export async function POST(req: NextRequest) {
  try {
    const { resumeURL } = await req.json();

    if (!resumeURL) {
      return NextResponse.json({ error: "No resumeURL provided" }, { status: 400 });
    }

    const signedUrl = await ensureSignedUrl(resumeURL);
    console.log("Fetching resume from:", signedUrl);

    // --- Download resume into tmp dir ---
    const response = await fetch(signedUrl);
    if (!response.ok) {
      console.error("Failed to fetch resume. Status:", response.status);
      return NextResponse.json({
        error: `Failed to fetch resume: ${response.status} ${response.statusText} `
      }, { status: 500 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log("Resume fetched, size:", buffer.length, "bytes");

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Resume file is empty" }, { status: 400 });
    }

    // ✅ Use os.tmpdir() to make sure path works in all environments
    const tempPath = path.join(os.tmpdir(), `resume - ${Date.now()}.pdf`);
    await fs.writeFile(tempPath, buffer);
    console.log("Resume saved to:", tempPath);

    // --- Extract text from PDF ---
    const loader = new PDFLoader(tempPath);
    const docs = await loader.load();
    const resumeText = docs.map(d => d.pageContent).join("\n");

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    console.log("Extracted text length:", resumeText.length);

    // --- Generate ATS Report ---
    const input = {
      resume_text: resumeText,
      format_instructions: parser.getFormatInstructions(),
    };

    // Invoke LLM directly
    const rawResponse = await llm.invoke(await promptTemplate.format(input));
    const rawText = typeof rawResponse.content === 'string'
      ? rawResponse.content
      : JSON.stringify(rawResponse.content);

    // Clean markdown code blocks
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let atsReport: any;
    try {
      atsReport = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('Manual parse failed, trying LangChain parser:', parseErr);
      try {
        atsReport = await parser.parse(cleanedText);
      } catch (parserErr) {
        console.error('All parsing failed. Raw response:', rawText);
        return NextResponse.json(
          { error: "AI returned invalid report format. Please try again." },
          { status: 502 }
        );
      }
    }

    console.log("ATS Report generated:", atsReport);
    return NextResponse.json(atsReport);
  } catch (err: any) {
    console.error("Resume scoring error:", err.message || err);
    return NextResponse.json({
      error: err.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
