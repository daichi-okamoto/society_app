import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import Payment from "./Payment";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: { post: vi.fn().mockResolvedValue({ checkout_url: "https://example.com" }) }
}));

const assignMock = vi.fn();
Object.defineProperty(window, "location", {
  value: { assign: assignMock },
  writable: true
});

describe("Payment", () => {
  it("redirects to checkout", async () => {
    const { getByText, getByLabelText } = render(<Payment />);
    fireEvent.change(getByLabelText("申込ID"), { target: { value: "1" } });
    fireEvent.click(getByText("決済へ進む"));

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith("https://example.com"));
  });
});
