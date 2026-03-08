import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import pdfParse from "pdf-parse";

const ai = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENAI_KEY!,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        let pdfData;
        try {
            pdfData = await pdfParse(buffer);
        } catch (parseError) {
            console.error("PDF parse error:", parseError);
            return NextResponse.json({ isValid: false, reason: "Could not read PDF text. Ensure it is a valid PDF document." });
        }

        const text = pdfData.text;

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ isValid: false, reason: "Not enough text found in PDF to validate as a resume." });
        }

        // Use Gemini to validate
        const prompt = `Analyze the following text extracted from a PDF. Determine if it represents a resume (curriculum vitae) or not. 
If it is a resume (contains things like education, experience, skills, contact info, etc), reply only with the word "VALID". 
If it is NOT a resume (e.g. a random book, a receipt, an essay, etc), reply only with the word "INVALID".

Text:
${text.substring(0, 3000)}`;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
        });

        const resultText = response.text ? response.text.trim().toUpperCase() : "";

        if (resultText.includes("VALID") && !resultText.includes("INVALID")) {
            return NextResponse.json({ isValid: true });
        } else {
            return NextResponse.json({ isValid: false, reason: "The uploaded document does not appear to be a resume." });
        }
    } catch (error: any) {
        console.error("Resume validation error:", error);
        return NextResponse.json({ error: "Failed to validate resume", details: error.message }, { status: 500 });
    }
}
