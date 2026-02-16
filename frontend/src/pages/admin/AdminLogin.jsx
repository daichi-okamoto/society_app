import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await login({ email, password });
      if (!user || user.role !== "admin") {
        await logout();
        setError("管理者アカウントでログインしてください");
        return;
      }
      navigate("/admin", { replace: true });
    } catch {
      setError("ログインに失敗しました");
    }
  };

  return (
    <div className="adlogin-root">
      <div className="adlogin-panel">
        <div className="adlogin-head">
          <div className="adlogin-logo">T</div>
          <h1>管理者ログイン</h1>
          <p>運営管理ダッシュボードへアクセス</p>
        </div>

        <form className="adlogin-form" onSubmit={handleSubmit}>
          <div className="adlogin-field">
            <label htmlFor="admin-login-email">メールアドレス</label>
            <div className="adlogin-input-wrap">
              <span className="material-symbols-outlined">mail</span>
              <input
                id="admin-login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="adlogin-field">
            <label htmlFor="admin-login-password">パスワード</label>
            <div className="adlogin-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="admin-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="adlogin-toggle"
                aria-label="パスワード表示切替"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <span className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          </div>

          {error ? <p className="adlogin-error">{error}</p> : null}

          <button type="submit" className="adlogin-submit">
            ログイン
          </button>
        </form>

        <div className="adlogin-divider">
          <span>または</span>
        </div>

        <button type="button" className="adlogin-google-btn">
          <img
            alt="Google logo"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpLuO3AxcrdhNM-_F80qPVD29mBqCYg_FTzOSQz6gtf-BU6JtzfQuYzyF4IdiZh6LweIPdmJtW3S4rnvby3rRWYAehWW2P9BSNb1zN62JWZK5Jmxv0KMro4g0-aNfgswwGSJ6qgeZje1enye3BoYMD81GbQVpku1JCQTrtWfvwwpjRY-rOyDOgwTM1XEa6YYoSNdzmO_-zELS35rzLlhDYKscI2Eo0PbzHzHu2MUkZvL6NwuUHFvQBARXjEtUnqgMkZrGQDyX5iPks"
          />
          <span>Googleでログイン</span>
        </button>

        <div className="adlogin-foot-links">
          <button type="button">パスワードを忘れた場合</button>
          <p>
            <span>アカウントをお持ちでないですか？</span>
            <Link to="/admin/register">管理者登録はこちら</Link>
          </p>
        </div>

        <footer className="adlogin-copyright">© 2024 Tokyo Sevens Cup Admin. All rights reserved.</footer>
      </div>
    </div>
  );
}
