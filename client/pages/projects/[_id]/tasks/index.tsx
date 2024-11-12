import { useRouter } from 'next/router';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSession } from 'next-auth/react';
import CustomAlerts from '@/components/CustomAlerts';
import '@/css/delete.scss';
import Select from 'react-select';
import { SingleValue } from 'react-select'; 
import moment from 'moment';
import { getSession } from 'next-auth/react'; 

interface Task {
  id: string;
  nom: string;
  responsable: string; 
  responsableDetails?: { 
    nom: string;
    photo: string;
  };
  createdAt: string;
  duree_maximale: number;
  files: string[];
}

interface Column {
  id: string;
  nom: string;
  taches: Task[];
  isAddingTask: boolean;
  newTaskName: string;
  selectedUserId: string;
}

interface Project {
  id: string;
  nom: string;
  columns: Column[];
}

interface User {
  id: string;
  name: string;
}

interface RoleOption {
  value: number;
  label: string;
}

const ProjectDetails: NextPage = () => {
  const { data: session } = useSession();
  console.log(session);
  const router = useRouter();
  const { _id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false); 
  const [currentColumnId, setCurrentColumnId] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDureeMaximale, setNewTaskDureeMaximale] = useState(2); 
  const [users, setUsers] = useState<User[]>([]); 
  const [allUsers, setAllUsers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [file, setFile] = useState(null); 
  const [fileURL, setFileURL] = useState(''); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isManager, setIsManager] = useState(false);

  const roles = [
    { id: 1, name: "Collaborator" },
    { id: 2, name: "Manager" },
    { id: 3, name: "Developer" },
    { id: 4, name: "Designer" }
  ];
  const roleOptions = roles.map(role => ({
    value: role.id,
    label: role.name
  }));
  const [selectedRole, setSelectedRole] = useState<SingleValue<RoleOption>>(null);

  const handleRoleChange = (option: SingleValue<RoleOption>) => {
    setSelectedRole(option);
  };

  const userOptions = allUsers.map(user => ({ value: user._id, label: user.email }));

  const handleAddMember = async () => {
    if (!selectedUser) return;
    try {
      const response = await axios.post(`http://localhost:5000/project/invite/${_id}`, {
        userId: selectedUser,
        role: selectedRole?.label,
      },
        {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`, 
        },
      });
      console.log('Member added successfully:', response.data);
      setAlert({ show: true, message: "Member added successfully !", type: 'success' });
      setShowAddMemberModal(false);
      setSelectedRole(null);
      await fetchColumns();
    } catch (error) {
      if (error.response?.status === 400) {
        setAlert({ show: true, message: "This user is already a member !", type: 'warning' });
      } else {
        console.log(selectedUser);
        console.error('Failed to add member:', error);
        setAlert({ show: true, message: "Sorry, Only managers can add member :[ !", type: 'error' });
      }
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setAlert({ show: true, message: 'Please select a file to upload.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file); 

    try {
      const response = await axios.post(`http://localhost:5000/tache/uploadfile/${selectedTask?._id}`, formData, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`, 
        },
      });

      if (response.status === 200) {
        const files = response.data.model.file;
        if (files && files.length > 0) {
          const lastFilePath = files[files.length - 1]; 
          const newTaskFileUrl = `http://localhost:5000/${lastFilePath.replace(/\\/g, '/')}`;
          setFileURL(newTaskFileUrl);
          console.log("File upload successful:", newTaskFileUrl);
          setAlert({ show: true, message: 'File uploaded successfully.', type: 'success' });
          await fetchColumns(); // Refresh the columns to get the updated task with the new file
        }
      } else {
        setAlert({ show: true, message: 'Failed to upload file.', type: 'error' });
      }
    } catch (error) {
      setError('An error occurred during file upload.');
      console.error("File upload error:", error);
    }
  };

  const normalizeFileUrlForBackend = (url) => {
    // Assuming the URL you receive is like "http://localhost:5000/uploads/file-name.pdf"
    // and you need to extract "uploads/file-name.pdf"
    const urlParts = url.split('/');
    const indexOfUploads = urlParts.indexOf('uploads');
    return urlParts.slice(indexOfUploads).join('/');
  };
  
  const handleFileDelete = async (taskId, fileUrl) => {
    const normalizedFileUrl = normalizeFileUrlForBackend(fileUrl);
  
    try {
      const response = await axios.delete(`http://localhost:5000/tache/${taskId}/files`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
        data: {
          data: normalizedFileUrl // Pass the normalized URL
        }
      });
  
      if (response.status === 200) {
        console.log("File deleted successfully:", response.data);
        setAlert({ show: true, message: 'File deleted successfully.', type: 'success' });
        // Update the state to remove the file from the UI
        await fetchColumns(); // Refresh the columns to reflect the file deletion
      } else {
        setAlert({ show: true, message: 'Failed to delete file.', type: 'error' });
      }
    } catch (error) {
      setError('An error occurred during file deletion.');
      console.error("File deletion error:", error);
    }
  };
  

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]); 
    } else {
      setAlert({ show: true, message: "No file selected.", type: 'error' });
    }
  };

  const handleTaskClick = (task) => {
    if (session?.user?._id === task.responsable) {
      setSelectedTask({
        ...task,
        responsable: task.responsable || users[0]?._id 
      });
      setIsModalOpen(true);
    } else {
      setAlert({ show: true, message: "You are not authorized to edit this task.", type: 'error' });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(`http://localhost:5000/tache/${selectedTask._id}`, {
        nom: selectedTask?.nom,
        responsable: selectedTask?.responsable,
        description: selectedTask?.description,
        duree_maximale: selectedTask?.duree_maximale
      });
      console.log('Task updated successfully:', response.data);
      await fetchColumns(); 
      closeModal(); 
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getU'); 
      console.log('Users fetched:', response.data.model);
      setAllUsers(response.data.model); 
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [_id]);

  const options = users.map(user => ({
    value: user.id,
    label: `${user.email}`
  }));

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? 'blue' : base.borderColor,
      '&:hover': {
        borderColor: state.isFocused ? 'darkblue' : base.borderColor,
      },
      boxShadow: state.isFocused ? null : null,
    }),
  };

  const handleSelectChange = selectedOption => {
    setSelectedUser(selectedOption.value);
  };

  const handleAddTask = async () => {
    console.log('Adding task for user ID:', selectedUser); 

    if (!currentColumnId || !selectedUser) {
      console.log('Selected user:', selectedUser);
      setAlert({ show: true, message: 'Failed to add task. Please Fill All Fields', type: 'error' });
      console.error('No column or user selected');
      return;
    }
    try {
      const response = await axios.post(`http://localhost:5000/tache/add/${currentColumnId}`, {
        nom: newTaskName,
        responsable: selectedUser,
        duree_maximale: newTaskDureeMaximale
      });
      console.log('Task added successfully:', response.data);

      await fetchColumns();  
      setNewTaskName('');
      setNewTaskDureeMaximale(2); 
      setAlert({ show: true, message: 'Task added successfully !', type: 'success' });
    } catch (error) {
      setAlert({ show: true, message: 'Failed to add task. Please Fill All Fields', type: 'error' });
      console.log('Selected user:', selectedUser);
      console.error('Failed to add task:', error);
    }
  };

  const deleteTask = async (columnId, taskId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/tache/${taskId}`);
      if (response.status === 200) {
        console.log('Task deleted successfully');

        const updatedColumns = columns.map(column => {
          if (column._id === columnId) {
            return {
              ...column,
              tasks: column.tasks.filter(task => task._id !== taskId)
            };
          }
          return column;
        });
        setIsModalOpen(false);
        setColumns(updatedColumns);
        await fetchColumns();
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setAlert({ show: true, message: 'Failed to delete task.', type: 'error' });
    }
  };

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  function formatPhotoUrl(photoPath) {
    return photoPath ? `http://localhost:5000/${photoPath.replace(/\\/g, '/')}` : 'http://localhost:5000/middleware/uploads/unknown.png';
  }

  const getTaskBarColor = (task, columnName) => {
    const taskCreatedAt = moment(task.createdAt);
    const currentDate = moment();
    const dureeMaximale = task.duree_maximale || 2; 
    const dueDate = taskCreatedAt.clone().add(dureeMaximale, 'days');
    const daysUntilDue = dueDate.diff(currentDate, 'days');

    if (columnName !== "Done") {
      if (daysUntilDue === 1) {
        return 'orange';
      } else if (daysUntilDue === 0 || daysUntilDue < 0 ) {
        return 'red';
      } else if (daysUntilDue > 1) {
        return 'green';
      }
    }

    return 'green';
  };

  const fetchColumns = async () => {
    if (!_id) {
      console.log('Project ID is undefined');
      return;
    }

    try {
      const response = await axios.get<Project>(`http://localhost:5000/project/${_id}`);
      console.log('Fetched project:', response.data.model);
      if (response.status === 200) {
        const project = response.data.model;
        const columnsPromises = project.columns.map(columnId =>
          axios.get<Column>(`http://localhost:5000/column/${columnId}`)
        );
        const columnsResponses = await Promise.all(columnsPromises);

        const columnsWithTasks = await Promise.all(columnsResponses.map(async (columnResponse) => {
          const column = columnResponse.data;
          const tasksWithDetails = await Promise.all(column.model.taches.map(async (taskId) => {
            const taskResponse = await axios.get<Task>(`http://localhost:5000/tache/${taskId}`);
            const task = taskResponse.data.model;

            let responsableDetails = null;
            if (task.responsable) {
              try {
                const userResponse = await axios.get(`http://localhost:5000/${task.responsable}`);
                const user = userResponse.data.model;
                responsableDetails = {
                  nom: user.firstname,
                  photo: formatPhotoUrl(user.photo) 
                };
              } catch (userError) {
                console.error(`Error fetching user details for task ${task.id}:`, userError.message);
                responsableDetails = {
                  nom: 'Unknown',
                  photoUrl: 'middleware/uploads/unknown.png' 
                };
              }
            }

            return {
              ...task,
              responsableDetails,
              files: task.file ? task.file.map(filePath => `http://localhost:5000/${filePath.replace(/\\/g, '/')}`) : []
            };
          }));

          return {
            ...column,
            tasks: tasksWithDetails,
            isAddingTask: false,
            newTaskName: '',
            selectedUserId: ''
          };
        }));
        setColumns(columnsWithTasks);
      } else {
        console.error(`Failed to fetch project: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching project: ${error.message}`);
      
    }
  };

  useEffect(() => {
    fetchColumns();
  }, [_id]); 

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!_id || typeof _id !== 'string') return;
      const session = await getSession(); 

      try {
        const projectResponse = await axios.get<Project>(`http://localhost:5000/project/${_id}`);
        setProject(projectResponse.data);
        const memberDetails = projectResponse.data.model.membres.map(member => ({
          id: member.utilisateur._id,
          email: member.utilisateur.email,
          firstName: member.utilisateur.firstname,
          lastName: member.utilisateur.lastname,
          role: member.role,
          photo: `http://localhost:5000/${member.utilisateur.photo.replace(/\\/g, '/')}`
        }));
        console.log("memberDetails:", memberDetails); 
        console.log("session.user._id:", session?.user?._id); 
        setUsers(memberDetails);
        const columnsPromises = projectResponse.data.model.columns.map(columnId =>
          axios.get<Column>(`http://localhost:5000/column/${columnId}`)
        );
        const columnsResponses = await Promise.all(columnsPromises);
        const columnsWithTasks = await Promise.all(columnsResponses.map(async (columnResponse) => {
          const column = columnResponse.data;
          const tasksPromises = column.model.taches.map(taskId =>
            axios.get<Task>(`http://localhost:5000/tache/${taskId}`)
          );
          const tasksResponses = await Promise.all(tasksPromises);
          return {
            ...column,
            tasks: tasksResponses.map(response => response.data.model)
          };
        }));
        setColumns(columnsWithTasks);
        const currentUser = memberDetails.find(member => member.id === session?.user?._id);
        console.log('Current user:', currentUser);
        if (currentUser && currentUser.role === "Manager" || currentUser &&  currentUser.role === "manager") {
          setIsManager(true);
        } else {
          setIsManager(false);
        }
       
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project details:", error);
        setError("Failed to load project details. Please try again later.");
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [_id]);
  
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/tache/${draggableId}/move/${destination.droppableId}`, {}, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}` 
        }
      });

      console.log(typeof session?.user?._id, typeof response.data.tache.responsable);  

      console.log('Session User ID:', session?.user?._id); 
      console.log('Task Responsable ID:', response.data.tache.responsable);
      if (session?.user?._id !== response.data.tache.responsable) {
        console.error('Failed to move the task, not authorized :', response.data.error);
        return;
      }
      if (response.status === 200) {
        console.log('Task moved successfully:', response.data);

        await fetchColumns();  
      } else {

        console.error('Failed to move the task:', response.data.error);
      }
    } catch (error: unknown) {
      console.error('Error moving task:', error);

      if (axios.isAxiosError(error)) {

        if (error.response?.status === 404) {
          setAlert({ show: true, message: 'You are not authorized to move this task.', type: 'error' });
        } else {
          setAlert({ show: true, message: error.message, type: 'error' }); 
        }
      } else if (error instanceof Error) {

        setAlert({ show: true, message: error.message, type: 'error' });
      } else {

        setAlert({ show: true, message: 'An unexpected error occurred.', type: 'error' });
      }
    }
  };

  const handleAddColumn = async () => {
    const columnData = {
      name: "New Column", 
      tasks: [], 
    };

    try {
      const response = await axios.post(`http://localhost:5000/column/add/${_id}`, { nom: newColumnName }, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}` 
      }
      });
      if (response.status === 200) {
        setNewColumnName('');
        await fetchColumns(); 
        console.log('Column added successfully:', response.data);
        setIsAddingColumn(false);
      } else {
        throw new Error('Failed to add column');
      }
    } catch (error) {
      console.error('Error adding column:', error);
      setAlert({ show: true, message: 'Failed to add new column.', type: 'error' });
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (window.confirm("Are you sure you want to delete this column? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`http://localhost:5000/column/${columnId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        });
        if (response.status === 200) {
          setAlert({ show: true, message: 'Column deleted successfully!', type: 'success' });
          await fetchColumns();
        } else {
          throw new Error('Failed to delete column');
        }
      } catch (error) {
        console.error('Error deleting column:', error);
        setAlert({ show: true, message: 'Failed to delete column.', type: 'error' });
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      {alert.show && (
        <CustomAlerts
          message={alert.message}
          type={alert.type as 'error' | 'success' | 'warning'}
          onClose={() => setAlert({ show: false, message: '', type: '' })}
        />
      )}
      <Breadcrumb pageName="My Project" />

      <h2 className='mb-4'>Project's name: {project?.model.nom}</h2>

      { isManager && ( <button style={{
        width: '150px',  
        height: '40px',  
        backgroundColor: 'blue',
        color: 'white',
        borderRadius: '5px',
        marginBottom: '10px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
        onClick={() => setShowAddMemberModal(true)}>+ Add Member</button>
    )}
      {showAddMemberModal && (
        <div>
          <Select
            options={userOptions}
            onChange={handleSelectChange}
            placeholder="Select a user"
          />
          <Select
            options={roleOptions}
            value={selectedRole}
            onChange={handleRoleChange}
            placeholder="Select a role"
            className="my-react-select-container" 
            classNamePrefix="my-react-select" 
          />
          <button style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '10px 20px',
            marginLeft: '10px',
            marginTop: '10px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }} onClick={handleAddMember}>Confirm</button>
          <button style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '10px 20px',
            marginLeft: '10px',
            marginTop: '10px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }} onClick={() => setShowAddMemberModal(false)}>Cancel</button>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns-container" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px' }}>
          {columns.map((column, index) => (
            <Droppable key={column.model._id} droppableId={column.model._id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ borderRadius: '25px', margin: '8px', background: '#e2e2e2', padding: '10px', width: '250px',  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.12)' }}>
                  <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ marginLeft: '5px', fontWeight: 'bold', color: '#0A1172', fontSize: '20px' }}>{column.model.nom}</h2>
                    { isManager && ( <button type="button" className="btn-close" onClick={() => handleDeleteColumn(column.model._id)}>
                      <span className="icon-cross"></span>
                    </button>
                    )}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {column.tasks.map((task, taskIndex) => (
                      <Draggable key={task._id} draggableId={task._id} index={taskIndex}>
                        {(provided, snapshot) => (
                          <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, padding: '6px', margin: '4px', background: snapshot.isDragging ? 'lightblue' : '#fff', borderRadius: '4px' }}
                            onClick={() => handleTaskClick(task)}>
                            {task.nom}
                            {task.responsableDetails && (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <img
                                  src={task.responsableDetails.photo}
                                  alt="Responsable"
                                  style={{ width: 20, height: 20, borderRadius: '50%', marginRight: '8px' }}
                                />
                                <span style={{ color: 'darkblue', fontSize: 12 }}>
                                  {task.responsableDetails.nom}
                                </span>
                              </div>
                            )}
                            <div style={{
                              height: '5px',
                              backgroundColor: getTaskBarColor(task, column.model.nom),
                              borderRadius: '2px',
                              marginTop: '5px'
                            }}></div>
                            <div>
                              {task.files && task.files.length > 0 && (
                                <div>
                                  {task.files.map((fileUrl, fileIndex) => (
                                    <div key={fileIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        View File {fileIndex + 1}
                                      </a>
                                      <button
                                        style={{
                                         
                                          color: 'red',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '2px 6px',
                                          cursor: 'pointer'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFileDelete(task._id, fileUrl);
                                        }}
                                      >
                                        x
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'red',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              x
                            </button>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {isModalOpen && selectedTask && (
                      <div className="modal">
                        {alert.show && (
                          <CustomAlerts
                            message={alert.message}
                            type={alert.type as 'error' | 'success' | 'warning'}
                            onClose={() => setAlert({ show: false, message: '', type: '' })}
                          />
                        )}
                        <div className="grid grid-cols-5 gap-2">
                          <div className="col-span-5">
                            <div className="rounded-sm border border-stroke bg-white shadow-default">
                              <div className="border-b border-stroke px-5 py-3">
                                <h4>Edit Task</h4>
                              </div>
                              <div className="p-5">
                                <form onSubmit={handleUpdateTask}>
                                  <input
                                    className="w-full rounded border bg-gray px-4.5 py-3 mb-5"
                                    value={selectedTask?.nom}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, nom: e.target.value })}
                                    placeholder="Task Name"
                                  />
                                  <select
                                    className="w-full rounded border bg-gray px-4.5 py-3 mb-5"
                                    value={selectedTask?.responsable}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, responsable: e.target.value })}
                                  >
                                    {users.map(user => (
                                      <option key={user._id} value={user._id}>{user.email}</option>
                                    ))}
                                  </select>
                                  <textarea
                                    className="w-full rounded border bg-gray px-4.5 py-3 mb-5"
                                    rows="3"
                                    value={selectedTask?.description}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                    placeholder="Description"
                                  ></textarea>
                                  <input
                                    type="number"
                                    className="w-full rounded border bg-gray px-4.5 py-3 mb-5"
                                    value={selectedTask?.duree_maximale || ''}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, duree_maximale: e.target.value })}
                                    placeholder="Durée Maximale (in days)"
                                  />
                                  <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="file-input"
                                  />
                                  <button type="button" onClick={handleFileUpload} className="upload-button mb-5" style={{
                                    backgroundColor: 'blue',
                                    color: 'white',
                                    padding: '5px 10px',
                                    marginLeft: '10px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                  }}>
                                    Upload File
                                  </button>
                                  {error && <p className="error-message">{error}</p>}
                                  {fileURL && <p>File URL: <a href={fileURL} target="_blank" rel="noopener noreferrer" className="border text-white bg-blue-500">View File</a></p>}
                                  <div className="flex justify-end">
                                    <button type="button" onClick={closeModal} className="border px-6 py-2 mr-4">Cancel</button>
                                    <button type="submit" className="bg-blue-500 text-white px-6 py-2 mr-4">Save Changes</button>
                                    <button type="button" onClick={() => deleteTask(currentColumnId, selectedTask._id)} className="bg-red text-white px-6 py-2">Supprimer</button>
                                  </div>
                                </form>
                                <div className="mt-4">
                                  <h5>Files:</h5>
                                  {selectedTask.files && selectedTask.files.length > 0 ? (
                                    <div>
                                      {selectedTask.files.map((fileUrl, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                            View File {index + 1}
                                          </a>
                                          <button
                                            style={{
                                              backgroundColor: 'red',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              padding: '2px 6px',
                                              cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleFileDelete(selectedTask._id, fileUrl);
                                            }}
                                          >
                                            x
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p>No files uploaded.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <button onClick={() => {
                        const newColumns = columns.map((col, colIndex) => {
                          if (index === colIndex) {
                            return { ...col, isAddingTask: !col.isAddingTask };
                          }
                          return col;
                        });
                        setColumns(newColumns); setCurrentColumnId(column.model._id); console.log('Adding task to column ID:', column.model._id);
                      }} className="add-task-button">
                        + Add Task
                      </button>
                      {column.isAddingTask && (
                        <div className="add-task-form mb-4 border px-2 py-2 mr-4 bg-blue-100" style={{ borderRadius: 20 }}>
                          <input
                            style={{
                              width: '100%', 
                              padding: '8px 10px', 
                              fontFamily: 'Arial, sans-serif', 
                              border: '1px solid #ccc', 
                              borderRadius: '4px', 
                              backgroundColor: '#fff', 
                              color: '#333', 
                            }}
                            type="text"
                            placeholder="Task name"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="task-input mb-4"
                          />
                          <input
                            style={{
                              width: '100%', 
                              padding: '8px 10px', 
                              fontFamily: 'Arial, sans-serif', 
                              border: '1px solid #ccc', 
                              borderRadius: '4px', 
                              backgroundColor: '#fff',
                              color: '#333', 
                              marginBottom: '10px', 
                            }}
                            type="number"
                            placeholder="Max duration (days)"
                            value={newTaskDureeMaximale}
                            onChange={(e) => setNewTaskDureeMaximale(Number(e.target.value))}
                            className="task-input mb-4"
                          />
                          <Select
                            options={options}
                            onChange={handleSelectChange}
                            styles={customStyles}
                            value={options.find(option => option.value === selectedUser)}
                            placeholder="Select a user"
                            className="user-select mb-4"
                          />
                          <button onClick={() => handleAddTask()} style={{
                            backgroundColor: 'blue',
                            color: 'white',
                            padding: '10px 20px',
                            marginLeft: '10px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}>
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </ul>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
          {isManager && ( 
            <button
              onClick={() => setIsAddingColumn(true)}
              style={{
                width: '150px',  
                height: '40px',  
                backgroundColor: 'blue',
                color: 'white',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              + New Column
            </button>
          )}
          {isAddingColumn && (
            <div className="my-4">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
                style={{ padding: '10px', marginRight: '10px', width: '200px' }}
              />
              <button
                onClick={handleAddColumn}
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  marginTop: '10px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Add Column
              </button>
              <button
                onClick={() => setIsAddingColumn(false)}
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  padding: '10px 20px',
                  marginLeft: '10px',
                  marginTop: '10px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ProjectDetails;
