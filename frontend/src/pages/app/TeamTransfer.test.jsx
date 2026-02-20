import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TeamTransfer from "./TeamTransfer";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      team: {
        id: 1,
        members: [{ user_id: 2, name: "山田", role: "member" }]
      }
    }),
    post: vi.fn().mockResolvedValue({})
  }
}));

describe("TeamTransfer", () => {
  it("submits transfer", async () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter initialEntries={["/teams/1/transfer"]}>
        <Routes>
          <Route path="/teams/:id/transfer" element={<TeamTransfer />} />
          <Route path="/teams/:id" element={<p>team detail</p>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("代表移譲")).toBeTruthy());
    fireEvent.change(getByLabelText("移譲先"), { target: { value: "2" } });
    fireEvent.click(getByText("移譲"));

    expect(api.post).toHaveBeenCalled();
    await waitFor(() => expect(getByText("team detail")).toBeTruthy());
  });
});
