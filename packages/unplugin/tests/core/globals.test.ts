import { describe, expect, it } from "vitest";
import { detectNamesToProtect } from "../../src/core/globals.js";

describe("detectNamesToProtect", () => {
  describe("autoGlobals: true", () => {
    it("detects exported function declarations", () => {
      const code = "export function onOpen() {}\nexport function doGet() {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["onOpen", "doGet"]);
    });

    it("detects exported async function declarations", () => {
      const code = "export async function doPost(e) { return e; }";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["doPost"]);
    });

    it("detects exported const declarations", () => {
      const code = "export const handler = () => {};";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["handler"]);
    });

    it("detects exported let declarations", () => {
      const code = "export let counter = 0;";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["counter"]);
    });

    it("detects exported var declarations", () => {
      const code = "export var legacy = true;";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["legacy"]);
    });

    it("detects exported class declarations", () => {
      const code = "export class MyService {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["MyService"]);
    });
  });

  describe("autoGlobals: false", () => {
    it("does not auto-detect exported names", () => {
      const code = "export function onOpen() {}";
      const result = detectNamesToProtect(code, [], false);
      expect(result).toEqual([]);
    });

    it("returns globals that are declared in the code", () => {
      const code = "function processData() { return 1; }";
      const result = detectNamesToProtect(code, ["processData"], false);
      expect(result).toEqual(["processData"]);
    });
  });

  describe("globals filtering", () => {
    it("filters out globals not declared in the code", () => {
      const code = "function onOpen() {}";
      const result = detectNamesToProtect(code, ["onOpen", "notDeclared"], true);
      expect(result).toEqual(["onOpen"]);
    });

    it("returns empty array when no globals and no exports", () => {
      const code = "function internal() {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual([]);
    });

    it("returns empty array when globals is empty and autoGlobals is false", () => {
      const code = "export function onOpen() {}";
      const result = detectNamesToProtect(code, [], false);
      expect(result).toEqual([]);
    });
  });

  describe("deduplication", () => {
    it("does not duplicate when a name is both in globals and exported", () => {
      const code = "export function onOpen() {}";
      const result = detectNamesToProtect(code, ["onOpen"], true);
      expect(result).toEqual(["onOpen"]);
    });
  });

  describe("regex safety", () => {
    it("handles names with regex-special characters in globals gracefully", () => {
      // Names with special chars won't match typical declarations, so they are filtered out
      const code = "function normal() {}";
      const result = detectNamesToProtect(code, ["func.name", "a+b"], true);
      expect(result).toEqual([]);
    });
  });
});
