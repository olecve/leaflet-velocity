import { describe, expect, it } from "vitest";
import L from "leaflet";

declare global {
  interface Window {
    L?: unknown;
  }
}

describe("index side effects", () => {
  it("extends the imported Leaflet module directly, even when a different Leaflet-like object owns window.L", async () => {
    // Simulates a host page whose own, separately-bundled Leaflet instance is
    // sitting in the global slot — the exact situation that broke the
    // original plugin, which patched window.L instead of an imported module.
    const hostLeaflet = { ...L };
    window.L = hostLeaflet;

    await import("./index");

    expect(typeof (L as any).velocityLayer).toBe("function");
    expect(typeof (L as any).canvasLayer).toBe("function");
    expect(typeof (L as any).control.velocity).toBe("function");
    expect((hostLeaflet as any).velocityLayer).toBeUndefined();
    // window.L is left exactly as it was — this package never touches it.
    expect(window.L).toBe(hostLeaflet);
  });
});
