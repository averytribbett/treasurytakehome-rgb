import { Link, Route, Routes } from "react-router-dom";
import { BatchPage } from "./pages/Batch";
import { HomePage } from "./pages/Home";
import { ReviewPage } from "./pages/Review";

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="wordmark" to="/">
          Label Check
        </Link>
        <p>TTB label review helper</p>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/batch" element={<BatchPage />} />
      </Routes>
    </div>
  );
}
