# AI Knowledge Vault

AI Knowledge Vault is a modern, high-fidelity web application designed to help users organize notes, upload PDF documents, and leverage AI capabilities to summarize content, generate study decks/flashcards, and practice with simulated mock interviews.

---

## 🚀 Key Features

* **🗂 Notes & Folders**: Organize study notes in a neat, hierarchical folder structure.
* **📄 PDF Upload & Processing**: Upload PDF documents (up to 10MB). Text is parsed dynamically on upload.
* **🤖 AI Summarization**: Generate concise, structured summaries of your notes or PDF files powered by Anthropic's Claude and OpenAI.
* **🧠 Study Decks & Flashcards**: Auto-generate flashcard decks from notes/PDFs and track your revision progress (marking cards as correct/incorrect).
* **🎤 Mock Interview Prep**: Practice answering generated mock interview questions to prep for exams or job interviews.
* **🔒 Secure Authentication**: Robust session management and social login (Google OAuth) powered by **Better Auth**.

---

## 🛠 Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
* **Database**: PostgreSQL
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
* **API Layer**: [tRPC](https://trpc.io/) + [TanStack React Query](https://tanstack.com/query/latest)
* **Authentication**: [Better Auth](https://www.better-auth.com/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **AI Clients**: [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) & [OpenAI SDK](https://github.com/openai/openai-node)

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have [Node.js v20+](https://nodejs.org/) installed and a running PostgreSQL database.

### 2. Environment Variables Setup
Copy the configuration variables to a `.env` file in the root directory:

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-32-char-random-secret"
BETTER_AUTH_URL="http://localhost:3000"

# AI Api Keys
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-proj-..."

# Google OAuth Credentials (optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Push Database Schema
Push the local database schema to your PostgreSQL instance:
```bash
npx drizzle-kit push
```

### 5. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## ⚙️ Scripts

The following commands are available in the project:

* `npm run dev`: Starts the Next.js development server with Turbopack.
* `npm run build`: Compiles the application for production.
* `npm run start`: Runs the built Next.js production server.
* `npm run lint`: Validates the codebase style and syntax using ESLint.
* `npm run typecheck`: Runs the TypeScript compiler (`tsc --noEmit`) to verify type safety.

---

## 🛡 CI/CD & Deployment

### Continuous Integration
A GitHub Actions workflow is preconfigured in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) to automatically validate the codebase on every push or pull request to the `main`, `master`, and `dev` branches by running:
1. Linter (`npm run lint`)
2. TypeScript typecheck (`npm run typecheck`)
3. Production build compilation (`npm run build`)

### Vercel Deployment
To deploy this project to Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Configure all environment variables listed in the **Environment Variables Setup** section under Project Settings.
3. Under **Settings > Build & Development Settings**, turn on the **Build Command** override and set it to:
   ```bash
   npx drizzle-kit migrate && next build
   ```
   This ensures database migrations are run automatically on every successful deployment.
