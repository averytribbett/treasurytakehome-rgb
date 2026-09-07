import { LabelCheck } from "../components/LabelCheck";
import { PageIntro } from "../components/PageIntro";

export function ReviewPage() {
  return (
    <main>
      <PageIntro title="Check one label">
        Add the label on the left, a saved file or a screenshot copied from COLA. Paste the application text on the
        right. Checking starts on its own and shows a timer while it runs.
      </PageIntro>
      <LabelCheck />
    </main>
  );
}
