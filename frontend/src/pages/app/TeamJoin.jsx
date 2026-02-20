import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function TeamJoin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await api.post(`/teams/${id}/join-requests`, { join_code: joinCode });
      navigate(`/teams/${id}`, {
        state: { flash: { type: "success", message: "参加申請を送信しました。" } },
      });
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
          <input id="join-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="例: TS-123456" />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">申請</button>
      </form>
    </section>
  );
}
