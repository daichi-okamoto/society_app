import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMatches from "./AdminMatches";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
}));

describe("AdminMatches", () => {
  it("renders empty state and creates one match", async () => {
    api.get
      .mockResolvedValueOnce({
        tournament: {
          id: 1,
          name: "大会A",
          event_date: "2026-03-29",
          start_time: "09:00",
          end_time: "16:00",
          description: "グループ設定:\n- Aグループ: ★★\n- Bグループ: ★★★",
        },
      })
      .mockResolvedValueOnce({ teams: [{ id: 10, name: "FC A" }, { id: 11, name: "FC B" }] })
      .mockResolvedValueOnce({
        entries: [
          { id: 1, tournament_id: 1, team_id: 10, status: "approved" },
          { id: 2, tournament_id: 1, team_id: 11, status: "approved" },
        ],
      })
      .mockResolvedValueOnce({ matches: [] })
      .mockResolvedValueOnce({
        matches: [
          {
            id: 1,
            home_team_id: 10,
            away_team_id: 11,
            home_team_name: "FC A",
            away_team_name: "FC B",
            kickoff_at: "2026-03-29T10:00:00+09:00",
            field: "グループA",
            status: "scheduled",
            result: null,
          },
        ],
      });
    api.post.mockResolvedValueOnce({ match: { id: 1 } });

    render(
      <MemoryRouter initialEntries={["/admin/matches?tournamentId=1"]}>
        <AdminMatches />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("試合が登録されていません")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /試合を追加する/ }));

    fireEvent.change(screen.getByLabelText("ホーム"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("アウェイ"), { target: { value: "11" } });
    fireEvent.change(screen.getByLabelText("キックオフ"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText("コート"), { target: { value: "Aコート" } });
    fireEvent.click(screen.getByRole("button", { name: "変更を保存して反映" }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith("/tournaments/1/matches", expect.objectContaining({ home_team_id: 10, away_team_id: 11 }));
  });
});
