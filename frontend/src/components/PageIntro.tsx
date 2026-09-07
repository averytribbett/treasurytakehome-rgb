import { Link } from "react-router-dom";

interface Props {
  title: string;
  children: React.ReactNode;
}

export function PageIntro({ title, children }: Props) {
  return (
    <>
      <Link className="back" to="/">
        Back to start
      </Link>
      <h1 className="page-title">{title}</h1>
      <p className="page-copy">{children}</p>
    </>
  );
}
