import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareLabel } from "./services/compareService.js";
import { parseApplicationText } from "./services/parseApplicationService.js";
import { warmupOcr } from "./services/extractService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.post("/api/compare", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Add a label image first." });
      return;
    }

    const result = await compareLabel(
      req.file.buffer,
      req.file.mimetype || "image/png",
      parseApplicationText(String(req.body?.applicationText ?? "")),
    );
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not compare this label.";
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API http://localhost:${port}`);
  void warmupOcr();
});
