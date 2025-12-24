# PickMyArtist

PickMyArtist is a modern, performer-only marketplace for creating premium
profiles and showcasing talent in a curated directory.

## Setup

Run all commands from the project root: `/Users/andrehaldin/PickMyArtistV.1/pickmyartist` (this is where `package.json` lives).

```bash
cd /Users/andrehaldin/PickMyArtistV.1/pickmyartist
npm install
```

## Environment

Create `.env.local` with your Supabase project keys:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_STORAGE_BUCKET=profiles
```

Supabase Edge Function env vars (for Resend email):

```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM="PickMyArtist <bookings@pickmyartist.com>"
```

If the env values are missing, the app runs with mock performers and shows a
banner reminding you to connect Supabase.

Restart the Vite dev server after updating `.env.local`.

## Development

```bash
npm run dev
```

## Supabase schema

Run the SQL in `supabase_schema.sql` inside the Supabase SQL editor. It creates
the `profiles` and `enquiries` tables and enables RLS policies for public access,
owner editing, and anonymous enquiries.

## Supabase functions

Deploy the Edge Function in `supabase/functions/send-enquiry-email` to enable email
notifications via Resend.

## Project structure

- `src/components` shared UI
- `src/pages` routes
- `src/hooks/useAuth.js` auth session hook
- `src/data/mockArtists.js` mock performers for offline mode
- `src/lib/supabaseClient.js` Supabase client setup
