import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
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
      return Promise.resolve({
        tournament: {
          id: 1,
          name: "大会A",
          event_date: "2026-05-01",
          venue: "会場",
          match_half_minutes: 12,
          max_teams: 8,
          active_entry_teams_count: 3,
          entry_fee_amount: 5000,
          entry_fee_currency: "JPY",
          cancel_deadline_date: "2026-04-30",
          start_time: "19:30:00",
          end_time: "21:30:00",
          description: "大会概要テキスト\nグループ設定:\n- Aグループ: ★★★★ (スタンダード)\n- Bグループ: ★★ (ビギナー)",
          rules: "スパイク禁止\n遅刻厳禁",
          cautions: "雨天決行（荒天中止）\n開始20分前までに受付"
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

    await waitFor(() => expect(getByText("大会A")).toBeTruthy());
    expect(getByText("大会A")).toBeTruthy();
    expect(getByText("開催日時")).toBeTruthy();
    expect(getAllByText("会場").length).toBeGreaterThan(0);
    expect(getByText("大会概要")).toBeTruthy();
    expect(getByText("グループ設定")).toBeTruthy();
    expect(getByText("Aグループ")).toBeTruthy();
    expect(getByText("Bグループ")).toBeTruthy();
    expect(getByText("注意事項")).toBeTruthy();
    expect(getByText("雨天決行（荒天中止）")).toBeTruthy();
    expect(getByText("大会にエントリーする")).toBeTruthy();
    expect(getByText("残り 5 / 8")).toBeTruthy();
    expect(getByText("19:30〜21:30")).toBeTruthy();

    fireEvent.click(getByText("ルール"));
    expect(getByText("スパイク禁止")).toBeTruthy();
    expect(getByText("遅刻厳禁")).toBeTruthy();
  });
});
