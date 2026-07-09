"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Save,
  FileText,
  Eye,
  Edit,
  Loader2,
  Check,
  Brain,
  Award,
} from "lucide-react";

function NotesContent() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get("id");
  const router = useRouter();
  const utils = trpc.useUtils();

  // Local state for editing
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [previewMode, setPreviewMode] = useState(false);

  // AI states
  const [aiActiveTab, setAiActiveTab] = useState<"summary" | "explain">("summary");
  const [aiSummary, setAiSummary] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [flashcardSuccess, setFlashcardSuccess] = useState("");
  const [interviewSuccess, setInterviewSuccess] = useState("");

  // tRPC Query
  const { data: noteData, isLoading: noteLoading } = trpc.notes.get.useQuery(
    { id: noteId || "" },
    { enabled: !!noteId }
  );

  // Sync state with noteData during render to avoid useEffect cascading renders
  const [prevNoteData, setPrevNoteData] = useState<typeof noteData | null>(null);
  if (noteData && noteData !== prevNoteData) {
    setPrevNoteData(noteData);
    setTitle(noteData.title);
    setContent(noteData.content);
    setSaveStatus("saved");
    setAiSummary("");
    setAiExplanation("");
    setAiError("");
    setFlashcardSuccess("");
    setInterviewSuccess("");
  }

  // tRPC Mutations
  const updateNote = trpc.notes.update.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      utils.notes.list.invalidate();
      if (noteId) {
        utils.notes.get.invalidate({ id: noteId });
      }
    },
  });

  const summarize = trpc.ai.summarize.useMutation({
    onSuccess: (data) => {
      setAiSummary(data.summary || "");
      setAiLoading(false);
    },
    onError: (err) => {
      setAiError(err.message || "Failed to generate summary.");
      setAiLoading(false);
    },
  });

  const explain = trpc.ai.explain.useMutation({
    onSuccess: (data) => {
      setAiExplanation(data.explanation || "");
      setAiLoading(false);
    },
    onError: (err) => {
      setAiError(err.message || "Failed to explain concepts.");
      setAiLoading(false);
    },
  });

  const generateFlashcards = trpc.ai.generateFlashcards.useMutation({
    onSuccess: (data) => {
      setFlashcardSuccess(`Successfully created deck "${data.deck.title}" with ${data.cardCount} flashcards!`);
      utils.study.listDecks.invalidate();
      setAiLoading(false);
    },
    onError: (err) => {
      setAiError(err.message || "Failed to generate flashcards.");
      setAiLoading(false);
    },
  });

  const generateInterview = trpc.ai.generateInterviewQuestions.useMutation({
    onSuccess: (data) => {
      setInterviewSuccess(`Successfully created interview session "${data.interview.title}"!`);
      utils.study.listInterviews.invalidate();
      setAiLoading(false);
    },
    onError: (err) => {
      setAiError(err.message || "Failed to generate interview prep.");
      setAiLoading(false);
    },
  });

  // Debounced Autosave
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!noteId || !noteData) return;
    
    // Check if anything actually changed to prevent loop
    if (title === noteData.title && content === noteData.content) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      updateNote.mutate({
        id: noteId,
        title: title || "Untitled Note",
        content: content || "",
      });
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content, noteId, noteData, updateNote]);

  // Manual save trigger
  const handleManualSave = () => {
    if (!noteId) return;
    setSaveStatus("saving");
    updateNote.mutate({
      id: noteId,
      title: title || "Untitled Note",
      content: content || "",
    });
  };

  // AI action triggers
  const handleAISummarize = () => {
    if (!noteId || !content.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiSummary("");
    setAiActiveTab("summary");
    summarize.mutate({ noteId, pdfId: null });
  };

  const handleAIExplain = () => {
    if (!noteId || !content.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiExplanation("");
    setAiActiveTab("explain");
    explain.mutate({ noteId, pdfId: null });
  };

  const handleAIFlashcards = () => {
    if (!noteId || !content.trim()) return;
    setAiLoading(true);
    setAiError("");
    setFlashcardSuccess("");
    generateFlashcards.mutate({
      noteId,
      pdfId: null,
      deckTitle: `Flashcards: ${title || "Untitled Note"}`,
    });
  };

  const handleAIInterview = () => {
    if (!noteId || !content.trim()) return;
    setAiLoading(true);
    setAiError("");
    setInterviewSuccess("");
    generateInterview.mutate({
      noteId,
      pdfId: null,
      sessionTitle: `Prep: ${title || "Untitled Note"}`,
    });
  };

  if (!noteId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto bg-primary/10 border border-primary/20 p-4 rounded-full w-fit text-primary animate-bounce">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-primary">No Note Selected</h2>
          <p className="text-sm text-foreground/75 leading-relaxed">
            Select an existing note from the sidebar folder tree, or click the &quot;+&quot; button to create a new markdown note.
          </p>
        </div>
      </div>
    );
  }

  if (noteLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-foreground/60 mt-2">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full select-none overflow-hidden bg-background text-foreground">
      {/* Editor Pane (Left/Center) */}
      <div className="flex-1 flex flex-col h-full border-r border-border/20">
        {/* Top toolbar */}
        <div className="p-4 border-b border-border/20 flex items-center justify-between bg-card/10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground/60">Status:</span>
            {saveStatus === "saving" && (
              <Badge variant="secondary" className="gap-1 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Autosaving...
              </Badge>
            )}
            {saveStatus === "saved" && (
              <Badge variant="gold" className="gap-1">
                <Check className="h-3 w-3 text-primary" /> Saved to Vault
              </Badge>
            )}
            {saveStatus === "unsaved" && (
              <Badge variant="outline" className="gap-1 border-yellow-500/30 text-yellow-300">
                Unsaved changes
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-1.5"
            >
              {previewMode ? (
                <>
                  <Edit className="h-3.5 w-3.5 text-primary" /> Write Mode
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-primary" /> Preview Mode
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              className="gap-1.5"
              disabled={saveStatus === "saved" || saveStatus === "saving"}
            >
              <Save className="h-3.5 w-3.5 text-primary" /> Save
            </Button>
          </div>
        </div>

        {/* Edit Fields */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
          <Input
            placeholder="Note Title"
            className="text-2xl font-bold border-none bg-transparent shadow-none px-0 focus-visible:ring-0 text-primary py-2 placeholder:text-primary/40 focus:outline-none"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus("unsaved");
            }}
          />
          
          {previewMode ? (
            <div className="flex-1 border border-border/10 rounded-lg p-4 bg-card/25 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {content || <em className="text-foreground/40">Empty note content. Click Write Mode to write markdown.</em>}
            </div>
          ) : (
            <Textarea
              placeholder="Write your study guide content in Markdown format here..."
              className="flex-1 border-none shadow-none bg-transparent px-0 focus-visible:ring-0 resize-none font-mono text-sm focus:outline-none leading-relaxed min-h-[400px]"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaveStatus("unsaved");
              }}
            />
          )}
        </div>
      </div>

      {/* AI Sidebar Pane (Right) */}
      <div className="w-80 flex flex-col h-full bg-card/20 overflow-y-auto p-4 space-y-6">
        <div className="flex items-center gap-2 border-b border-border/30 pb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-xs uppercase tracking-wider text-primary">AI Learning Tools</h2>
        </div>

        {/* AI Action Quick Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISummarize}
            disabled={aiLoading || !content.trim()}
            className="text-[10px] py-1.5"
          >
            Summarize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIExplain}
            disabled={aiLoading || !content.trim()}
            className="text-[10px] py-1.5"
          >
            Explain
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIFlashcards}
            disabled={aiLoading || !content.trim()}
            className="text-[10px] py-1.5 col-span-2 gap-1.5"
          >
            <Brain className="h-3 w-3 text-primary" /> Generate Flashcards
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIInterview}
            disabled={aiLoading || !content.trim()}
            className="text-[10px] py-1.5 col-span-2 gap-1.5"
          >
            <Award className="h-3 w-3 text-primary" /> Generate Interview Prep
          </Button>
        </div>

        {/* Alerts / Success banners */}
        {flashcardSuccess && (
          <div className="bg-primary/20 border border-primary/30 text-primary text-xs p-3 rounded-lg leading-relaxed flex flex-col gap-2">
            <span>{flashcardSuccess}</span>
            <Button
              size="sm"
              className="text-[10px] h-7 font-bold py-1 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/dashboard/flashcards")}
            >
              Start Studying
            </Button>
          </div>
        )}

        {interviewSuccess && (
          <div className="bg-primary/20 border border-primary/30 text-primary text-xs p-3 rounded-lg leading-relaxed flex flex-col gap-2">
            <span>{interviewSuccess}</span>
            <Button
              size="sm"
              className="text-[10px] h-7 font-bold py-1 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/dashboard/interview")}
            >
              Start Mock Interview
            </Button>
          </div>
        )}

        {aiError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg">
            {aiError}
          </div>
        )}

        {/* AI Output Result Box */}
        {(aiLoading || aiSummary || aiExplanation) && (
          <Card className="flex-1 bg-background/50 border border-border/40 overflow-hidden flex flex-col min-h-[300px]">
            {/* Tab header */}
            <div className="flex border-b border-border/30 bg-card/40">
              <button
                className={`flex-1 text-[10px] font-bold uppercase py-2 border-b-2 transition-all ${
                  aiActiveTab === "summary"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
                onClick={() => setAiActiveTab("summary")}
              >
                Summary
              </button>
              <button
                className={`flex-1 text-[10px] font-bold uppercase py-2 border-b-2 transition-all ${
                  aiActiveTab === "explain"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
                onClick={() => setAiActiveTab("explain")}
              >
                Analogies
              </button>
            </div>

            {/* Output Panel content */}
            <CardContent className="p-4 flex-1 overflow-y-auto text-xs leading-relaxed">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-foreground/50 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>AI is thinking...</span>
                </div>
              ) : aiActiveTab === "summary" ? (
                <div className="space-y-2 whitespace-pre-wrap">
                  {aiSummary || <em className="text-foreground/40">Click Summarize to load summary bullets.</em>}
                </div>
              ) : (
                <div className="space-y-2 whitespace-pre-wrap">
                  {aiExplanation || <em className="text-foreground/40">Click Explain to load topic analogies.</em>}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-foreground/60 mt-2">Loading workspace...</p>
        </div>
      }
    >
      <NotesContent />
    </Suspense>
  );
}
