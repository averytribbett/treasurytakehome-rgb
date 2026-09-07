# Approach, tools, and assumptions

Label Check is a standalone prototype for TTB compliance agents. An agent adds a label photo and the matching application text. The API reads the photo, pulls the expected fields out of the paste, and scores each field as pass, needs review, or fail. The tool recommends. The agent decides.

The assignment asked for a working core, not a COLA rebuild. There is no database, no login, and no COLA integration.

## Approach

The product is two pages after a first-choice landing.

- One label: one photo and one application paste. Compare runs when both are present.
- A batch: the same pair, repeated. Add another starts the next pair so each photo stays matched with its own text. Checking waits until **Process labels**.

That batch shape is intentional. The assignment never described a daily report, a spreadsheet, or image URLs. This prototype assumes agents still pair each photo with its application text by hand. Peak season arrives as a pile of COLA records, so the UI copies that: add a pair, add another, then Process labels.

Compare is a shared service, not a second product. The frontend is a Vite React app. The API is Express. They run as two processes. The browser calls `POST /api/compare`. There is no extract endpoint. Extraction lives inside compare.

Images can come from a file or from the clipboard. COLA is on-screen software. Agents often copy a screenshot and never save a PNG.

## Tools

The email asked for tools used. This includes the stack and the editor.

| Piece | Choice | Why |
| --- | --- | --- |
| Editor | Cursor | AI-assisted development. Used to write, refactor, and test the prototype faster while keeping the product decisions human. |
| Language | TypeScript, Node 20 | One language on the client and the server. Typed compare rules. |
| Frontend | Vite, React 19, React Router | Small SPA with two obvious paths: one label and a batch. |
| API | Express, multer | File upload and a small HTTP surface. Easy to host on a Node box. |
| Vision | OpenAI `gpt-5.6-luna` when `OPENAI_API_KEY` is set | Better at angled, dark, or glare-heavy labels than raw OCR. |
| Fallback | Tesseract.js on the API | Works if the cloud call fails or the key is missing. |
| Compare | Deterministic TypeScript | Agents can explain a verdict without trusting a model to score. |
| Tests | Vitest on the API | Compare rules and parsers stay pinned. |
| Samples | PNG plus matching `.txt` in `samples/` | Reviewers can test from files in the repo. |
| Source control | Git, GitHub | Deliverable 1 is a repository they can clone. |

Cursor was used as an AI pair programmer: scaffolding, UI copy, tests, and iteration on the batch flow. The scoring rules, the pair-by-hand batch assumption, the ZDR note, and the "tool recommends, agent decides" stance came from the stakeholder notes, not from the model. That split matters for an AI specialist role. The product uses AI to read a label. It does not use AI to decide pass or fail.

The OpenAI key stays in `api/.env`. It is never sent to Vite. Marcus's notes said the network may block cloud ML. If the OpenAI call fails, the API falls back to Tesseract and still returns a result.

## How a check runs

1. The agent adds a photo and pastes application text (a COLA dump or text copied from a PDF).
2. `parseApplicationText` reads labeled keys such as `Brand name:` and falls back to the same heuristics used on OCR text. `GOVERNMENT WARNING:` is not treated as a field key, so the prefix stays on the expected warning.
3. `extractFromImage` tries OpenAI Vision, then Tesseract.
4. `compareFields` scores brand, class/type, ABV, net contents, and the government warning.
5. Overall is the worst field: fail beats needs review beats pass.

Single checks often finish near Sarah's five second bar when OpenAI is warm. A batch of several labels will take longer than five seconds. The UI does not hide that. One label shows a checking panel with a running timer. A batch keeps a sticky bar that names the pair in progress (`Checking label 2 of 4`) and lists each pair as not started, checking, pass, needs review, fail, or error.

`Process labels` starts the check for every pair that has a photo and application text. It runs them one after another. The batch page keeps a progress list. Fail and needs-review reasons show in parentheses next to the status. It does not open the full field table for each pair.

## Compare rules

These match the interview notes more than a generic fuzzy match.

- **Government warning.** Exact text after whitespace collapse. The words `GOVERNMENT WARNING` on the label must be all caps. Jenny's title-case example is a fail. When OpenAI Vision ran, `warningBold` is also checked: not bold is a fail. Tesseract cannot see stroke weight, so that path passes the text check and says bold could not be checked.
- **Brand and class/type.** Exact match is pass. Same letters, different capitalization (`STONE'S THROW` vs `Stone's Throw`) is needs review, because Dave said that needs judgment. Extra spaces or punctuation that disappear after normalize is pass. Low similarity is fail.
- **ABV and net contents.** Numbers are parsed (`45% Alc./Vol.` is `45`, `750 mL` is `750`). An unreadable number is needs review, not fail.
- **Unreadable photo.** If extraction is blank, every field is needs review and the banner asks for a better image.

## Assumptions

- This is a proof of concept, not a COLA feature. Marcus said not to integrate with COLA.
- Nothing sensitive is stored. Photos and application text live in memory for the request, then are discarded.
- **OpenAI and live data.** The prototype calls the OpenAI API. Before this ran on real applications, TTB would sign a zero data retention (ZDR) agreement so label images and application text are not retained or used to train models. Until that paper exists, treat the cloud path as a demo only. Local Tesseract is the path that never leaves the host.
- **Batch is not a file upload.** The assignment did not give a batch file format. Agents add each photo and its application text, then click Process labels.
- Agents work in COLA and can copy a screenshot. File upload is still there for a saved PNG.
- Application text is pasted. A printed PDF is something you copy from, not a magic daily report the API splits apart.
- Reviewers will use the files in `samples/` to try the product.

## Limitations

- Bold on the warning is only checked when OpenAI Vision ran. Tesseract has no font-weight signal, so that path cannot fail a regular-weight warning.
- Tesseract is weaker on huge bold type, glare, and steep angles. OpenAI is better there, and still not perfect.
- The first Tesseract call after process start can be slow. The API warms a worker on listen.
- There is no user account, audit log, or retention policy beyond "do not store."
- The API allows CORS from any origin so a separately hosted frontend can call it. That is fine for a prototype, not for production.

## Test labels

Use the PNG as the photo. Paste the matching `.txt` as the application.

- `old-tom`: clean match with a bold government warning, should pass
- `stones-throw`: brand capitalization differs, should need review
- `warning-titlecase`: warning is not all caps, should fail
- `non-bold-text`: warning is the statutory wording in regular weight, should fail
- `hard-to-read`: dark or angled Old Tom. OpenAI usually reads it. Tesseract often cannot.

## Local run

See [README.md](README.md). Two terminals: `cd api && npm run dev`, then `cd frontend && npm run dev`. Optional `OPENAI_API_KEY` in `api/.env`. Frontend only needs `VITE_API_URL`.
