# Wisfy invoice test

1. Supabase: SQL editor -> run `supabase/schema.sql`.
2. Vercel: import this folder, add env vars from `.env.example` (SUPABASE_URL, service role key, ADMIN_KEY, WISFY_SECRET_TOKEN).
3. Open the site, enter ADMIN_KEY, add payment numbers, create an invoice, open its link.
4. Wisfy SMS app: Webhook URL `https://YOUR-APP.vercel.app/api/webhooks/wisfy-sms`, Bearer token = WISFY_SECRET_TOKEN. Send a test ping (returns `{success:true,test:true}`).
5. Pay the invoice amount to your number, enter the TrxID on the pay page, press Verify. A match needs the same TrxID, the same amount and the same provider.

Local: `npm i && cp .env.example .env.local && npm run dev`
