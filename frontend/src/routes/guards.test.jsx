import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequireAuth, RequireAdmin } from "./guards";
import { AuthProvider, useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", async () => {
  const actual = await vi.importActual("../context/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn()
  };
});

const Protected = () => <div>protected</div>;

function renderWith(route, element) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={element}>
          <Route path="/protected" element={<Protected />} />
        </Route>
        <Route path="/login" element={<div>login</div>} />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("guards", () => {
  it("redirects to login when unauthenticated", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    const { getByText } = renderWith("/protected", <RequireAuth />);
    expect(getByText("login")).toBeTruthy();
  });

  it("allows access when authenticated", () => {
    useAuth.mockReturnValue({ user: { role: "participant" }, loading: false });
    const { getByText } = renderWith("/protected", <RequireAuth />);
    expect(getByText("protected")).toBeTruthy();
  });

  it("redirects non-admin to home", () => {
    useAuth.mockReturnValue({ user: { role: "participant" }, loading: false });
    const { getByText } = renderWith("/protected", <RequireAdmin />);
    expect(getByText("home")).toBeTruthy();
  });
});
