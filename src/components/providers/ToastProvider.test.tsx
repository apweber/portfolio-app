import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";

function ToastTrigger({ variant }: { variant: "success" | "error" }) {
  const { show } = useToast();
  return (
    <button onClick={() => show({ variant, message: "Test message" })}>
      Show Toast
    </button>
  );
}

function Wrapper({ variant = "success" }: { variant?: "success" | "error" }) {
  return (
    <ToastProvider>
      <ToastTrigger variant={variant} />
    </ToastProvider>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows a toast message when show() is called", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Show Toast" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Test message");
  });

  it("auto-dismisses the toast after 5 seconds", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Show Toast" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("throws when useToast is used outside ToastProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bare() {
      useToast();
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useToast must be used inside ToastProvider");
    consoleError.mockRestore();
  });
});
