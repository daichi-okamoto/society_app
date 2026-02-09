import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import Teams from "./Teams";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("Teams", () => {
  it("renders teams list", async () => {
    api.get.mockResolvedValue({ teams: [{ id: 1, name: "FC Example", captain_name: "山田" }] });
    const { getByText } = render(<Teams />);
    await waitFor(() => expect(getByText("FC Example / 代表: 山田")).toBeTruthy());
  });

  it("renders empty state", async () => {
    api.get.mockResolvedValue({ teams: [] });
    const { getByText } = render(<Teams />);
    await waitFor(() => expect(getByText("チームがありません。")).toBeTruthy());
  });
});
