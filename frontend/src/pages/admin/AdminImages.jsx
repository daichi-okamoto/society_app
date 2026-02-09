import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminImages() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    file_url: "",
    file_name: "",
    content_type: "image/jpeg",
    size_bytes: ""
  });

  useEffect(() => {
    api
      .get("/tournaments")
      .then((data) => {
        const list = data?.tournaments || [];
        setTournaments(list);
        if (list[0]) setSelectedTournamentId(String(list[0].id));
      })
      .catch(() => setError("大会一覧の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;
    setError(null);
    api
      .get(`/tournaments/${selectedTournamentId}/images`)
      .then((data) => setImages(data?.images || []))
      .catch(() => setError("画像一覧の取得に失敗しました"));
  }, [selectedTournamentId]);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/tournaments/${selectedTournamentId}/images`, {
        ...form,
        size_bytes: Number(form.size_bytes)
      });
      setForm({ file_url: "", file_name: "", content_type: "image/jpeg", size_bytes: "" });
      const data = await api.get(`/tournaments/${selectedTournamentId}/images`);
      setImages(data?.images || []);
    } catch {
      setError("画像のアップロードに失敗しました");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    setError(null);
    try {
      await api.del(`/tournament_images/${id}`);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      setError("画像の削除に失敗しました");
    }
  };

  if (loading) return <section>読み込み中...</section>;

  return (
    <section>
      <h1>画像管理</h1>
      {error && <p>{error}</p>}

      <div>
        <label htmlFor="tournament-select">大会</label>
        <select
          id="tournament-select"
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <h2>画像一覧</h2>
      {images.length === 0 ? (
        <p>画像がありません。</p>
      ) : (
        <ul>
          {images.map((img) => (
            <li key={img.id}>
              {img.file_name}{" "}
              <button type="button" onClick={() => onDelete(img.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>画像アップロード</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="img-url">URL</label>
          <input id="img-url" value={form.file_url} onChange={onChange("file_url")} />
        </div>
        <div>
          <label htmlFor="img-name">ファイル名</label>
          <input id="img-name" value={form.file_name} onChange={onChange("file_name")} />
        </div>
        <div>
          <label htmlFor="img-type">MIME</label>
          <input id="img-type" value={form.content_type} onChange={onChange("content_type")} />
        </div>
        <div>
          <label htmlFor="img-size">サイズ</label>
          <input id="img-size" value={form.size_bytes} onChange={onChange("size_bytes")} />
        </div>
        <button type="submit">アップロード</button>
      </form>
    </section>
  );
}
