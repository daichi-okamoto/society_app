import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminMatches from "./AdminMatches";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() }
}));

describe("AdminMatches", () => {
  it("renders matches and creates one", async () => {
    api.get
      .mockResolvedValueOnce({ tournaments: [{ id: 1, name: "大会A" }] })
      .mockResolvedValueOnce({ teams: [{ id: 10, name: "FC A" }, { id: 11, name: "FC B" }] })
      .mockResolvedValueOnce({ matches: [] })
      .mockResolvedValueOnce({
        matches: [
          { id: 1, home_team_name: "FC A", away_team_name: "FC B", kickoff_at: "10:00", field: "A" }
        ]
      });
    api.post.mockResolvedValueOnce({ match: { id: 1 } });

    const { getByText, getByLabelText } = render(<AdminMatches />);
    await waitFor(() => expect(getByText("試合がありません。")).toBeTruthy());

    fireEvent.change(getByLabelText("ホーム"), { target: { value: "10" } });
    fireEvent.change(getByLabelText("アウェイ"), { target: { value: "11" } });
    fireEvent.change(getByLabelText("開始時刻"), { target: { value: "10:00" } });
    fireEvent.change(getByLabelText("コート"), { target: { value: "A" } });
    fireEvent.click(getByText("作成"));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });
});
