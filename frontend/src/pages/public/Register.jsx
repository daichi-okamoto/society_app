import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";
import AuthScaffold from "../../components/auth/AuthScaffold";
import AuthGoogleButton from "../../components/auth/AuthGoogleButton";
import AuthDivider from "../../components/auth/AuthDivider";

function buildProfileFromEmail(email) {
  const localPart = (email || "new_user").split("@")[0] || "new_user";
  const baseName = localPart.replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龯]/g, "").slice(0, 20) || "新規ユーザー";

  return {
    name: baseName,
    name_kana: "みとうろく",
    birth_date: "2000-01-01",
    phone: "0000000000",
    address: ""
  };
}

export default function Register() {
  const { register } = useAuthActions();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [error, setError] = useState(null);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("パスワード確認が一致しません");
      return;
    }

    try {
      const profile = buildProfileFromEmail(form.email);
      await register({
        ...profile,
        email: form.email,
        password: form.password
      });
      navigate("/app/home", { state: { flash: { type: "success", message: "アカウントを作成しました。" } } });
    } catch {
      setError("登録に失敗しました");
    }
  };

  return (
    <AuthScaffold
      title="新しく始める"
      subtitle="J7 Soccer アカウントを作成"
      termsLead="登録することで"
      panelClassName="register-panel"
      afterForm={
        <div className="register-login-link">
          <Link to="/login">すでにアカウントをお持ちの方はこちら</Link>
        </div>
      }
    >
      <form className="login-sp-form register-form" onSubmit={onSubmit}>
        <div className="login-sp-field">
          <label htmlFor="reg-email">メールアドレス</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            placeholder="example@j7soccer.com"
            value={form.email}
            onChange={onChange}
          />
        </div>

        <div className="login-sp-field">
          <label htmlFor="reg-password">パスワード</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            placeholder="8文字以上の英数字"
            value={form.password}
            onChange={onChange}
          />
        </div>

        <div className="login-sp-field">
          <label htmlFor="reg-password-confirm">パスワード（確認）</label>
          <input
            id="reg-password-confirm"
            name="passwordConfirm"
            type="password"
            placeholder="もう一度入力してください"
            value={form.passwordConfirm}
            onChange={onChange}
          />
        </div>

        {error && <p className="login-sp-error">{error}</p>}

        <button type="submit" className="login-sp-submit">
          アカウントを作成
        </button>

        <AuthDivider />
        <AuthGoogleButton label="Googleで登録" />
      </form>
    </AuthScaffold>
  );
}
