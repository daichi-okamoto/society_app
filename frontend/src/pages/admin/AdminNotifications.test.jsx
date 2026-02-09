import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminNotifications from "./AdminNotifications";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), del: vi.fn() }
}));

describe("AdminNotifications", () => {
  it("renders history and sends notification", async () => {
    const notificationsList = [
      { id: 1, title: "通知A", sent_at: "2026-02-01" },
      { id: 2, title: "通知B", scheduled_at: "2026-02-05 10:00" }
    ];
    api.get.mockImplementation((path) => {
      if (path === "/notifications/admin") {
        return Promise.resolve({ notifications: notificationsList });
      }
      if (path === "/tournaments") {
        return Promise.resolve({ tournaments: [{ id: 1, name: "大会A" }] });
      }
      if (path === "/teams") {
        return Promise.resolve({ teams: [{ id: 1, name: "チームA" }] });
      }
      return Promise.resolve({});
    });
    api.post.mockResolvedValueOnce({ notification: { id: 3 } });
    api.del.mockResolvedValueOnce({ deleted: true });

    const { getByText, getByLabelText } = render(<AdminNotifications />);
    await waitFor(() => expect(getByText("通知A / 2026-02-01")).toBeTruthy());

    fireEvent.change(getByLabelText("タイトル"), { target: { value: "通知B" } });
    fireEvent.change(getByLabelText("本文"), { target: { value: "本文" } });
    fireEvent.change(getByLabelText("送信時間"), { target: { value: "2026-02-05 10:00" } });
    fireEvent.click(getByText("送信"));
    await waitFor(() => expect(api.post).toHaveBeenCalled());

    fireEvent.click(getByText("取消"));
    await waitFor(() => expect(api.del).toHaveBeenCalled());
  });
});
