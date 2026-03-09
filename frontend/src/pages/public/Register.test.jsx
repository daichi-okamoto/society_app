import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";

vi.mock("../../hooks/useAuthActions", () => ({
  useAuthActions: () => ({ register: vi.fn().mockResolvedValue({}) })
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe("Register", () => {
  it("submits register form", () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText("メールアドレス"), { target: { value: "a@b.com" } });
    fireEvent.change(getByLabelText("パスワード"), { target: { value: "password123" } });
    fireEvent.change(getByLabelText("パスワード（確認）"), { target: { value: "password123" } });
    fireEvent.click(getByText("アカウントを作成"));

    expect(getByText("アカウントを作成")).toBeTruthy();
  });

  it("toggles password visibility for password and confirmation", () => {
    const { getByLabelText } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = getByLabelText("パスワード");
    const passwordConfirmInput = getByLabelText("パスワード（確認）");
    const passwordToggle = getByLabelText("パスワード表示切替");
    const passwordConfirmToggle = getByLabelText("パスワード確認表示切替");

    expect(passwordInput.getAttribute("type")).toBe("password");
    expect(passwordConfirmInput.getAttribute("type")).toBe("password");

    fireEvent.click(passwordToggle);
    fireEvent.click(passwordConfirmToggle);

    expect(passwordInput.getAttribute("type")).toBe("text");
    expect(passwordConfirmInput.getAttribute("type")).toBe("text");
  });
});
