import moment from 'moment';

const getTaskStyle = (task, columnName) => {
  const taskCreatedAt = moment(task.createdAt);
  const currentDate = moment();
  const dureeMaximale = task.duree_maximale || 2; // Default to 2 if not provided
  const dueDate = taskCreatedAt.clone().add(dureeMaximale, 'days');
  const daysUntilDue = dueDate.diff(currentDate, 'days');

  if (columnName !== "Done") {
    if (daysUntilDue === 1) {
      return 'orange';
    } else if (daysUntilDue === 0 || daysUntilDue < 0) {
      return 'red';
    } else if (daysUntilDue > 1) {
      return 'green';
    }
  }

  return 'green';
};

export default getTaskStyle;
