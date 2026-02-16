/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
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
      technicalSkills: z.number().min(0).max(10).describe("Technical proficiency and knowledge depth"),
      communication: z.number().min(0).max(10).describe("Clarity, articulation, and professional communication"),
      problemSolving: z.number().min(0).max(10).describe("Analytical thinking and solution approach"),
      experience: z.number().min(0).max(10).describe("Relevant professional experience and achievements"),
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
3. Rate each category on a 0-10 scale where:
   - 0-3: Below expectations
   - 4-6: Meets basic expectations
   - 7-8: Above expectations
   - 9-10: Exceptional

ASSESSMENT CRITERIA:
- Technical Skills: Depth of knowledge, practical application, problem-solving ability
- Communication: Clarity, articulation, listening skills, professional demeanor
- Problem Solving: Logical thinking, analytical approach, creativity in solutions
- Experience: Relevance, depth, achievements, growth potential

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

Return ONLY JSON in this format:
{format_instructions}
`);

// --- LLM ---
const llm = new ChatGroq({
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  temperature: 0.2, // Lower temperature for more consistent and confident responses
  maxTokens: 800, // Increased tokens for more detailed feedback
});

// --- Chain ---
const chain = promptTemplate.pipe(llm).pipe(parser);

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

    // Format conversation into readable string for the LLM
    const conversationString = conversation
      .map((m) => `${m.type === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const input = {
      conversation: conversationString,
      format_instructions: parser.getFormatInstructions(),
    };

    const result = await chain.invoke(input) as z.infer<typeof feedbackSchema>;

    // --- Normalize response (so frontend never breaks) ---
    const finalResult = {
      feedback: {
        rating: {
          technicalSkills: result?.feedback?.rating?.technicalSkills ?? 0,
          communication: result?.feedback?.rating?.communication ?? 0,
          problemSolving: result?.feedback?.rating?.problemSolving ?? 0,
          experience: result?.feedback?.rating?.experience ?? 0,
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
