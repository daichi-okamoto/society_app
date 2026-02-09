import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TeamJoin from "./TeamJoin";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { post: vi.fn().mockResolvedValue({ join_request: { id: 1 } }) }
}));

describe("TeamJoin", () => {
  it("submits join request", async () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter initialEntries={["/teams/1/join"]}>
        <Routes>
          <Route path="/teams/:id/join" element={<TeamJoin />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText("参加コード"), { target: { value: "ABC123" } });
    fireEvent.click(getByText("申請"));

    await waitFor(() => expect(getByText("申請しました。代表の承認をお待ちください。")).toBeTruthy());
  });
});
