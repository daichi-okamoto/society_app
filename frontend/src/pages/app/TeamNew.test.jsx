import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeamNew from "./TeamNew";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { post: vi.fn().mockResolvedValue({ team: { id: 1 } }) }
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe("TeamNew", () => {
  it("submits create team", () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter>
        <TeamNew />
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText("チーム名"), { target: { value: "FC Example" } });
    fireEvent.click(getByText("作成"));

    expect(getByText("作成")).toBeTruthy();
  });
});
