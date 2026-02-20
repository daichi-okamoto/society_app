import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryReview from "./TournamentEntryReview";

const getMock = vi.fn((path) => {
  if (path === "/tournaments/4") {
    return Promise.resolve({
      tournament: {
        id: 4,
        name: "J7 渋谷カップ Vol.12",
        event_date: "2026-02-20",
        venue: "代々木公園フットサルコート",
        entry_fee_amount: 22000,
      },
    });
  }

  if (path === "/tournaments/4/entries/me") {
    return Promise.resolve({ entry: { id: 123, team_id: 10, status: "approved" } });
  }

  if (path === "/teams") {
    return Promise.resolve({ teams: [{ id: 10, name: "FC 東京セブン", is_member: true }] });
  }

  if (path === "/teams/10") {
    return Promise.resolve({ team: { id: 10, name: "FC 東京セブン" } });
  }

  return Promise.resolve({});
});

vi.mock("../../lib/api", () => ({
  api: {
    get: (...args) => getMock(...args),
  },
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "山田 太郎",
      phone: "090-1234-5678",
    },
  }),
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

  it("shows entry confirmation details", async () => {
    renderPage();

    expect(await screen.findByText("エントリー内容の確認")).toBeInTheDocument();
    expect(await screen.findByText("J7 渋谷カップ Vol.12")).toBeInTheDocument();
    expect(await screen.findByText("FC 東京セブン")).toBeInTheDocument();
    expect(await screen.findByText("山田 太郎")).toBeInTheDocument();
    expect(await screen.findByText("¥22,000")).toBeInTheDocument();
    expect(await screen.findByText("名簿を提出・編集する")).toBeInTheDocument();
  });
});
