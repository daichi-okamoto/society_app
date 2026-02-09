import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminEntries from "./AdminEntries";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), patch: vi.fn() }
}));

describe("AdminEntries", () => {
  it("renders entries and approves", async () => {
    api.get
      .mockResolvedValueOnce({
        entries: [
          { id: 1, tournament_id: 1, team_id: 2, status: "pending" },
          { id: 2, tournament_id: 2, team_id: 3, status: "approved" }
        ]
      })
      .mockResolvedValueOnce({
        tournaments: [
          { id: 1, name: "大会A" },
          { id: 2, name: "大会B" }
        ]
      })
      .mockResolvedValueOnce({
        teams: [
          { id: 2, name: "FC A" },
          { id: 3, name: "FC B" }
        ]
      });
    api.patch.mockResolvedValueOnce({ entry: { id: 1, status: "approved" } });

    const { getByText, getByLabelText } = render(<AdminEntries />);
    await waitFor(() => expect(getByText("大会: 大会A / チーム: FC A / 状態: pending")).toBeTruthy());
    fireEvent.click(getByText("承認"));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());

    fireEvent.change(getByLabelText("大会"), { target: { value: "2" } });
    expect(getByText("大会: 大会B / チーム: FC B / 状態: approved")).toBeTruthy();
    fireEvent.change(getByLabelText("状態"), { target: { value: "pending" } });
    expect(getByText("申込がありません。")).toBeTruthy();
  });
});
