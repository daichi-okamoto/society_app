import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryRoster from "./TournamentEntryRoster";

const getMock = vi.fn((path) => {
  if (path === "/tournaments/4") {
    return Promise.resolve({
      tournament: {
        id: 4,
        name: "J7 渋谷カップ Vol.12",
        event_date: "2026-02-20",
        venue: "代々木公園フットサルコート",
      },
    });
  }

  if (path === "/tournaments/4/entries/me") {
    return Promise.resolve({ entry: { id: 1, team_id: 10, status: "approved" } });
  }

  if (path === "/teams") {
    return Promise.resolve({
      teams: [{ id: 10, name: "FC 東京セブン", is_member: true }],
    });
  }

  if (path === "/teams/10") {
    return Promise.resolve({
      team: {
        id: 10,
        name: "FC 東京セブン",
        captain_user_id: 2,
        members: [
          {
            id: 21,
            user_id: 2,
            name: "田中 健太",
            name_kana: "たなか けんた",
            phone: "090-1111-2222",
            email: "tanaka@example.com",
            address: "東京都渋谷区",
            role: "captain",
          },
          {
            id: 22,
            user_id: 3,
            name: "佐藤 翔",
            name_kana: "さとう しょう",
            phone: "090-3333-4444",
            email: "sato@example.com",
            address: "",
            role: "member",
          },
        ],
      },
    });
  }

  return Promise.resolve({});
});

vi.mock("../../lib/api", () => ({
  api: {
    get: (...args) => getMock(...args),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/tournaments/4/entry/review/roster"]}>
      <Routes>
        <Route path="/tournaments/:id/entry/review/roster" element={<TournamentEntryRoster />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TournamentEntryRoster", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("shows tournament and dynamic members", async () => {
    renderPage();

    expect(await screen.findByText("参加選手名簿の提出")).toBeInTheDocument();
    expect(await screen.findByText("J7 渋谷カップ Vol.12")).toBeInTheDocument();
    expect(await screen.findByText("田中 健太")).toBeInTheDocument();
    expect(await screen.findByText("佐藤 翔")).toBeInTheDocument();
    expect(await screen.findByText("住所未登録")).toBeInTheDocument();
  });

  it("updates selected chip count when selecting a member", async () => {
    renderPage();

    await screen.findByText("田中 健太");
    const checkbox = screen.getByLabelText("田中 健太を選択");
    fireEvent.click(checkbox);

    expect(screen.getByText("選択中の選手 (1名)")).toBeInTheDocument();
    expect(screen.getAllByText("田中 健太").length).toBeGreaterThanOrEqual(1);
  });
});
