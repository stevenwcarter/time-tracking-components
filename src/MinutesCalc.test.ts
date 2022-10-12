import MinutesCalc, {
  compareTimes,
  minToTime,
  minToTimeDecimal,
  minutesDiff,
  roundNearestQuarter,
  TimePeriodData,
} from 'MinutesCalc';

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

describe('TimePeriodData', () => {
  const tpBuilder = (startTime: number | string, endTime: number | string) => {
    return { category: 'test', startTime: String(startTime), endTime: String(endTime) };
  };

  it('should fail validation on bad data', () => {
    expect(() => new TimePeriodData(tpBuilder(-1, 2)).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder(25, 2)).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder(1, -2)).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder(1, 24)).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder('1:-5', 2)).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder('1:61', 2)).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder(12, '1:-11')).validate()).toThrow();
    expect(() => new TimePeriodData(tpBuilder(12, '1:61')).validate()).toThrow();
  });
  it('should pass validation on good data', () => {
    expect(() => new TimePeriodData(tpBuilder(1, 2)).validate()).not.toThrow();
  });
});

describe('minutesDiff', () => {
  it('should calculate minutes between times', () => {
    expect(minutesDiff(12, 11, 12, 21)).toBe(10);
    expect(minutesDiff(12, 11, 13, 21)).toBe(70);
  });
});

describe('minToTime', () => {
  it('should convert minutes to expected time format', () => {
    expect(minToTime(0)).toBe('0:00');
    expect(minToTime(5)).toBe('0:05');
    expect(minToTime(70)).toBe('1:10');
  });
});

describe('roundNearestQuarter', () => {
  it('should convert to nearest quarter', () => {
    expect(roundNearestQuarter(0.23)).toBe('0.25');
    expect(roundNearestQuarter(0.88)).toBe('1.00');
  });
  it('should round up if below .25', () => {
    expect(roundNearestQuarter(0.01)).toBe('0.25');
  });
});

describe('minToTimeDecimal', () => {
  it('should format as decimal properly', () => {
    expect(minToTimeDecimal(55)).toBe('1.00 hrs - 0.92 hrs before rounding');
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
