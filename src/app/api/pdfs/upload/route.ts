import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { pdfDocument } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
    try {
        // Authenticate the request
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const folderId = formData.get("folderId") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Check file size — max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert to base64 for database storage (Vercel has a read-only filesystem)
        const base64Data = buffer.toString("base64");

        // Extract text from PDF using a serverless-safe import
        let extractedText = "";
        try {
            // Polyfill browser globals that pdf-parse may reference
            if (typeof global !== "undefined") {
                const g = global as unknown as Record<string, unknown>;
                if (!g.DOMMatrix) g.DOMMatrix = class DOMMatrix { };
                if (!g.Path2D) g.Path2D = class Path2D { };
            }

            // Use the direct subpath to bypass the test-file fs.readFileSync
            // that the default pdf-parse entry point runs on import.
            // @ts-expect-error - no type declarations for direct subpath import
            const pdfParse = (await import("pdf-parse/lib/pdf-parse")).default;
            const data = await pdfParse(buffer);
            extractedText = data.text;
        } catch (parseError) {
            console.error("PDF Parsing Error:", parseError);
            extractedText = `[Parsing Fallback] Document: ${file.name} (${file.size} bytes). Text extraction failed.`;
        }

        const id = crypto.randomUUID();

        // Save to database — no local file system needed on Vercel
        const newPdf = await db
            .insert(pdfDocument)
            .values({
                id,
                name: file.name,
                filePath: `/api/pdfs/${id}/file`, // virtual path; file served from DB
                fileData: base64Data,
                extractedText: extractedText || "Empty PDF document content.",
                userId: session.user.id,
                folderId: folderId || null,
            })
            .returning();

        return NextResponse.json({ success: true, pdf: newPdf[0] });

    } catch (error) {
        const err = error as Error;
        console.error("Upload error:", err.message, err.stack);
        return NextResponse.json(
            { error: err.message || "Upload failed" },
            { status: 500 }
        );
    }
}

export const maxDuration = 60;