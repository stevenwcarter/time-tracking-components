import { NumberMap, TimePeriod } from './TimeTrackingTypes';

export class TimePeriodData {
  timePeriod: TimePeriod;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;

  constructor(timePeriod: TimePeriod) {
    [this.startHour, this.startMin] = timePeriod.startTime.split(':').map((t) => parseInt(t, 10));
    [this.endHour, this.endMin] = timePeriod.endTime.split(':').map((t) => parseInt(t, 10));

    this.timePeriod = timePeriod;
  }

  validate(): void {
    if (
      this.startHour < 0 ||
      this.startHour > 23 ||
      this.endHour < 0 ||
      this.endHour > 23 ||
      this.startMin < 0 ||
      this.startMin > 59 ||
      this.endMin < 0 ||
      this.endMin > 59
    ) {
      throw new Error(
        `Invalid time specified in time period: ${this.timePeriod.startTime}-${this.timePeriod.endTime}`
      );
    }
  }
}

export const compareTimes = (
  leftHour: number,
  leftMin: number,
  rightHour: number,
  rightMin: number
) => {
  if (leftHour < rightHour) {
    return -1;
  }

  if (leftHour > rightHour) {
    return 1;
  }

  if (leftMin < rightMin) {
    return -1;
  }

  if (leftMin > rightMin) {
    return 1;
  }

  return 0;
};

export const minutesDiff = (
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number
) => {
  let minDiff = 0;

  minDiff += (endHour - startHour) * 60;
  minDiff += endMin - startMin;

  return minDiff;
};

export const minToTime = (minutes: number) => {
  const hoursStr = String(Math.floor(minutes / 60));

  let minutesString = String(minutes % 60);

  if (minutesString.length === 1) {
    minutesString = `0${minutesString}`;
  }

  return `${hoursStr}:${minutesString}`;
};

const roundNearestQuarter = (number: number) => {
  return (Math.round(number * 4) / 4).toFixed(2);
};

export const minToTimeDecimal = (minutes: number) => {
  const unrounded = (minutes / 60).toFixed(2);
  const hoursStr = String(roundNearestQuarter(minutes / 60));

  if (unrounded !== hoursStr) {
    return `${hoursStr} hrs - ${unrounded} hrs before rounding`;
  }

  return `${hoursStr} hrs`;
};

export class TimeCategory {
  category = '';
  timePeriods: string[] = [];
  tasks: string[] = [];
  minutes = 0;
}

export class MinutesData {
  totalWorkingMinutesMap: NumberMap = {};
  startTime = '';
  endTime = '';
  totalWorkingMinutes = 0;
  totalDeadMinutes = 0;
  deadPeriods: string[] = [];
  alertSuspiciousDeadPeriod = false;
}

export class DateResults {
  timeCategories: TimeCategory[] = [];
  minutesData: MinutesData = new MinutesData();
}

export default class MinutesCalc {
  timePeriods: TimePeriod[] = [];
  usingMilitaryTime = false;
  firstTimePeriod = false;
  previousEndHour = 0;
  previousEndMin = 0;
  timePeriodDataList: TimePeriodData[] = [];
  minutesData: MinutesData = new MinutesData();

  constructor(timePeriods: TimePeriod[]) {
    this.timePeriods = timePeriods;
  }

  initialize() {
    this.usingMilitaryTime = false;
    this.firstTimePeriod = true;
    this.previousEndHour = 0;
    this.previousEndMin = 0;

    this.timePeriodDataList = [];

    for (let i = 0; i < this.timePeriods.length; i++) {
      const timePeriod = this.timePeriods[i];
      const tp = new TimePeriodData(timePeriod);

      tp.validate();
      this.timePeriodDataList.push(tp);

      if (tp.startHour > 12 || tp.endHour > 12 || tp.startHour === 0 || tp.endHour === 0) {
        this.usingMilitaryTime = true;
      }
    }
  }

  calcTotalMinutes() {
    this.initialize();

    for (let i = 0; i < this.timePeriodDataList.length; i++) {
      this.addPeriod(this.timePeriodDataList[i]);
    }
  }

  addPeriod(tpd: TimePeriodData) {
    /*
     * When using non-military time, we will convert times to military for purpose
     * of calculation.  Note that if we bleed into the next day, hours will start from
     * 24:00.  i.e. 2:30 AM on the next day will actually be 26:30 after this code executes
     *
     * All non-military time periods are assumed to be < 12 hours in length.
     * Otherwise 5:00-6:00 could be either 1 hour or 13 hours.
     */

    /*
     * ** MILITARY TIME **
     * If the end time is earlier than the start time, add 24 hours to the end time.
     * This can happen if we bleed into the next day, such as 23:00-1:00.  In this
     * case, we need to update the time period to 23:00-25:00.
     *
     * ** NON-MILITARY TIME **
     * If the end time is earlier than the start time, add 12 hours to the end time.
     * Thus, 11:00-1:00 is converted to 11:00-13:00.
     */
    if (compareTimes(tpd.startHour, tpd.startMin, tpd.endHour, tpd.endMin) === 1) {
      tpd.endHour += this.usingMilitaryTime ? 24 : 12;
    }

    /*
     * ** MILITARY TIME **
     * If this time period appears to start before the last period ended,
     * add 24 hours.  An example would be where previous time period ended
     * at 23:30, and next time period is 1:00-2:00 of the next day.  This next period
     * needs to be made 25:00-26:00.
     *
     * ** NON-MILITARY TIME **
     * If this time period appears to start before the last period ended,
     * add 12 hours.  An example would be where previous time period ended
     * at 12:30, and next time period is 1:00-5:00.  This next time period
     * needs to be made 13:00-18:00.
     */
    while (
      compareTimes(tpd.startHour, tpd.startMin, this.previousEndHour, this.previousEndMin) === -1
    ) {
      tpd.startHour += this.usingMilitaryTime ? 24 : 12;
      tpd.endHour += this.usingMilitaryTime ? 24 : 12;
    }

    /* except for the first time period, calculate the dead time */
    if (this.firstTimePeriod) {
      this.firstTimePeriod = false;
      this.minutesData.startTime = this.calcRealTime(tpd.startHour, tpd.startMin, false);
    } else {
      const deadMins = minutesDiff(
        this.previousEndHour,
        this.previousEndMin,
        tpd.startHour,
        tpd.startMin
      );

      if (deadMins > 0) {
        const deadHours = deadMins / 60;

        if (
          (this.usingMilitaryTime && deadHours >= 23) ||
          (!this.usingMilitaryTime && deadHours >= 11)
        ) {
          /*
           * If a dead period equals almost 24 hours military or 12 hours non-military, it is likely that
           * this dead period is caused by an overlap in time.  The user should be warned that they should
           * verify that the suspicious dead period is indeed valid.
           */
          this.minutesData.alertSuspiciousDeadPeriod = true;
        }

        this.minutesData.totalDeadMinutes += deadMins;
        this.minutesData.deadPeriods.push(
          `${this.calcRealTime(
            this.previousEndHour,
            this.previousEndMin,
            false
          )}-${this.calcRealTime(tpd.startHour, tpd.startMin, false)}`
        );
      }

      this.minutesData.endTime = this.calcRealTime(tpd.endHour, tpd.endMin, false);
    }

    const minutesWorked = minutesDiff(tpd.startHour, tpd.startMin, tpd.endHour, tpd.endMin);

    if (!this.minutesData.totalWorkingMinutesMap[tpd.timePeriod.category]) {
      this.minutesData.totalWorkingMinutesMap[tpd.timePeriod.category] = 0;
    }

    this.minutesData.totalWorkingMinutesMap[tpd.timePeriod.category] += minutesWorked;
    this.minutesData.totalWorkingMinutes += minutesWorked;

    this.previousEndHour = tpd.endHour;
    this.previousEndMin = tpd.endMin;
  }

  calcRealTime(hours: number, min: number, showDays: boolean) {
    let days = '';

    if (showDays) {
      const daysInt = hours / 24;

      if (daysInt > 0) {
        days = `(${daysInt} day${daysInt > 1 ? 's' : ''})`;
      }
    }

    while (hours > (this.usingMilitaryTime ? 23 : 12)) {
      hours -= this.usingMilitaryTime ? 24 : 12;
    }

    if (!this.usingMilitaryTime && hours === 0) {
      hours = 12;
    }

    return minToTime(hours * 60 + min) + days;
  }
}
