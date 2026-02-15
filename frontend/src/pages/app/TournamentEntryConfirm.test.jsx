import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryConfirm from "./TournamentEntryConfirm";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    post: vi.fn().mockResolvedValue({ entry: { id: 1 } }),
  },
}));

describe("TournamentEntryConfirm", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("submits entry on confirm", async () => {
    const draft = {
      team_id: 1,
      team_name: "FC 渋谷ユナイテッド",
      category: "enjoy",
      payment_method: "card",
      representative_name: "田中 健太郎",
      representative_phone: "090-1234-5678",
      amount: 15000,
    };

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/tournaments/4/entry/confirm", state: { draft } },
        ]}
      >
        <Routes>
          <Route path="/tournaments/:id/entry/confirm" element={<TournamentEntryConfirm />} />
          <Route path="/tournaments/:id/entry/complete" element={<div>完了ページ</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("この内容で申し込む").closest("button"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/tournaments/4/entries", {
        team_id: 1,
        category: "enjoy",
        payment_method: "card",
      });
      expect(screen.getByText("完了ページ")).toBeInTheDocument();
    });
  });
});
