/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { to, subject, body, userEmail } = await req.json();

    // Check if user has credits (skip for admin)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = userEmail === adminEmail;

    if (!isAdmin && userEmail) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

      if (!supabaseUrl || !serviceKey) {
        console.error("Missing Supabase credentials");
        return NextResponse.json(
          { error: "Supabase service key or URL not configured" },
          { status: 500 }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceKey);

      // Get user credits
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("remainingcredits")
        .eq("email", userEmail)
        .single();

      if (userError) {
        console.error("🔴 Credit verification error:", userError, "for email:", userEmail);
        return NextResponse.json(
          { error: "Unable to verify credits - " + userError.message },
          { status: 500 }
        );
      }

      if (!userData) {
        console.error("🔴 No user data found for email:", userEmail);
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 500 }
        );
      }

      const remainingCredits = (userData as any)?.remainingcredits ?? 0;
      console.log("✅ User credits verified:", remainingCredits, "for email:", userEmail);

      if (remainingCredits <= 0) {
        return NextResponse.json(
          { error: "No credits remaining. Please purchase credits to send emails." },
          { status: 403 }
        );
      }

      // Deduct 1 credit
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ remainingcredits: remainingCredits - 1 })
        .eq("email", userEmail);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        return NextResponse.json(
          { error: "Failed to update credits" },
          { status: 500 }
        );
      }
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: body,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
