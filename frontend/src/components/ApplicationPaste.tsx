import { STATUTORY_WARNING } from "../types";

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function ApplicationPaste({ value, onChange }: Props) {
  return (
    <label className="paste-label">
      Application text
      <textarea
        value={value}
        onPaste={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Paste everything from the application or PDF.\n\nBrand name: OLD TOM DISTILLERY\nClass and type: Kentucky Straight Bourbon Whiskey\nAlcohol content: 45% Alc./Vol.\nNet contents: 750 mL\n\n${STATUTORY_WARNING}`}
      />
    </label>
  );
}
