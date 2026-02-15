import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import TournamentDetailUpcoming from "./TournamentDetailUpcoming";
import TournamentDetailLive from "./TournamentDetailLive";
import LoadingScreen from "../../components/LoadingScreen";

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [entryStatus, setEntryStatus] = useState(null);
  const [entryTeamId, setEntryTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${id}`)
      .then((data) => {
        if (!active) return;
        setTournament(data?.tournament || null);
      })
      .catch(() => {
        if (!active) return;
        setError("大会情報の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setEntryStatus(null);
      return;
    }
    let active = true;
    api
      .get(`/tournaments/${id}/entries/me`)
      .then((data) => {
        if (!active) return;
        setEntryStatus(data?.entry?.status || null);
        setEntryTeamId(data?.entry?.team_id || null);
      })
      .catch(() => {
        if (!active) return;
        setEntryStatus(null);
        setEntryTeamId(null);
      });

    return () => {
      active = false;
    };
  }, [id, user]);

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;
  if (!tournament) return <section>大会が見つかりません。</section>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tournamentDate = new Date(`${tournament.event_date}T00:00:00`);
  const isOngoing = tournamentDate.getTime() === today.getTime();

  if (isOngoing) {
    return <TournamentDetailLive tournament={tournament} entryStatus={entryStatus} entryTeamId={entryTeamId} />;
  }

  // エントリー済みでなければ、募集側の大会詳細デザインを表示する
  if (!entryStatus) {
    return <TournamentDetailUpcoming tournament={tournament} />;
  }

  return <TournamentDetailLive tournament={tournament} entryStatus={entryStatus} entryTeamId={entryTeamId} />;
}
