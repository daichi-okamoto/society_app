import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminTeamDetail from "./AdminTeamDetail";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("AdminTeamDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows confirm alert before suspension and calls moderate API on accept", async () => {
    api.get.mockResolvedValueOnce({
      team: {
        id: 8,
        name: "FC テスト",
        status: "approved",
        created_at: "2026-02-01",
        members: [],
        captain: { name: "管理者", phone: "09000000000", email: "a@example.com", address: "東京都" },
      },
    });
    api.patch.mockResolvedValueOnce({ team: { id: 8, status: "suspended" } });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/admin/teams/8"]}>
        <Routes>
          <Route path="/admin/teams/:id" element={<AdminTeamDetail />} />
          <Route path="/admin/teams" element={<div>teams list</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("FC テスト")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "利用停止" }));

    expect(confirmSpy).toHaveBeenCalledWith("このチームを利用停止にしますか？");
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/teams/8/moderate", { decision: "suspend" }));
  });

  it("shows reactivate button for suspended team and can reactivate", async () => {
    api.get.mockResolvedValueOnce({
      team: {
        id: 9,
        name: "FC 停止中",
        status: "suspended",
        created_at: "2026-02-01",
        members: [],
        captain: { name: "管理者", phone: "09000000000", email: "a@example.com", address: "東京都" },
      },
    });
    api.patch.mockResolvedValueOnce({ team: { id: 9, status: "approved" } });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/admin/teams/9"]}>
        <Routes>
          <Route path="/admin/teams/:id" element={<AdminTeamDetail />} />
          <Route path="/admin/teams" element={<div>teams list</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("FC 停止中")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "利用再開" }));

    expect(confirmSpy).toHaveBeenCalledWith("このチームの利用を再開しますか？");
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/teams/9/moderate", { decision: "reactivate" }));
  });

  it("toggles all members in the member list", async () => {
    api.get.mockResolvedValueOnce({
      team: {
        id: 10,
        name: "FC 10人",
        status: "approved",
        created_at: "2026-02-01",
        members: [
          { id: 1, name: "代表", email: "captain@example.com", role: "captain" },
          { id: 2, name: "メンバー1", email: "member1@example.com", role: "member" },
          { id: 3, name: "メンバー2", email: "member2@example.com", role: "member" },
          { id: 4, name: "メンバー3", email: "member3@example.com", role: "member" },
        ],
        captain: { name: "代表", phone: "09000000000", email: "captain@example.com", address: "東京都" },
      },
    });

    render(
      <MemoryRouter initialEntries={["/admin/teams/10"]}>
        <Routes>
          <Route path="/admin/teams/:id" element={<AdminTeamDetail />} />
          <Route path="/admin/teams" element={<div>teams list</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("FC 10人")).toBeInTheDocument());
    expect(screen.queryByText("メンバー3")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "全メンバーを表示" }));

    expect(screen.getByText("メンバー3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "一部のみ表示" })).toBeInTheDocument();
  });
});
