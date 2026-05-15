// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearDemoData, demoStorageKeys } from "./reset";

describe("clearDemoData", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("removes only local demo Agent and Assessment data", () => {
    for (const key of demoStorageKeys()) {
      window.localStorage.setItem(key, "demo");
    }
    window.localStorage.setItem("averonix.company", "keep");
    window.localStorage.setItem("supabase.auth.token", "keep");

    clearDemoData();

    for (const key of demoStorageKeys()) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    expect(window.localStorage.getItem("averonix.company")).toBe("keep");
    expect(window.localStorage.getItem("supabase.auth.token")).toBe("keep");
  });
});
