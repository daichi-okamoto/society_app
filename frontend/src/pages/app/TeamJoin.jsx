import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function TeamJoin() {
  const { id } = useParams();
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.post(`/teams/${id}/join-requests`, { join_code: joinCode });
      setMessage("申請しました。代表の承認をお待ちください。");
    } catch (err) {
      setError("参加申請に失敗しました");
    }
  };

  return (
    <section>
      <h1>参加コード入力</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="join-code">参加コード</label>
          <input id="join-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
        </div>
        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
        <button type="submit">申請</button>
      </form>
    </section>
  );
}
