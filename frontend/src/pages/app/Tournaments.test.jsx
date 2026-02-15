import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

    render(
      <MemoryRouter>
        <Tournaments />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "大会をさがす" })).toBeInTheDocument());
    expect(screen.getByText("大会A")).toBeInTheDocument();
    expect(screen.getByText("会場")).toBeInTheDocument();
  });

  it("filters by keyword", async () => {
    api.get.mockResolvedValue({
      tournaments: [
        { id: 1, name: "渋谷カップ", event_date: "2026-05-01", venue: "代々木" },
        { id: 2, name: "新宿リーグ", event_date: "2026-05-08", venue: "新宿中央公園" },
      ],
    });

    render(
      <MemoryRouter>
        <Tournaments />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("渋谷カップ")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("大会名・エリア・会場で検索"), {
      target: { value: "新宿" },
    });
    expect(screen.queryByText("渋谷カップ")).not.toBeInTheDocument();
    expect(screen.getByText("新宿リーグ")).toBeInTheDocument();
  });
});
