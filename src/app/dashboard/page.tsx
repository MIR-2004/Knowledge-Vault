import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { folder, note, pdfDocument, flashcard, flashcardDeck, interviewPrep } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  FileText,
  Folder,
  BookOpen,
  Brain,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;

  if (!user) return null;

  // Fetch counts from database
  const foldersCount = await db
    .select()
    .from(folder)
    .where(eq(folder.userId, user.id))
    .then((r) => r.length);

  const notesCount = await db
    .select()
    .from(note)
    .where(eq(note.userId, user.id))
    .then((r) => r.length);

  const pdfCount = await db
    .select()
    .from(pdfDocument)
    .where(eq(pdfDocument.userId, user.id))
    .then((r) => r.length);

  const cardsCount = await db
    .select()
    .from(flashcard)
    .innerJoin(flashcardDeck, eq(flashcard.deckId, flashcardDeck.id))
    .where(eq(flashcardDeck.userId, user.id))
    .then((r) => r.length);

  // Fetch recent notes
  const recentNotes = await db
    .select()
    .from(note)
    .where(eq(note.userId, user.id))
    .orderBy(desc(note.updatedAt))
    .limit(4);

  // Fetch recent PDFs
  const recentPdfs = await db
    .select()
    .from(pdfDocument)
    .where(eq(pdfDocument.userId, user.id))
    .orderBy(desc(pdfDocument.createdAt))
    .limit(4);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/40 border border-border p-6 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to Your <span className="text-primary">Vault</span>, {user.name}
          </h1>
          <p className="text-sm text-foreground/80">
            Write markdown notes, upload PDFs, and practice study flashcards with your AI partner.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-lg z-10">
          <Sparkles className="h-4 w-4" /> Claude AI Engine Connected
        </div>
        {/* Background gradient decoration */}
        <div className="absolute right-0 top-0 w-64 h-full bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Folders</span>
            <Folder className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{foldersCount}</div>
            <p className="text-[10px] text-foreground/60 mt-1">Organized workspaces</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Notes</span>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesCount}</div>
            <p className="text-[10px] text-foreground/60 mt-1">Markdown study guides</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">PDF Vault</span>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pdfCount}</div>
            <p className="text-[10px] text-foreground/60 mt-1">Uploaded textbooks</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Flashcards</span>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cardsCount}</div>
            <p className="text-[10px] text-foreground/60 mt-1">Spaced-repetition cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent + Getting Started */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Recent Work */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Notes
            </h2>
            {recentNotes.length > 0 && (
              <span className="text-[10px] text-foreground/60">Last updated notes</span>
            )}
          </div>

          {recentNotes.length === 0 ? (
            <div className="border border-border/20 border-dashed rounded-lg p-12 text-center text-sm text-foreground/60">
              No notes found. Click the &quot;+&quot; in the sidebar to create your first markdown note!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentNotes.map((n) => (
                <Link key={n.id} href={`/dashboard/notes?id=${n.id}`}>
                  <Card className="p-4 hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between h-36 cursor-pointer">
                    <div>
                      <h3 className="font-bold text-sm text-primary truncate mb-1">{n.title}</h3>
                      <p className="text-xs text-foreground/75 line-clamp-3">
                        {n.content ? n.content.slice(0, 150) : "No content yet. Click to write."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[9px] text-foreground/60 font-mono">
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </span>
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Recent PDFs */}
          <div className="flex items-center justify-between border-b border-border/30 pt-4 pb-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> PDF Documents
            </h2>
          </div>

          {recentPdfs.length === 0 ? (
            <div className="border border-border/20 border-dashed rounded-lg p-12 text-center text-sm text-foreground/60">
              No PDFs uploaded yet. Head over to the PDF Vault to upload textbook chapters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentPdfs.map((pdf) => (
                <Link key={pdf.id} href="/dashboard/pdfs">
                  <Card className="p-4 hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between h-36 cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-bold text-sm text-foreground truncate">{pdf.name}</h3>
                      </div>
                      <p className="text-[10px] text-foreground/70 line-clamp-3">
                        {pdf.extractedText ? pdf.extractedText.slice(0, 150) : "Processing file text."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[9px] text-foreground/60 font-mono font-bold uppercase">
                        PDF FILE
                      </span>
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Panel of Home: AI Power-ups & Quick Links */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Quick Actions
            </h2>
          </div>

          <div className="space-y-4">
            <Card className="p-4 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-xs text-primary mb-1 uppercase tracking-wider">1. Flashcard Deck</h3>
              <p className="text-xs text-foreground/80 leading-relaxed mb-3">
                Need to memorize facts? Generate an active deck from any note, and review with spaced repetition.
              </p>
              <Link href="/dashboard/flashcards">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Study Flashcards
                </Button>
              </Link>
            </Card>

            <Card className="p-4 hover:border-primary/50 transition-colors">
              <h3 className="font-bold text-xs text-primary mb-1 uppercase tracking-wider">2. Technical Interview</h3>
              <p className="text-xs text-foreground/80 leading-relaxed mb-3">
                Prep for your next role. Let AI extract concepts, build an interview set, and grade your answers.
              </p>
              <Link href="/dashboard/interview">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Practice Interviews
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
