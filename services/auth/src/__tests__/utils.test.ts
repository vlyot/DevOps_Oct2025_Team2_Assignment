import validator from "validator";

describe("Input Validation Utils", () => {
  it("should validate correct email formats", () => {
    expect(validator.isEmail("user@example.com")).toBe(true);
    expect(validator.isEmail("user.name+tag@company.co.uk")).toBe(true);
  });

  it("should reject invalid email formats", () => {
    expect(validator.isEmail("plainaddress")).toBe(false);
    expect(validator.isEmail("@missing-username.com")).toBe(false);
  });
});
