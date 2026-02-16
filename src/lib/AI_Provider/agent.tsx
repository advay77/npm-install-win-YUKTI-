
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/services/supabaseClient";
// import { useUserData } from "@/context/UserDetailContext";
// import nodemailer from "nodemailer";
import { toast } from "sonner";
import axios from "axios";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENAI_KEY!,
});
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || "INTERVIEWX";
const PROJECT_TAGLINE =
  process.env.NEXT_PUBLIC_PROJECT_TAGLINE ||
  "AI-powered platform for complete hiring and interviews";
const PROJECT_SUMMARY =
  process.env.NEXT_PUBLIC_PROJECT_SUMMARY ||
  "HR can create interviews, send links to candidates, AI voice agents conduct interviews and produce summaries/insights. Candidates can also upload resumes.";

type FunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

type FunctionResponse = {
  name: string;
  response: {
    result: unknown;
  };
};

type HistoryPart =
  | { text: string }
  | { functionCall: FunctionCall }
  | { functionResponse: FunctionResponse };

const history: Array<{ role: string; parts: HistoryPart[] }> = [];

// ---------------TOOLS DEFINATION--------------------
async function createTicket({
  userId,
  description,
}: {
  userId: number;
  description: string;
}) {
  const { data, error } = await supabase.from("tickets").insert({
    userId,
    description,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
  toast("Ticket has been created", {
    description: (
      <span className="text-gray-600 font-inter">
        We will get back to you soon.
      </span>
    ),
    action: {
      label: "Pending",
      onClick: () => console.log("Undo"),
    },
  });
  return { message: "Ticket created successfully", data };
}

async function sendMail(to: string, subject: string, body: string) {
  try {
    const res = await axios.post("/api/send-mail", { to, subject, body });
    if (res.data.success) {
      toast("Email has been sent", {
        description: (
          <span className="text-gray-600 font-inter">
            Email has been sent to {to}
          </span>
        ),

      });
      return `Email sent to ${to}, messageId: ${res.data.messageId}`;
    }
    return `Failed: ${res.data.error}`;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return `Error: ${errorMessage}`;
  }
}

// --------------------------TOOL DECLARARTION-----------------------------
export const sendMailDeclaration = {
  name: "sendMail",
  description: "Send an email using Gmail",
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: { type: Type.STRING, description: "Recipient email address" },
      subject: { type: Type.STRING, description: "Subject of the email" },
      body: { type: Type.STRING, description: "Plain text body of the email" },
    },
    required: ["to", "subject", "body"],
  },
};

export const createTicketDeclaration = {
  name: "createTicket",
  description: "Create a new support ticket for the particular user issue",
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: "Description of the user's issue",
      },
    },
    required: ["description"],
  },
};
let currentUserId: number | undefined;
// -----------------TOOL  MAPPING------------------------
type ToolMap = {
  createTicket: (args: { description: string }) => Promise<{ message: string; data: unknown }>;
  sendMail: (args: {
    to: string;
    subject: string;
    body: string;
  }) => Promise<string>;
};

const availableTools: ToolMap = {
  createTicket: ({ description }) => {
    if (typeof currentUserId !== "number") {
      throw new Error("User ID is not defined");
    }
    return createTicket({ userId: currentUserId, description });
  },
  sendMail: ({ to, subject, body }) => sendMail(to, subject, body),
};

// -----------------------------AGENT------------------
export async function runAgent(userMessage: string, userId: number) {
  history.push({ role: "user", parts: [{ text: userMessage }] });
  currentUserId = userId;

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: history,
      config: {
        systemInstruction: `
          You are the helpful AI assistant for ${PROJECT_NAME}, an ${PROJECT_TAGLINE}.
          Always refer to the platform as "${PROJECT_NAME}" (never VOCLAX or any other name).

          Platform capabilities:
          - ${PROJECT_SUMMARY}
          - You can assist with creating interviews, sending mails to candidates, and opening support tickets for user issues.

          Interview creation guidance (3 steps):
          1) Add job title, description, duration, type, and choose if candidate resumes are required.
          2) AI generates questions; users may add/remove questions manually.
          3) Interview is created; provide/send the interview link to candidates.

          You also have access to tools for creating tickets and sending mails when appropriate.
        `,
        maxOutputTokens: 600,
        tools: [
          {
            functionDeclarations: [
              createTicketDeclaration,
              sendMailDeclaration,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const { name, args } = response.functionCalls[0];

      let result: string | { message: string; data: unknown };
      if (name === "createTicket") {
        result = await availableTools.createTicket(args as { description: string });
      } else if (name === "sendMail") {
        result = await availableTools.sendMail(args as { to: string; subject: string; body: string });
      } else {
        throw new Error(`Unknown function: ${name}`);
      }

      const functionResponsePart = {
        name: name,
        response: {
          result: result,
        },
      };

      // model response
      history.push({
        role: "model",
        parts: [
          {
            functionCall: { name: response.functionCalls[0].name || "", args: response.functionCalls[0].args || {} },
          },
        ],
      });
      //function reulst in history
      history.push({
        role: "user",
        parts: [
          {
            functionResponse: functionResponsePart,
          },
        ],
      });
    } else {
      history.push({
        role: "model",
        parts: [
          {
            text: response.text ?? "",
          },
        ],
      });
      return response.text ?? "";
    }
  }
}
