const {
  loginSchema,
  registerSchema,
  updateUserSchema,
  switchCommandSchema,
  alertSchema,
  alertQuerySchema,
  truckCommandSchema,
  TRUCK_COMMANDS,
  SWITCH_ACTIONS,
} = require("../utils/validation");

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    it("deve aceitar login com username", () => {
      const result = loginSchema.validate({ username: "admin", password: "123456" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar login com email", () => {
      const result = loginSchema.validate({ email: "admin@test.com", password: "123456" });
      expect(result.error).toBeUndefined();
    });

    it("deve rejeitar login sem username e email", () => {
      const result = loginSchema.validate({ password: "123456" });
      expect(result.error).toBeDefined();
    });

    it("deve rejeitar senha curta", () => {
      const result = loginSchema.validate({ username: "admin", password: "123" });
      expect(result.error).toBeDefined();
    });
  });

  describe("registerSchema", () => {
    it("deve aceitar registro válido", () => {
      const result = registerSchema.validate({
        username: "admin",
        email: "admin@test.com",
        password: "123456",
      });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar registro com role", () => {
      const result = registerSchema.validate({
        username: "admin",
        email: "admin@test.com",
        password: "123456",
        role: "admin",
      });
      expect(result.error).toBeUndefined();
      expect(result.value.role).toBe("admin");
    });

    it("deve rejeitar role inválido", () => {
      const result = registerSchema.validate({
        username: "admin",
        email: "admin@test.com",
        password: "123456",
        role: "superadmin",
      });
      expect(result.error).toBeDefined();
    });

    it("deve rejeitar email inválido", () => {
      const result = registerSchema.validate({
        username: "admin",
        email: "invalid",
        password: "123456",
      });
      expect(result.error).toBeDefined();
    });
  });

  describe("updateUserSchema", () => {
    it("deve aceitar atualização de username", () => {
      const result = updateUserSchema.validate({ username: "newname" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar atualização de role", () => {
      const result = updateUserSchema.validate({ role: "viewer" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar atualização múltipla", () => {
      const result = updateUserSchema.validate({ username: "new", email: "new@test.com", role: "admin" });
      expect(result.error).toBeUndefined();
    });

    it("deve rejeitar objeto vazio", () => {
      const result = updateUserSchema.validate({});
      expect(result.error).toBeDefined();
    });

    it("deve rejeitar role inválido", () => {
      const result = updateUserSchema.validate({ role: "invalid" });
      expect(result.error).toBeDefined();
    });
  });

  describe("switchCommandSchema", () => {
    it("deve aceitar comando com action", () => {
      const result = switchCommandSchema.validate({ switchId: 1, action: "LEFT" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar comando com angle", () => {
      const result = switchCommandSchema.validate({ switchId: 2, angle: 90 });
      expect(result.error).toBeUndefined();
    });

    it("deve rejeitar switchId fora do range", () => {
      const result = switchCommandSchema.validate({ switchId: 5, action: "LEFT" });
      expect(result.error).toBeDefined();
    });

    it("deve rejeitar sem action e sem angle", () => {
      const result = switchCommandSchema.validate({ switchId: 1 });
      expect(result.error).toBeDefined();
    });

    it("deve aceitar todas as ações válidas", () => {
      SWITCH_ACTIONS.forEach(action => {
        const result = switchCommandSchema.validate({ switchId: 1, action });
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe("alertSchema", () => {
    it("deve aceitar alerta válido", () => {
      const result = alertSchema.validate({
        severity: "warning",
        module: "ferrovia",
        message: "Teste de alerta",
      });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar módulo quimica", () => {
      const result = alertSchema.validate({
        severity: "critical",
        module: "quimica",
        message: "Alerta químico",
      });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar módulo sistema", () => {
      const result = alertSchema.validate({
        severity: "info",
        module: "sistema",
        message: "Sistema atualizado",
      });
      expect(result.error).toBeUndefined();
    });

    it("deve rejeitar severidade inválida", () => {
      const result = alertSchema.validate({
        severity: "high",
        module: "ferrovia",
        message: "Teste",
      });
      expect(result.error).toBeDefined();
    });

    it("deve rejeitar módulo inválido", () => {
      const result = alertSchema.validate({
        severity: "warning",
        module: "invalid",
        message: "Teste",
      });
      expect(result.error).toBeDefined();
    });

    it("deve aceitar com details", () => {
      const result = alertSchema.validate({
        severity: "warning",
        module: "ferrovia",
        message: "Teste",
        details: { temperature: 45 },
      });
      expect(result.error).toBeUndefined();
    });
  });

  describe("alertQuerySchema", () => {
    it("deve aceitar query válida", () => {
      const result = alertQuerySchema.validate({ module: "ferrovia", severity: "warning" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar módulo quimica", () => {
      const result = alertQuerySchema.validate({ module: "quimica" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar query vazia", () => {
      const result = alertQuerySchema.validate({});
      expect(result.error).toBeUndefined();
    });

    it("deve usar defaults", () => {
      const result = alertQuerySchema.validate({});
      expect(result.value.limit).toBe(50);
      expect(result.value.offset).toBe(0);
    });
  });

  describe("truckCommandSchema", () => {
    it("deve aceitar comando válido", () => {
      const result = truckCommandSchema.validate({ command: "F" });
      expect(result.error).toBeUndefined();
    });

    it("deve aceitar todos os comandos", () => {
      TRUCK_COMMANDS.forEach(cmd => {
        const result = truckCommandSchema.validate({ command: cmd });
        expect(result.error).toBeUndefined();
      });
    });

    it("deve rejeitar comando inválido", () => {
      const result = truckCommandSchema.validate({ command: "Z" });
      expect(result.error).toBeDefined();
    });
  });
});
