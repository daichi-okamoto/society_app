import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Payment from "./Payment";

describe("Payment", () => {
  it("shows payment card section when payment method is registered", () => {
    render(
        <MemoryRouter>
        <Payment />
      </MemoryRouter>
    );

    expect(screen.getByText("登録済みのお支払い方法")).toBeInTheDocument();
    expect(screen.getByText("最近の支払い履歴")).toBeInTheDocument();
    expect(screen.getByText("新しいカードを追加")).toBeInTheDocument();
  });

  it("shows empty state when payment method is not registered", () => {
    render(
        <MemoryRouter>
        <Payment paymentMethod={null} paymentHistory={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText("お支払い方法が登録されていません")).toBeInTheDocument();
    expect(screen.getByText("お支払い方法を追加する")).toBeInTheDocument();
    expect(screen.getByText("カード情報は暗号化され、安全に保管されます")).toBeInTheDocument();
  });
});
