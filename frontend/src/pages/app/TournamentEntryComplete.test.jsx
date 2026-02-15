import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryComplete from "./TournamentEntryComplete";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      tournament: { name: "J7 渋谷カップ Vol.12" },
    }),
  },
}));

describe("TournamentEntryComplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
