import type { CheckResult } from "../types";
import { verdictWord } from "../lib";

interface Props {
  result: CheckResult;
}

export function Results({ result }: Props) {
  const seconds = (result.elapsedMs / 1000).toFixed(1);
  const engine = result.engine === "openai" ? "OpenAI Vision" : "Tesseract (local)";

  return (
    <section>
      <div className={`banner ${result.overall}`}>
        <h2>{verdictWord(result.overall)}</h2>
        <p>
          {result.unreadable
            ? "Could not read the label clearly. Ask for a better image."
            : "This is a recommendation. You still decide."}
        </p>
      </div>
      <p className="meta">
        Checked in {seconds} seconds with {engine}.
      </p>
      <table className="results">
        <thead>
          <tr>
            <th>Field</th>
            <th>Application</th>
            <th>Label</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {result.fields.map((row) => (
            <tr key={row.field}>
              <td>
                <strong>{row.label}</strong>
                <div className="hint">{row.reason}</div>
              </td>
              <td>{row.expected || "-"}</td>
              <td>{row.found || "-"}</td>
              <td>
                <span className={`stamp ${row.verdict}`}>{verdictWord(row.verdict)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
