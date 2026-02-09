import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TeamDetail from "./TeamDetail";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("TeamDetail", () => {
  it("renders team details", async () => {
    api.get.mockResolvedValue({
      team: {
        id: 1,
        name: "FC Example",
        join_code: "ABC123",
        members: [{ user_id: 1, name: "山田", role: "captain" }]
      }
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={["/teams/1"]}>
        <Routes>
          <Route path="/teams/:id" element={<TeamDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("FC Example")).toBeTruthy());
    expect(getByText("参加コード: ABC123")).toBeTruthy();
    expect(getByText("山田 (captain)")).toBeTruthy();
  });
});
