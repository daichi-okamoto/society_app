import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryReview from "./TournamentEntryReview";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      tournament: {
        name: "渋谷ナイトカップ",
        event_date: "2026-02-20",
        venue: "代々木公園フットサルコート",
      },
    }),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/tournaments/4/entry/review"]}>
      <Routes>
        <Route path="/tournaments/:id/entry/review" element={<TournamentEntryReview />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TournamentEntryReview", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("shows paid status for card payment", async () => {
    window.sessionStorage.setItem(
      "entry-result:4",
      JSON.stringify({
        receiptNumber: "#20240501-001",
        team_id: 2,
        team_name: "FC SHINJUKU STARS",
        category: "enjoy",
        representative_name: "田中 健太郎",
        representative_phone: "090-1234-5678",
        payment_method: "card",
      })
    );

    renderPage();

    expect(await screen.findByText("決済完了")).toBeInTheDocument();
    expect(screen.getByText("クレジットカード")).toBeInTheDocument();
  });

  it("shows onsite status and note for cash payment", async () => {
    window.sessionStorage.setItem(
      "entry-result:4",
      JSON.stringify({
        receiptNumber: "#20240501-001",
        team_id: 2,
        team_name: "FC SHINJUKU STARS",
        category: "enjoy",
        representative_name: "田中 健太郎",
        representative_phone: "090-1234-5678",
        payment_method: "cash",
      })
    );

    renderPage();

    expect(await screen.findByText("当日現地にてお支払い")).toBeInTheDocument();
    expect(screen.getByText("当日払い")).toBeInTheDocument();
    expect(
      screen.getByText("※当日払いは現金のみとなります。お釣りのないようご協力をお願いいたします。")
    ).toBeInTheDocument();
  });
});
