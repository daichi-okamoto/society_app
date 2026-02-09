import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn()
  }
}));

function ShowUser() {
  const { user, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return <div>{user ? user.email : "guest"}</div>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it("loads current user from /users/me", async () => {
    api.get.mockResolvedValue({ user: { email: "user@example.com", role: "participant" } });

    const { getByText } = render(
      <AuthProvider>
        <ShowUser />
      </AuthProvider>
    );

    await waitFor(() => expect(getByText("user@example.com")).toBeTruthy());
    expect(api.get).toHaveBeenCalledWith("/users/me");
  });

  it("sets user null on error", async () => {
    api.get.mockRejectedValue(new Error("unauthorized"));

    const { getByText } = render(
      <AuthProvider>
        <ShowUser />
      </AuthProvider>
    );

    await waitFor(() => expect(getByText("guest")).toBeTruthy());
  });
});
