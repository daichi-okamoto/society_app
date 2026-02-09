import { useState } from "react";
import { api } from "../../lib/api";

export default function Payment() {
  const [entryId, setEntryId] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const data = await api.post("/payments/stripe/checkout", { tournament_entry_id: entryId });
      if (data?.checkout_url) {
        window.location.assign(data.checkout_url);
      } else {
        setMessage("決済リンクを取得しました");
      }
    } catch {
      setError("決済の開始に失敗しました");
    }
  };

  return (
    <section>
      <h1>決済</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="entry-id">申込ID</label>
          <input id="entry-id" value={entryId} onChange={(e) => setEntryId(e.target.value)} />
        </div>
        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
        <button type="submit">決済へ進む</button>
      </form>
    </section>
  );
}
