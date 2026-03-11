import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Tournaments from "./Tournaments";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("Tournaments", () => {
  it("shows distinct status labels by date", async () => {
    const formatYmd = (date) => date.toISOString().slice(0, 10);
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 7);
    const past = new Date(today);
    past.setDate(today.getDate() - 7);

    api.get.mockResolvedValue({
      tournaments: [
        { id: 1, name: "本日開催", event_date: formatYmd(today), venue: "会場A" },
        { id: 2, name: "未来開催", event_date: formatYmd(future), venue: "会場B" },
        { id: 3, name: "過去開催", event_date: formatYmd(past), venue: "会場C" },
      ],
    });

    render(
      <MemoryRouter>
        <Tournaments />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("本日開催")).toBeInTheDocument());
    expect(screen.getByText("開催中", { selector: ".tsrch-status" })).toBeInTheDocument();
    expect(screen.getByText("募集中", { selector: ".tsrch-status" })).toBeInTheDocument();
    expect(screen.getByText("開催終了", { selector: ".tsrch-status" })).toBeInTheDocument();
  });

  it("renders tournaments", async () => {
    api.get.mockResolvedValue({
      tournaments: [{ id: 1, name: "大会A", event_date: "2026-05-01", venue: "会場", image_url: "https://example.com/tournament-a.jpg" }]
    });

    render(
      <MemoryRouter>
        <Tournaments />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "大会をさがす" })).toBeInTheDocument());
    expect(screen.getByText("大会A")).toBeInTheDocument();
    expect(screen.getByText("会場")).toBeInTheDocument();
    expect(screen.getByAltText("Tournament Venue")).toHaveAttribute("src", "https://example.com/tournament-a.jpg");
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

  it("filters past tournaments with the past tag", async () => {
    const formatYmd = (date) => date.toISOString().slice(0, 10);
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 7);
    const past = new Date(today);
    past.setDate(today.getDate() - 7);

    api.get.mockResolvedValue({
      tournaments: [
        { id: 1, name: "未来大会", event_date: formatYmd(future), venue: "会場A" },
        { id: 2, name: "過去大会", event_date: formatYmd(past), venue: "会場B" },
      ],
    });

    render(
      <MemoryRouter>
        <Tournaments />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("未来大会")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "過去の大会" }));

    expect(screen.getByText("過去大会")).toBeInTheDocument();
    expect(screen.queryByText("未来大会")).not.toBeInTheDocument();
  });
});
