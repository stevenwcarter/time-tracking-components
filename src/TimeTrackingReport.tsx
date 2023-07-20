import MinutesCalc, { DateResults } from './MinutesCalc';
import { TaskGroup, TimeCatMap, TimePeriod } from './TimeTrackingTypes';
import { timeDisplay } from 'displayHelpers';
import { TimeCategoriesReport } from 'TimeCategoriesReport';

export const TIME_REGEX = /^(\d{1,2}(:\d{2})?)-(\d{1,2}(:\d{2})?) (.*)/;

export const extractTimes = (line: string) => {
  const matches = line.match(TIME_REGEX);

  if (matches === null || (matches && matches.length !== 6)) {
    throw new Error('Could not parse times');
  }

  let startTime = matches[1];
  const startMinutes = matches[2];
  let endTime = matches[3];
  const endMinutes = matches[4];
  const taskCode = matches[5];

  if (!startMinutes) {
    startTime += ':00';
  }

  if (!endMinutes) {
    endTime += ':00';
  }

  return { startTime, endTime, taskCode };
};

export const parseLines = (source: string): [TimeCatMap, TimePeriod[]] => {
  const timeCatMap: TimeCatMap = {};
  const lines = source.split('\n');
  let lastTask = '';

  const allTimePeriods: TimePeriod[] = [];

  lines
    .map((l) => l.trim())
    .forEach((line) => {
      if (TIME_REGEX.test(line)) {
        const { startTime, endTime, taskCode } = extractTimes(line);

        if (!timeCatMap[taskCode]) {
          timeCatMap[taskCode] = {
            times: [],
            tasks: [],
            minutes: 0,
            category: taskCode,
            timePeriods: [],
          };
        }

        timeCatMap[taskCode].times.push({ startTime, endTime });
        timeCatMap[taskCode].timePeriods.push(line.split(' ')[0]);
        lastTask = taskCode;
        allTimePeriods.push({ category: taskCode, startTime, endTime });
      } else if (line.startsWith('/') || line.startsWith('-')) {
        if (lastTask === '') {
          throw new Error('Times must come before tasks');
        }

        timeCatMap[lastTask].tasks.push(line.replace(/^\/\//, ''));
      }
    });

  return [timeCatMap, allTimePeriods];
};

export const getAllTimes = (timeCatMap: TimeCatMap) => {
  if (!timeCatMap) {
    throw new Error('No map found');
  }

  return Object.keys(timeCatMap).reduce((times: TimePeriod[], taskCode) => {
    const task: TaskGroup = timeCatMap[taskCode];

    return times.concat(
      task.times.map((t) => ({
        category: taskCode,
        startTime: t.startTime,
        endTime: t.endTime,
      }))
    );
  }, []);
};

interface TimeTrackingReportProps {
  source: string;
}

export const TimeTrackingReport = (props: TimeTrackingReportProps) => {
  const timeCatMap = parseLines(props.source);

  const allTimes = timeCatMap[1];

  const mc = new MinutesCalc(allTimes);

  mc.calcTotalMinutes();

  const results = new DateResults();

  results.minutesData = mc.minutesData;

  Object.keys(timeCatMap[0]).forEach((category) => {
    const tc = timeCatMap[0][category];

    tc.minutes = mc.minutesData.totalWorkingMinutesMap[tc.category];

    results.timeCategories.push(tc);
  });

  const minutesData = results.minutesData;

  return (
    <div>
      <h3>Time Tracking</h3>
      <div>
        <strong>Start Time: </strong>
        {minutesData.startTime}
        {'  '}

        <strong>End Time: </strong>
        {minutesData.endTime}
      </div>
      <hr />
      <div>
        <strong>Total Working Time: </strong>
        {timeDisplay(minutesData.totalWorkingMinutes)}
      </div>
      <div>
        <strong>Total dead time: </strong>
        {timeDisplay(minutesData.totalDeadMinutes)}
      </div>
      {minutesData.deadPeriods.length > 0 && (
        <>
          <hr />
          <strong>Dead Periods:</strong>
          <ul>
            {minutesData.deadPeriods.map((dp, i) => (
              <li key={`deadperiod${i}`}>{dp}</li>
            ))}
          </ul>
        </>
      )}
      {minutesData.alertSuspiciousDeadPeriod && (
        <strong>
          Please verify dead time periods as there is at least one suspiciously long dead period.
          Generally, this is a sign of bad data.
        </strong>
      )}
      <TimeCategoriesReport categories={results.timeCategories} />
    </div>
  );
};

export default TimeTrackingReport;
