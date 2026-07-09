import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { pdfDocument } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
    //poyfill Dommmatrix and path2D
    if (typeof global !== "undefined") {
        const globalObj = global as unknown as Record<string, unknown>;
        if (!globalObj.DOMMatrix) {
            globalObj.DOMMatrix = class DOMMatrix { };
        }
        if (!globalObj.Path2D) {
            globalObj.Path2D = class Path2D { };
        }
    }

    // @ts-expect-error - pdf-parse/lib/pdf-parse does not have default type declarations for direct subpath imports
    const pdfParse = (await import("pdf-parse/lib/pdf-parse")).default;

    try {
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

        //check for file size maximum 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
        }


        //extracting text from pdf file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let extractedText = "";
        try {
            const data = await pdfParse(buffer);
            extractedText = data.text;
        } catch (parseError) {
            console.error("PDF Parsing Error:", parseError);
            extractedText = `[Parsing Fallback] Document title: ${file.name}\nSize: ${file.size} bytes. Failed to parse text dynamically.`;
        }

        const id = crypto.randomUUID();

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const filePathOnDisk = path.join(uploadDir, `${id}_${file.name}`);
        await fs.writeFile(filePathOnDisk, buffer);

        // save the pdf text to the database
        const newPdf = await db
            .insert(pdfDocument)
            .values({
                id,
                name: file.name,
                filePath: `/uploads/${id}_${file.name}`,
                extractedText: extractedText || "Empty PDF document content.",
                userId: session.user.id,
                folderId: folderId || null,
            })
            .returning();

        return NextResponse.json({ success: true, pdf: newPdf[0] });

    } catch (error) {
        const err = error as Error;
        console.error("Upload error:", err);
        return NextResponse.json(
            { error: err.message || "Upload failed" },
            { status: 500 }
        );
    }
}

export const maxDuration = 60;