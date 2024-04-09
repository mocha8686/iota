import items from './items.json';

interface Item {
	id: number;
	name: string;
	plural: string;
}

export function getItemById(id: number): Item | undefined {
	const item = items.at(id);
	if (item && item.id !== id) throw new Error("ID's don't match keys, fix items.json");
	return item;
}

export function getItems(): Item[] {
	return items;
}
