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
  it("renders team profile draft and invite code from team detail", async () => {
    window.localStorage.setItem(
      "team-profile:1",
      JSON.stringify({
        locationLabel: "東京都渋谷区",
        introduction: "社会人中心で週末に活動しています。"
      })
    );

    api.get.mockImplementation((path) => {
      if (path === "/teams") {
        return Promise.resolve({ teams: [{ id: 1, name: "FC Example", is_member: true }] });
      }
      if (path === "/teams/1") {
        return Promise.resolve({
          team: {
            id: 1,
            name: "FC Example",
            status: "pending",
            join_code: "TS-654321",
            members: []
          }
        });
      }
      if (path === "/tournaments") {
        return Promise.resolve({ tournaments: [] });
      }
      return Promise.resolve({});
    });

    const { getByText } = render(
      <MemoryRouter>
        <AuthProvider>
          <Teams />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText("TS-654321")).toBeTruthy());
    expect(getByText("ID: 1")).toBeTruthy();
    expect(getByText("未承認")).toBeTruthy();
    expect(getByText("東京都渋谷区")).toBeTruthy();
    expect(getByText("社会人中心で週末に活動しています。")).toBeTruthy();
  });

  it("renders teams list", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/teams") {
        return Promise.resolve({ teams: [{ id: 1, name: "FC Example", captain_name: "山田", is_member: true }] });
      }
      if (path === "/teams/1") {
        return Promise.resolve({
          team: {
            id: 1,
            name: "FC Example",
            status: "approved",
            join_code: "TS-123456",
            members: []
          }
        });
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

  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });
});
