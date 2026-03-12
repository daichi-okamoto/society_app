import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../lib/api";
import AdminNotificationCreate from "./AdminNotificationCreate";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

describe("AdminNotificationCreate", () => {
  it("creates a scheduled notification for tournament teams", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/tournaments") return Promise.resolve({ tournaments: [{ id: 3, name: "春大会" }] });
      if (path === "/teams") return Promise.resolve({ teams: [{ id: 8, name: "FC テスト" }] });
      return Promise.resolve({});
    });
    api.post.mockResolvedValue({ notification: { id: 1 } });

    render(
      <MemoryRouter initialEntries={["/admin/notifications/new"]}>
        <Routes>
          <Route path="/admin/notifications/new" element={<AdminNotificationCreate />} />
          <Route path="/admin/notifications" element={<div>notifications list</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("通知の作成")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("配信先を選択"), { target: { value: "tournament_teams" } });
    fireEvent.change(screen.getByLabelText("対象大会"), { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("例：【重要】決勝トーナメントの日程変更について"), {
      target: { value: "日程変更" },
    });
    fireEvent.change(screen.getByPlaceholderText("詳細な内容を入力してください..."), {
      target: { value: "詳細本文" },
    });
    fireEvent.click(screen.getByLabelText("即時送信"));
    fireEvent.change(screen.getByLabelText("予約日時"), { target: { value: "2026-03-12T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: /送信する/ }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/notifications", expect.objectContaining({
      delivery_scope: "tournament_teams",
      tournament_id: "3",
      send_now: false,
      scheduled_at: "2026-03-12T10:00",
    })));
    await waitFor(() => expect(screen.getByText("notifications list")).toBeInTheDocument());
  });
});
