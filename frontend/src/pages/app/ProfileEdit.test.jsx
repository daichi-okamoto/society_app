import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProfileEdit from "./ProfileEdit";
import { api } from "../../lib/api";

const setUser = vi.fn();

vi.mock("../../lib/api", () => ({
  api: {
    patch: vi.fn(),
    postForm: vi.fn(),
  },
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "テストユーザー",
      name_kana: "テストユーザー",
      birth_date: "1997-10-05",
      email: "user@example.com",
      phone: "0000000000",
      address: "〒399-3102 長野県下伊那郡高森町 ラピュタ102",
      avatar_url: "",
    },
    setUser,
  }),
}));

describe("ProfileEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/me/edit"]}>
        <Routes>
          <Route path="/me/edit" element={<ProfileEdit />} />
          <Route path="/me" element={<div>マイページ</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows validation error details returned by the API", async () => {
    api.patch.mockRejectedValueOnce({
      status: 422,
      data: {
        error: {
          code: "validation_error",
          details: {
            email: ["is invalid"],
          },
        },
      },
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "変更を保存する" }));

    await waitFor(() => {
      expect(screen.getByText("メールアドレス：形式が正しくありません")).toBeInTheDocument();
    });
  });

  it("shows session expiration message on unauthorized update", async () => {
    api.patch.mockRejectedValueOnce({ status: 401 });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "変更を保存する" }));

    await waitFor(() => {
      expect(screen.getByText("ログイン状態の有効期限が切れました。再度ログインしてください。")).toBeInTheDocument();
    });
  });

  it("uses date input for birth date", async () => {
    renderPage();

    const birthDateInput = screen.getByLabelText("生年月日");
    expect(birthDateInput).toHaveAttribute("type", "date");
    expect(birthDateInput).toHaveValue("1997-10-05");
  });
});
