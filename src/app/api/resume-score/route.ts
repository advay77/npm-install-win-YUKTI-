/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import fs from "fs/promises";
import path from "path";
import os from "os";

// --- Schema for ATS report ---
const feedbackSchema = z.object({
  atsScore: z.number().min(0).max(100).default(0),
  strongPoints: z.array(z.string()).default([]),
  weakPoints: z.array(z.string()).default([]),
});

const parser = StructuredOutputParser.fromZodSchema(feedbackSchema);

const promptTemplate = PromptTemplate.fromTemplate(`
You are an ATS (Applicant Tracking System). Analyze the resume text below. and provides strict score and strong and weak points.

Resume:
{resume_text}

Provide:
- ATS score (0-100) based on relevance, clarity, and completeness.
- Strong points as points.
- Weak points as points.

{format_instructions}
`);

const llm = new ChatGroq({
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  temperature: 0.3,
  maxTokens: 600,
});

export async function POST(req: NextRequest) {
  try {
    const { resumeURL } = await req.json();

    if (!resumeURL) {
      return NextResponse.json({ error: "No resumeURL provided" }, { status: 400 });
    }

    console.log("Fetching resume from:", resumeURL);

    // --- Download resume into tmp dir ---
    const response = await fetch(resumeURL);
    if (!response.ok) {
      console.error("Failed to fetch resume. Status:", response.status);
      return NextResponse.json({
        error: `Failed to fetch resume: ${response.status} ${response.statusText}`
      }, { status: 500 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log("Resume fetched, size:", buffer.length, "bytes");

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Resume file is empty" }, { status: 400 });
    }

    // ✅ Use os.tmpdir() to make sure path works in all environments
    const tempPath = path.join(os.tmpdir(), `resume-${Date.now()}.pdf`);
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
    const chain = promptTemplate.pipe(llm).pipe(parser);
    const atsReport = await chain.invoke({
      resume_text: resumeText,
      format_instructions: parser.getFormatInstructions(),
    });

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
