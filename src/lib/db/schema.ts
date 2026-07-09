import { pgTable, text, timestamp, boolean, foreignKey } from "drizzle-orm/pg-core";

// Better Auth tables

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// Knowledge vault workspace tables

export const folder = pgTable("folder", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parentId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => {
  return {
    parentReference: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "folder_parent_id_fk"
    }).onDelete("cascade")
  };
});

export const note = pgTable("note", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  folderId: text("folderId")
    .references(() => folder.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const pdfDocument = pgTable("pdf_document", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filePath: text("filePath").notNull(),
  extractedText: text("extractedText"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  folderId: text("folderId")
    .references(() => folder.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const flashcardDeck = pgTable("flashcard_deck", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  noteId: text("noteId")
    .references(() => note.id, { onDelete: "cascade" }),
  pdfId: text("pdfId")
    .references(() => pdfDocument.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const flashcard = pgTable("flashcard", {
  id: text("id").primaryKey(),
  deckId: text("deckId")
    .notNull()
    .references(() => flashcardDeck.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  status: text("status").notNull().default("NEW"), // 'NEW' | 'LEARNING' | 'MASTERED'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const interviewPrep = pgTable("interview_prep", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  noteId: text("noteId")
    .references(() => note.id, { onDelete: "cascade" }),
  pdfId: text("pdfId")
    .references(() => pdfDocument.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionsJson: text("questionsJson").notNull(), // stringified array of InterviewQuestions
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
