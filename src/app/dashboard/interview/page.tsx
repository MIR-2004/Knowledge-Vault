"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronLeft, ChevronRight, MessageSquare, Loader2, Sparkles, CheckCircle2, Award, Clipboard } from "lucide-react";

export default function InterviewPage() {
  const utils = trpc.useUtils();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [grading, setGrading] = useState(false);

  // Queries
  const { data: interviews = [], isLoading: interviewsLoading } = trpc.study.listInterviews.useQuery();
  const { data: session, isLoading: sessionLoading } = trpc.study.getInterview.useQuery(
    { id: activeSessionId || "" },
    { enabled: !!activeSessionId }
  );

  // Mutations
  const submitAnswer = trpc.ai.submitInterviewAnswer.useMutation({
    onSuccess: () => {
      utils.study.getInterview.invalidate({ id: activeSessionId || "" });
      setGrading(false);
    },
    onError: () => {
      setGrading(false);
    },
  });

  interface Question {
    id: string;
    question: string;
    sampleAnswer: string;
    userAnswer?: string;
    feedback?: string;
    score?: number;
  }

  const questions: Question[] = session ? JSON.parse(session.questionsJson) : [];
  const activeQuestion = questions[currentQuestionIndex];

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId || !activeQuestion || !userAnswer.trim()) return;

    setGrading(true);
    submitAnswer.mutate({
      interviewId: activeSessionId,
      questionId: activeQuestion.id,
      userAnswer: userAnswer.trim(),
    });
  };

  const handleNext = () => {
    if (!session || questions.length === 0) return;
    const nextIndex = (currentQuestionIndex + 1) % questions.length;
    setUserAnswer(questions[nextIndex]?.userAnswer || "");
    setCurrentQuestionIndex(nextIndex);
  };

  const handlePrev = () => {
    if (!session || questions.length === 0) return;
    const prevIndex = (currentQuestionIndex - 1 + questions.length) % questions.length;
    setUserAnswer(questions[prevIndex]?.userAnswer || "");
    setCurrentQuestionIndex(prevIndex);
  };

  // Calculate stats
  const answeredCount = questions.filter((q) => q.userAnswer).length;
  const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
  const averageScore = answeredCount > 0 ? Math.round(totalScore / answeredCount) : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto flex-1 flex flex-col h-full overflow-hidden select-none space-y-6">
      {/* Header */}
      <div className="border-b border-border/30 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" /> Technical Mock Interviews
        </h1>
        <p className="text-xs text-foreground/80 mt-1">
          Simulate technical mock interviews. Write answers to questions and let OpenAI score them.
        </p>
      </div>

      {/* Grid: Interviews List vs Panel Console */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left: Sessions lists */}
        <div className="md:col-span-1 border border-border/20 bg-card/20 rounded-lg p-4 flex flex-col overflow-hidden h-[450px]">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 border-b border-border/20 pb-2">
            Interview Prep Sessions
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {interviewsLoading ? (
              <div className="text-center text-xs text-foreground/40 py-8">Loading sessions...</div>
            ) : interviews.length === 0 ? (
              <div className="text-center text-xs text-foreground/40 py-8 leading-relaxed">
                No mock interviews found.<br />Open a Note or PDF and click &quot;Generate Interview Prep&quot; to begin.
              </div>
            ) : (
              interviews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSessionId(item.id);
                    setCurrentQuestionIndex(0);
                    setUserAnswer("");
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    activeSessionId === item.id
                      ? "bg-secondary text-primary border-primary/40"
                      : "bg-background/40 hover:bg-card/40 border-border/10 hover:border-border/30"
                  }`}
                >
                  <h3 className="text-xs font-bold truncate text-foreground mb-1">{item.title}</h3>
                  <span className="text-[9px] text-foreground/60 font-mono">
                    Date: {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Interview Arena Panel Console */}
        <div className="md:col-span-2 border border-border/20 bg-card/10 rounded-lg overflow-hidden flex flex-col h-[450px]">
          {activeSessionId ? (
            sessionLoading || !session ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-foreground/60 mt-2">Loading interview...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-foreground/50">
                <HelpCircle className="h-10 w-10 text-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-primary">No Questions</p>
                <p className="text-xs text-foreground/60 mt-1">This prep session has no questions.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 justify-between overflow-hidden">
                {/* Session progress header */}
                <div className="flex items-center justify-between border-b border-border/15 pb-3 shrink-0">
                  <div>
                    <h2 className="text-sm font-bold text-foreground truncate max-w-[200px]">{session.title}</h2>
                    <p className="text-[10px] text-foreground/60 mt-0.5">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                  </div>
                  {/* Scores progress */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-bold">
                      Progress: {answeredCount} / {questions.length} Answered
                    </Badge>
                    {answeredCount > 0 && (
                      <Badge variant="gold" className="text-[9px] font-bold gap-1">
                        <Award className="h-3 w-3" /> Average Score: {averageScore}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Main Study/Grader Section */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {/* Question Prompt */}
                  <div className="bg-secondary/25 border border-border/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                        Question Prompt
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground/90 leading-relaxed">
                      {activeQuestion.question}
                    </p>
                  </div>

                  {/* Submission Status or Input */}
                  {activeQuestion.userAnswer ? (
                    /* Graded feedback results */
                    <div className="space-y-3">
                      {/* User's Answer */}
                      <div className="border border-border/10 rounded-lg p-3 bg-background/20">
                        <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
                          Your Submitted Answer
                        </h4>
                        <p className="text-xs text-foreground/80 leading-relaxed italic">
                          &quot;{activeQuestion.userAnswer}&quot;
                        </p>
                      </div>

                      {/* AI Evaluation */}
                      <Card className="border-primary/30 bg-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 space-y-0">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <CardTitle className="text-xs uppercase tracking-wider font-bold">
                              AI Evaluator Feedback
                            </CardTitle>
                          </div>
                          <Badge variant="gold" className="text-[10px] font-extrabold px-2.5 py-0.5">
                            Grade: {activeQuestion.score}%
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 text-[11px] leading-relaxed text-foreground/90">
                          {activeQuestion.feedback}
                        </CardContent>
                      </Card>

                      {/* Model Answer comparison */}
                      <div className="border border-border/10 rounded-lg p-3 bg-background/20 space-y-1">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <h4 className="text-[10px] text-foreground/60 font-bold uppercase tracking-wider">
                            Sample Model Answer
                          </h4>
                        </div>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">
                          {activeQuestion.sampleAnswer}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Answer Input field */
                    <form onSubmit={handleSubmitAnswer} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          Your Technical Response
                        </label>
                        <Textarea
                          placeholder="Type your structured answer here. Include core concepts, schemas, or logic explanations..."
                          className="text-xs min-h-[100px] leading-relaxed font-sans"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          disabled={grading}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full font-bold gap-1.5"
                        disabled={grading || !userAnswer.trim()}
                      >
                        {grading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> AI grading your response...
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-4 w-4" /> Submit Response
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>

                {/* Navigation footer */}
                <div className="border-t border-border/15 pt-4 shrink-0 flex justify-between items-center text-xs">
                  <Button variant="ghost" size="sm" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous Question
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-foreground/50 font-semibold uppercase">Status:</span>
                    {activeQuestion.userAnswer ? (
                      <Badge variant="gold" className="text-[9px] font-bold">
                        Graded ({activeQuestion.score}%)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-bold">
                        Unanswered
                      </Badge>
                    )}
                  </div>

                  <Button variant="ghost" size="sm" onClick={handleNext}>
                    Next Question <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-foreground/50">
              <HelpCircle className="h-12 w-12 text-foreground/30 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-primary">No Session Selected</p>
              <p className="text-xs text-foreground/60 mt-1 max-w-xs">
                Select an interview prep session from the lists on the left to start practicing mock interviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
