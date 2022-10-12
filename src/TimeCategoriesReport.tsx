import { TimeCategory } from 'MinutesCalc';
import { TimeCategoryReport } from 'TimeCategoryReport';

interface TimeCategoriesReportProps {
  categories: TimeCategory[];
}

export const TimeCategoriesReport = (props: TimeCategoriesReportProps) => {
  return (
    <div>
      {props.categories.map((c, i) => (
        <TimeCategoryReport key={`timecategory${i}`} category={c} />
      ))}
    </div>
  );
};
