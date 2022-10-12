import { timeDisplay } from 'displayHelpers';
import { TimeCategory } from 'MinutesCalc';

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
