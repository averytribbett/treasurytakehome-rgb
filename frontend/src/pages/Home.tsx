import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main>
      <div className="home-lead">
        <h1>What do you want to check?</h1>
        <p>Pick one label or a whole stack. That is the only choice on this screen.</p>
      </div>
      <div className="doors">
        <Link className="door" to="/review">
          <h2>One label</h2>
          <p>Add one bottle photo, a file or a screenshot, and the application text.</p>
        </Link>
        <Link className="door" to="/batch">
          <h2>A batch</h2>
          <p>Add pairs, then Process labels. The status shows pass, fail, or needs review.</p>
        </Link>
      </div>
    </main>
  );
}
