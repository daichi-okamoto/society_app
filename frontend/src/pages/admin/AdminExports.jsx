import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function formatDateLabel(value) {
  if (!value) return "日程未設定";
  const dt = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "日程未設定";
  return dt.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminExports() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/tournaments")
      .then((data) => {
        if (!active) return;
        setTournaments(data?.tournaments || []);
      })
      .catch(() => {
        if (!active) return;
        setError("大会一覧を取得できませんでした。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedTournament = useMemo(
    () => tournaments.find((item) => String(item.id) === String(selectedTournamentId)) || null,
    [selectedTournamentId, tournaments]
  );

  const downloadInsuranceCsv = async () => {
    if (downloading) return;

    setError("");
    setDownloading(true);
    try {
      const query = new URLSearchParams();
      if (selectedTournamentId) query.set("tournament_id", selectedTournamentId);
      const path = `/exports/insurance${query.toString() ? `?${query.toString()}` : ""}`;
      const response = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("download_failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedTournamentId ? `insurance_roster_t${selectedTournamentId}.csv` : "insurance_roster_all.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("CSV の出力に失敗しました。時間を置いて再度お試しください。");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="adexp-root">
      <header className="adexp-header">
        <div className="adexp-header-row">
          <button type="button" className="adexp-icon-btn" onClick={() => navigate(-1)} aria-label="back">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>データ出力</h1>
          <div className="adexp-header-spacer" aria-hidden="true" />
        </div>
      </header>

      <main className="adexp-main">
        <section className="adexp-panel">
          <div className="adexp-panel-head">
            <span className="material-symbols-outlined">download</span>
            <div>
              <h2>保険提出用 名簿 CSV</h2>
              <p>提出済み名簿を CSV 形式で出力します。大会を選ぶと対象を絞り込めます。</p>
            </div>
          </div>

          <label className="adexp-label" htmlFor="admin-export-tournament">
            対象大会
          </label>
          <div className="adexp-select-wrap">
            <select
              id="admin-export-tournament"
              value={selectedTournamentId}
              onChange={(event) => setSelectedTournamentId(event.target.value)}
              disabled={loading}
            >
              <option value="">すべての大会</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined">expand_more</span>
          </div>

          <div className="adexp-summary">
            <div>
              <span>出力対象</span>
              <strong>{selectedTournament ? selectedTournament.name : "すべての大会"}</strong>
            </div>
            <div>
              <span>日程</span>
              <strong>{selectedTournament ? formatDateLabel(selectedTournament.event_date) : "横断集計"}</strong>
            </div>
          </div>

          {error ? <p className="adexp-error">{error}</p> : null}

          <button type="button" className="adexp-download-btn" onClick={downloadInsuranceCsv} disabled={loading || downloading}>
            <span className="material-symbols-outlined">file_download</span>
            {downloading ? "出力中..." : "CSV をダウンロード"}
          </button>
        </section>
      </main>

      <AdminBottomNav />
    </div>
  );
}
