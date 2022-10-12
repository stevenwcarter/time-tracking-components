import MinutesCalc from 'MinutesCalc';

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
