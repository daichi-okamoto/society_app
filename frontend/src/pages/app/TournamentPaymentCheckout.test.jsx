import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TournamentPaymentCheckout from "./TournamentPaymentCheckout";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

const confirmPaymentMock = vi.fn();

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }) => <div>{children}</div>,
  PaymentElement: () => <div>PaymentElement</div>,
  useStripe: () => ({ confirmPayment: confirmPaymentMock }),
  useElements: () => ({}),
}));

describe("TournamentPaymentCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
  });

  it("shows error when publishable key is missing", async () => {
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "");

    render(
      <MemoryRouter initialEntries={["/tournaments/7/payment?entry_id=5"]}>
        <Routes>
          <Route path="/tournaments/:id/payment" element={<TournamentPaymentCheckout />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Stripe公開キーが未設定です/)).toBeInTheDocument();
    });
  });

  it("navigates to complete when already paid on intent", async () => {
    api.post.mockResolvedValueOnce({ already_paid: true, payment: { status: "paid" } });

    render(
      <MemoryRouter initialEntries={["/tournaments/7/payment?entry_id=5"]}>
        <Routes>
          <Route path="/tournaments/:id/payment" element={<TournamentPaymentCheckout />} />
          <Route path="/tournaments/:id/entry/complete" element={<div>完了ページ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("完了ページ")).toBeInTheDocument();
    });
  });

  it("confirms payment with Payment Element", async () => {
    confirmPaymentMock.mockResolvedValueOnce({ paymentIntent: { status: "succeeded" } });

    api.post.mockResolvedValueOnce({
      client_secret: "pi_client_secret_123",
      payment_intent_id: "pi_123",
    });

    render(
      <MemoryRouter initialEntries={["/tournaments/7/payment?entry_id=5"]}>
        <Routes>
          <Route path="/tournaments/:id/payment" element={<TournamentPaymentCheckout />} />
          <Route path="/tournaments/:id/entry/complete" element={<div>完了ページ</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("PaymentElement")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "この内容で決済する" }));

    await waitFor(() => {
      expect(confirmPaymentMock).toHaveBeenCalled();
      expect(screen.getByText("完了ページ")).toBeInTheDocument();
    });
  });
});
