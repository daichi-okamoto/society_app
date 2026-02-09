import { Link } from "react-router-dom";

export default function MyPage() {
  return (
    <section>
      <h1>マイページ</h1>
      <p>
        <Link to="/notifications">通知センターへ</Link>
      </p>
    </section>
  );
}
