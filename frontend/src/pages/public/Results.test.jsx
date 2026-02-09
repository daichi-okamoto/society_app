import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Results from "./Results";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("Results", () => {
  it("renders match results", async () => {
    api.get.mockResolvedValue({
      matches: [
        {
          id: 1,
          home_team_id: 1,
          away_team_id: 2,
          home_team_name: "FC A",
          away_team_name: "FC B",
          result: { home_score: 3, away_score: 1 }
        }
      ]
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={["/tournaments/1/results"]}>
        <Routes>
          <Route path="/tournaments/:id/results" element={<Results />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("FC A vs FC B 3-1")).toBeTruthy());
  });
});
