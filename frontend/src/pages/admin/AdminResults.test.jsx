import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminResults from "./AdminResults";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() }
}));

describe("AdminResults", () => {
  it("updates match result", async () => {
    api.get
      .mockResolvedValueOnce({ tournaments: [{ id: 1, name: "大会A" }] })
      .mockResolvedValueOnce({
        matches: [
          { id: 1, home_team_name: "FC A", away_team_name: "FC B", result: null, result_updated_by_name: null }
        ]
      })
      .mockResolvedValueOnce({
        matches: [
          {
            id: 1,
            home_team_name: "FC A",
            away_team_name: "FC B",
            result: { home_score: 1, away_score: 0 },
            result_updated_by_name: "運営"
          }
        ]
      });
    api.post.mockResolvedValueOnce({ result: { match_id: 1, home_score: 1, away_score: 0 } });

    const { getByText, getByLabelText } = render(<AdminResults />);
    await waitFor(() => expect(getByText("FC A vs FC B")).toBeTruthy());

    fireEvent.change(getByLabelText("ホーム"), { target: { value: "1" } });
    fireEvent.change(getByLabelText("アウェイ"), { target: { value: "0" } });
    fireEvent.click(getByText("結果更新"));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    await waitFor(() => expect(getByText(/更新者: 運営/)).toBeTruthy());
  });
});
