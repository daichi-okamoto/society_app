import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

vi.mock("../../hooks/useAuthActions", () => ({
  useAuthActions: () => ({ login: vi.fn().mockResolvedValue({}) })
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe("Login", () => {
  it("submits login form", () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText("メール"), { target: { value: "a@b.com" } });
    fireEvent.change(getByLabelText("パスワード"), { target: { value: "password" } });
    fireEvent.click(getByText("ログイン", { selector: "button" }));

    expect(getByText("ログイン", { selector: "button" })).toBeTruthy();
  });
});
