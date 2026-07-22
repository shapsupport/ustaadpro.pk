import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Please provide valid contact details." }, { status: 400 });
    }

    const source = body as Record<string, unknown>;
    const payload = {
      name: String(source.name || "").trim(),
      email: String(source.email || "").trim().toLowerCase(),
      message: String(source.message || "").trim(),
    };

    if (payload.name.length < 2 || !EMAIL_PATTERN.test(payload.email) || payload.message.length < 3) {
      return NextResponse.json(
        { message: "Please enter a valid name, email address, and message." },
        { status: 400 },
      );
    }

    if (!API_BASE) {
      return NextResponse.json(
        { message: "Contact service is temporarily unavailable. Please email ustaadpro.official26@gmail.com." },
        { status: 503 },
      );
    }

    const response = await fetch(`${API_BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Your message could not be sent. Please try again or email ustaadpro.official26@gmail.com." },
        { status: response.status },
      );
    }

    return NextResponse.json({
      message: data.message || "Your message has been sent to ustaadpro.official26@gmail.com. We will contact you soon.",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { message: timedOut ? "The contact service timed out. Please try again." : "Your message could not be sent. Please try again." },
      { status: timedOut ? 504 : 500 },
    );
  }
}
