import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";

export default function Register() {
  const { register } = useAuthActions();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    name_kana: "",
    birth_date: "",
    phone: "",
    email: "",
    address: "",
    password: ""
  });
  const [error, setError] = useState(null);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(form);
      navigate("/tournaments");
    } catch (err) {
      setError("登録に失敗しました");
    }
  };

  return (
    <section>
      <h1>新規登録</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="reg-name">氏名</label>
          <input id="reg-name" name="name" value={form.name} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="reg-kana">ふりがな</label>
          <input id="reg-kana" name="name_kana" value={form.name_kana} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="reg-birth">生年月日</label>
          <input id="reg-birth" name="birth_date" type="date" value={form.birth_date} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="reg-phone">電話</label>
          <input id="reg-phone" name="phone" value={form.phone} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="reg-email">メール</label>
          <input id="reg-email" name="email" value={form.email} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="reg-address">住所</label>
          <input id="reg-address" name="address" value={form.address} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="reg-password">パスワード</label>
          <input id="reg-password" name="password" type="password" value={form.password} onChange={onChange} />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">登録</button>
      </form>
    </section>
  );
}
