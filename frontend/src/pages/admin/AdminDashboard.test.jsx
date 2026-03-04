import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() },
}));

describe("AdminDashboard", () => {
  it("links tournament cards to admin detail page", async () => {
    api.get.mockResolvedValue({
      tournaments: [
        {
          id: 8,
          name: "テスト大会",
          event_date: "2026-03-29",
          start_time: "09:00",
          end_time: "16:00",
          max_teams: 15,
          active_entry_teams_count: 0,
          entry_fee_amount: 12000,
        },
      ],
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("テスト大会")).toBeInTheDocument());
    const cardLink = screen.getByRole("link", { name: /テスト大会/i });
    expect(cardLink).toHaveAttribute("href", "/admin/tournaments/8");
    expect(screen.getByText("3/29 (日) • 9:00 - 16:00")).toBeInTheDocument();
    expect(screen.getByText("満枠売上")).toBeInTheDocument();
    expect(screen.getByText("¥180,000")).toBeInTheDocument();
  });
});
