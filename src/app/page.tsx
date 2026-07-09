"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Brain,
  FileText,
  FolderOpen,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Terminal,
  Zap,
  CheckCircle,
  FileCode,
  Flame,
  MousePointer,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: session } = authClient.useSession();
  
  // Playground state
  const [activeTab, setActiveTab] = useState<"summarize" | "explain" | "flashcards" | "interview">("summarize");
  const [cardFlipped, setCardFlipped] = useState(false);

  // Playround Data Mockups
  const playgroundOptions = {
    summarize: {
      inputTitle: "Database Indexing 101.md",
      inputContent: `# B-Tree Database Indexes\n\nDatabase indexes are critical data structures (typically B-Trees) that speed up data retrieval operations on a database table at the cost of additional writes and storage space. B-Trees maintain sorted data and perform searches, sequential access, insertions, and deletions in logarithmic time O(log N). When a table is indexed, the engine looks up the index tree first to locate row pointers instead of scanning the entire disk sequentially.`,
      outputType: "Summary Dashboard",
      outputIcon: <FileCode className="h-4.5 w-4.5 text-primary" />,
      outputHTML: (
        <div className="space-y-4 animate-fade-in-up text-xs leading-relaxed">
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <CheckCircle className="h-4 w-4" />
            <span>AI Executive Summary</span>
          </div>
          <p className="text-foreground/80">
            This document outlines the mechanics of B-Tree indexing, explaining how lookup times are minimized to logarithmic complexity while introducing write penalties and disk overhead.
          </p>
          <div className="border-t border-border/10 pt-3 space-y-2">
            <span className="font-bold text-[10px] text-primary uppercase tracking-wider block">Key Insights</span>
            <ul className="list-disc list-inside space-y-1.5 text-foreground/75">
              <li><strong className="text-foreground">Logarithmic Time</strong>: Search operations run in <code className="font-mono text-primary bg-secondary/50 px-1 rounded text-[10px]">O(log N)</code>.</li>
              <li><strong className="text-foreground">Write Penalty</strong>: INSERT, UPDATE, and DELETE queries slow down because the index tree must rebalance.</li>
              <li><strong className="text-foreground">Disk Scan Avoidance</strong>: Bypasses expensive full table sequential scans by using row pointers.</li>
            </ul>
          </div>
        </div>
      ),
    },
    explain: {
      inputTitle: "REST_vs_GraphQL.md",
      inputContent: `# REST vs GraphQL API Structures\n\nREST APIs expose resource endpoints (e.g. /users, /posts) returning fixed data structures, leading to over-fetching (getting more data than needed) or under-fetching (requiring multiple endpoints to get complete data). GraphQL exposes a single endpoint and allows clients to write exact queries requesting only necessary keys (e.g. user.name, user.avatar), saving network payload size.`,
      outputType: "Analogy Engine",
      outputIcon: <Brain className="h-4.5 w-4.5 text-primary" />,
      outputHTML: (
        <div className="space-y-4 animate-fade-in-up text-xs leading-relaxed">
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>AI Analogy Explainer</span>
          </div>
          <div className="space-y-3">
            <div className="bg-secondary/20 p-2.5 rounded border border-border/20">
              <strong className="text-primary block text-[10px] uppercase font-bold tracking-wider">Concept: REST APIs</strong>
              <p className="text-foreground/85 mt-0.5">Like ordering a fixed Combo Meal. Even if you only want the burger, you must buy and carry the fries and drink (Over-fetching).</p>
            </div>
            <div className="bg-secondary/20 p-2.5 rounded border border-border/20">
              <strong className="text-primary block text-[10px] uppercase font-bold tracking-wider">Concept: GraphQL APIs</strong>
              <p className="text-foreground/85 mt-0.5">Like an A La Carte Buffet. You fill your plate with exactly one burger patty and no fries, paying and carrying only what you eat.</p>
            </div>
          </div>
        </div>
      ),
    },
    flashcards: {
      inputTitle: "TypeScript_Fundamentals.md",
      inputContent: `# TS Type Declarations\n\nType safety prevents runtime assignment errors. Enforcing compile-time checks ensures parameters match exact declarations. Type narrowing and discriminated unions provide sound runtime boundaries for asynchronous API data inputs.`,
      outputType: "Spaced Repetition Deck",
      outputIcon: <Zap className="h-4.5 w-4.5 text-primary" />,
      outputHTML: (
        <div className="space-y-4 animate-fade-in-up text-center flex flex-col items-center justify-center h-full min-h-[160px]">
          <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Interactive 3D Study Card</span>
          
          <div 
            className="w-full max-w-[240px] h-32 cursor-pointer flip-card"
            onClick={() => setCardFlipped(!cardFlipped)}
          >
            <div className={`flip-card-inner relative w-full h-full duration-500 transform ${cardFlipped ? "flip-card-flipped" : ""}`}>
              {/* Front */}
              <div className="absolute inset-0 bg-secondary/80 border border-border rounded-xl p-4 flex flex-col justify-between items-center text-center shadow-lg flip-card-front">
                <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Question</span>
                <p className="text-xs font-bold leading-relaxed text-foreground px-2">What is compile-time type safety?</p>
                <span className="text-[8px] text-foreground/40 flex items-center gap-1"><MousePointer className="h-2.5 w-2.5 text-primary" /> Click card to flip</span>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 bg-secondary border border-primary/50 rounded-xl p-4 flex flex-col justify-between items-center text-center shadow-lg flip-card-back">
                <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Answer</span>
                <p className="text-[10px] leading-relaxed text-foreground/90 font-medium">Checking and validating code variables at build-time to prevent crash errors at runtime.</p>
                <span className="text-[8px] text-primary flex items-center gap-1"><RotateCcw className="h-2.5 w-2.5" /> Click to reset</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    interview: {
      inputTitle: "Microservices_Architecture.md",
      inputContent: `# System Architecture\n\nMicroservices separate functional business logic into individual isolated applications. Communication occurs via REST or gRPC. Data isolation is maintained, meaning each service operates its own database to avoid shared database bottlenecks.`,
      outputType: "Technical Mock Interview",
      outputIcon: <Award className="h-4.5 w-4.5 text-primary" />,
      outputHTML: (
        <div className="space-y-3 animate-fade-in-up text-xs leading-relaxed">
          <div className="flex justify-between items-center border-b border-border/10 pb-2">
            <span className="text-primary font-bold flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Interview Response Graded
            </span>
            <Badge variant="gold" className="text-[10px] font-extrabold font-mono px-2 py-0.5">Score: 94%</Badge>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-foreground/50 tracking-wider block">Question</span>
              <p className="font-semibold text-foreground/90">Why do microservices avoid sharing databases?</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-foreground/50 tracking-wider block">Candidate Reply</span>
              <p className="text-foreground/75 italic">&quot;Sharing a DB couples the services together. If the database schema changes, both services break, creating database lock bottleneck.&quot;</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-lg text-[11px]">
              <span className="text-[9px] font-bold text-primary uppercase block tracking-wider">AI Evaluation</span>
              <p className="text-foreground/90 mt-0.5 leading-relaxed">
                Excellent response. You highlighted database tight coupling and schema dependency. To reach 100%, discuss service scaling autonomy.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  };

  const currentOption = playgroundOptions[activeTab];

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden select-none">
      {/* Mesh grid & glowing gradient blobs */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[700px] h-[700px] bg-primary/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow animation-delay-400" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-border/20 z-10 animate-fade-in-up">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105 shadow-md shadow-primary/5">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <span className="font-black text-xl tracking-wider text-primary">KNOWLEDGE VAULT</span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <Link href="/dashboard">
              <Button className="font-bold px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all btn-glow">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">
                Log In
              </Link>
              <Link href="/register">
                <Button className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all btn-glow">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center py-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Left Copy (Optimized UI/UX design) */}
          <div className="lg:col-span-6 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-xs font-bold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
              <span>A Second Brain, Supercharged by AI</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tighter text-foreground">
              Write once. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-300 to-purple-400">
                Recall forever.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-xl">
              Knowledge Vault is the ultimate study system. Author rich markdown guides, import course textbooks, and leverage contextual GPT-4o-mini engines to summarize notes, formulate card decks, and practice mock technical interviews.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="font-bold text-base px-8 py-6 gap-2 btn-glow">
                    Enter Dashboard <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="font-bold text-base px-8 py-6 gap-2 btn-glow">
                      Create Free Account <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#playground">
                    <Button size="lg" variant="outline" className="font-bold text-base px-8 py-6 hover:bg-card/40 transition-colors">
                      Test Playground
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Floating Dashboard Visual (Optimized for UX depth) */}
          <div className="lg:col-span-6 animate-float animate-fade-in-up animation-delay-200">
            <div className="relative bg-card/40 border border-border/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-40 pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-foreground/50 font-mono bg-background/50 px-2.5 py-0.5 rounded border border-border/10">
                  <Terminal className="h-3 w-3 text-primary" />
                  <span>app/dashboard/notes/schema.ts</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-background/40 rounded-lg p-3 border border-border/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-primary font-bold">Autosaving Workspace</span>
                    <span className="text-[9px] text-green-400 font-mono animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active Sync
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed font-mono truncate">
                    const db = drizzle(pool, &#123; schema &#125;);
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-background/80 border border-border/60 rounded-xl p-4 flex flex-col justify-between h-28 relative shadow-md">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider">AI Analogy</span>
                    <p className="text-xs font-semibold leading-snug mt-1">REST is like ordering combo meals; GraphQL is an a-la-carte buffet.</p>
                  </div>
                  <div className="bg-background/80 border border-border/60 rounded-xl p-4 flex flex-col justify-between h-28 relative shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Interview Review</span>
                      <Badge variant="gold" className="text-[9px] font-bold font-mono">92%</Badge>
                    </div>
                    <p className="text-[10px] text-foreground/75 leading-relaxed mt-1.5 line-clamp-2">
                      &quot;Correct analysis of SQL reindexing time. Mention table locking next time.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE PLAYGROUND WIDGET (The hook for new visitors) */}
        <section id="playground" className="mt-32 space-y-8 animate-fade-in-up animation-delay-200 scroll-mt-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Interactive Playground</h2>
            <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
              Test how the AI assistant processes note contents to generate answers, analogies, flashcards, and technical mock grades.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-card/25 border border-border/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
            {/* Left Control Tabs & Input */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <span className="text-[10px] font-bold uppercase text-foreground/50 tracking-wider block">1. Select AI Tool</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => { setActiveTab("summarize"); setCardFlipped(false); }}
                  className={`text-[11px] font-bold py-2.5 px-3 rounded-lg border transition-all truncate text-center ${
                    activeTab === "summarize"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-background/20 text-foreground/75 hover:bg-background/40 hover:text-foreground"
                  }`}
                >
                  Summarizer
                </button>
                <button
                  onClick={() => { setActiveTab("explain"); setCardFlipped(false); }}
                  className={`text-[11px] font-bold py-2.5 px-3 rounded-lg border transition-all truncate text-center ${
                    activeTab === "explain"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-background/20 text-foreground/75 hover:bg-background/40 hover:text-foreground"
                  }`}
                >
                  Analogies
                </button>
                <button
                  onClick={() => { setActiveTab("flashcards"); setCardFlipped(false); }}
                  className={`text-[11px] font-bold py-2.5 px-3 rounded-lg border transition-all truncate text-center ${
                    activeTab === "flashcards"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-background/20 text-foreground/75 hover:bg-background/40 hover:text-foreground"
                  }`}
                >
                  Flashcards
                </button>
                <button
                  onClick={() => { setActiveTab("interview"); setCardFlipped(false); }}
                  className={`text-[11px] font-bold py-2.5 px-3 rounded-lg border transition-all truncate text-center ${
                    activeTab === "interview"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-background/20 text-foreground/75 hover:bg-background/40 hover:text-foreground"
                  }`}
                >
                  Interviews
                </button>
              </div>

              <div className="flex-1 flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-foreground/50 tracking-wider">
                  <span>2. Note Workspace Input</span>
                  <span className="font-mono text-primary/70">{currentOption.inputTitle}</span>
                </div>
                <div className="flex-1 bg-background/50 border border-border/40 rounded-xl p-4 font-mono text-[10px] text-foreground/70 leading-relaxed whitespace-pre-wrap select-text h-48 overflow-y-auto">
                  {currentOption.inputContent}
                </div>
              </div>
            </div>

            {/* Right Live AI Response Panel */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <span className="text-[10px] font-bold uppercase text-foreground/50 tracking-wider block">3. Live Playground Output</span>
              <div className="flex-1 bg-background/90 border border-border/80 rounded-xl p-5 shadow-inner relative min-h-[220px] flex flex-col justify-between">
                
                <div className="flex items-center justify-between border-b border-border/10 pb-3 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-primary font-sans">
                    {currentOption.outputIcon}
                    <span>{currentOption.outputType}</span>
                  </div>
                  <span className="text-[9px] text-green-400 font-mono flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Compiled
                  </span>
                </div>

                <div className="flex-1">
                  {currentOption.outputHTML}
                </div>

                <div className="text-[8px] font-mono text-foreground/35 mt-4 pt-2 border-t border-border/10 text-right">
                  Contextual analysis completed dynamically.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 animate-fade-in-up animation-delay-200">
          <div className="bg-card/20 border border-border/60 p-6 rounded-2xl space-y-4 hover:border-primary/50 hover:bg-card/40 transition-all duration-300 group glow-border">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-extrabold text-lg text-primary">Organize & Write</h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              Form nested folder hierarchies. Author study guides inside an editor featuring a live Markdown previewer and background autosaving.
            </p>
          </div>

          <div className="bg-card/20 border border-border/60 p-6 rounded-2xl space-y-4 hover:border-primary/50 hover:bg-card/40 transition-all duration-300 group glow-border">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-extrabold text-lg text-primary">PDF Vault & Parser</h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              Upload course syllabus, notes, or full PDFs. The system extracts text dynamically so you can study alongside your document content.
            </p>
          </div>

          <div className="bg-card/20 border border-border/60 p-6 rounded-2xl space-y-4 hover:border-primary/50 hover:bg-card/40 transition-all duration-300 group glow-border">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-extrabold text-lg text-primary">Technical Interviews</h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              Generate custom interview questions directly from your materials. Write answers and receive constructive score reviews and feedback.
            </p>
          </div>
        </div>

        {/* Call to Action Banner */}
        <section className="mt-32 w-full bg-gradient-to-tr from-card/85 via-card/50 to-card/20 border border-border rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 z-10 relative overflow-hidden animate-fade-in-up animation-delay-400">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="space-y-3 max-w-xl z-10">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Ready to supercharge your study system?</h2>
            <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
              Open your second brain inside the Knowledge Vault today. Study with dynamic spaced repetition, generate analogies, and prepare for interviews.
            </p>
          </div>
          <div className="z-10">
            <Link href={session ? "/dashboard" : "/register"}>
              <Button size="lg" className="font-bold px-8 py-6 shadow-xl shadow-primary/20 btn-glow">
                {session ? "Enter Dashboard" : "Sign Up for Free"}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/20 py-8 text-center text-xs text-foreground/60 z-10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AI Knowledge Vault. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Developed by <strong className="text-primary font-bold">Mir Saif Ali</strong></span>
            <span className="text-border/40">|</span>
            <a
              href="https://github.com/mirsaifali"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-primary transition-colors font-semibold"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/mir-saif-ali"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-primary transition-colors font-semibold"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
