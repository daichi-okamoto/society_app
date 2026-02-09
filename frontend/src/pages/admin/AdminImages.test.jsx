import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminImages from "./AdminImages";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), del: vi.fn() }
}));

describe("AdminImages", () => {
  it("renders images and uploads new one", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    api.get
      .mockResolvedValueOnce({ tournaments: [{ id: 1, name: "大会A" }] })
      .mockResolvedValueOnce({ images: [{ id: 1, file_name: "a.jpg" }] })
      .mockResolvedValueOnce({ images: [{ id: 1, file_name: "a.jpg" }, { id: 2, file_name: "b.jpg" }] });
    api.post.mockResolvedValueOnce({ image: { id: 2 } });
    api.del.mockResolvedValueOnce({ deleted: true });

    const { getByText, getByLabelText, getAllByText } = render(<AdminImages />);
    await waitFor(() => expect(getByText("a.jpg")).toBeTruthy());

    fireEvent.change(getByLabelText("URL"), { target: { value: "https://example.com/b.jpg" } });
    fireEvent.change(getByLabelText("ファイル名"), { target: { value: "b.jpg" } });
    fireEvent.change(getByLabelText("サイズ"), { target: { value: "100" } });
    fireEvent.click(getByText("アップロード"));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const deleteButtons = getAllByText("削除");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(api.del).toHaveBeenCalled());
    confirmSpy.mockRestore();
  });
});
