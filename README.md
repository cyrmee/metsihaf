# My Beloved Bible

I want to make a bible app for myself that's has NIV, ESV, NLT, NASV and the Amharic 1954 version with all the cross references in place and all and this app should be just a website not a mobile app

## Development

This repo holds the Next.js frontend. The NestJS API lives in a separate repo at `~/source/metsihaf-backend`. Run both locally, in two terminals:

```sh
git clone <this-repository-url>
cd <repository-name>

# Frontend (http://localhost:3000)
npm install
cp .env.local.example .env.local   # fill in SUPABASE_* values
npm run dev

# Backend API (http://localhost:4000), in a second terminal
cd ~/source/metsihaf-backend
npm install
cp .env.example .env               # fill in DATABASE_URL, DIRECT_URL, SUPABASE_*
npm run start:dev
```

Set `ESV_API_KEY` and `API_BIBLE_KEY` in the backend's `.env` to enable the NIV, ESV, NLT and NASB translations (the Amharic 1954 text works without them).

Prisma migrations run from the backend repo: `npx prisma migrate dev`. The Amharic SQLite database is rebuilt with `npm run db:build`.

Deploying this app means deploying two services: the Next.js frontend and the long-running Nest API process (not a serverless function).
