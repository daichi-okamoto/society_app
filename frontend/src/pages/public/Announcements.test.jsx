import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import Announcements from "./Announcements";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("Announcements", () => {
  it("renders announcements", async () => {
    api.get.mockResolvedValue({
      announcements: [{ id: 1, title: "お知らせA", published_at: "2026-02-01" }]
    });

    const { getByText } = render(<Announcements />);
    await waitFor(() => expect(getByText("お知らせA / 2026-02-01")).toBeTruthy());
  });
});
