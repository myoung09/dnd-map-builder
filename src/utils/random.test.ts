// Unit tests for SeededRandom class
// Verifies reproducibility across seeds for all random generation methods

import { SeededRandom } from './random';

describe('SeededRandom', () => {
  describe('Reproducibility Tests', () => {
    test('identical seeds produce identical sequences of next() values', () => {
      const seed = 12345;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      // Generate 100 random numbers and verify they match
      for (let i = 0; i < 100; i++) {
        const value1 = rng1.next();
        const value2 = rng2.next();
        expect(value1).toBe(value2);
        expect(value1).toBeGreaterThanOrEqual(0);
        expect(value1).toBeLessThan(1);
      }
    });

    test('identical seeds produce identical sequences of nextInt() values', () => {
      const seed = 54321;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      // Test various ranges
      const ranges = [
        { min: 0, max: 10 },
        { min: -5, max: 5 },
        { min: 100, max: 200 },
        { min: 0, max: 1000 }
      ];

      for (const range of ranges) {
        for (let i = 0; i < 50; i++) {
          const value1 = rng1.nextInt(range.min, range.max);
          const value2 = rng2.nextInt(range.min, range.max);
          expect(value1).toBe(value2);
          expect(value1).toBeGreaterThanOrEqual(range.min);
          expect(value1).toBeLessThanOrEqual(range.max);
          expect(Number.isInteger(value1)).toBe(true);
        }
      }
    });

    test('identical seeds produce identical sequences of nextFloat() values', () => {
      const seed = 99999;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      // Test various float ranges
      const ranges = [
        { min: 0, max: 1 },
        { min: -10, max: 10 },
        { min: 0, max: 100 },
        { min: -0.5, max: 0.5 }
      ];

      for (const range of ranges) {
        for (let i = 0; i < 50; i++) {
          const value1 = rng1.nextFloat(range.min, range.max);
          const value2 = rng2.nextFloat(range.min, range.max);
          expect(value1).toBe(value2);
          expect(value1).toBeGreaterThanOrEqual(range.min);
          expect(value1).toBeLessThan(range.max);
        }
      }
    });

    test('identical seeds produce identical boolean sequences', () => {
      const seed = 77777;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      // Generate boolean-like values using next() < 0.5
      for (let i = 0; i < 100; i++) {
        const bool1 = rng1.next() < 0.5;
        const bool2 = rng2.next() < 0.5;
        expect(bool1).toBe(bool2);
        expect(typeof bool1).toBe('boolean');
      }
    });

    test('identical seeds produce identical shuffle() results', () => {
      const seed = 11111;
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      const shuffled1 = rng1.shuffle(array);
      const shuffled2 = rng2.shuffle(array);

      expect(shuffled1).toEqual(shuffled2);
      expect(shuffled1.length).toBe(array.length);
      
      // Verify all elements are present (just shuffled)
      const sorted1 = [...shuffled1].sort((a, b) => a - b);
      expect(sorted1).toEqual(array);
    });

    test('identical seeds produce identical choice() results', () => {
      const seed = 22222;
      const array = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      for (let i = 0; i < 50; i++) {
        const choice1 = rng1.choice(array);
        const choice2 = rng2.choice(array);
        expect(choice1).toBe(choice2);
        expect(array).toContain(choice1);
      }
    });
  });

  describe('Different Seeds Produce Different Sequences', () => {
    test('different seeds produce different next() sequences', () => {
      const rng1 = new SeededRandom(1000);
      const rng2 = new SeededRandom(2000);

      let differentCount = 0;
      for (let i = 0; i < 100; i++) {
        const value1 = rng1.next();
        const value2 = rng2.next();
        if (value1 !== value2) {
          differentCount++;
        }
      }

      // Expect at least 95% of values to be different
      expect(differentCount).toBeGreaterThan(95);
    });

    test('different seeds produce different nextInt() sequences', () => {
      const rng1 = new SeededRandom(3000);
      const rng2 = new SeededRandom(4000);

      let differentCount = 0;
      for (let i = 0; i < 100; i++) {
        const value1 = rng1.nextInt(0, 100);
        const value2 = rng2.nextInt(0, 100);
        if (value1 !== value2) {
          differentCount++;
        }
      }

      // Expect at least 90% of values to be different
      expect(differentCount).toBeGreaterThan(90);
    });
  });

  describe('Distribution Tests', () => {
    test('next() produces values uniformly distributed between 0 and 1', () => {
      const rng = new SeededRandom(5555);
      const buckets = [0, 0, 0, 0, 0]; // 5 buckets for ranges [0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0]
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const value = rng.next();
        const bucketIndex = Math.min(Math.floor(value * 5), 4);
        buckets[bucketIndex]++;
      }

      // Each bucket should have roughly 200 values (20% of 1000)
      // Allow 30% deviation for statistical variance
      const expectedPerBucket = iterations / 5;
      const tolerance = expectedPerBucket * 0.3;

      for (const count of buckets) {
        expect(count).toBeGreaterThan(expectedPerBucket - tolerance);
        expect(count).toBeLessThan(expectedPerBucket + tolerance);
      }
    });

    test('nextInt() produces integers within specified range', () => {
      const rng = new SeededRandom(6666);
      const min = 10;
      const max = 20;

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('nextFloat() produces floats within specified range', () => {
      const rng = new SeededRandom(7777);
      const min = -5.5;
      const max = 10.5;

      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
      }
    });
  });

  describe('Edge Cases', () => {
    test('nextInt() with min === max returns that value', () => {
      const rng = new SeededRandom(8888);
      const value = 42;

      for (let i = 0; i < 10; i++) {
        expect(rng.nextInt(value, value)).toBe(value);
      }
    });

    test('nextFloat() with min === max returns that value', () => {
      const rng = new SeededRandom(9999);
      const value = 3.14;

      for (let i = 0; i < 10; i++) {
        const result = rng.nextFloat(value, value);
        expect(result).toBeGreaterThanOrEqual(value);
        expect(result).toBeLessThan(value + 0.0001); // Allow tiny floating point error
      }
    });

    test('shuffle() does not modify original array', () => {
      const rng = new SeededRandom(10000);
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];

      rng.shuffle(original);

      expect(original).toEqual(copy);
    });

    test('choice() works with single-element array', () => {
      const rng = new SeededRandom(11000);
      const array = ['only'];

      for (let i = 0; i < 10; i++) {
        expect(rng.choice(array)).toBe('only');
      }
    });
  });

  describe('Linear Congruential Generator Properties', () => {
    test('LCG produces full period before repeating', () => {
      const rng = new SeededRandom(1);
      const seen = new Set<string>();
      let iterations = 0;
      const maxIterations = 10000; // Test first 10k values

      for (let i = 0; i < maxIterations; i++) {
        const value = rng.next();
        const key = value.toFixed(10); // Use fixed precision to detect duplicates
        
        if (seen.has(key)) {
          // Found a repeat
          break;
        }
        
        seen.add(key);
        iterations++;
      }

      // LCG should have a long period (ideally close to modulus 233280)
      // We should see thousands of unique values before any repeat
      expect(iterations).toBeGreaterThan(1000);
    });

    test('sequential seeds produce different initial values', () => {
      const values = [];
      for (let seed = 1; seed <= 10; seed++) {
        const rng = new SeededRandom(seed);
        values.push(rng.next());
      }

      // All 10 values should be different
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(10);
    });
  });

  describe('Determinism Across Multiple Method Calls', () => {
    test('mixed method calls produce identical sequences with same seed', () => {
      const seed = 33333;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      // Mix different method calls
      expect(rng1.next()).toBe(rng2.next());
      expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100));
      expect(rng1.nextFloat(0, 1)).toBe(rng2.nextFloat(0, 1));
      expect(rng1.nextInt(50, 150)).toBe(rng2.nextInt(50, 150));
      expect(rng1.next()).toBe(rng2.next());
      
      const array = [1, 2, 3, 4, 5];
      expect(rng1.shuffle(array)).toEqual(rng2.shuffle(array));
      expect(rng1.choice(array)).toBe(rng2.choice(array));
    });
  });
});
