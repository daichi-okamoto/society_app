import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminTournaments from "./AdminTournaments";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("AdminTournaments", () => {
  it("renders tournaments and supports filtering/search", async () => {
    api.get.mockImplementation((path) => {
      return Promise.resolve({
        tournaments: [
          { id: 1, name: "大会A", event_date: "2099-05-01", venue: "会場A", max_teams: 16, active_entry_teams_count: 4, entry_fee_amount: 20000 },
          { id: 2, name: "大会B", event_date: "2099-06-01", venue: "会場B", max_teams: 12, active_entry_teams_count: 2, entry_fee_amount: 12000 }
        ]
      });
    });

    const { getByText, getByPlaceholderText, queryByText, getByRole } = render(
      <MemoryRouter>
        <AdminTournaments />
      </MemoryRouter>
    );
    await waitFor(() => expect(getByText("大会A")).toBeTruthy());
    expect(getByText("大会B")).toBeTruthy();
    expect(getByText("運営中の大会")).toBeTruthy();

    fireEvent.change(getByPlaceholderText("大会名で検索"), { target: { value: "大会B" } });
    await waitFor(() => expect(getByText("大会B")).toBeTruthy());
    expect(queryByText("大会A")).toBeNull();

    fireEvent.click(getByRole("button", { name: "募集中" }));
    await waitFor(() => expect(getByText("大会B")).toBeTruthy());
  });
});
