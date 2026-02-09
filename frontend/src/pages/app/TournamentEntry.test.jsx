import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntry from "./TournamentEntry";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { post: vi.fn().mockResolvedValue({ entry: { id: 1 } }) }
}));

describe("TournamentEntry", () => {
  it("submits entry", async () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter initialEntries={["/tournaments/1/entry"]}>
        <Routes>
          <Route path="/tournaments/:id/entry" element={<TournamentEntry />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText("チームID"), { target: { value: "1" } });
    fireEvent.click(getByText("申込"));

    await waitFor(() => expect(getByText("申込しました。運営の承認をお待ちください。")).toBeTruthy());
  });
});
