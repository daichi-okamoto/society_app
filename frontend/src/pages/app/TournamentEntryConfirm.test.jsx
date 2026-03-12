import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntryConfirm from "./TournamentEntryConfirm";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    post: vi.fn().mockResolvedValue({ entry: { id: 1 } }),
    get: vi.fn().mockResolvedValue({ methods: [{ id: "pm_1", is_default: true }] }),
  },
}));

describe("TournamentEntryConfirm", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
    api.get.mockResolvedValue({ methods: [{ id: "pm_1", is_default: true }] });
  });

  it("navigates to in-app payment page for card payment", async () => {
    const draft = {
      team_id: 1,
      team_name: "FC 渋谷ユナイテッド",
      category: "enjoy",
      payment_method: "card",
      representative_name: "田中 健太郎",
      representative_phone: "090-1234-5678",
      amount: 15000,
    };

    api.post.mockResolvedValueOnce({ entry: { id: 12 } });

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/tournaments/4/entry/confirm", state: { draft } },
        ]}
      >
        <Routes>
          <Route path="/tournaments/:id/entry/confirm" element={<TournamentEntryConfirm />} />
          <Route path="/tournaments/:id/entry/complete" element={<div>完了ページ</div>} />
          <Route path="/tournaments/:id/payment" element={<div>決済ページ</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("この内容で申し込む").closest("button"));

    await waitFor(() => {
      expect(api.post).toHaveBeenNthCalledWith(1, "/tournaments/4/entries", {
        team_id: 1,
        category: "enjoy",
        payment_method: "card",
      });
      expect(api.get).toHaveBeenCalledWith("/payments/methods");
      expect(screen.getByText("決済ページ")).toBeInTheDocument();
    });
  });

  it("navigates to complete page for cash payment", async () => {
    const draft = {
      team_id: 1,
      team_name: "FC 渋谷ユナイテッド",
      category: "enjoy",
      payment_method: "cash",
      representative_name: "田中 健太郎",
      representative_phone: "090-1234-5678",
      amount: 15000,
    };

    api.post.mockResolvedValueOnce({ entry: { id: 22 } });

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
        payment_method: "cash",
      });
      expect(screen.getByText("完了ページ")).toBeInTheDocument();
    });
  });

});
