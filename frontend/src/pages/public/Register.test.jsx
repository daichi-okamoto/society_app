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

    fireEvent.change(getByLabelText("氏名"), { target: { value: "山田" } });
    fireEvent.change(getByLabelText("ふりがな"), { target: { value: "やまだ" } });
    fireEvent.change(getByLabelText("生年月日"), { target: { value: "1990-01-01" } });
    fireEvent.change(getByLabelText("電話"), { target: { value: "090-0000-0000" } });
    fireEvent.change(getByLabelText("メール"), { target: { value: "a@b.com" } });
    fireEvent.change(getByLabelText("住所"), { target: { value: "東京" } });
    fireEvent.change(getByLabelText("パスワード"), { target: { value: "password" } });
    fireEvent.click(getByText("登録"));

    expect(getByText("登録")).toBeTruthy();
  });
});
