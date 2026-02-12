import { Request, Response } from "express";
import { login } from "../controllers/authController";
import { supabase } from "../lib/supabase";

// Mock Supabase
jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe("Auth Controller - Login", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  // --- NEW VALIDATION TESTS ---

  it("should return 400 if email or password is missing", async () => {
    mockReq = { body: { email: "" } }; // Missing password

    await login(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Email and password are required",
    });
  });

  it("should return 400 if email format is invalid", async () => {
    mockReq = { body: { email: "not-an-email", password: "123" } };

    await login(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid email format" });
  });

  // --- LOGIC TESTS ---

  it("should return 200 and token on success", async () => {
    mockReq = { body: { email: "test@example.com", password: "password123" } };

    // Mock successful Supabase response
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: { access_token: "fake-jwt-token" },
        user: { user_metadata: { role: "admin" } },
      },
      error: null,
    });

    await login(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "fake-jwt-token",
        role: "admin",
        message: "Login successful!",
      })
    );
  });

  it("should return 401 on Supabase auth error", async () => {
    mockReq = { body: { email: "test@example.com", password: "wrong" } };

    // Mock Supabase failure
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    await login(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Invalid login credentials",
    });
  });
});
