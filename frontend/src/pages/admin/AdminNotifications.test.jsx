import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminNotifications from "./AdminNotifications";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("AdminNotifications", () => {
  it("renders history and tab switch", async () => {
    const notificationsList = [
      { id: 1, title: "通知A", body: "本文A", target_type: "everyone", sent_at: "2026-02-01T10:00:00+09:00" },
      { id: 2, title: "通知B", body: "本文B", target_type: "everyone", scheduled_at: "2026-02-05T10:00:00+09:00" }
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

    const { getByText, getByLabelText, getByRole } = render(
      <MemoryRouter>
        <AdminNotifications />
      </MemoryRouter>
    );
    await waitFor(() => expect(getByText("通知A")).toBeTruthy());
    expect(getByText("送信済み")).toBeTruthy();
    expect(getByText("配信済")).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "下書き" }));
    await waitFor(() => expect(getByText("通知B")).toBeTruthy());
    expect(getByRole("button", { name: "下書き" })).toBeTruthy();
    expect(getByLabelText("settings")).toBeTruthy();
  });
});
