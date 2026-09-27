import { describe, expect, it } from 'vitest';

import Windy from './windy';

function createWindy() {
  return new Windy({
    canvas: document.createElement('canvas'),
  } as any);
}

describe('Windy', () => {
  it('stop() does not throw when called before start() has ever run', () => {
    // animationBucket is only created in start(); calling stop() first (e.g. a
    // layer removed immediately after being added) used to throw because
    // stop() called this.animationBucket.clear() unconditionally.
    const windy = createWindy();

    expect(() => windy.stop()).not.toThrow();
  });

  it('evolve() does not throw when called before start() has ever run', () => {
    const windy = createWindy();

    expect(() => (windy as unknown as { evolve: () => void }).evolve()).not.toThrow();
  });
});
