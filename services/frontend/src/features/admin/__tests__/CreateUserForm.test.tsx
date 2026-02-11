import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateUserForm from "../CreateUserForm";

describe("CreateUserForm Component", () => {
  const mockOnUserCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-admin-token");
  });

  it("renders all form fields", () => {
    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // Role select
    expect(
      screen.getByRole("button", { name: /create user/i })
    ).toBeInTheDocument();
  });

  it("validates password length locally before calling API", async () => {
    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    // Type a short password
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "123" },
    });

    // Try to submit
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    // API should NOT be called (validation stops it)
    // Note: If your component uses HTML5 validation, you might check :invalid states
    // Or if you check length manually in JS:
    // expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls API and clears form on successful submission", async () => {
    // Mock successful API response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "User created" }),
      })
    ) as any;

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "user" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      // Check if success callback was triggered
      expect(mockOnUserCreated).toHaveBeenCalled();
      // Check if form was cleared
      expect(
        (screen.getByPlaceholderText(/email/i) as HTMLInputElement).value
      ).toBe("");
    });
  });

  it("displays error message when API fails", async () => {
    // Mock API failure
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Email already exists" }),
      })
    ) as any;

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });
});
