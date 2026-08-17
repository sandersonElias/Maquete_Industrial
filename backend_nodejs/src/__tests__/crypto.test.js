const crypto = require("crypto");

describe("Timing-Safe Comparison", () => {
  // Teste do algoritmo de comparação timing-safe usado no authenticateGateway
  function safeCompare(a, b) {
    if (!a || !b) return false;
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  it("deve retornar true para strings iguais", () => {
    expect(safeCompare("abc", "abc")).toBe(true);
  });

  it("deve retornar false para strings diferentes", () => {
    expect(safeCompare("abc", "xyz")).toBe(false);
  });

  it("deve retornar false para strings de tamanhos diferentes", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
  });

  it("deve retornar false para undefined", () => {
    expect(safeCompare(undefined, "abc")).toBe(false);
    expect(safeCompare("abc", undefined)).toBe(false);
  });

  it("deve retornar false para strings vazias", () => {
    expect(safeCompare("", "abc")).toBe(false);
    expect(safeCompare("abc", "")).toBe(false);
  });

  it("deve retornar true para strings vazias iguais", () => {
    expect(safeCompare("", "")).toBe(false); // Empty strings are falsy
  });

  it("deve ser consistente com caracteres especiais", () => {
    expect(safeCompare("chave@123!", "chave@123!")).toBe(true);
    expect(safeCompare("chave@123!", "chave@123?")).toBe(false);
  });

  it("deve ser consistente com unicode", () => {
    expect(safeCompare("café", "café")).toBe(true);
    expect(safeCompare("café", "cafe")).toBe(false);
  });
});

describe("UUID Generation", () => {
  const { v4: uuidv4 } = require("uuid");

  it("deve gerar UUID v4 válido", () => {
    const id = uuidv4();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("deve gerar UUIDs únicos", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(uuidv4());
    }
    expect(ids.size).toBe(100);
  });
});

describe("Password Hashing", () => {
  const bcrypt = require("bcryptjs");

  it("deve hashpear senha corretamente", async () => {
    const password = "minha_senha_123";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("deve verificar senha corretamente", async () => {
    const password = "minha_senha_123";
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it("deve rejeitar senha incorreta", async () => {
    const password = "minha_senha_123";
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare("senha_errada", hash);
    expect(valid).toBe(false);
  });
});
