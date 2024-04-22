import { expect, it } from 'vitest';
import locations from './locations.json';

it('maintains location order', () => {
	const locationList = locations.map(location => location.name);
	expect(locationList).toMatchSnapshot();
});
