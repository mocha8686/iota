export interface CountedStub {
	id: number;
	count: [number, number] | number;
}

export interface WeightedStub {
	id: number;
	weight: number;
}

export type CountedWeightedStub = CountedStub & WeightedStub;

export interface Encounter {
	weight: number;
	enemies: CountedStub[];
}

export interface Location {
	name: string;
	items: CountedWeightedStub[];
	encounterChance: number;
	encounters: Encounter[];
}
