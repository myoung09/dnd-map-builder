// Perlin noise implementation for organic terrain generation

export class PerlinNoise {
  private gradients: Map<string, [number, number]> = new Map();
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  private hash(x: number, y: number): string {
    return `${x},${y}`;
  }

  private getGradient(x: number, y: number): [number, number] {
    const key = this.hash(x, y);
    
    if (!this.gradients.has(key)) {
      // Generate deterministic gradient based on position and seed
      const random = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
      const angle = (random - Math.floor(random)) * 2 * Math.PI;
      this.gradients.set(key, [Math.cos(angle), Math.sin(angle)]);
    }
    
    return this.gradients.get(key)!;
  }

  private dotProduct(x: number, y: number, vx: number, vy: number): number {
    const gradient = this.getGradient(x, y);
    return gradient[0] * vx + gradient[1] * vy;
  }

  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // Get noise value at position (x, y)
  noise(x: number, y: number): number {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const sx = x - x0;
    const sy = y - y0;

    const n0 = this.dotProduct(x0, y0, sx, sy);
    const n1 = this.dotProduct(x1, y0, sx - 1, sy);
    const ix0 = this.lerp(n0, n1, this.smoothstep(sx));

    const n2 = this.dotProduct(x0, y1, sx, sy - 1);
    const n3 = this.dotProduct(x1, y1, sx - 1, sy - 1);
    const ix1 = this.lerp(n2, n3, this.smoothstep(sx));

    return this.lerp(ix0, ix1, this.smoothstep(sy));
  }

  // Octave noise for more natural variation
  octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}
