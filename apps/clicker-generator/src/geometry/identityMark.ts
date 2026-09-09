// Covert model-identity mark. A deterministic constellation of tiny voids buried in
// the ALWAYS-SOLID BASE SLAB under the body — invisible on prints and normal previews,
// but demonstrable in any slicer's horizontal layer/section view. The constellation is
// derived from a build-time secret (VITE_MARK_SEED, a GitHub Actions secret), so the
// mechanism can be public while the actual signature stays private and provable.
//
// (2026-07-30) Relocated from a solid ring around the switch into the base slab, so the
// body can be hollowed for filament savings without ever unburying the mark. Voids are
// authored in the base PLANE (polar r + angle only); the builder places them at the
// base mid-plane and clamps each diameter to the current base thickness, so the mark
// survives any user-set wall/base thickness. Dev builds (no seed) still add the
// hardcoded tier only; the deployed site adds both.

export interface MarkVoid {
  /** Polar radius from switch #0's centre, mm (kept small so it stays inside the base). */
  r: number;
  /** Polar angle, degrees (rotated with the switch at build time). */
  thetaDeg: number;
  /** Nominal void sphere diameter, mm (the builder clamps this to the base thickness). */
  d: number;
}

/** Read the build-time secret. Empty (dev / node test) → secret tier disabled. */
export function getMarkSeed(): string {
  try {
    return (((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_MARK_SEED) as string) ?? '';
  } catch {
    return '';
  }
}

// xmur3 string hash → 32-bit seeds for a deterministic PRNG.
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// sfc32: small, fast, well-distributed PRNG → floats in [0, 1).
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function makePrng(seed: string): () => number {
  const s = xmur3(seed);
  return sfc32(s(), s(), s(), s());
}

function angularGap(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return Math.min(d, 360 - d);
}

/** Deterministic 5-void constellation for a seed. Same seed → same voids forever, so
 *  every model from the public site shares one fingerprint ("made by my generator").
 *  Radii stay in the 8.0–10.5 mm base ring; angles ≥ 25° apart. */
export function markVoids(seed: string): MarkVoid[] {
  if (!seed) return [];
  const rng = makePrng(seed);
  const voids: MarkVoid[] = [];
  const angles: number[] = [];
  let guard = 0;
  while (voids.length < 5 && guard++ < 1000) {
    const theta = rng() * 360;
    if (angles.some((a) => angularGap(a, theta) < 25)) continue;
    angles.push(theta);
    voids.push({
      r: 8.0 + rng() * 2.5, // 8.0..10.5 mm — outer base ring
      thetaDeg: theta,
      d: 0.7 + rng() * 0.2, // 0.7..0.9 mm (builder clamps to base thickness)
    });
  }
  return voids;
}

// ---------------------------------------------------------------------------
// Hardcoded watermark — always active, no secret required. A DIFFERENT (inner)
// radius band from the secret tier so the two never overlap. Even if someone copies
// the source and runs it without VITE_MARK_SEED, every model still carries these voids.
// ---------------------------------------------------------------------------
const HARDCODED_SEED = 'vostok-labs-clicker-generator-2026';

/** 4 hardcoded voids ALWAYS subtracted from the base — no build-time secret needed.
 *  Proves the model was built by this generator's code. Radii 5.0–7.0 mm. */
export function hardcodedVoids(): MarkVoid[] {
  const rng = makePrng(HARDCODED_SEED);
  const voids: MarkVoid[] = [];
  const angles: number[] = [];
  let guard = 0;
  while (voids.length < 4 && guard++ < 1000) {
    const theta = rng() * 360;
    if (angles.some((a) => angularGap(a, theta) < 30)) continue;
    angles.push(theta);
    voids.push({
      r: 5.0 + rng() * 2.0, // 5.0..7.0 mm — inner base ring (inside the secret band)
      thetaDeg: theta,
      d: 0.6 + rng() * 0.2, // 0.6..0.8 mm (builder clamps to base thickness)
    });
  }
  return voids;
}
