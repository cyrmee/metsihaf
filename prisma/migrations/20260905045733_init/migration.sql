-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gin" WITH VERSION '1.3';

-- CreateEnum
CREATE TYPE "HighlightColor" AS ENUM ('yellow', 'red', 'orange', 'brown', 'green', 'teal', 'blue', 'purple', 'pink');

-- CreateEnum
CREATE TYPE "AccentTheme" AS ENUM ('red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown');

-- CreateEnum
CREATE TYPE "LineSpacing" AS ENUM ('tight', 'normal', 'relaxed');

-- CreateEnum
CREATE TYPE "LetterSpacing" AS ENUM ('tight', 'normal', 'wide');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "authUid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "color" "HighlightColor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "translation" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verse" (
    "version" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "verseEnd" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "redLetter" JSONB,
    "footnotes" JSONB,
    "heading" TEXT,
    "subheading" TEXT,
    "poetic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("version","book","chapter","verse")
);

-- CreateTable
CREATE TABLE "StudyNote" (
    "source" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "verseEnd" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "StudyNote_pkey" PRIMARY KEY ("source","book","chapter","verse")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "fontSize" INTEGER NOT NULL DEFAULT 18,
    "accentTheme" "AccentTheme" NOT NULL DEFAULT 'red',
    "lineSpacing" "LineSpacing" NOT NULL DEFAULT 'normal',
    "letterSpacing" "LetterSpacing" NOT NULL DEFAULT 'normal',
    "showVerseSelector" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authUid_key" ON "User"("authUid");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_ref_key" ON "Bookmark"("userId", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_userId_ref_key" ON "Highlight"("userId", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "Note_userId_ref_key" ON "Note"("userId", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingPosition_userId_key" ON "ReadingPosition"("userId");

-- CreateIndex
CREATE INDEX "Verse_language_version_idx" ON "Verse"("language", "version");

-- CreateIndex
CREATE INDEX "StudyNote_book_chapter_idx" ON "StudyNote"("book", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingPosition" ADD CONSTRAINT "ReadingPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

