import { useEffect, useState } from "react";

interface Props {
  title?: string;
}

export function CheckingStatus({ title = "Checking this label" }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="checking" role="status" aria-live="polite">
      <div className="checking-meter" aria-hidden="true">
        <span className="checking-meter-fill" />
      </div>
      <p className="checking-title">
        {title}… {seconds}s
      </p>
      <p className="checking-copy">Reading the photo and matching it to the application.</p>
    </div>
  );
}
