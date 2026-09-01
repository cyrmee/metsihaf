# My Beloved Bible

I want to make a bible app for myself that's has NIV, ESV, NLT, NASV and the Amharic 1954 version with all the cross references in place and all and this app should be just a website not a mobile app

## Development

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
cp .env.local.example .env.local   # fill in SUPABASE_* and DATABASE_URL/DIRECT_URL values
npm run dev                        # http://localhost:3000
```

Set `ESV_API_KEY` and `API_BIBLE_KEY` in `.env.local` to enable the NIV, ESV, NLT and NASB translations (the Amharic 1954 text works without them).

`npx prisma migrate dev` runs migrations. The Amharic SQLite database is rebuilt with `npm run db:build`.
