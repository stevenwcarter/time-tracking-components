export interface TimeInterval {
  startTime: string;
  endTime: string;
}
export interface TimePeriod {
  category: string;
  startTime: string;
  endTime: string;
}

export interface TaskGroup {
  times: TimeInterval[];
  tasks: string[];
  minutes: number;
  category: string;
  timePeriods: string[];
}
export interface TimeCatMap {
  [key: string]: TaskGroup;
}

export interface NumberMap {
  [key: string]: number;
}
