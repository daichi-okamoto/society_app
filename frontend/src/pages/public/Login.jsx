import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";
import AuthScaffold from "../../components/auth/AuthScaffold";
import AuthGoogleButton from "../../components/auth/AuthGoogleButton";
import AuthDivider from "../../components/auth/AuthDivider";

export default function Login() {
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const oauthError = searchParams.get("oauth_error");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate("/app/home", { state: { flash: { type: "success", message: "ログインしました。" } } });
    } catch (err) {
      setError("ログインに失敗しました");
    }
  };

  return (
    <AuthScaffold title="おかえりなさい" subtitle="高森ソサイチへようこそ" termsLead="ログインすることで">
        <form className="login-sp-form" onSubmit={onSubmit}>
          <div className="login-sp-field">
            <label htmlFor="login-email">メールアドレス</label>
            <div className="login-sp-input-wrap">
              <span className="material-symbols-outlined">mail</span>
              <input
                id="login-email"
                type="email"
                placeholder="example@j7soccer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-sp-field">
            <label htmlFor="login-password">パスワード</label>
            <div className="login-sp-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-sp-toggle"
                aria-label="パスワード表示切替"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <span className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          </div>

          <div className="login-sp-help">
            <button type="button">パスワードを忘れた場合</button>
          </div>

          {(error || oauthError) && (
            <p className="login-sp-error">{error || "Googleログインに失敗しました。もう一度お試しください。"}</p>
          )}

          <button type="submit" className="login-sp-submit">
            ログイン
          </button>

          <AuthDivider />

          <AuthGoogleButton label="Googleでログイン" successMessage="Googleアカウントでログインしました。" />

          <div className="login-sp-register">
            <span>アカウントをお持ちでない方</span>
            <Link to="/register">新規登録はこちら</Link>
          </div>
        </form>
    </AuthScaffold>
  );
}
