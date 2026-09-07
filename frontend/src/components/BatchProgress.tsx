import type { LabelCheckReport } from "./LabelCheck";
import { statusReason, verdictWord } from "../lib";

interface Slot {
  id: string;
}

interface Props {
  slots: Slot[];
  reports: Record<string, LabelCheckReport>;
}

function statusLabel(report: LabelCheckReport | undefined): string {
  if (report?.busy) return "Checking";
  if (report?.error) return `Error (${report.error})`;
  if (!report?.result) return "Not started";
  const word = verdictWord(report.result.overall);
  const reason = statusReason(report.result);
  return reason ? `${word} (${reason})` : word;
}

function statusClass(report: LabelCheckReport | undefined): string {
  if (report?.busy) return "is-checking";
  if (report?.error) return "is-fail";
  if (report?.result) return `is-${report.result.overall}`;
  return "is-idle";
}

export function BatchProgress({ slots, reports }: Props) {
  const total = slots.length;
  const finished = slots.filter((slot) => {
    const report = reports[slot.id];
    return Boolean(report?.result || report?.error);
  }).length;
  const checkingIndexes = slots
    .map((slot, index) => (reports[slot.id]?.busy ? index + 1 : null))
    .filter((index): index is number => index !== null);
  const busyCount = checkingIndexes.length;

  if (finished === 0 && busyCount === 0) return null;

  const headline =
    busyCount === 0
      ? `Finished ${finished} of ${total}`
      : busyCount === 1
        ? `Checking label ${checkingIndexes[0]} of ${total}`
        : `Checking ${busyCount} labels (${finished} of ${total} done)`;

  const percent = total === 0 ? 0 : Math.round((finished / total) * 100);

  return (
    <div className="batch-progress" role="status" aria-live="polite">
      <p className="batch-progress-title">{headline}</p>
      <p className="batch-progress-copy">
        {busyCount > 0
          ? "Ready pairs run at the same time. This bar shows how the batch is going."
          : "Every pair that is ready has a result."}
      </p>
      <div className="batch-progress-track" aria-hidden="true">
        <span className="batch-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <ol className="batch-progress-list">
        {slots.map((slot, index) => {
          const report = reports[slot.id];
          return (
            <li key={slot.id} className={statusClass(report)}>
              <span>Label {index + 1}</span>
              <span>{statusLabel(report)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
