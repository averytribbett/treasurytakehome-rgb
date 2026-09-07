import type { CheckResult } from "../types";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { statusReason, verdictWord } from "../lib";
import { compareLabel } from "../services/compareService";
import { ApplicationPaste } from "./ApplicationPaste";
import { ImageIntake } from "./ImageIntake";
import { CheckingStatus } from "./CheckingStatus";
import { Results } from "./Results";

export interface LabelCheckReport {
  file: File | null;
  applicationText: string;
  result: CheckResult | null;
  error: string;
  busy: boolean;
}

export interface LabelCheckHandle {
  run: () => Promise<CheckResult | null>;
}

interface Props {
  title?: string;
  windowPaste?: boolean;
  active?: boolean;
  autoCompare?: boolean;
  showResults?: boolean;
  onActivate?: () => void;
  onRemove?: () => void;
  onReport?: (report: LabelCheckReport) => void;
}

function readyToCompare(file: File | null, applicationText: string): file is File {
  return Boolean(file && applicationText.trim());
}

export const LabelCheck = forwardRef<LabelCheckHandle, Props>(function LabelCheck(
  {
    title,
    windowPaste,
    active,
    autoCompare = true,
    showResults = true,
    onActivate,
    onRemove,
    onReport,
  },
  ref,
) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [applicationText, setApplicationText] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<File | null>(null);
  const textRef = useRef("");
  const textTimer = useRef<number>(0);
  const requestId = useRef(0);
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    onReportRef.current?.({ file, applicationText, result, error, busy });
  }, [file, applicationText, result, error, busy]);

  function takeFile(next: File) {
    setFile(next);
    fileRef.current = next;
    setResult(null);
    setError("");
    setPreview(URL.createObjectURL(next));
    return next;
  }

  useImperativeHandle(ref, () => ({
    async run() {
      const image = fileRef.current;
      const text = textRef.current;
      if (!readyToCompare(image, text)) return null;
      return runCompare(image, text);
    },
  }));

  async function runCompare(image: File, text: string): Promise<CheckResult | null> {
    const mine = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const next = await compareLabel(image, text);
      if (mine !== requestId.current) return null;
      setResult(next);
      return next;
    } catch (err) {
      if (mine !== requestId.current) return null;
      setResult(null);
      setError(err instanceof Error ? err.message : "Could not check this label.");
      return null;
    } finally {
      if (mine === requestId.current) setBusy(false);
    }
  }

  async function onPick(next: File) {
    const chosen = takeFile(next);
    if (autoCompare && readyToCompare(chosen, applicationText)) {
      await runCompare(chosen, applicationText);
    }
  }

  function onText(next: string) {
    setApplicationText(next);
    textRef.current = next;
    if (!autoCompare) {
      setResult(null);
      setError("");
      return;
    }
    window.clearTimeout(textTimer.current);
    textTimer.current = window.setTimeout(() => {
      const image = fileRef.current;
      if (readyToCompare(image, next)) void runCompare(image, next);
    }, 400);
  }

  return (
    <section className={`label-slot ${busy ? "is-checking" : ""}`} aria-busy={busy}>
      {title || onRemove || busy ? (
        <div className="slot-head">
          {title ? <h2>{title}</h2> : busy ? <span className="stamp checking">Checking</span> : <span />}
          <div className="slot-head-actions">
            {busy && title ? <span className="stamp checking">Checking</span> : null}
            {!showResults && result && !busy ? (
              <span className={`slot-status stamp ${result.overall}`}>
                {verdictWord(result.overall)}
                {statusReason(result) ? ` (${statusReason(result)})` : ""}
              </span>
            ) : null}
            {onRemove ? (
              <button className="btn secondary" type="button" onClick={onRemove} disabled={busy}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {busy ? <CheckingStatus title={title ? `Checking ${title.toLowerCase()}` : "Checking this label"} /> : null}

      <div className="grid-2">
        <ImageIntake
          hasImage={Boolean(file)}
          disabled={busy}
          windowPaste={windowPaste}
          active={active}
          onActivate={onActivate}
          onImage={(file) => void onPick(file)}
        >
          {preview ? (
            <img src={preview} alt={title ? `${title} photo` : "Label you selected"} />
          ) : (
            <div>
              <strong>Add a label photo</strong>
              <span>Choose a file, or copy the label in COLA and paste it here (Ctrl+V or Cmd+V).</span>
            </div>
          )}
        </ImageIntake>
        <div className="panel">
          <ApplicationPaste value={applicationText} onChange={onText} />
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {showResults && result && !busy ? <Results result={result} /> : null}
    </section>
  );
});
