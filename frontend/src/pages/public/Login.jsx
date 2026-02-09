import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";

export default function Login() {
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate("/tournaments");
    } catch (err) {
      setError("ログインに失敗しました");
    }
  };

  return (
    <section>
      <h1>ログイン</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="login-email">メール</label>
          <input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="login-password">パスワード</label>
          <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">ログイン</button>
      </form>
    </section>
  );
}
