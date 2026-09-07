# Label Check

A TTB prototype that compares a bottle-label photo to the values on the application. It does not connect to COLA or store files.

The documentation with approach, tools used, assumptions made is in [documentation.md](documentation.md)
The original assignment notes are in [assignment.md](assignment.md).

## Run locally

Needs Node 20+. Two terminals.

```bash
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env
```

Optional: put an `OPENAI_API_KEY` in `api/.env`. Without it, the API uses Tesseract. That key never goes in the frontend.

Terminal 1 — API (http://localhost:3001):

```bash
cd api
npm install
npm test
npm run dev
```

Terminal 2 — app (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

The Vite app calls the API at `VITE_API_URL` from `frontend/.env`.

- `POST /api/compare` — one label. A batch is the same call, once per pair.

Extract is a shared service used by compare. There is no extract endpoint.

Add the label as a file or a pasted screenshot (Ctrl+V / Cmd+V), then paste the application or PDF text into one box. **Process label** starts the check. The API pulls brand, class/type, ABV, net contents, and the warning out of that dump, then compares them to the photo.

A batch is the same pair, repeated. Use **Add another** so each photo stays matched with its own application text. **Process labels** checks every pair that is ready. Fail and needs-review reasons show next to the status.

## Deploy

The API must run on a Node host. Tesseract will not start on typical serverless (Vercel/Netlify functions). The OpenAI key stays on the API. Set the frontend’s `VITE_API_URL` to the live API URL **when you build** the Vite app.

Simplest free split:

1. API on [Render](https://render.com) as a Web Service from the `api/` folder. Start command `npm start`. Add `OPENAI_API_KEY`. Render sets `PORT`.
2. Frontend on [Cloudflare Pages](https://pages.cloudflare.com) or [Netlify](https://www.netlify.com) from the `frontend/` folder. Build `npm run build`, publish `dist`. Set `VITE_API_URL` to the Render URL before the build.

The first hit after a free-tier sleep can be slow. That is the host spinning up, then Tesseract warming.

Test labels are in `samples/`. Use the PNG as the photo and paste the matching `.txt` as the application.

- `old-tom`: clean match, warning is bold
- `stones-throw`: same brand, different capitalization (needs review)
- `warning-titlecase`: warning is not all caps (fail)
- `non-bold-text`: warning is all caps but regular weight (fail)
- `hard-to-read`: angled or dark label. OpenAI usually reads it. Tesseract often cannot.
