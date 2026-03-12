import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminPayments from "./AdminPayments";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("AdminPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders summary and payment rows", async () => {
    api.get.mockResolvedValueOnce({
      summary: { monthly_revenue: 56000, pending_count: 2, refunded_count: 1 },
      alerts: [{ code: "failed_payments_recent", level: "error", message: "失敗あり", count: 1 }],
      payments: [
        {
          id: 10,
          status: "paid",
          amount: 12000,
          method: "card",
          team_name: "FC Test",
          tournament_name: "春大会",
          paid_at: "2026-03-01T10:00:00Z",
          refundable: true,
        },
      ],
    });

    render(
      <MemoryRouter>
        <AdminPayments />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("決済管理")).toBeInTheDocument();
      expect(screen.getByText("FC Test")).toBeInTheDocument();
      expect(screen.getByText("返金処理を実行")).toBeInTheDocument();
    });
  });

  it("calls refund API when refund button is clicked", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    api.get.mockResolvedValue({
      summary: { monthly_revenue: 56000, pending_count: 2, refunded_count: 1 },
      alerts: [],
      payments: [
        {
          id: 11,
          status: "paid",
          amount: 8000,
          method: "card",
          team_name: "FC Refund",
          tournament_name: "秋大会",
          paid_at: "2026-03-01T10:00:00Z",
          refundable: true,
        },
      ],
    });
    api.post.mockResolvedValue({ payment: { id: 11, status: "refunded" } });

    render(
      <MemoryRouter>
        <AdminPayments />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("FC Refund")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("返金処理を実行"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/payments/11/refund", {});
    });
  });
});
