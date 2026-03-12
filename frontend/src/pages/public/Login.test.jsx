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

    fireEvent.change(getByLabelText("メールアドレス"), { target: { value: "a@b.com" } });
    fireEvent.change(getByLabelText("パスワード"), { target: { value: "password" } });
    fireEvent.click(getByText("ログイン", { selector: "button" }));

    expect(getByText("ログイン", { selector: "button" })).toBeTruthy();
  });

  it("toggles password visibility", () => {
    const { getByLabelText } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = getByLabelText("パスワード");
    const toggleButton = getByLabelText("パスワード表示切替");

    expect(passwordInput.getAttribute("type")).toBe("password");
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute("type")).toBe("text");
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute("type")).toBe("password");
  });
});
