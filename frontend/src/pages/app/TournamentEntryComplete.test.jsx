import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryComplete from "./TournamentEntryComplete";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("TournamentEntryComplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes("/payments/latest")) {
        return Promise.resolve({ payment: { status: "paid" } });
      }
      return Promise.resolve({
        tournament: { name: "J7 渋谷カップ Vol.12" },
      });
    });
  });

  it("renders completion screen with state values", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/tournaments/4/entry/complete",
            state: {
              receiptNumber: "#20240501-001",
              tournamentName: "渋谷ナイトカップ",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/tournaments/:id/entry/complete" element={<TournamentEntryComplete />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "完了" })).toBeInTheDocument();
    expect(screen.getByText("大会へのエントリーが", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("#20240501-001")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("J7 渋谷カップ Vol.12")).toBeInTheDocument();
    });
  });

  it("shows payment synced notice when returned from checkout success", async () => {
    window.sessionStorage.setItem(
      "entry-result:4",
      JSON.stringify({
        entry_id: 99,
        receiptNumber: "#20240501-099",
      })
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/tournaments/4/entry/complete",
            search: "?payment=success&session_id=cs_test_123",
          },
        ]}
      >
        <Routes>
          <Route path="/tournaments/:id/entry/complete" element={<TournamentEntryComplete />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/payments/latest?tournament_entry_id=99");
      expect(screen.getByText("決済が完了しました。")).toBeInTheDocument();
    });
  });
});
