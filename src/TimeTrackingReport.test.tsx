import MinutesCalc from './MinutesCalc';
import { TIME_REGEX, extractTimes, getAllTimes, parseLines } from './TimeTrackingReport';

describe('TIME_REGEX', () => {
	it('should match time lines', () => {
		expect(TIME_REGEX.test('12:30-1:15 test')).toBe(true);
	});
	it('should extract for the matchers', () => {
		const matches = '12:30-1:15 test'.match(TIME_REGEX);

		expect(matches).not.toBeNull();

		if (matches === null) {
			return;
		}

		expect(matches?.length).toBe(6);
		expect(matches[1]).toBe('12:30');
		expect(matches[2]).toBe(':30');
	});
});

describe('extractTimes', () => {
	it('should extract times that include minutes', () => {
		expect(extractTimes('12:30-1:15 test')).toEqual({
			startTime: '12:30',
			endTime: '1:15',
			taskCode: 'test',
		});
	});
	it('should extract times that do not include minutes in start time', () => {
		expect(extractTimes('12-1:15 test')).toEqual({
			startTime: '12:00',
			endTime: '1:15',
			taskCode: 'test',
		});
	});
	it('should extract times that do not include minutes in end time', () => {
		expect(extractTimes('12:30-1 test')).toEqual({
			startTime: '12:30',
			endTime: '1:00',
			taskCode: 'test',
		});
	});
});

describe('parseLines', () => {
	it('should extract and group times', () => {
		expect(
			parseLines(`12:00-1:30 test
		//- Doing a thing
		1:30-2:30 test2
		//- Doing a different thing
		2:30-4 test
		//- Different from the first thing`)[0]
		).toMatchObject({
			test: {
				tasks: ['- Doing a thing', '- Different from the first thing'],
				times: [
					{ startTime: '12:00', endTime: '1:30' },
					{ startTime: '2:30', endTime: '4:00' },
				],
			},
			test2: {
				tasks: ['- Doing a different thing'],
				times: [{ startTime: '1:30', endTime: '2:30' }],
			},
		});
	});
});

describe('getAllTimes', () => {
	it('should extract all the times from the time map', () => {
		const timeCatMap = parseLines(`12:00-1:30 test
		//- Doing a thing
		1:30-2:30 test2
		//- Doing a different thing
		2:30-4 test
		//- Different from the first thing`)[0];

		expect(getAllTimes(timeCatMap)).toEqual([
			{ category: 'test', startTime: '12:00', endTime: '1:30' },
			{ category: 'test', startTime: '2:30', endTime: '4:00' },
			{ category: 'test2', startTime: '1:30', endTime: '2:30' },
		]);
	});
});

describe('MinutesCalc', () => {
	it('should total minutes correctly', () => {
		const allTimes = [
			{ category: 'test', startTime: '12:00', endTime: '1:30' },
			{ category: 'test2', startTime: '1:30', endTime: '2:30' },
			{ category: 'test', startTime: '2:30', endTime: '4:00' },
		];

		const mc = new MinutesCalc(allTimes);

		mc.calcTotalMinutes();

		expect(mc.minutesData.totalWorkingMinutes).toBe(240);
	});
});
