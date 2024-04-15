export interface WeightedItem<T> {
	item: T;
	weight: number;
}

export function weightedRandom<T>(items: WeightedItem<T>[]): T {
	const weights = items.reduce<number[]>(
		(acc, val) => [...acc, val.weight + (acc.at(acc.length - 1) ?? 0)],
		[],
	);
	const random = Math.random() * weights[weights.length - 1];
	return items[weights.findIndex(weight => weight > random)].item;
}
