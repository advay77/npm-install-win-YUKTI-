/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

interface FeedbackRequest {
  conversation: { type: "user" | "assistant"; content: string }[];
}

// --- Zod Schema (enhanced for detailed feedback) ---
const feedbackSchema = z.object({
  feedback: z.object({
    rating: z.object({
      relevance: z.number().min(0).max(5).describe("Relevance of candidate's background and experience to the job requirements"),
      technicalDepth: z.number().min(0).max(5).describe("Depth of technical knowledge and expertise demonstrated"),
      clarity: z.number().min(0).max(5).describe("Clarity of thought and expression in responses"),
      communicationQuality: z.number().min(0).max(5).describe("Overall quality of communication, including listening and articulation"),
    }),
    summary: z.string().describe("Comprehensive 4-5 line summary highlighting key strengths and areas for improvement"),
    recommendation: z.enum(["Yes", "No", "Maybe"]).describe("Clear hiring recommendation"),
    recommendationMessage: z.string().describe("Detailed justification for the recommendation with specific examples"),
    strengths: z.array(z.string()).describe("List of candidate's key strengths demonstrated during interview"),
    improvements: z.array(z.string()).describe("List of areas where candidate could improve"),
    technicalAssessment: z.string().describe("Specific evaluation of technical skills and knowledge"),
    communicationAssessment: z.string().describe("Evaluation of communication skills and professional demeanor"),
    overallConfidence: z.number().min(0).max(100).describe("Confidence level in the assessment (0-100%)"),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser = StructuredOutputParser.fromZodSchema(feedbackSchema as any);

// --- Prompt Template ---
const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert technical interviewer and hiring manager providing comprehensive feedback on a job interview.

INTERVIEW CONVERSATION:
{conversation}

FEEDBACK GENERATION GUIDELINES:
1. Analyze the candidate's responses thoroughly and objectively
2. Provide specific examples from the conversation to support your assessment
3. Rate each category on a 0-5 scale where:
   - 0-1: Below expectations
   - 2-3: Meets basic expectations
   - 4: Above expectations
   - 5: Exceptional

ASSESSMENT CRITERIA:
- Relevance: Relevance of candidate's background and experience to the job requirements
- Technical Depth: Depth of technical knowledge and expertise demonstrated
- Clarity: Clarity of thought and expression in responses
- Communication Quality: Overall quality of communication, including listening and articulation

RECOMMENDATION SCALE:
- "Yes": Strong candidate, recommended for hire
- "Maybe": Potential candidate, needs further evaluation or specific conditions
- "No": Not suitable for the position

CONFIDENCE LEVEL (0-100%):
- 90-100%: Very confident in assessment
- 70-89%: Confident with minor uncertainties
- 50-69%: Moderately confident, some ambiguities
- Below 50%: Low confidence, limited data

Your task:
1. Provide detailed ratings for all four categories
2. Write a comprehensive 4-5 line summary
3. Give a clear recommendation with detailed justification
4. List specific strengths demonstrated
5. Identify areas for improvement
6. Provide detailed technical and communication assessments
7. Indicate your confidence level in this evaluation

Be thorough, professional, and constructive in your feedback. Use specific examples from the conversation to support your analysis.

Return ONLY raw JSON. Do NOT include markdown code blocks (like \`\`\`json), explanations, or extra text.

{format_instructions}
`);

// --- LLM ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: Request) {
  try {
    const body: FeedbackRequest = await request.json();
    const { conversation } = body;

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { isError: true, error: "Missing conversation data" },
        { status: 400 }
      );
    }

    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENAI_KEY,
      model: "gemini-1.5-flash",
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    const conversationString = conversation
      .map((m) => `${m.type === "user" ? "User" : "Assistant"}: ${m.content} `)
      .join("\n");

    const input = {
      conversation: conversationString,
      format_instructions: parser.getFormatInstructions(),
    };

    // Invoke LLM directly
    const rawResponse = await llm.invoke(await promptTemplate.format(input));
    const rawText = typeof rawResponse.content === 'string'
      ? rawResponse.content
      : JSON.stringify(rawResponse.content);

    // Clean JSON using Regex
    let cleanedText = rawText.trim();
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1].trim();
    } else {
      const startIdx = cleanedText.indexOf('{');
      const endIdx = cleanedText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanedText = cleanedText.substring(startIdx, endIdx + 1);
      }
    }

    let result: z.infer<typeof feedbackSchema>;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('Manual JSON parse failed:', parseErr);
      try {
        result = await parser.parse(cleanedText) as z.infer<typeof feedbackSchema>;
      } catch (parserErr) {
        console.error('All parsing failed. Raw response:', rawText);
        return NextResponse.json(
          { isError: true, error: "AI returned invalid feedback format. Please try again." },
          { status: 502 }
        );
      }
    }

    // --- Normalize response (so frontend never breaks) ---
    const finalResult = {
      feedback: {
        rating: {
          relevance: result?.feedback?.rating?.relevance ?? 0,
          technicalDepth: result?.feedback?.rating?.technicalDepth ?? 0,
          clarity: result?.feedback?.rating?.clarity ?? 0,
          communicationQuality: result?.feedback?.rating?.communicationQuality ?? 0,
        },
        summary: result?.feedback?.summary ?? "Insufficient data provided for comprehensive assessment.",
        recommendation: result?.feedback?.recommendation ?? "No",
        recommendationMessage:
          result?.feedback?.recommendationMessage ??
          "Unable to provide recommendation due to limited interview data.",
        strengths: result?.feedback?.strengths ?? [],
        improvements: result?.feedback?.improvements ?? [],
        technicalAssessment: result?.feedback?.technicalAssessment ?? "Technical skills could not be adequately assessed.",
        communicationAssessment: result?.feedback?.communicationAssessment ?? "Communication skills could not be adequately assessed.",
        overallConfidence: result?.feedback?.overallConfidence ?? 0,
      },
    };

    return NextResponse.json({ data: finalResult });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback';
    console.error("❌ FEEDBACK ERROR:", error);
    return NextResponse.json(
      { isError: true, error: errorMessage },
      { status: 500 }
    );
  }
}
