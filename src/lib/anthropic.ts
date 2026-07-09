// Get the Claude API key
function getAnthropicApiKey(): string | null {
    return process.env.ANTHROPIC_API_KEY || null;
}

function cleanJsonOutput(text: string): string {
    //Try to extract JSON array 
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];

    //Try to extract JSON object
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) return objMatch[0];

    return text.replace(/```json\n?|```\n?/g, "").trim();
}

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = getAnthropicApiKey();

    if (!apiKey) {
        throw new Error("No Anthropic API key found")
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: "claude-sonnet-5",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    const textBlock = (data.content as Array<{ type: string; text?: string }> || [])
        .find((block) => block.type === "text");

    const result = textBlock?.text || "";

    if (!result) {
        console.error("Claude returned no text block. Full content:", JSON.stringify(data.content));
    }

    return result;
}

export async function summarizeNoteOrPdf(title: string, text: string): Promise<string> {
    const prompt = `You are an AI learning assistant. Summarize the following document titled "${title}". 
    Provide a clear, high-level summary paragraph first, followed by a list of key takeaways in bullet points. Use clean markdown.
    Document Content: ${text.slice(0, 8000)}`;

    const apiKey = getAnthropicApiKey();

    if (!apiKey) {
    console.warn("No Anthropic API key found. Using Mock AI Fallback.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `### Executive Summary
The document **"${title}"** covers core topics in software development, architecture, and learning methodologies. This summary distills the essential concepts to save study time and optimize review cycles.

### Key Takeaways
- **Core Concepts**: Summarizes the fundamental definitions and structural relationships described in the notes.
- **Architectural Flow**: Highlights how data and commands travel between the frontend client interfaces and backend processing engines.
- **Practical Implications**: Outlines the recommended steps to build, run, and scale these techniques in production environments.
- **Best Practices**: Stresses code legibility, robust validation checks, and clean error-handling fallback systems.`;
  }

  try {
    return await callClaude(prompt);
  } catch (error) {
    const err = error as Error;
    console.error("Claude API Error:", err);
    throw new Error(err.message || "Failed to generate AI summary.");
  }
}

export async function explainDifficultConcepts(
  title: string,
  text: string
): Promise<string> {
  const prompt = `You are a world-class teacher. Analyze the following document titled "${title}" and identify 2-3 difficult concepts or terms. 
Explain each concept in simple terms, using real-world analogies. Format with clean markdown headings.

Document Content:
${text.slice(0, 8000)}`;

  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    console.warn("No Anthropic API key found. Using Mock AI Fallback.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `### Concept 1: Asynchronous State Management
**Simple Explanation**: Managing data changes in a software application where operations happen at different times (like waiting for a database to respond).
**Analogy**: Think of it like ordering food at a restaurant. You place your order (send a request) and receive a buzzer. Instead of standing at the counter doing nothing (blocking), you sit down, browse your phone, and only collect the food when the buzzer rings (asynchronous callback).

### Concept 2: Type Safety and Schemas
**Simple Explanation**: Enforcing rules on what kind of data can flow through your application (e.g. checking that an email is a string, and a price is a number).
**Analogy**: Think of it like a coin-sorting machine. The slots are designed with exact dimensions (types). A quarter cannot slide into a dime slot, which prevents sorting errors (runtime bugs) before the coins are boxed up.`;
  }

  try {
    return await callClaude(prompt);
  } catch (error) {
    const err = error as Error;
    console.error("Claude API Error:", err);
    throw new Error(err.message || "Failed to explain concepts.");
  }
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export async function generateFlashcardsFromText(
  title: string,
  text: string
): Promise<FlashcardItem[]> {
  const prompt = `You are an AI study assistant. Analyze the document titled "${title}" and generate a JSON array containing up to 6 flashcards.
Each flashcard must have a "front" (question/concept) and "back" (answer/definition) property.
Ensure you return ONLY a raw JSON array of objects, with no markdown code blocks or wrapper text.

Example format:
[
  {"front": "Question 1", "back": "Answer 1"}
]

Document Content:
${text.slice(0, 8000)}`;

  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    console.warn("No Anthropic API key found. Using Mock AI Fallback.");
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return [
      {
        front: "What is Drizzle ORM?",
        back: "Drizzle is a TypeScript-first Object Relational Mapper (ORM) that is lightweight, performant, and lets you write SQL-like queries with full type safety.",
      },
      {
        front: "Explain the purpose of tRPC.",
        back: "tRPC allows you to build end-to-end type-safe APIs without generating code. It shares TypeScript types between your router (server) and components (client).",
      },
      {
        front: "What is Better Auth?",
        back: "Better Auth is a modern, self-hosted authentication library for TypeScript applications. It stores user, session, and verification logs in your own database.",
      },
      {
        front: "How does Spaced Repetition (Leitner System) work?",
        back: "It involves reviewing flashcards at increasing intervals. Cards answered correctly move to the next box (studied less frequently), while incorrect ones return to box one.",
      },
    ];
  }

  try {
    const systemPrompt = "You are a helpful assistant. You must return ONLY raw JSON array strings matching the exact schema specified, without any markdown formatting wrappers (such as ```json) or explanation text.";
    const response = await callClaude(prompt, systemPrompt);
    const cleaned = cleanJsonOutput(response);
    return JSON.parse(cleaned) as FlashcardItem[];
  } catch (error) {
    const err = error as Error;
    console.error("Claude API Error:", err);
    throw new Error(err.message || "Failed to generate flashcards.");
  }
}

export interface InterviewQuestionItem {
  id: string;
  question: string;
  sampleAnswer: string;
  userAnswer?: string;
  feedback?: string;
  score?: number;
}

export async function generateInterviewQuestionsFromText(
  title: string,
  text: string
): Promise<InterviewQuestionItem[]> {
  const prompt = `You are a technical interviewer. Analyze the document titled "${title}" and generate a JSON array containing 3 realistic technical interview questions based on the content.
Each question object must contain:
- "id": a unique short string (e.g. "q1", "q2")
- "question": the question text
- "sampleAnswer": a detailed, model answer demonstrating deep understanding.
Ensure you return ONLY a raw JSON array of objects, with no markdown code blocks or wrapper text.

Document Content:
${text.slice(0, 8000)}`;

  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    console.warn("No Anthropic API key found. Using Mock AI Fallback.");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return [
      {
        id: "q1",
        question: `How would you structure a production-grade full-stack project using the concepts from "${title}"?`,
        sampleAnswer: "A production-grade app should use a clean directory separation like src/app (routing/layouts), src/components (modular UI, separated into base ui components and domain feature components), src/lib (database clients, auth handlers), and src/lib/trpc/routers (modular backend endpoint definitions grouped by entity). Database queries should use indexes on foreign keys, and sensitive operations must run behind protected procedures.",
      },
      {
        id: "q2",
        question: "What are the benefits of combining Drizzle ORM and tRPC, and how do they improve developer experience?",
        sampleAnswer: "By combining Drizzle and tRPC, you establish a type-safe pipeline from the database schema up to the client UI. Drizzle generates type definitions for select and insert payloads. When tRPC returns these rows, the React client automatically infers their shapes. If a database column name is changed, typescript compilation will throw errors in components using it, eliminating runtime bugs.",
      },
      {
        id: "q3",
        question: "Why should we enforce robust validation (like Zod) on the server-side, even if we already have frontend checks?",
        sampleAnswer: "Frontend checks are easily bypassed by direct API calls (e.g., using curl, Postman, or malicious scripts). Server-side validation acts as the final gatekeeper. Zod schemas parse inputs at the API gateway level, sanitizing SQL queries, preventing buffer inputs, and rejecting malformed payloads before they hit the database layer.",
      },
    ];
  }

  try {
    const systemPrompt = "You are a helpful assistant. You must return ONLY raw JSON array strings matching the exact schema specified, without any markdown formatting wrappers (such as ```json) or explanation text.";
    const response = await callClaude(prompt, systemPrompt);
    const cleaned = cleanJsonOutput(response);
    return JSON.parse(cleaned) as InterviewQuestionItem[];
  } catch (error) {
    const err = error as Error;
    console.error("Claude API Error:", err);
    throw new Error(err.message || "Failed to generate interview questions.");
  }
}

export async function gradeInterviewAnswer(
  question: string,
  sampleAnswer: string,
  userAnswer: string
): Promise<{ score: number; feedback: string }> {
  const prompt = `You are a technical interviewer. Evaluate the candidate's answer to the technical question.
Question: "${question}"
Model Answer: "${sampleAnswer}"
Candidate's Answer: "${userAnswer}"

Grade the candidate's answer on a scale from 0 to 100.
Provide constructive feedback explaining what they got right, what they missed, and how to improve.
Return ONLY a JSON object in this exact format:
{
  "score": 85,
  "feedback": "Your answer is excellent. You correctly mentioned X and Y. However, to get a higher score, you should expand on Z."
}
Do not return any markdown code block wrappers or other text.`;

  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    console.warn("No Anthropic API key found. Using Mock AI Fallback.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const len = userAnswer.trim().length;
    let score = 50;
    let feedback = "";
    if (len < 10) {
      score = 20;
      feedback = "Your answer is too short. Please provide a more detailed explanation of the concept including its mechanisms and trade-offs.";
    } else if (len < 40) {
      score = 55;
      feedback = "Good start, but you only touched the surface. You should explain the core mechanism and give a example of how it operates in practice.";
    } else {
      score = Math.min(80 + Math.floor(Math.random() * 15), 100);
      feedback = `Excellent response! You've captured the core requirements and illustrated a clear conceptual grasp of the topic. To improve further, you could discuss edge cases or performance optimization patterns related to this concept in production.`;
    }
    return { score, feedback };
  }

  try {
    const systemPrompt = "You are a helpful assistant. You must return ONLY raw JSON strings matching the exact schema specified, without any markdown formatting wrappers (such as ```json) or explanation text.";
    const response = await callClaude(prompt, systemPrompt);
    const cleaned = cleanJsonOutput(response);
    return JSON.parse(cleaned) as { score: number; feedback: string };
  } catch (error) {
    const err = error as Error;
    console.error("Claude API Error:", err);
    return {
      score: 70,
      feedback: "Answer graded. (Claude API error occurred; grading defaulted to standard feedback.)",
    };
  }
}
