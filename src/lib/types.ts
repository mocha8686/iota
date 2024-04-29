export interface Stub {
	id: number;
}

export type CountedStub = Stub & { count: number };
export type RangedStub = Stub & { count: [number, number] };
export type RangedCountedStub = CountedStub | RangedStub;

export type WeightedStub = Stub & { weight: number };
export type DropStub = RangedCountedStub & WeightedStub;

export interface Encounter {
	weight: number;
	enemies: RangedCountedStub[];
}

export interface Location {
	name: string;
	items: DropStub[];
	encounterChance: number;
	encounters: Encounter[];
}
