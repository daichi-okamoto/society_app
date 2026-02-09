import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminAnnouncements from "./AdminAnnouncements";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), del: vi.fn() }
}));

describe("AdminAnnouncements", () => {
  it("renders announcements, deletes, and creates one", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    api.get.mockResolvedValueOnce({
      announcements: [{ id: 1, title: "お知らせA", published_at: "2026-02-01" }]
    });
    api.post.mockResolvedValueOnce({ announcement: { id: 2 } });
    api.get.mockResolvedValueOnce({ announcements: [] });
    api.del.mockResolvedValueOnce({ deleted: true });

    const { getByText, getByLabelText } = render(<AdminAnnouncements />);
    await waitFor(() => expect(getByText("お知らせA / 2026-02-01")).toBeTruthy());

    fireEvent.click(getByText("削除"));
    await waitFor(() => expect(api.del).toHaveBeenCalled());

    fireEvent.change(getByLabelText("タイトル"), { target: { value: "お知らせB" } });
    fireEvent.change(getByLabelText("本文"), { target: { value: "本文" } });
    fireEvent.click(getByText("作成"));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    confirmSpy.mockRestore();
  });
});
