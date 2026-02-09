import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentImages from "./TournamentImages";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("TournamentImages", () => {
  it("renders images", async () => {
    api.get.mockResolvedValue({
      images: [
        { id: 1, file_name: "image.jpg", download_url: "https://example.com/image.jpg" }
      ]
    });

    const { getByText, getByAltText, getByRole } = render(
      <MemoryRouter initialEntries={["/tournaments/1/images"]}>
        <Routes>
          <Route path="/tournaments/:id/images" element={<TournamentImages />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("image.jpg")).toBeTruthy());
    expect(getByAltText("image.jpg")).toBeTruthy();
    expect(getByRole("link", { name: "ダウンロード" })).toBeTruthy();
  });
});
