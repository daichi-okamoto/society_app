import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeamNew from "./TeamNew";

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
  it("renders and can submit create team form", () => {
    const { getByText, getByLabelText } = render(
      <MemoryRouter>
        <TeamNew />
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText(/チーム名/), { target: { value: "FC Example" } });
    fireEvent.change(getByLabelText(/活動拠点/), { target: { value: "tokyo" } });
    fireEvent.click(getByLabelText("チームを作成する人が代表者になります"));
    fireEvent.click(getByText("チームを登録する"));

    expect(getByText("チーム作成")).toBeTruthy();
  });
});
