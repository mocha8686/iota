import { afterEach, describe, expect, it } from 'vitest';

import { weightedRandom } from './rand';

function changeRandom(n: number) {
	Math.random = () => n;
}

describe('weighted random', () => {
	const originalRandom = Math.random;

	afterEach(() => {
		Math.random = originalRandom;
	});

	it('can randomize with weights', () => {
		const items = [
			{ item: 'foo', weight: 2 },
			{ item: 'bar', weight: 1 },
			{ item: 'baz', weight: 3 },
			{ item: 'qux', weight: 4 },
		];

		const expected = ['foo', 'foo', 'bar', 'baz', 'baz', 'baz', 'qux', 'qux', 'qux', 'qux'];

		for (let i = 0; i < 10; i++) {
			console.log(`Iteration ${i}`);
			changeRandom(i / 10);
			expect(weightedRandom(items)).toBe(expected[i]);
		}
	});
});
