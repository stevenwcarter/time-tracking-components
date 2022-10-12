import MinutesCalc, { compareTimes } from 'MinutesCalc';

describe('compareTimes', () => {
  it('should sort by hours', () => {
    expect(compareTimes(10, 10, 11, 10)).toBe(-1);
    expect(compareTimes(11, 10, 10, 10)).toBe(1);
    expect(compareTimes(10, 10, 10, 10)).toBe(0);
  });
  it('should sort by minutes', () => {
    expect(compareTimes(10, 11, 10, 12)).toBe(-1);
    expect(compareTimes(10, 12, 10, 11)).toBe(1);
    expect(compareTimes(10, 12, 10, 12)).toBe(0);
  });
  it('should sort by minutes and hours', () => {
    expect(compareTimes(11, 12, 12, 11)).toBe(-1);
    expect(compareTimes(12, 11, 11, 12)).toBe(1);
    expect(compareTimes(11, 12, 11, 12)).toBe(0);
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
