import locations from './locations.json';
import { randomIntInclusive, weightedRandom } from './rand';
import type { CountedStub } from './types';

export type Event = ItemEvent | EncounterEvent;
export type ItemEvent = { type: 'item' } & CountedStub;
export interface EncounterEvent {
	type: 'encounter';
	enemies: CountedStub[];
}

export interface Timed {
	time: number;
};
export type TimedItemEvent = ItemEvent & Timed;
export type TimedEncounterEvent = EncounterEvent & Timed;
export type TimedEvent = TimedItemEvent | TimedEncounterEvent;

export function isItemEvent(event: TimedEvent): event is TimedItemEvent {
	return event.type === 'item';
}

export function isEncounterEvent(event: TimedEvent): event is TimedEncounterEvent {
	return event.type === 'encounter';
}

export function generateRandomEvent(id: number): Event {
	const location = locations[id];

	if (Math.random() < location.encounterChance) {
		const enemies = weightedRandom(
			location.encounters.map(elem => ({
				item: elem.enemies,
				weight: elem.weight,
			})),
		);
		return { type: 'encounter', enemies };
	} else {
		const data = weightedRandom(
			location.items.map(elem => ({
				item: { id: elem.id, count: elem.count },
				weight: elem.weight,
			})),
		);

		const count =
			typeof data.count === 'number'
				? data.count
				: randomIntInclusive(data.count[0], data.count[1]);

		return { type: 'item', id: data.id, count };
	}
}
