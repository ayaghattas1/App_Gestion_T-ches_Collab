"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CardDataStats from "../CardDataStats";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import moment from "moment";

const ChatCard = dynamic(() => import('../Chat/ChatCard'), {
  ssr: false, 
});

const TableOne = dynamic(() => import('../Tables/TableOne'), {
  ssr: false, 
});

const MapOne = dynamic(() => import('../Maps/MapOne'), {
  ssr: false,
});

const ChartOne = dynamic(() => import('../Charts/ChartOne'), {
  ssr: false, 
});

const ChartTwo = dynamic(() => import('../Charts/ChartTwo'), {
  ssr: false,
});

const ChartThree = dynamic(() => import('../Charts/ChartThree'), {
  ssr: false, 
});

const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [tasksInProgress, setTasksInProgress] = useState(0);
  const [projectRate, setProjectRate] = useState(0);
  const [taskRate, setTaskRate] = useState(0);

  useEffect(() => {
    const calculateRate = (items, key) => {
      const currentMonth = moment().month();
      const previousMonth = moment().subtract(1, 'months').month();
      const currentMonthCount = items.filter(item => moment(item[key]).month() === currentMonth).length;
      const previousMonthCount = items.filter(item => moment(item[key]).month() === previousMonth).length;
      if (previousMonthCount === 0) return currentMonthCount * 100;
      return ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    };

    const fetchData = async () => {
      try {
        const projectsResponse = await axios.get("http://localhost:5000/projects", {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        });
        const projects = projectsResponse.data.projects;

        const userProjects = projects.filter(project => 
          project.membres.some(member => member.utilisateur === session?.user?._id)
        );

        setTotalProjects(userProjects.length);

        let userTasks = [];
        let completedTaskIds = new Set();

        const columnsPromises = userProjects.flatMap(project =>
          project.columns.map(columnId =>
            axios.get(`http://localhost:5000/column/${columnId}`)
          )
        );
        const columnsResponses = await Promise.all(columnsPromises);
        const columns = columnsResponses.map(response => response.data);

        for (const column of columns) {
          if (column.model.nom === "Done") {
            column.model.taches.forEach(taskId => completedTaskIds.add(taskId));
          }
          const tasksPromises = column.model.taches.map(taskId =>
            axios.get(`http://localhost:5000/tache/${taskId}`)
          );
          const tasksResponses = await Promise.all(tasksPromises);
          const tasks = tasksResponses.map(response => response.data.model);

          userTasks = userTasks.concat(tasks.filter(task => task.responsable === session?.user?._id));
        }

        setTotalTasks(userTasks.length);
        const completedTasksCount = userTasks.filter(task => completedTaskIds.has(task._id)).length;
        setCompletedTasks(completedTasksCount);

        const overdueTasksCount = userTasks.filter(task => {
          const taskDueDate = moment(task.createdAt).clone().add(task.duree_maximale, 'days');
          const daysUntilDue = taskDueDate.diff(task.createdAt, 'days');
          //return moment().isAfter(taskDueDate) && !completedTaskIds.has(task._id);
            return (daysUntilDue  < 1 || daysUntilDue  === 1   )  && !completedTaskIds.has(task._id);
        }).length;
        setOverdueTasks(overdueTasksCount);

        const tasksInProgressCount = userTasks.length - (completedTasksCount + overdueTasksCount);
        setTasksInProgress(tasksInProgressCount);

        setProjectRate(calculateRate(userProjects, 'createdAt'));
        setTaskRate(calculateRate(userTasks, 'createdAt'));

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [session]);

  return (
    <>
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Total Projects " total={totalProjects.toString()} rate={`  ${projectRate.toFixed(2)}%`} levelUp>
          <svg
  className="fill-primary dark:fill-white"
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M10 4L12 6H21C21.55 6 22 6.45 22 7V19C22 19.55 21.55 20 21 20H3C2.45 20 2 19.55 2 19V5C2 4.45 2.45 4 3 4H10ZM10 2H3C1.9 2 1 2.9 1 4V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V7C23 5.9 22.1 5 21 5H12L10 3C10 2.45 9.55 2 9 2H10Z"
    fill="blue"
  />
  <rect x="6" y="9" width="12" height="2" fill="blue" />
  <rect x="6" y="13" width="8" height="2" fill="blue" />
</svg>
          </CardDataStats>
          <CardDataStats title="Total Tasks" total={totalTasks.toString()} rate={`${taskRate.toFixed(2)}%`} levelUp>
          <svg
  className="fill-primary dark:fill-white"
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 7L10 14L7 11L8.41 9.59L10 11.17L15.59 5.59L17 7Z"
    fill="blue"
  />
</svg>
          </CardDataStats>
        </div>
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats title="Completed Tasks" total={completedTasks.toString()}  levelUp>
              <svg
                className="fill-primary dark:fill-white"
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
               <path
      d="M20.285 5.47l-11.55 11.55-5.175-5.175a1.255 1.255 0 00-1.78 0c-.49.49-.49 1.28 0 1.77l6.05 6.05c.48.49 1.26.49 1.75 0l12.325-12.32a1.25 1.25 0 10-1.775-1.775z"
      fill="green"
    />
              </svg>
            </CardDataStats>
            <CardDataStats title="In progress Tasks" total={tasksInProgress.toString()} levelDown>
            <svg
  className="fill-primary dark:fill-white"
  width="20"
  height="20"
  viewBox="0 0 20 20"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
>
  <circle cx="10" cy="10" r="8" stroke="#ccc" strokeWidth="2" fill="none" />
  <circle cx="10" cy="2" r="2" fill="orange">
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 10 10"
      to="360 10 10"
      dur="1s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
            </CardDataStats>
            <CardDataStats title="Overdue Tasks" total={overdueTasks.toString()} levelDown >
            <svg
  className="fill-primary dark:fill-white"
  width="24"
  height="22"
  viewBox="0 0 24 22"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M12 10.586L16.95 5.636C17.34 5.246 17.97 5.246 18.36 5.636C18.75 6.026 18.75 6.656 18.36 7.046L13.414 12L18.36 16.95C18.75 17.34 18.75 17.97 18.36 18.36C17.97 18.75 17.34 18.75 16.95 18.36L12 13.414L7.05 18.36C6.66 18.75 6.03 18.75 5.64 18.36C5.25 17.97 5.25 17.34 5.64 16.95L10.586 12L5.64 7.05C5.25 6.66 5.25 6.03 5.64 5.64C6.03 5.25 6.66 5.25 7.05 5.64L12 10.586Z"
    fill="red"
  />
</svg>

            </CardDataStats>
           
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        <ChartThree />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard />
      </div>
    </>
  );
};

export default Dashboard;
