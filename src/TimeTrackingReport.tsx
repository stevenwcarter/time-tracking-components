import MinutesCalc, { DateResults, minToTime, minToTimeDecimal, TimeCategory } from './MinutesCalc';
import React from 'react';
import { TaskGroup, TimeCatMap, TimePeriod } from './TimeTrackingTypes';
import { timeDisplay } from 'displayHelpers';

export const TIME_REGEX = /(\d{1,2}(:\d{2})?)-(\d{1,2}(:\d{2})?) (.*)/;

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

interface TimeCategoriesReportProps {
  categories: TimeCategory[];
}

interface TimeCategoryReportProps {
  category: TimeCategory;
}

export const TimeCategoryReport = (props: TimeCategoryReportProps) => {
  const { category } = props;

  return (
    <div>
      <hr />
      <br />
      <div>
        <strong>Billing Code: </strong>
        {category.category} - {timeDisplay(category.minutes)}
      </div>
      {category.tasks.length > 0 && (
        <pre>
          {category.tasks.map((task, i) => (
            <div key={`${category}task${i}`}>{task}</div>
          ))}
        </pre>
      )}

      <br />
    </div>
  );
};

export const TimeCategoriesReport = (props: TimeCategoriesReportProps) => {
  return (
    <div>
      {props.categories.map((c, i) => (
        <TimeCategoryReport key={`timecategory${i}`} category={c} />
      ))}
    </div>
  );
};

export const TimeTrackingReport = (props: any) => {
  const timeCatMap = parseLines(props.source);

  const allTimes = timeCatMap[1];

  console.log('All times', allTimes);

  const mc = new MinutesCalc(allTimes);

  mc.calcTotalMinutes();

  const results = new DateResults();

  results.minutesData = mc.minutesData;

  Object.keys(timeCatMap[0]).forEach((category) => {
    const tc = timeCatMap[0][category];

    tc.minutes = mc.minutesData.totalWorkingMinutesMap[tc.category];

    results.timeCategories.push(tc);
  });

  console.log(timeCatMap);
  console.log(results);

  return (
    <div>
      <h3>Time Tracking</h3>
      <div>
        <strong>Start Time: </strong>
        {results.minutesData.startTime}
        {'  '}

        <strong>End Time: </strong>
        {results.minutesData.endTime}
      </div>
      <hr />
      <div>
        <strong>Total Working Time: </strong>
        {timeDisplay(results.minutesData.totalWorkingMinutes)}
      </div>
      <div>
        <strong>Total dead time: </strong>
        {timeDisplay(results.minutesData.totalDeadMinutes)}
      </div>
      {results.minutesData.deadPeriods.length > 0 && (
        <>
          <hr />
          <strong>Dead Periods:</strong>
          <ul>
            {results.minutesData.deadPeriods.map((dp, i) => (
              <li key={`deadperiod${i}`}>{dp}</li>
            ))}
          </ul>
        </>
      )}
      {results.minutesData.alertSuspiciousDeadPeriod && (
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
