import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

export default function AdminImages() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const refreshImages = async () => {
    const data = await api.get(`/tournaments/${selectedTournamentId}/images`);
    setImages(data?.images || []);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedFile) {
      setError("アップロードする画像を選択してください");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploaded = await api.postForm("/uploads/direct", formData);
      const contentType = uploaded.content_type || selectedFile.type || "application/octet-stream";

      await api.post(`/tournaments/${selectedTournamentId}/images`, {
        file_url: uploaded.public_url,
        file_name: uploaded.file_name || selectedFile.name,
        content_type: contentType,
        size_bytes: Number(uploaded.size_bytes || selectedFile.size),
      });
      setSelectedFile(null);
      await refreshImages();
    } catch (e) {
      const code = e?.data?.error?.code;
      if (code === "r2_not_configured") {
        setError("R2の設定が未完了です。環境変数を確認してください");
      } else if (code === "r2_upload_failed") {
        setError("R2へのアップロードに失敗しました");
      } else {
        setError("画像のアップロードに失敗しました");
      }
    } finally {
      setUploading(false);
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

  if (loading) return <LoadingScreen />;

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
          <label htmlFor="img-file">画像ファイル</label>
          <input
            id="img-file"
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </div>
        {selectedFile ? (
          <p>
            選択中: {selectedFile.name} ({selectedFile.size} bytes)
          </p>
        ) : null}
        <button type="submit" disabled={uploading}>
          {uploading ? "アップロード中..." : "アップロード"}
        </button>
      </form>
    </section>
  );
}
