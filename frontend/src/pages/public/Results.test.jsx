import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Results from "./Results";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, role: "player" } })
}));

describe("Results", () => {
  it("renders match results", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/tournaments/1") {
        return Promise.resolve({
          tournament: {
            id: 1,
            name: "J7 渋谷カップ Vol.11",
            event_date: "2024-04-18",
            venue: "渋谷フットサル"
          }
        });
      }
      if (path === "/tournaments/1/entries/me") {
        return Promise.resolve({
          entry: { team_id: 1, status: "approved" }
        });
      }
      return Promise.resolve({
        matches: [
          {
            id: 1,
            home_team_id: 1,
            away_team_id: 2,
            home_team_name: "渋谷ギャラクシー",
            away_team_name: "代々木ユナイテッド",
            kickoff_at: "2024-04-18T10:30:00+09:00",
            result: { home_score: 3, away_score: 1 }
          }
        ]
      });
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={["/tournaments/1/results"]}>
        <Routes>
          <Route path="/tournaments/:id/results" element={<Results />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("大会結果詳細")).toBeTruthy());
    expect(getByText("J7 渋谷カップ Vol.11")).toBeTruthy();
    expect(getByText("所属チーム試合結果")).toBeTruthy();
    expect(getByText("渋谷ギャラクシー", { selector: "small" })).toBeTruthy();
    expect(getByText("代々木ユナイテッド")).toBeTruthy();
  });
});
