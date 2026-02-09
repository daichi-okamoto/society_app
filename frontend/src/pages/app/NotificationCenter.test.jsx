import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import NotificationCenter from "./NotificationCenter";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() }
}));

describe("NotificationCenter", () => {
  it("renders notifications and marks read", async () => {
    api.get.mockResolvedValueOnce({
      notifications: [{ id: 1, title: "通知", body: "本文" }]
    });
    api.post.mockResolvedValueOnce({ read: true });

    const { getByText } = render(<NotificationCenter />);
    await waitFor(() => expect(getByText("通知")).toBeTruthy());
    fireEvent.click(getByText("既読"));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });
});
