import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";
import AuthScaffold from "../../components/auth/AuthScaffold";
import AuthGoogleButton from "../../components/auth/AuthGoogleButton";
import AuthDivider from "../../components/auth/AuthDivider";

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
      navigate("/app/home");
    } catch (err) {
      setError("ログインに失敗しました");
    }
  };

  return (
    <AuthScaffold title="おかえりなさい" subtitle="J7 Soccer リーグへようこそ" termsLead="ログインすることで">
        <form className="login-sp-form" onSubmit={onSubmit}>
          <div className="login-sp-field">
            <label htmlFor="login-email">メールアドレス</label>
            <input
              id="login-email"
              type="email"
              placeholder="example@j7soccer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-sp-field">
            <label htmlFor="login-password">パスワード</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-sp-help">
            <button type="button">パスワードを忘れた場合</button>
          </div>

          {error && <p className="login-sp-error">{error}</p>}

          <button type="submit" className="login-sp-submit">
            ログイン
          </button>

          <AuthDivider />

          <AuthGoogleButton label="Googleでログイン" />

          <div className="login-sp-register">
            <span>アカウントをお持ちでない方</span>
            <Link to="/register">新規登録はこちら</Link>
          </div>
        </form>
    </AuthScaffold>
  );
}
