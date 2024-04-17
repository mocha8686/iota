export interface WeightedItem<T> {
	item: T;
	weight: number;
}

export function weightedRandom<T>(items: WeightedItem<T>[]): T {
	const weights = items.reduce<number[]>(
		(acc, val) =>
			acc.toSpliced(-1, 0, val.weight + (acc.at(acc.length - 1) ?? 0)),
		[],
	);
	const random = Math.random() * weights[weights.length - 1];
	return items[weights.findIndex(weight => weight > random)].item;
}

export const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min)) + min;

export const randomIntInclusive = (min: number, max: number): number =>
	randomInt(min, max + 1);
