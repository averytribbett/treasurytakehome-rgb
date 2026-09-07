# Approach, tools, and assumptions

I built Label Check as a standalone tool for TTB compliance agents. You add a label photo and the application text. The API reads the photo, pulls the expected fields out of the paste, and scores each field as pass, needs review, or fail. The tool makes a recommendation. The agent still decides.

This is a working prototype, not a COLA rebuild. There is no database, no login, and no COLA integration.

## Why the first screen is two giant buttons

Sarah said the UI had to be something her mom could figure out, and that half the team is over 50. I did not want a dashboard with a pile of options. The first screen asks one question, "What do you want to check?", and the only answers are two large buttons: **One label** and **A batch**.

That is the whole landing page on purpose. If Dave can see two doors and pick one, he is already in the right flow.

## One label and a batch

- **One label:** one photo and one application paste. Nothing runs until you click **Process label**.
- **A batch:** the same pair, repeated. **Add another** starts the next pair so each photo stays with its own text. Nothing runs until you click **Process labels**.

I did not build a CSV or a zip upload. The assignment never described a batch file format. Peak season is still a pile of COLA records, so the UI copies that: add a pair, add another, then process.

A check is one shared path either way. The browser calls `POST /api/compare`. There is no extract endpoint. Reading the photo happens inside compare.

You can choose a file or paste a screenshot. COLA is on-screen software, so a lot of agents will copy the label and never save a PNG.

## Speed

Sarah said if it is not back in about five seconds, nobody will use it. One label is usually around 2–4 seconds with OpenAI warm, so it stays under that bar.

The hosted API is on Render's free tier. If nobody has hit it in a while, the box goes to sleep. The first label after that can take 30–60 seconds while the service wakes up. That is the host, not the model. After it is up, later labels are back in the 2–4 second range.

A batch uses the same call, but ready pairs run at the same time. Each label is still in that 2–4 second range. A stack of four is closer to one label than to four labels in a line. The sticky bar at the top shows how many are running so the wait is visible instead of feeling stuck.

Most of the 2–4 seconds is OpenAI looking at the image, not our server. I already turned reasoning off on `gpt-5.6-luna` (`reasoning_effort: "none"`) so it does not sit and think before it reads the label. Tesseract is faster (~0.4s once warm) but it misses bold and a lot of hard photos, so it is the fallback, not the default.

If someone needed the OpenAI call itself to be faster than that, the next step would be an enterprise plan with higher throughput. I do not think that is worth the extra cost here. We are already under Sarah's five second bar, and a batch is parallel, so the money would buy a little less waiting on each image, not a different product.

## Tools

| Piece | Choice | Why I picked it |
| --- | --- | --- |
| Editor | Cursor | Faster scaffolding, refactors, and tests. I still made the product calls. |
| Language | TypeScript, Node 20 | Same language on the client and the server. Compare rules stay typed. |
| Frontend | Vite, React 19, React Router | Small app with two obvious paths. |
| API | Express, multer | File upload and a small HTTP surface. Easy to host on a regular Node box. |
| Vision | OpenAI `gpt-5.6-luna` when `OPENAI_API_KEY` is set | Better on angled, dark, or glare-heavy labels than raw OCR. Also the only path that can see bold. |
| Fallback | Tesseract.js on the API | Still works if the cloud call fails or the key is missing. Marcus said the network may block ML endpoints. |
| Compare | Plain TypeScript | I did not want a model deciding pass or fail. An agent should be able to read the reason. |
| Tests | Vitest on the API | Pins the scoring rules and the parsers. |
| Samples | PNG plus matching `.txt` in `samples/` | Reviewers can try it from files in the repo. |
| Source control | Git, GitHub | Deliverable 1 is a repo they can clone. |

I used Cursor as a pair programmer for boilerplate, UI copy, tests, and some of the batch flow. The scoring rules, the two-button landing, the pair-by-hand batch, and the "recommend, don't decide" stance came from the stakeholder notes.

The OpenAI key lives in `api/.env`. It never goes to Vite. If OpenAI fails, the API falls back to Tesseract and still returns a result.

## How a check runs

1. Add a photo and paste the application text (a COLA dump or text copied from a PDF).
2. `parseApplicationText` looks for labeled keys like `Brand name:`. If those are missing it uses the same heuristics as OCR. `GOVERNMENT WARNING:` is not treated as a field key, so the prefix stays on the expected warning.
3. `extractFromImage` tries OpenAI Vision, then Tesseract.
4. `compareFields` scores brand, class/type, ABV, net contents, and the government warning.
5. Overall is the worst field: fail beats needs review beats pass.

One label shows a checking panel with a timer. A batch keeps a list: not started, checking, pass, needs review, fail, or error. **Process labels** starts every ready pair together. Fail and needs-review reasons show in parentheses next to the status. The batch page does not open the full field table for every pair.

## Compare rules

I wrote these from the interview notes, not from a generic fuzzy match.

- **Government warning.** Exact text after collapsing extra spaces. The first two words on the label have to be `GOVERNMENT WARNING` in all caps. Jenny's title-case example is a fail. When OpenAI ran, `warningBold` is also checked: not bold is a fail. Tesseract cannot see stroke weight, so that path passes the wording and says bold could not be checked.
- **Brand and class/type.** Exact match is pass. Same letters, different capitalization (`STONE'S THROW` vs `Stone's Throw`) is needs review. Dave said that needs judgment. Extra spaces or punctuation that disappear after normalize is pass. Low similarity is fail.
- **ABV and net contents.** Numbers are parsed (`45% Alc./Vol.` is `45`, `750 mL` is `750`). An unreadable number is needs review, not fail.
- **Unreadable photo.** If extraction comes back blank, every field is needs review and the banner asks for a better image.

## Assumptions

- Proof of concept only. Marcus said not to integrate with COLA.
- Nothing sensitive is stored. Photos and application text live in memory for the request, then they are discarded.
- **OpenAI and live data.** This prototype calls the OpenAI API. Before it ran on real applications, TTB would need a zero data retention (ZDR) agreement so images and text are not kept or used for training. Until that exists, treat the cloud path as a demo. Tesseract is the path that never leaves the host.
- **Batch is not a file upload.** Agents add each photo and its application text, then click Process labels.
- Agents work in COLA and can copy a screenshot. File upload is still there for a saved PNG.
- Application text is pasted. A printed PDF is something you copy from, not a daily report the API splits apart.
- Reviewers will use the files in `samples/` to try the product.

## Limitations

- Bold on the warning is only checked when OpenAI Vision ran.
- Tesseract is weaker on huge bold type, glare, and steep angles. OpenAI is better there, and still not perfect.
- The first Tesseract call after process start can be slow. The API warms a worker on listen.
- The live API is on a free Render box. The first request after it sleeps can take 30–60 seconds. After that, labels are back under five seconds.
- There is no user account, audit log, or retention policy beyond "do not store."
- The API allows CORS from any origin so a separately hosted frontend can call it. Fine for a prototype, not for production.

## Test labels

Use the PNG as the photo. Paste the matching `.txt` as the application.

- `old-tom`: clean match with a bold government warning, should pass
- `stones-throw`: brand capitalization differs, should need review
- `warning-titlecase`: warning is not all caps, should fail
- `non-bold-text`: warning is the statutory wording in regular weight, should fail
- `hard-to-read`: dark or angled Old Tom. OpenAI usually reads it. Tesseract often cannot.

## Local run

See [README.md](README.md). Two terminals: `cd api && npm run dev`, then `cd frontend && npm run dev`. Optional `OPENAI_API_KEY` in `api/.env`. Frontend only needs `VITE_API_URL`.
