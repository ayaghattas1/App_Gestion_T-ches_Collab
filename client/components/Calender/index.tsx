"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import { useSession } from "next-auth/react";
import moment, { Moment } from "moment";
import './tooltip.css';
import getTaskStyle from './getTaskStyle'; // Ensure correct import path

interface Task {
  _id: string;
  nom: string;
  description: string;
  responsable: string;
  createdAt: string;
  duree_maximale?: number;
  columnName: string; // Added columnName
}

const Calendar: React.FC = () => {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!session?.user?.accessToken) return;

      try {
        const projectsResponse = await axios.get("http://localhost:5000/projects", {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        });

        const projects = projectsResponse.data.projects.filter((project: any) =>
          project.membres.some((member: any) => member.utilisateur === session.user._id)
        );

        const tasks: Task[] = [];

        for (const project of projects) {
          for (const columnId of project.columns) {
            const columnResponse = await axios.get(`http://localhost:5000/column/${columnId}`, {
              headers: { Authorization: `Bearer ${session.user.accessToken}` }
            });
            const columnName = columnResponse.data.model.nom; // Get column name

            for (const taskId of columnResponse.data.model.taches) {
              const taskResponse = await axios.get(`http://localhost:5000/tache/${taskId}`, {
                headers: { Authorization: `Bearer ${session.user.accessToken}` }
              });
              const task = taskResponse.data.model;

              if (task.responsable === session.user._id) {
                tasks.push({ ...task, columnName }); // Add column name to task
              }
            }
          }
        }
        setTasks(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, [session]);

  const renderTasks = (day: Moment) => {
    const tasksForDay = tasks.filter(task => {
      const taskStart = moment(task.createdAt);
      return day.isSame(taskStart, 'day');
    });

    return tasksForDay.map(task => {
      const taskStart = moment(task.createdAt);
      const taskEnd = taskStart.clone().add(task.duree_maximale || 2, 'days').subtract(1, 'day');
      const taskDuration = taskEnd.diff(taskStart, 'days') + 1;

      return (
        <div
          key={task._id}
          className="relative mb-1 text-xs rounded-sm text-white tooltip-container"
          style={{
            gridColumnEnd: `span ${taskDuration}`,
            zIndex: 1,
            width: `calc(${taskDuration} * 100%)`,
            backgroundColor: getTaskStyle(task, task.columnName), 
            padding: '2px',
            marginBottom: '2px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '20px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
          onClick={() => setSelectedTask(task)}
        >
          <span className="font-semibold">{task.nom}</span>
          <div className="tooltip-text">
            <strong>{task.nom}</strong><br />
            <span>{task.description}</span><br />
            <span>{moment(task.createdAt).format('D MMM YYYY')} - {moment(task.createdAt).add(task.duree_maximale || 2, 'days').format('D MMM YYYY')}</span>
          </div>
        </div>
      );
    });
  };

  const renderCalendar = () => {
    const startDate = moment().startOf('month').startOf('week');
    const endDate = moment().endOf('month').endOf('week');
    const weeks: JSX.Element[] = [];

    let day = startDate.clone();

    while (day.isBefore(endDate, 'day')) {
      const days = Array(7).fill(0).map((_, i) => {
        const currentDay = day.clone();
        day.add(1, 'day');
        return (
          <td key={i} className="relative ease h-20 cursor-pointer border border-stroke p-2 transition duration-500 hover:bg-gray dark:border-strokedark dark:hover:bg-meta-4 md:h-25 md:p-6 xl:h-31">
            <span className="font-medium text-black dark:text-white">
              {currentDay.date()}
            </span>
            <div className="relative flex flex-col h-full">
              {renderTasks(currentDay)}
            </div>
          </td>
        );
      });

      weeks.push(
        <tr key={day.format('YYYY-MM-DD')} className="grid grid-cols-7">
          {days}
        </tr>
      );
    }

    return weeks;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Calendar" />

      <div className="w-full max-w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <table className="w-full">
          <thead>
            <tr className="grid grid-cols-7 rounded-t-sm bg-primary text-white">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                <th key={i} className="flex h-15 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-5">
                  <span className="hidden lg:block">{day}</span>
                  <span className="block lg:hidden">{day.substring(0, 3)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderCalendar()}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <div id="taskModal" className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close" onClick={() => setSelectedTask(null)}>&times;</span>
            <h2>{selectedTask.nom}</h2>
            <p><strong>Description:</strong> {selectedTask.description}</p>
            <p><strong>Responsable:</strong> {session?.user?.lastname}</p>
            <p><strong>Date de début:</strong> {moment(selectedTask.createdAt).format('D MMM YYYY')}</p>
            <p><strong>Durée maximale:</strong> {selectedTask.duree_maximale} jours</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
