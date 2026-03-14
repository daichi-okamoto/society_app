import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TournamentEntry from "./TournamentEntry";
import TournamentEntryConfirm from "./TournamentEntryConfirm";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn((path) => {
      if (path === "/teams") {
        return Promise.resolve({
          teams: [{ id: 1, name: "FC 渋谷ユナイテッド", is_member: true }],
        });
      }
      if (path === "/tournaments/4") {
        return Promise.resolve({
          tournament: {
            id: 4,
            name: "春大会",
            entry_fee_amount: 18000,
            description: "大会説明\nグループ設定:\n- エンジョイ: ★★★\n- オープン: ★★★★★",
          },
        });
      }
      return Promise.resolve({});
    }),
    post: vi.fn().mockResolvedValue({ entry: { id: 1 } })
  }
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      name: "田中 健太郎",
      phone_number: "090-1234-5678",
    }
  })
}));

describe("TournamentEntry", () => {
  it("moves to confirm page", async () => {
    render(
      <MemoryRouter initialEntries={["/tournaments/4/entry"]}>
        <Routes>
          <Route path="/tournaments/:id/entry" element={<TournamentEntry />} />
          <Route path="/tournaments/:id/entry/confirm" element={<TournamentEntryConfirm />} />
          <Route path="/tournaments/:id" element={<div>大会TOP</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "エントリーチーム" })).toBeInTheDocument();
    });
    expect(screen.getByText("エンジョイ")).toBeInTheDocument();
    expect(screen.getByText("オープン")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "エントリーチーム" }), { target: { value: "1" } });
    fireEvent.click(screen.getByText("確認画面へ進む"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "内容確認" })).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });
});
