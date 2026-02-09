import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import Home from "./Home";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn()
  }
}));

describe("Home", () => {
  it("renders tournaments list", async () => {
    api.get.mockResolvedValue({
      tournaments: [
        { id: 1, name: "大会A", event_date: "2026-05-01", venue: "会場" }
      ]
    });

    const { getByText } = render(<Home />);

    await waitFor(() => expect(getByText("大会A / 2026-05-01 / 会場")).toBeTruthy());
  });

  it("renders empty state", async () => {
    api.get.mockResolvedValue({ tournaments: [] });

    const { getByText } = render(<Home />);

    await waitFor(() => expect(getByText("現在公開中の大会はありません。")).toBeTruthy());
  });
});
