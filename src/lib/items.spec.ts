import { expect, it } from 'vitest';
import items from './items.json';

it('maintains item order', () => {
	const itemList = items.map(item => item.name);
	expect(itemList).toMatchSnapshot();
});
