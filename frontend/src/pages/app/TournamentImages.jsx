import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function TournamentImages() {
  const { id } = useParams();
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 12;

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${id}/images`)
      .then((data) => {
        if (!active) return;
        setImages(data?.images || []);
        setPage(1);
      })
      .catch(() => {
        if (!active) return;
        setError("画像の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <section>読み込み中...</section>;
  if (error) return <section>{error}</section>;

  const totalPages = Math.max(1, Math.ceil(images.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageItems = images.slice(startIndex, startIndex + pageSize);

  return (
    <section>
      <h1>大会画像ギャラリー</h1>
      {images.length === 0 ? (
        <p>画像はまだありません。</p>
      ) : (
        <div className="image-grid">
          {pageItems.map((img) => (
            <div className="image-card" key={img.id}>
              <img
                src={img.download_url}
                alt={img.file_name}
                className="image-thumb"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="image-meta">
                <span>{img.file_name}</span>
                <a href={img.download_url} target="_blank" rel="noreferrer">
                  ダウンロード
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      {images.length > pageSize && (
        <div className="pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            前へ
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            次へ
          </button>
        </div>
      )}
    </section>
  );
}
