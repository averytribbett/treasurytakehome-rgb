import type { LabelCheckHandle, LabelCheckReport } from "../components/LabelCheck";
import { useRef, useState } from "react";
import { BatchProgress } from "../components/BatchProgress";
import { LabelCheck } from "../components/LabelCheck";
import { PageIntro } from "../components/PageIntro";

interface Slot {
  id: string;
}

function newSlot(): Slot {
  return { id: crypto.randomUUID() };
}

export function BatchPage() {
  const [slots, setSlots] = useState<Slot[]>(() => [newSlot()]);
  const [activeId, setActiveId] = useState(slots[0].id);
  const [reports, setReports] = useState<Record<string, LabelCheckReport>>({});
  const [processing, setProcessing] = useState(false);
  const runners = useRef<Record<string, LabelCheckHandle | null>>({});

  function addAnother() {
    const slot = newSlot();
    setSlots((current) => [...current, slot]);
    setActiveId(slot.id);
  }

  function removeSlot(id: string) {
    setSlots((current) => {
      if (current.length === 1) return current;
      const next = current.filter((slot) => slot.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? "");
      return next;
    });
    setReports((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function pairReady(report: LabelCheckReport | undefined): boolean {
    return Boolean(report?.file && report.applicationText.trim());
  }

  async function processLabels() {
    const ready = slots.filter((slot) => pairReady(reports[slot.id]));
    if (ready.length === 0 || processing) return;
    setProcessing(true);
    try {
      for (const slot of ready) {
        await runners.current[slot.id]?.run();
      }
    } finally {
      setProcessing(false);
    }
  }

  const finished = slots.filter((slot) => {
    const report = reports[slot.id];
    return Boolean(report?.result || report?.error);
  }).length;
  const readyCount = slots.filter((slot) => pairReady(reports[slot.id])).length;
  const busy = processing || slots.some((slot) => reports[slot.id]?.busy);

  return (
    <main>
      <PageIntro title="Check a batch">
        Add each photo and its application text. Use Add another for the next pair. Process labels checks the batch. A
        batch takes longer than five seconds, so the bar at the top shows which label is running.
      </PageIntro>

      <BatchProgress slots={slots} reports={reports} />

      {slots.map((slot, index) => (
        <LabelCheck
          key={slot.id}
          ref={(handle) => {
            runners.current[slot.id] = handle;
          }}
          title={`Label ${index + 1}`}
          showResults={false}
          windowPaste={activeId === slot.id}
          active={activeId === slot.id}
          onActivate={() => setActiveId(slot.id)}
          onReport={(report) => setReports((current) => ({ ...current, [slot.id]: report }))}
          onRemove={slots.length > 1 ? () => removeSlot(slot.id) : undefined}
        />
      ))}

      <div className="actions batch-actions">
        <button className="btn secondary" type="button" onClick={addAnother} disabled={busy}>
          Add another
        </button>
        <button className="btn" type="button" onClick={() => void processLabels()} disabled={busy || readyCount === 0}>
          Process labels
        </button>
      </div>

      {finished > 0 ? (
        <p className="progress">
          Finished {finished} of {slots.length}.
        </p>
      ) : null}
    </main>
  );
}
