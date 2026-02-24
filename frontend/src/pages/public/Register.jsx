import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";
import AuthScaffold from "../../components/auth/AuthScaffold";
import AuthGoogleButton from "../../components/auth/AuthGoogleButton";
import AuthDivider from "../../components/auth/AuthDivider";
import { parseValidationError } from "../../lib/apiErrors";

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
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

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
    } catch (err) {
      if (err?.status === 422) {
        const { fieldErrors: parsed, summary } = parseValidationError(err);
        setFieldErrors(parsed);
        setError(summary);
        return;
      }
      setError("登録に失敗しました。しばらくしてから再度お試しください");
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
            className={fieldErrors.email ? "is-invalid" : ""}
          />
          {fieldErrors.email ? <p className="login-sp-field-error">{fieldErrors.email}</p> : null}
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
            className={fieldErrors.password ? "is-invalid" : ""}
          />
          {fieldErrors.password ? <p className="login-sp-field-error">{fieldErrors.password}</p> : null}
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
            className={fieldErrors.passwordConfirm ? "is-invalid" : ""}
          />
          {fieldErrors.passwordConfirm ? <p className="login-sp-field-error">{fieldErrors.passwordConfirm}</p> : null}
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
