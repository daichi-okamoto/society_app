import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminImages from "./AdminImages";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), postForm: vi.fn(), del: vi.fn() }
}));

describe("AdminImages", () => {
  it("renders images and uploads new one", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    api.get
      .mockResolvedValueOnce({ tournaments: [{ id: 1, name: "大会A" }] })
      .mockResolvedValueOnce({ images: [{ id: 1, file_name: "a.jpg" }] })
      .mockResolvedValueOnce({ images: [{ id: 1, file_name: "a.jpg" }, { id: 2, file_name: "b.jpg" }] });
    api.postForm.mockResolvedValueOnce({
      public_url: "https://cdn.example.com/tournament-images/x-b.jpg",
      file_name: "b.jpg",
      content_type: "image/jpeg",
      size_bytes: 5,
    });
    api.post
      .mockResolvedValueOnce({
        image: { id: 2 },
      });
    api.del.mockResolvedValueOnce({ deleted: true });

    const { getByText, getByLabelText, getAllByText } = render(<AdminImages />);
    await waitFor(() => expect(getByText("a.jpg")).toBeTruthy());

    const file = new File(["dummy"], "b.jpg", { type: "image/jpeg" });
    fireEvent.change(getByLabelText("画像ファイル"), { target: { files: [file] } });
    fireEvent.click(getByText("アップロード"));

    await waitFor(() => expect(api.postForm).toHaveBeenCalled());
    expect(api.postForm).toHaveBeenCalledWith("/uploads/direct", expect.any(FormData));
    expect(api.post).toHaveBeenCalledWith("/tournaments/1/images", expect.objectContaining({ file_name: "b.jpg" }));

    const deleteButtons = getAllByText("削除");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(api.del).toHaveBeenCalled());
    confirmSpy.mockRestore();
  });
});
