# Who is next

Shows who presents at this week's meeting. Every Monday the next person in the queue takes over.
One link per team, only names inside. Runs on Cloudflare Workers + KV, free tier.

## Use

1. Open the site, type the team one name per row (or paste a list), "Create team link".
2. Send the link to the team. Anyone with it can see and edit the queue.
3. "My turn now" next to a name: that person presents this week and swaps turns with whoever was due.
   Everyone with the link sees it; history shows "instead of".
4. "Edit people": add, rename or remove people. New people join at the end.

## Run locally

```bash
npm install
npm test        # rotation and API tests
npm run dev     # http://localhost:8787, with a local KV store
```

## Deploy

The first deploy goes from your machine:

```bash
npx wrangler login
npm run deploy
```

It creates the KV store, writes its id into `wrangler.toml` (commit that change) and prints the address
(`https://presenter.<your-subdomain>.workers.dev`).

After that, GitHub deploys:

- Pull requests and pushes to other branches run the tests (`.github/workflows/tests.yml`).
- A push to `main` runs the tests, then deploys (`.github/workflows/deploy.yml`). "Run workflow" in Actions does too.
- It needs two repository secrets (Settings → Secrets and variables → Actions):
  - `CLOUDFLARE_API_TOKEN`: Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers".
  - `CLOUDFLARE_ACCOUNT_ID`: printed by `npx wrangler whoami`.

The week starts on Monday in `TIME_ZONE` (`wrangler.toml`, default `Europe/Warsaw`).

Free tier: 100,000 requests and 1,000 KV writes a day. A new team or a queue edit is one write.
