import { describe, it, expect, vi } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TeamRequests from "./TeamRequests";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ join_requests: [{ id: 1, user_id: 2, status: "pending" }] }),
    patch: vi.fn().mockResolvedValue({})
  }
}));

describe("TeamRequests", () => {
  it("renders and approves request", async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/teams/1/requests"]}>
        <Routes>
          <Route path="/teams/:id/requests" element={<TeamRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("2 / pending")).toBeTruthy());
    fireEvent.click(getByText("承認"));

    expect(api.patch).toHaveBeenCalled();
  });
});
