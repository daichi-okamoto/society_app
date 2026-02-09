import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function TeamNew() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await api.post("/teams", { name });
      navigate(`/teams/${data.team.id}`);
    } catch (err) {
      setError("チーム作成に失敗しました");
    }
  };

  return (
    <section>
      <h1>チーム作成</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="team-name">チーム名</label>
          <input id="team-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">作成</button>
      </form>
    </section>
  );
}
