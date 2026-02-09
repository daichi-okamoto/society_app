import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import AdminTournaments from "./AdminTournaments";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() }
}));

describe("AdminTournaments", () => {
  it("renders tournaments, creates, updates, and deletes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    api.get.mockImplementation((path) => {
      if (path.startsWith("/tournaments/")) {
        return Promise.resolve({
          tournament: {
            id: 1,
            name: "大会A",
            event_date: "2026-05-01",
            venue: "会場",
            match_half_minutes: 12,
            max_teams: 15,
            entry_fee_amount: 20000,
            entry_fee_currency: "JPY",
            cancel_deadline_date: "2026-04-30"
          }
        });
      }
      return Promise.resolve({
        tournaments: [{ id: 1, name: "大会A", event_date: "2026-05-01", venue: "会場" }]
      });
    });
    api.post.mockResolvedValueOnce({ tournament: { id: 2 } });
    api.patch.mockResolvedValueOnce({ tournament: { id: 1 } });
    api.del.mockResolvedValueOnce({ deleted: true });

    const { getByText, getByLabelText, getAllByText } = render(<AdminTournaments />);
    await waitFor(() => expect(getByText("大会A / 2026-05-01 / 会場")).toBeTruthy());

    fireEvent.click(getAllByText("削除")[0]);
    await waitFor(() => expect(api.del).toHaveBeenCalled());
    confirmSpy.mockRestore();

    fireEvent.change(getByLabelText("大会"), { target: { value: "1" } });
    await waitFor(() => expect(getByLabelText("大会名(編集)")).toBeTruthy());
    fireEvent.change(getByLabelText("大会名(編集)"), { target: { value: "大会A更新" } });
    fireEvent.click(getByText("更新"));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());

    fireEvent.change(getByLabelText("大会名"), { target: { value: "大会B" } });
    fireEvent.change(getByLabelText("開催日"), { target: { value: "2026-06-01" } });
    fireEvent.change(getByLabelText("会場"), { target: { value: "会場B" } });
    fireEvent.change(getByLabelText("参加費"), { target: { value: "10000" } });
    fireEvent.click(getByText("作成"));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });
});
