import { describe, expect, it } from "vitest";
import { proximoSeguro, rotaPublica, rotaSoVisitante } from "./proximo";

describe("proximoSeguro", () => {
  it("aceita caminhos internos com query e hash", () => {
    expect(proximoSeguro("/workflow")).toBe("/workflow");
    expect(proximoSeguro("/validacao/leads?x=1#a")).toBe("/validacao/leads?x=1#a");
  });
  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "javascript:alert(1)",
    "evil.com",
    "/%0d%0a" + "\r\n",
    "/a\\b",
    "",
  ])("bloqueia %j", (v) => {
    expect(proximoSeguro(v)).toBe("/");
  });
  it("usa o padrão para nulo e indefinido", () => {
    expect(proximoSeguro(null)).toBe("/");
    expect(proximoSeguro(undefined, "/x")).toBe("/x");
  });
  it("não volta para rotas de autenticação", () => {
    expect(proximoSeguro("/login")).toBe("/");
    expect(proximoSeguro("/cadastro?a=1")).toBe("/");
    expect(proximoSeguro("/auth/confirmar")).toBe("/");
  });
});

describe("rotaPublica / rotaSoVisitante", () => {
  it("libera auth e APIs com Bearer próprio", () => {
    for (const p of ["/login", "/cadastro", "/auth/confirmar", "/api/context", "/api/context/direcao/oferta", "/api/workflow"])
      expect(rotaPublica(p)).toBe(true);
  });
  it("protege o resto (inclusive prefixos parecidos)", () => {
    for (const p of ["/", "/workflow", "/api/contexto", "/authx", "/login/x", "/api/outra"])
      expect(rotaPublica(p)).toBe(false);
  });
  it("só login e cadastro são exclusivas de visitante", () => {
    expect(rotaSoVisitante("/login")).toBe(true);
    expect(rotaSoVisitante("/cadastro")).toBe(true);
    expect(rotaSoVisitante("/auth/confirmar")).toBe(false);
  });
});
