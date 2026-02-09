import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import Tournaments from "./Tournaments";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("Tournaments", () => {
  it("renders tournaments", async () => {
    api.get.mockResolvedValue({
      tournaments: [{ id: 1, name: "大会A", event_date: "2026-05-01", venue: "会場" }]
    });

    const { getByText } = render(<Tournaments />);
    await waitFor(() => expect(getByText("大会A / 2026-05-01 / 会場")).toBeTruthy());
  });
});
