import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PaymentAddCard from "./PaymentAddCard";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }) => <div>{children}</div>,
  CardNumberElement: () => <div>CardNumberElement</div>,
  CardExpiryElement: () => <div>CardExpiryElement</div>,
  CardCvcElement: () => <div>CardCvcElement</div>,
  useStripe: () => ({}),
  useElements: () => ({}),
}));

describe("PaymentAddCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
  });

  it("renders add card form after setup intent is prepared", async () => {
    api.post.mockResolvedValueOnce({ client_secret: "seti_secret_123" });

    render(
      <MemoryRouter>
        <PaymentAddCard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/payments/setup_intent", {});
      expect(screen.getByText("新しいカードの登録")).toBeInTheDocument();
      expect(screen.getByText("カードを登録する")).toBeInTheDocument();
      expect(screen.getByText("CardNumberElement")).toBeInTheDocument();
    });
  });
});
