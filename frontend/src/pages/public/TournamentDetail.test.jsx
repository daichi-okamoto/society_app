import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentDetail from "./TournamentDetail";
import { api } from "../../lib/api";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } })
}));

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("TournamentDetail", () => {
  it("renders tournament detail", async () => {
    api.get.mockImplementation((path) => {
      if (path.endsWith("/entries/me")) {
        return Promise.resolve({ entry: { status: "pending" } });
      }
      return Promise.resolve({
        tournament: {
          id: 1,
          name: "大会A",
          event_date: "2026-05-01",
          venue: "会場",
          match_half_minutes: 12,
          entry_fee_amount: 5000,
          entry_fee_currency: "JPY",
          cancel_deadline_date: "2026-04-30"
        }
      });
    });

    const { getByText, getAllByText } = render(
      <MemoryRouter initialEntries={["/tournaments/1"]}>
        <Routes>
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("大会名")).toBeTruthy());
    expect(getByText("大会A")).toBeTruthy();
    expect(getByText("開催日")).toBeTruthy();
    expect(getByText("2026-05-01")).toBeTruthy();
    expect(getAllByText("会場").length).toBeGreaterThan(0);
    expect(getByText("試合結果を見る")).toBeTruthy();
    expect(getByText("画像を見る")).toBeTruthy();
    expect(getByText("参加申込へ")).toBeTruthy();
    expect(getByText("申込状況: 申込済み(承認待ち)")).toBeTruthy();
  });
});
