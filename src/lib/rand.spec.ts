import { afterEach, describe, expect, it } from 'vitest';
import { randomInt, randomIntInclusive, weightedRandom } from './rand';

function changeRandom(n: number) {
	Math.random = () => n;
}

describe('random', () => {
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

		const expected = [
			'foo',
			'foo',
			'bar',
			'baz',
			'baz',
			'baz',
			'qux',
			'qux',
			'qux',
			'qux',
		];

		for (let i = 0; i < 10; i++) {
			changeRandom(i / 10);
			expect(weightedRandom(items)).toBe(expected[i]);
		}
	});

	it('can generate random ints', () => {
		const expected = [0, 0, 1, 2, 2, 3, 4, 4, 5, 6];
		const expectedWeighted = [0, 0, 1, 2, 3, 4, 4, 5, 6, 7];

		for (let i = 0; i < 10; i++) {
			changeRandom(i / 10);
			expect(randomInt(0, 7)).toBe(expected[i]);
			expect(randomIntInclusive(0, 7)).toBe(expectedWeighted[i]);
		}
	});
});
