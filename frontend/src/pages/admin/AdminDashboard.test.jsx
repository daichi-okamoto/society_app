import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() },
}));

describe("AdminDashboard", () => {
  it("shows only active tournaments in operating section and separates finished tournaments", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/tournaments") {
        return Promise.resolve({
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
            {
              id: 9,
              name: "過去大会",
              event_date: "2026-03-01",
              start_time: "09:00",
              end_time: "16:00",
              max_teams: 12,
              active_entry_teams_count: 6,
              entry_fee_amount: 10000,
            },
          ],
        });
      }

      if (path === "/admin/dashboard") {
        return Promise.resolve({
          tasks: [
            { id: "teams", title: "未承認のチーム", body: "新規登録の確認が必要です", count: 3, icon: "person_add", tone: "primary", href: "/admin/teams/pending" },
            { id: "roster", title: "名簿未提出の督促", body: "開催3日以内の大会があります", count: 2, icon: "assignment_late", tone: "amber", href: "/admin/entries" },
            { id: "matches", title: "対戦表未作成の大会", body: "開催1週間以内で対戦表が未作成です", count: 1, icon: "calendar_clock", tone: "slate", href: "/admin/matches?tournamentId=8" },
          ],
        });
      }

      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("テスト大会")).toBeInTheDocument());
    const activeSection = screen.getByRole("heading", { name: "運営中の大会" }).closest("section");
    const finishedSection = screen.getByRole("heading", { name: "終了した大会" }).closest("section");

    expect(within(activeSection).getByText("テスト大会")).toBeInTheDocument();
    expect(within(activeSection).queryByText("過去大会")).toBeNull();
    expect(within(finishedSection).getByText("過去大会")).toBeInTheDocument();

    const cardLink = within(activeSection).getByRole("link", { name: /テスト大会/i });
    expect(cardLink).toHaveAttribute("href", "/admin/tournaments/8");
    expect(screen.getByText("3/29 (日) • 9:00 - 16:00")).toBeInTheDocument();
    expect(screen.getByText("3/1 (日) • 9:00 - 16:00")).toBeInTheDocument();
    expect(within(activeSection).getByText("募集中")).toBeInTheDocument();
    expect(within(finishedSection).getByText("終了")).toBeInTheDocument();
    expect(within(activeSection).getByText("満枠売上")).toBeInTheDocument();
    expect(within(activeSection).getByText("¥180,000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /未承認のチーム/i })).toHaveAttribute("href", "/admin/teams/pending");
    expect(screen.getByRole("link", { name: /対戦表未作成の大会/i })).toHaveAttribute("href", "/admin/matches?tournamentId=8");
    expect(screen.queryByText("入金確認待ち")).toBeNull();
  });
});
