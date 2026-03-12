import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminTournamentDetail from "./AdminTournamentDetail";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("AdminTournamentDetail", () => {
  it("renders dynamic tournament facts and teams", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/tournaments/1") {
        return Promise.resolve({
          tournament: {
            id: 1,
            name: "テスト大会",
            event_date: "2026-03-29",
            start_time: "09:00",
            end_time: "16:00",
            venue: "代々木フットサルパーク",
            max_teams: 16,
            active_entry_teams_count: 2,
            entry_fee_amount: 15000,
            description: "説明",
            rules: "ルール",
          },
        });
      }
      if (path === "/tournament_entries") {
        return Promise.resolve({
          entries: [
            { id: 10, tournament_id: 1, team_id: 101, status: "approved" },
            { id: 11, tournament_id: 1, team_id: 102, status: "pending" },
            { id: 12, tournament_id: 2, team_id: 999, status: "approved" },
          ],
        });
      }
      if (path === "/teams") {
        return Promise.resolve({
          teams: [
            { id: 101, name: "FC 東京", captain_name: "佐藤", member_count: 9 },
            { id: 102, name: "渋谷ユナイテッド", captain_name: "田中", member_count: 7 },
          ],
        });
      }
      if (path === "/tournaments/1/images") {
        return Promise.resolve({ images: [] });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter initialEntries={["/admin/tournaments/1"]}>
        <Routes>
          <Route path="/admin/tournaments/:id" element={<AdminTournamentDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("テスト大会")).toBeInTheDocument());

    expect(screen.getByText("2 / 16 チーム")).toBeInTheDocument();
    expect(screen.getByText("代々木フットサルパーク")).toBeInTheDocument();
    expect(screen.getByText("¥15,000 / チーム")).toBeInTheDocument();
    expect(screen.getByText("FC 東京")).toBeInTheDocument();
    expect(screen.getByText("渋谷ユナイテッド")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("チーム名で検索"), {
      target: { value: "渋谷" },
    });

    expect(screen.queryByText("FC 東京")).not.toBeInTheDocument();
    expect(screen.getByText("渋谷ユナイテッド")).toBeInTheDocument();
  });
});
