"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import Select, { SingleValue } from 'react-select';
import CustomAlerts from '@/components/CustomAlerts';

interface RoleOption {
  value: number;
  label: string;
}

interface StateOption {
  value: number;
  label: string;
}
interface ModelOption {
  value: number;
  label: string;
}

const TableOne = () => {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<SingleValue<any>>(null);
  const [newProject, setNewProject] = useState({
    nom: '',
    etat: '',
    completion: 0,
    model: '',
    membres: []
  });

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

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

  const states = [
    { id: 1, name: "In progress" },
    { id: 2, name: "Done" },
  ];
  const stateOptions = states.map(state => ({
    value: state.id,
    label: state.name
  }));
  const [selectedState, setSelectedState] = useState<SingleValue<StateOption>>(null);

  const models = [
    { id: 1, name: "Kanban" },
    { id: 2, name: "Scrum" },
  ];
  const modelOptions = models.map(model => ({
    value: model.id,
    label: model.name
  }));
  const [selectedModel, setSelectedModel] = useState<SingleValue<ModelOption>>(null);

  const handleRoleChange = (option: SingleValue<RoleOption>) => {
    setSelectedRole(option);
  };

  const handleStateChange = (option: SingleValue<StateOption>) => {
    setSelectedState(option);
    setSelectedProject((prevProject: any) => ({ ...prevProject, etat: option.label }));
  };

  const handleModelChange = (option: SingleValue<ModelOption>) => {
    setSelectedModel(option);
    setSelectedProject((prevProject: any) => ({ ...prevProject, model: option.label }));
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (status === "authenticated" && session?.user?.accessToken) {
        try {
          const response = await axios.get('http://localhost:5000/projects', {
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          });
          const fetchedProjects = response.data.projects;

          const projectsWithUserRole = fetchedProjects.map((project: any) => {
            const member = project.membres.find((membre: any) => membre.utilisateur === session?.user?._id);
            const userRole = member ? member.role : 'Not a member';
            return { ...project, userRole };
          });
          const filteredProjects = projectsWithUserRole.filter(project => project.userRole !== 'Not a member');
          setProjects(filteredProjects);
          //setProjects(projectsWithUserRole);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching projects:", error);
          setError("Failed to load projects. Please try again later.");
          setLoading(false);
        }
      }
    };

    fetchProjects();
  }, [session?.user?.accessToken, status]);

  const fetchProjects = async () => {
    if (!session?.user?.accessToken) {
      setError("Authentication required.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/projects', {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      const fetchedProjects = response.data.projects;

      const projectsWithUserRole = fetchedProjects.map((project: any) => {
        const member = project.membres.find((membre: any) => membre.utilisateur === session?.user?._id);
        const userRole = member ? member.role : 'Not a member';
        return { ...project, userRole };
      });
      const filteredProjects = projectsWithUserRole.filter(project => project.userRole !== 'Not a member');
      setProjects(filteredProjects);
      //setProjects(projectsWithUserRole);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects. Please try again later.");
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      const projectData = response.data.model;
      console.log('Fetched project data:', projectData);

      const memberDetails = projectData.membres.map((member: any) => ({
        _id: member.utilisateur._id,
        email: member.utilisateur.email,
        firstname: member.utilisateur.firstname,
        lastname: member.utilisateur.lastname,
        role: member.role,
        photo: `http://localhost:5000/${member.utilisateur.photo.replace(/\\/g, '/')}`
      }));

      const detailedProject = { ...projectData, membres: memberDetails };
      console.log('Detailed project data with members:', detailedProject);

      setSelectedModel(modelOptions.find(option => option.label === projectData.model));
      setSelectedState(stateOptions.find(option => option.label === projectData.etat));
      setSelectedProject(detailedProject);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching project details:", error);
      setError("Failed to load project details. Please try again later.");
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await axios.delete(`http://localhost:5000/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      setProjects(projects.filter(project => project._id !== projectId));
      setAlert({ show: true, message: "Project deleted successfully!", type: 'success' });
    } catch (error) {
      console.error("Error deleting project:", error);
      setError("Failed to delete project. Please try again later.");
      setAlert({ show: true, message: "Failed to delete project.", type: 'error' });
    }
  };

  const handleModify = (projectId: string) => {
    fetchProjectDetails(projectId);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProjectData = {
      nom: selectedProject?.nom,
      etat: selectedProject?.etat,
      completion: selectedProject?.completion,
      model: selectedProject?.model
    };

    console.log("Updated project data:", updatedProjectData);

    try {
      const endpoint = `http://localhost:5000/project/${selectedProject._id}`;
      console.log("Sending PATCH request to:", endpoint);

      const response = await axios.patch(endpoint, updatedProjectData, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });

      if (response.status === 200) {
        const updatedProject = response.data;
        setProjects(projects.map(project => project._id === updatedProject._id ? updatedProject : project));
        setIsModalOpen(false);
        await fetchProjects();
        setAlert({ show: true, message: "Project updated successfully!", type: 'success' });
      } else {
        setError(`Failed to update project. Status code: ${response.status}`);
        setAlert({ show: true, message: "Project update error!", type: 'error' });
      }
    } catch (error) {
      console.log(selectedProject._id);
      console.error("Error updating project:", error);
      setError("Failed to update project. Please try again later.");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const response = await axios.delete(`http://localhost:5000/project/${selectedProject._id}/members/${selectedMember.value}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      if (response.status === 200) {
        console.log("Member deleted successfully.");
        setSelectedMember(null);
        setIsModalOpen(false);
        setAlert({ show: true, message: "Member deleted successfully!", type: 'success' });
      } else {
        setError(`Failed to delete member. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      setError("Failed to delete member. Please try again later.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setSelectedMember(null);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/project/add', newProject, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });

      if (response.status === 200 || response.status === 201) {
        setAlert({ show: true, message: "Project added successfully!", type: 'success' });

        const addedProject = response.data;
        setProjects([...projects, addedProject]);
        setIsAddModalOpen(false);
        setNewProject({
          nom: '',
          etat: '',
          completion: 0,
          model: '',
          membres: []
        });
        await axios.post(`http://localhost:5000/column/add/${addedProject._id}`, { nom: "Done" }, {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        });
        await fetchProjects();
      } else {
        setError(`Failed to add project. Status code: ${response.status}`);
        setAlert({ show: true, message: "Project add error!", type: 'error' });
      }
    } catch (error) {
      setAlert({ show: true, message: "Project add error!", type: 'error' });
      console.error("Error adding project:", error);
      setError("Failed to add project. Please try again later.");
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewProject({
      nom: '',
      etat: '',
      completion: 0,
      model: '',
      membres: []
    });
  };

  const memberOptions = selectedProject?.membres?.map((membre: any) => ({
    value: membre._id,
    label: membre.email
  }));

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
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">My Projects</h4>
        <button
          className="text-white mb-4 bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add Project
        </button>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left leading-4 text-blue-500 tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left leading-4 text-blue-500 tracking-wider">State</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left leading-4 text-blue-500 tracking-wider">Completion</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left leading-4 text-blue-500 tracking-wider">Role</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left leading-4 text-blue-500 tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <tr key={index}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{project.nom}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{project.etat}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{project.completion}%</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{project.userRole}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <Link className="text-blue-500 hover:text-blue-800" href={`/projects/${project._id}/tasks`}>
                    Show Tasks
                  </Link>
                  {(project.userRole === 'Manager' || project.userRole === 'manager') && (
                    <button
                      className="ml-4 text-yellow-500 hover:text-yellow-800"
                      onClick={() => handleModify(project._id)}
                    >
                      Modify
                    </button>
                  )}
                  {(project.userRole === 'Manager' || project.userRole === 'manager') && (
                    <button
                      className="ml-4 text-red-500 hover:text-red-800"
                      onClick={() => handleDelete(project._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedProject && (
        <div className="modal fixed mt-20 ml-30 inset-0 z-20 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 sm:px-6">
              <h4 className="text-lg leading-6 font-medium text-gray-900">Edit Project</h4>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleUpdateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    className="w-full rounded border bg-gray-100 px-4 py-2 mt-1"
                    value={selectedProject.nom || ''}
                    onChange={(e) => setSelectedProject({ ...selectedProject, nom: e.target.value })}
                    placeholder="Project Name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <Select
                    options={modelOptions}
                    value={modelOptions.find(option => option.label === selectedProject.model)}
                    onChange={handleModelChange}
                    placeholder="Select a model"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <Select
                    options={stateOptions}
                    value={stateOptions.find(option => option.label === selectedProject.etat)}
                    onChange={handleStateChange}
                    placeholder="Select a state"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Completion</label>
                  <input
                    className="w-full rounded border bg-gray-100 px-4 py-2 mt-1"
                    type="number"
                    value={selectedProject.completion || ''}
                    onChange={(e) => setSelectedProject({ ...selectedProject, completion: e.target.value })}
                    placeholder="Completion"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Members</label>
                  <Select
                    options={memberOptions}
                    onChange={setSelectedMember}
                    placeholder="Select a member to delete"
                  />
                  <button
                    type="button"
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
                    onClick={handleDeleteMember}
                  >
                    Delete Member
                  </button>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      padding: '10px 20px',
                      marginLeft: '280px',
                      marginTop: '10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'blue',
                      color: 'white',
                      padding: '10px 20px',
                      marginLeft: '10px',
                      marginTop: '10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal fixed mt-25 ml-30 inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Add Project</h3>
            </div>
            <div className="p-4 sm:p-6 ">
              <form onSubmit={handleAddProject}>
                <div >
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    className="w-full rounded border bg-gray-100 px-4 py-2 mt-1 mb-4"
                    value={newProject.nom}
                    onChange={(e) => setNewProject({ ...newProject, nom: e.target.value })}
                    placeholder="Project Name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <Select
                    options={modelOptions}
                    value={modelOptions.find(option => option.label === newProject.model)}
                    onChange={(option) => setNewProject({ ...newProject, model: option.label })}
                    placeholder="Select a model"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <Select
                    options={stateOptions}
                    value={stateOptions.find(option => option.label === newProject.etat)}
                    onChange={(option) => setNewProject({ ...newProject, etat: option.label })}
                    placeholder="Select a state"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Completion</label>
                  <input
                    className="w-full rounded border bg-gray-100 px-4 py-2 mt-1"
                    type="number"
                    value={newProject.completion}
                    onChange={(e) => setNewProject({ ...newProject, completion: e.target.value })}
                    placeholder="Completion"
                  />
                </div>
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Members</label>
                  {newProject.membres.map((membre, index) => (
                    <div key={index} className="mb-3">
                      <input
                        className="w-full rounded border bg-gray-100 px-4 py-2"
                        value={membre.utilisateur.email || ''}
                        placeholder="Member Email"
                        onChange={(e) => {
                          const newMembres = [...newProject.membres];
                          newMembres[index].utilisateur.email = e.target.value;
                          setNewProject({ ...newProject, membres: newMembres });
                        }}
                      />
                      <input
                        className="w-full rounded border bg-gray-100 px-4 py-2 mt-1"
                        value={membre.role || ''}
                        placeholder="Member Role"
                        onChange={(e) => {
                          const newMembres = [...newProject.membres];
                          newMembres[index].role = e.target.value;
                          setNewProject({ ...newProject, membres: newMembres });
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() =>
                      setNewProject({ ...newProject, membres: [...newProject.membres, { utilisateur: { email: '' }, role: '' }] })
                    }
                  >
                    + Add Member
                  </button> */}
                {/* </div> */}
                <div >
                  <button
                    type="button"
                    onClick={closeAddModal}
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      padding: '10px 20px',
                      marginLeft: '280px',
                      marginTop: '10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'blue',
                      color: 'white',
                      padding: '10px 20px',
                      marginLeft: '10px',
                      marginTop: '10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableOne;
