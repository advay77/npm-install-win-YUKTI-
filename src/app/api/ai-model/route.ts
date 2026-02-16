/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import axios from 'axios';

// Branding context to ensure the correct project name is used by the LLM
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || "INTERVIEWX";
const PROJECT_TAGLINE =
  process.env.NEXT_PUBLIC_PROJECT_TAGLINE ||
  "AI-powered interview and hiring platform";

interface InterviewRequest {
  jobTitle: string;
  jobDescription: string;
  interviewDuration: string;
  interviewType: string | string[];
}

const questionSchema = z.array(
  z.object({
    interviewQuestions: z.array(
      z.object({
        question: z.string().describe("The interview question"),
        type: z
          .enum(["Technical", "Behavioral", "Problem Solving", "Leadership", "Experience"])
          .describe("The type of question"),
      })
    ),
  })
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser = StructuredOutputParser.fromZodSchema(questionSchema as any);

const promptText = `
You are an expert technical interviewer and hiring manager generating high-quality interview questions for ${PROJECT_NAME}, an ${PROJECT_TAGLINE}.
Always refer to the platform as "${PROJECT_NAME}".

Based on the following inputs, generate a comprehensive set of interview questions that accurately assess candidate capabilities:
Job Title: {jobTitle}
Job Description: {jobDescription}
Interview Duration: {interviewDuration} minutes
Interview Type: {interviewType}
Target Question Count: {targetCount}

Your task:
- Analyze the job description to identify the key responsibilities, required skills, and expected experience.
- Generate questions that can be covered in {interviewDuration}-minute interview and produce EXACTLY {targetCount} questions.
- Ensure ALL questions are ONLY of the types specified in {interviewType} (e.g., {interviewType}). Do NOT include questions of any other type.
- Ensure the questions match the tone and structure of a real-life {interviewType} interview.
- Return ONLY raw JSON. Do NOT include markdown code blocks (like \`\`\`json), explanations, or extra text. Your entire response must be a single valid JSON object.

{format_instructions}
`;

const promptTemplate = PromptTemplate.fromTemplate(promptText);

export async function POST(request: Request) {
  try {
    const body: InterviewRequest = await request.json();
    console.log('[ai-model] request body:', body);
    const { jobTitle, jobDescription, interviewDuration, interviewType } = body;

    if (!jobTitle || !jobDescription || !interviewDuration || !interviewType) {
      return NextResponse.json(
        { isError: true, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const readableInterviewType = Array.isArray(interviewType)
      ? interviewType.join(", ")
      : interviewType;

    // Derive target question count from duration for predictability
    const durationMin = Number(interviewDuration);
    const targetCount = Number.isFinite(durationMin)
      ? (durationMin <= 12
        ? 8
        : durationMin <= 20
          ? 12
          : durationMin <= 35
            ? 16
            : 20)
      : 12;

    const input = {
      jobTitle,
      jobDescription,
      interviewDuration,
      interviewType: readableInterviewType,
      targetCount,
      format_instructions: parser.getFormatInstructions(),
    };

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('[ai-model] OpenRouter API KEY MISSING in process.env');
      return NextResponse.json({ isError: true, error: "OpenRouter API Key not found in local environment." }, { status: 500 });
    }
    console.log('[ai-model] API Key loaded (first 4 chars):', openRouterApiKey.substring(0, 4));

    let rawText = "";
    try {
      const formattedPrompt = await promptTemplate.format(input);
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: formattedPrompt }],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      rawText = response.data.choices[0].message.content;
      console.log("[ai-model] OpenRouter RESPONSE:", rawText);
    } catch (llmErr: any) {
      console.error('[ai-model] OpenRouter Error:', llmErr);
      return NextResponse.json(
        { isError: true, error: `AI Service Error: ${llmErr.message || "Failed to generate content"}` },
        { status: 502 }
      );
    }

    console.log('[ai-model] RAW AI RESPONSE:', rawText);

    // Extract JSON using a more robust regex
    let cleanedText = rawText.trim();
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1].trim();
    } else {
      // Find the first [ or { and the last ] or }
      const startIdx = cleanedText.indexOf('[');
      const startIdxObj = cleanedText.indexOf('{');
      const finalStartIdx = (startIdx !== -1 && startIdxObj !== -1) ? Math.min(startIdx, startIdxObj) : (startIdx !== -1 ? startIdx : startIdxObj);

      const endIdx = cleanedText.lastIndexOf(']');
      const endIdxObj = cleanedText.lastIndexOf('}');
      const finalEndIdx = Math.max(endIdx, endIdxObj);

      if (finalStartIdx !== -1 && finalEndIdx !== -1 && finalEndIdx > finalStartIdx) {
        cleanedText = cleanedText.substring(finalStartIdx, finalEndIdx + 1);
      }
    }

    let result: any;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('[ai-model] Manual JSON parse failed, trying LangChain parser. Cleaned text length:', cleanedText.length);
      try {
        result = await parser.parse(cleanedText);
      } catch (parserErr: any) {
        console.error('[ai-model] All parsing methods failed. Raw snippet:', rawText.substring(0, 100));
        return NextResponse.json(
          {
            isError: true,
            error: "AI response was not in a valid format. Please try again.",
            details: parserErr.message
          },
          { status: 502 }
        );
      }
    }

    // Fallback to extract inner object for UI
    const finalResult =
      Array.isArray(result) && result[0]?.interviewQuestions
        ? { interviewQuestions: result[0].interviewQuestions }
        : result;

    // console.log("✅ STRUCTURED OUTPUT:", JSON.stringify(finalResult, null, 2));

    return NextResponse.json({ data: finalResult });
  } catch (error: any) {
    console.error("❌ ERROR:", error);
    // Return stack in development to aid debugging
    return NextResponse.json(
      {
        isError: true,
        error: error.message || "Failed to generate questions",
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}