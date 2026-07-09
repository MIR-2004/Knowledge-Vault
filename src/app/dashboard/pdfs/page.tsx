"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  BookOpen,
  UploadCloud,
  File,
  Trash2,
  Sparkles,
  Search,
  Eye,
  Check,
  Brain,
  Award,
  Loader2,
} from "lucide-react";

export default function PdfsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // AI states
  const [aiActiveTab, setAiActiveTab] = useState<"summary" | "explain">("summary");
  const [aiSummary, setAiSummary] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");

  // Deletion confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [flashcardSuccess, setFlashcardSuccess] = useState("");
  const [interviewSuccess, setInterviewSuccess] = useState("");

  // Queries
  const { data: pdfs = [], isLoading: pdfsLoading } = trpc.pdfs.list.useQuery();

  // Mutations
  const deletePdf = trpc.pdfs.delete.useMutation({
    onSuccess: () => {
      utils.pdfs.list.invalidate();
      if (activePdfId) {
        setActivePdfId(null);
        setAiSummary("");
        setAiExplanation("");
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

  // Handle PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/pdfs/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccessMsg(`Successfully uploaded and parsed "${file.name}"!`);
      utils.pdfs.list.invalidate();
      setActivePdfId(data.pdf.id);
    } catch (error) {
      const err = error as Error;
      setUploadError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const activePdf = pdfs.find((p) => p.id === activePdfId);

  // Filter PDFs
  const filteredPdfs = pdfs.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // AI trigger helpers
  const handleAISummarize = () => {
    if (!activePdfId) return;
    setAiLoading(true);
    setAiError("");
    setAiSummary("");
    setAiActiveTab("summary");
    summarize.mutate({ noteId: null, pdfId: activePdfId });
  };

  const handleAIExplain = () => {
    if (!activePdfId) return;
    setAiLoading(true);
    setAiError("");
    setAiExplanation("");
    setAiActiveTab("explain");
    explain.mutate({ noteId: null, pdfId: activePdfId });
  };

  const handleAIFlashcards = () => {
    if (!activePdfId || !activePdf) return;
    setAiLoading(true);
    setAiError("");
    setFlashcardSuccess("");
    generateFlashcards.mutate({
      noteId: null,
      pdfId: activePdfId,
      deckTitle: `Flashcards: ${activePdf.name.replace(".pdf", "")}`,
    });
  };

  const handleAIInterview = () => {
    if (!activePdfId || !activePdf) return;
    setAiLoading(true);
    setAiError("");
    setInterviewSuccess("");
    generateInterview.mutate({
      noteId: null,
      pdfId: activePdfId,
      sessionTitle: `Prep: ${activePdf.name.replace(".pdf", "")}`,
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex-1 flex flex-col h-full overflow-hidden select-none space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> PDF Document Vault
          </h1>
          <p className="text-xs text-foreground/80 mt-1">
            Upload textbooks, research papers, or documentation to parse and study them using AI.
          </p>
        </div>

        {/* Upload File Input Button */}
        <div className="relative">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="pdf-upload-file"
          />
          <label
            htmlFor="pdf-upload-file"
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 cursor-pointer ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading & Parsing...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" /> Upload PDF
              </>
            )}
          </label>
        </div>
      </div>

      {/* Errors / Success flags */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-2.5 rounded-lg">
          {uploadError}
        </div>
      )}

      {successMsg && (
        <div className="bg-primary/20 border border-primary/30 text-primary text-xs px-4 py-2.5 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Grid Layout: Files List vs Content Reader */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left pane: Documents List */}
        <div className="md:col-span-1 border border-border/20 bg-card/20 rounded-lg p-4 flex flex-col overflow-hidden h-[500px]">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground/40" />
            <Input
              placeholder="Search files..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {pdfsLoading ? (
              <div className="text-center text-xs text-foreground/40 py-8">Loading vault...</div>
            ) : filteredPdfs.length === 0 ? (
              <div className="text-center text-xs text-foreground/40 py-8">No PDF files found.</div>
            ) : (
              filteredPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  onClick={() => {
                    setActivePdfId(pdf.id);
                    setAiSummary("");
                    setAiExplanation("");
                    setAiError("");
                    setFlashcardSuccess("");
                    setInterviewSuccess("");
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    activePdfId === pdf.id
                      ? "bg-secondary text-primary border-primary/40"
                      : "bg-background/40 hover:bg-card/40 border-border/10 hover:border-border/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <File className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-semibold truncate text-foreground">{pdf.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ id: pdf.id, name: pdf.name });
                    }}
                    className="text-foreground/40 hover:text-destructive p-1 rounded hover:bg-card transition-colors shrink-0"
                    title="Delete File"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right pane: Document Text Viewer & AI Sidecar */}
        <div className="md:col-span-2 flex flex-col border border-border/20 bg-card/10 rounded-lg overflow-hidden h-[500px]">
          {activePdf ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Text Reader */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-border/20 p-4">
                <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-4 shrink-0">
                  <span className="text-xs font-bold text-primary truncate max-w-[200px]">
                    READER: {activePdf.name}
                  </span>
                  <Badge variant="gold" className="text-[10px]">
                    TEXT EXTRACTED
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap bg-background/30 border border-border/10 rounded-lg p-4 font-sans">
                  {activePdf.extractedText || "No text extracted from this PDF file."}
                </div>
              </div>

              {/* AI Tool panel */}
              <div className="w-72 flex flex-col overflow-hidden p-4 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-border/30 pb-2 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <h3 className="font-bold text-[10px] uppercase tracking-wider text-primary">
                    AI Study Assistant
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAISummarize}
                    disabled={aiLoading}
                    className="text-[10px] py-1"
                  >
                    Summarize
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIExplain}
                    disabled={aiLoading}
                    className="text-[10px] py-1"
                  >
                    Explain
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIFlashcards}
                    disabled={aiLoading}
                    className="text-[10px] py-1 col-span-2 gap-1"
                  >
                    <Brain className="h-3 w-3 text-primary" /> Generate Flashcards
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIInterview}
                    disabled={aiLoading}
                    className="text-[10px] py-1 col-span-2 gap-1"
                  >
                    <Award className="h-3 w-3 text-primary" /> Generate Interview Prep
                  </Button>
                </div>

                {/* Alerts / Success banners */}
                {flashcardSuccess && (
                  <div className="bg-primary/20 border border-primary/30 text-primary text-[11px] p-3 rounded-lg leading-relaxed flex flex-col gap-2 shrink-0">
                    <span>{flashcardSuccess}</span>
                    <Button
                      size="sm"
                      className="text-[10px] h-6 py-0.5 font-bold w-full bg-primary text-primary-foreground"
                      onClick={() => router.push("/dashboard/flashcards")}
                    >
                      Study Deck
                    </Button>
                  </div>
                )}

                {interviewSuccess && (
                  <div className="bg-primary/20 border border-primary/30 text-primary text-[11px] p-3 rounded-lg leading-relaxed flex flex-col gap-2 shrink-0">
                    <span>{interviewSuccess}</span>
                    <Button
                      size="sm"
                      className="text-[10px] h-6 py-0.5 font-bold w-full bg-primary text-primary-foreground"
                      onClick={() => router.push("/dashboard/interview")}
                    >
                      Start Interview
                    </Button>
                  </div>
                )}

                {aiError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-[10px] p-2.5 rounded-lg shrink-0">
                    {aiError}
                  </div>
                )}

                {/* AI Result Area */}
                {(aiLoading || aiSummary || aiExplanation) && (
                  <Card className="flex-1 bg-background/50 border border-border/40 overflow-hidden flex flex-col">
                    <div className="flex border-b border-border/30 bg-card/40 shrink-0">
                      <button
                        className={`flex-1 text-[9px] font-bold uppercase py-1.5 border-b-2 ${
                          aiActiveTab === "summary"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground/60"
                        }`}
                        onClick={() => setAiActiveTab("summary")}
                      >
                        Summary
                      </button>
                      <button
                        className={`flex-1 text-[9px] font-bold uppercase py-1.5 border-b-2 ${
                          aiActiveTab === "explain"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground/60"
                        }`}
                        onClick={() => setAiActiveTab("explain")}
                      >
                        Explain
                      </button>
                    </div>
                    
                    <CardContent className="p-3 flex-1 overflow-y-auto text-[11px] leading-relaxed">
                      {aiLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-foreground/40 space-y-1.5">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span>AI Distilling...</span>
                        </div>
                      ) : aiActiveTab === "summary" ? (
                        <div className="whitespace-pre-wrap">{aiSummary || "No summary."}</div>
                      ) : (
                        <div className="whitespace-pre-wrap">{aiExplanation || "No explanation."}</div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-foreground/50">
              <File className="h-10 w-10 text-foreground/30 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-primary">No Document Selected</p>
              <p className="text-xs text-foreground/60 mt-1 max-w-xs">
                Select a parsed PDF document from the vault sidebar on the left, or upload a new PDF.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-relaxed text-foreground/80">
            Are you sure you want to permanently delete the PDF document &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteConfirm(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!deleteConfirm) return;
              deletePdf.mutate({ id: deleteConfirm.id }, {
                onSuccess: () => {
                  setDeleteConfirm(null);
                  setActivePdfId(null);
                },
              });
            }}
            disabled={deletePdf.isPending}
          >
            {deletePdf.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
