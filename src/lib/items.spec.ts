import { expect, it } from 'vitest';

import items from './items.json';

it('maintains item order', () => {
	expect(items).toMatchSnapshot();
});
