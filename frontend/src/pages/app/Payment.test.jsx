import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Payment from "./Payment";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  },
}));

describe("Payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
  });

  it("shows registered payment card section when method exists", async () => {
    api.get.mockResolvedValueOnce({
      methods: [{ id: "pm_1", brand: "visa", last4: "4242", exp_month: 12, exp_year: 2029, is_default: true }],
    });

    render(
      <MemoryRouter>
        <Payment />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("登録済みのお支払い方法")).toBeInTheDocument();
      expect(screen.getByText("VISA")).toBeInTheDocument();
      expect(screen.getAllByText(/4242/).length).toBeGreaterThan(0);
      expect(screen.getByText("新しいカードを追加")).toBeInTheDocument();
    });
  });

  it("shows empty state when no payment method is registered", async () => {
    api.get.mockResolvedValueOnce({ methods: [] });

    render(
      <MemoryRouter>
        <Payment />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("お支払い方法が登録されていません")).toBeInTheDocument();
      expect(screen.getByText("お支払い方法を追加する")).toBeInTheDocument();
    });
  });

  it("navigates to add card page when add button is pressed", async () => {
    api.get.mockResolvedValueOnce({ methods: [] });

    render(
      <MemoryRouter initialEntries={["/payments"]}>
        <Routes>
          <Route path="/payments" element={<Payment />} />
          <Route path="/payments/new-card" element={<div>新しいカードの登録ページ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("お支払い方法を追加する")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("お支払い方法を追加する"));

    await waitFor(() => {
      expect(screen.getByText("新しいカードの登録ページ")).toBeInTheDocument();
    });
  });
});
