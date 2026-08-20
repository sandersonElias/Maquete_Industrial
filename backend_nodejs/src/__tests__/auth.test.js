const crypto = require("crypto");

// Mock do config antes de importar o middleware
jest.mock("../config", () => ({
  GATEWAY_API_KEY: "test_api_key_123",
  JWT_SECRET: "test_jwt_secret",
}));

describe("authenticateGateway", () => {
  let authenticateGateway;

  beforeAll(() => {
    // Limpar cache do require
    delete require.cache[require.resolve("../middlewares/authenticateGateway")];
    authenticateGateway = require("../middlewares/authenticateGateway");
  });

  it("deve chamar next() com API key válida", () => {
    const req = { headers: { "x-api-key": "test_api_key_123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateGateway(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve retornar 403 com API key inválida", () => {
    const req = { headers: { "x-api-key": "wrong_key" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateGateway(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "API Key inválida" });
  });

  it("deve retornar 403 sem API key", () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateGateway(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("deve retornar 403 com API key vazia", () => {
    const req = { headers: { "x-api-key": "" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateGateway(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("authenticateToken", () => {
  let authenticateToken;
  const jwt = require("jsonwebtoken");

  beforeAll(() => {
    delete require.cache[require.resolve("../middlewares/authenticateToken")];
    authenticateToken = require("../middlewares/authenticateToken");
  });

  it("deve chamar next() com token válido", () => {
    const token = jwt.sign({ id: "user1", role: "admin" }, "test_jwt_secret", { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe("user1");
  });

  it("deve retornar 401 sem token", () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("deve retornar 401 com token expirado", () => {
    const token = jwt.sign({ id: "user1" }, "test_jwt_secret", { expiresIn: "-1h" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token expirado" });
  });

  it("deve retornar 403 com token inválido", () => {
    const req = { headers: { authorization: "Bearer invalid_token" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
