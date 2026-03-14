import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() }
}));

describe("NotificationCenter", () => {
  it("renders notifications and marks read", async () => {
    api.get.mockResolvedValueOnce({
      notifications: [{ id: 1, title: "通知", body: "本文", link_path: "/teams/1/requests" }]
    });
    api.get.mockResolvedValueOnce({
      notifications: [{ id: 2, title: "既読通知", body: "既読本文", read_at: "2026-01-01T00:00:00Z" }]
    });
    api.post.mockResolvedValueOnce({ read: true });

    render(
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "お知らせ" })).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("詳細へ"));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });
});
