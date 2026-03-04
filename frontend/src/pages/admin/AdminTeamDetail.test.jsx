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
});
