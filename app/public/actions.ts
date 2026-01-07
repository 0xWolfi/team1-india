"use server";

import { prisma } from "@/lib/prisma";

export async function applyToProgram(programId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, message: "Email is required" };
  }

  try {
    await prisma.application.create({
      // @ts-ignore
      data: {
        applicantEmail: email,
        data: { name }, // storing name in JSON blob for now as schema support varies
        status: "pending",
        programId: programId
      }
    });

    // In a real app, we'd also trigger an email or notification
    return { success: true, message: "Application submitted successfully!" };
  } catch (error) {
    console.error("Application error:", error);
    return { success: false, message: "Failed to submit application." };
  }
}
