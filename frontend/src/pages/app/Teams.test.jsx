import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Teams from "./Teams";
import { api } from "../../lib/api";
import { AuthProvider } from "../../context/AuthContext";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn() }
}));

describe("Teams", () => {
  it("renders teams list", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/teams") {
        return Promise.resolve({ teams: [{ id: 1, name: "FC Example", captain_name: "山田", is_member: true }] });
      }
      return Promise.resolve({ tournaments: [] });
    });
    const { getByText } = render(
      <MemoryRouter>
        <AuthProvider>
          <Teams />
        </AuthProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(getByText("チーム管理")).toBeTruthy());
    expect(getByText("FC Example")).toBeTruthy();
    expect(getByText("メンバー一覧")).toBeTruthy();
  });

  it("renders empty state", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/teams") return Promise.resolve({ teams: [] });
      return Promise.resolve({ tournaments: [] });
    });
    const { getByText } = render(
      <MemoryRouter>
        <AuthProvider>
          <Teams />
        </AuthProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(getByText(/チームに参加して/)).toBeTruthy());
  });
});
