import { minToTime, minToTimeDecimal } from 'MinutesCalc';

export const timeDisplay = (minutes: number): string => {
  return `${minToTime(minutes)} (${minToTimeDecimal(minutes)})`;
};
