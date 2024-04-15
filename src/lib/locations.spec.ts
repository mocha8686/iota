import { expect, it } from 'vitest';

import locations from './locations.json';

it('maintains location order', () => {
	expect(locations).toMatchSnapshot();
});
