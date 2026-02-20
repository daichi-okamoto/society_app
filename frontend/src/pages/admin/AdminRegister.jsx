import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";

function buildProfileFromEmail(email) {
  const localPart = (email || "admin").split("@")[0] || "admin";
  const baseName = localPart.replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龯]/g, "").slice(0, 20) || "管理者";

  return {
    name: `${baseName} 管理者`,
    name_kana: "かんりしゃ",
    birth_date: "1990-01-01",
    phone: "0000000000",
    address: ""
  };
}

export default function AdminRegister() {
  const navigate = useNavigate();
  const { registerAdmin } = useAuthActions();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    adminInviteCode: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("パスワード確認が一致しません");
      return;
    }

    if (!form.adminInviteCode.trim()) {
      setError("管理者招待コードを入力してください");
      return;
    }

    try {
      const profile = buildProfileFromEmail(form.email);
      await registerAdmin({
        ...profile,
        email: form.email,
        password: form.password,
        admin_invite_code: form.adminInviteCode
      });
      navigate("/admin", {
        replace: true,
        state: { flash: { type: "success", message: "管理者アカウントを登録しました。" } },
      });
    } catch (err) {
      if (err?.status === 401) {
        setError("管理者招待コードが正しくありません");
        return;
      }
      setError("管理者登録に失敗しました");
    }
  };

  return (
    <div className="adlogin-root">
      <div className="adlogin-panel">
        <div className="adlogin-head">
          <div className="adlogin-logo">T</div>
          <h1>管理者登録</h1>
          <p>運営管理ダッシュボード用アカウントを作成</p>
        </div>

        <form className="adlogin-form" onSubmit={onSubmit}>
          <div className="adlogin-field">
            <label htmlFor="admin-register-email">メールアドレス</label>
            <div className="adlogin-input-wrap">
              <span className="material-symbols-outlined">mail</span>
              <input
                id="admin-register-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={onChange}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="adlogin-field">
            <label htmlFor="admin-register-password">パスワード</label>
            <div className="adlogin-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="admin-register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={onChange}
                placeholder="8文字以上の英数字"
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

          <div className="adlogin-field">
            <label htmlFor="admin-register-password-confirm">パスワード（確認）</label>
            <div className="adlogin-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="admin-register-password-confirm"
                name="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                required
                value={form.passwordConfirm}
                onChange={onChange}
                placeholder="もう一度入力してください"
              />
              <button
                type="button"
                className="adlogin-toggle"
                aria-label="パスワード確認表示切替"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
              >
                <span className="material-symbols-outlined">{showPasswordConfirm ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          </div>

          <div className="adlogin-field">
            <label htmlFor="admin-invite-code">管理者招待コード</label>
            <div className="adlogin-input-wrap">
              <span className="material-symbols-outlined">vpn_key</span>
              <input
                id="admin-invite-code"
                name="adminInviteCode"
                type="text"
                required
                value={form.adminInviteCode}
                onChange={onChange}
                placeholder="招待コードを入力"
              />
            </div>
          </div>

          {error ? <p className="adlogin-error">{error}</p> : null}

          <button type="submit" className="adlogin-submit">
            管理者登録
          </button>
        </form>

        <div className="adlogin-foot-links">
          <p>
            <span>すでにアカウントをお持ちですか？</span>
            <Link to="/admin/login">管理者ログインはこちら</Link>
          </p>
        </div>

        <footer className="adlogin-copyright">© 2024 Tokyo Sevens Cup Admin. All rights reserved.</footer>
      </div>
    </div>
  );
}
