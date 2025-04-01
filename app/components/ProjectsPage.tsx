'use client';
import React, { useEffect, useState } from 'react';
import { projectsApi } from '../lib/api';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useProject } from '../contexts/ProjectContext';
import { 
  Plus, Search, Mail, Calendar, Settings, X, GitPullRequest, FileText, MessageSquare, Bot, Activity, ChevronDown, Edit2, Save, Shield, UserX, UserPlus, ChevronUp, Copy, Check, Link2, Users, ArrowUpRight, Sparkles, Type, AlignLeft, Clock, Flag, XCircle, AlertCircle, Signal, SignalLow, SignalMedium, SignalHigh, CircleDot, CheckCircle2, Ban, MinusCircle, Circle, User, AlertTriangle 
} from 'lucide-react';
import type { Project } from '../types';
import { ProjectDetail } from './ProjectDetail';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { showSuccess, showError } from "./utils/toast";
import { ToastContainer } from "./ToastContainer";

const formatStatus = (status: string) => {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    case 'NoPriority':
      return 'No Priority';
    default:
      return status;
  }
};

const formatPriority = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return 'Urgent';
    case 'High':
      return 'High';
    case 'Medium':
      return 'Medium';
    case 'Low':
      return 'Low';
    case 'NoPriority':
      return 'No Priority';
    default:
      return priority;
  }
};

const PriorityBars = ({ priority }: { priority: string }) => {
  if (priority === 'Urgent') {
    return (
      <AlertCircle className="w-4 h-4 text-orange-400" />
    );
  }

  if (priority === 'NoPriority') {
    return (
      <div className="flex items-center gap-[2px]">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-1 h-1 rounded-full bg-gray-600"
          />
        ))}
      </div>
    );
  }

  // For High, Medium, Low priorities
  const getBarCount = () => {
    switch (priority) {
      case 'High':
        return 3;
      case 'Medium':
        return 2;
      case 'Low':
        return 1;
      default:
        return 0;
    }
  };

  const barCount = getBarCount();
  const bars = Array(3).fill(null).map((_, index) => index < barCount);

  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((isActive, index) => (
        <div
          key={index}
          className={`w-1 rounded-sm ${isActive ? priority === 'High' ? 'bg-orange-400' : priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400' : 'bg-gray-600'} ${index === 0 ? 'h-2' : index === 1 ? 'h-3' : 'h-4'}`}
        />
      ))}
    </div>
  );
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  if (priority === 'Urgent') {
    return (
      <div className="flex items-center justify-center text-red-400">
        <AlertCircle className="w-4 h-4" />
      </div>
    );
  }
  
  if (priority === 'NoPriority') {
    return (
      <div className="flex items-center justify-center text-gray-400">
        <div className="flex gap-0.5">
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <PriorityBars priority={priority} />
    </div>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Completed':
      return (
        <div className="flex items-center justify-center text-green-400" title={formatStatus(status)}>
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    case 'InProgress':
      return (
        <div className="flex items-center justify-center text-blue-400" title={formatStatus(status)}>
          <CircleDot className="w-4 h-4" />
        </div>
      );
    case 'Planned':
      return (
        <div className="flex items-center justify-center text-purple-400" title={formatStatus(status)}>
          <Circle className="w-4 h-4" />
        </div>
      );
    case 'Cancelled':
      return (
        <div className="flex items-center justify-center text-red-400" title={formatStatus(status)}>
          <Ban className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center text-gray-400" title={formatStatus(status)}>
          <MinusCircle className="w-4 h-4" />
        </div>
      );
  }
};

export const ProjectsPage = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingField, setEditingField] = useState<{ projectId: string; field: string } | null>(null);
  const [dateEditingProject, setDateEditingProject] = useState<Project | null>(null);
  const { projects, updateProjectField, setProjects, createProject, deleteProject } = useProject();
  const { currentWorkspace } = useWorkspace();

  const priorityOptions = [
    { value: 'NoPriority', label: 'No Priority' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  const statusOptions = [
    { value: 'Backlog', label: 'Backlog' },
    { value: 'Planned', label: 'Planned' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const handleFieldEdit = async (projectId: string, field: keyof Project, value: any) => {
    try {
      await updateProjectField(projectId, field, value);
      // Close the dropdown after successful update
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const StatusDropdown = ({ project }: { project: Project }) => {
    const isOpen = editingField?.projectId === project.id && editingField?.field === 'status';
    const statuses = ['Backlog', 'Planned', 'InProgress', 'Completed', 'Cancelled'];
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingField(isOpen ? null : { projectId: project.id, field: 'status' });
          }}
          className="flex items-center gap-2 hover:bg-secondary rounded-md rounded px-2 py-1"
        >
          <StatusIcon status={project.status} />
        </button>
        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-48 rounded-md bg-muted shadow-lg ring-1 ring-black ring-opacity-5"
            style={{ right: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1" role="menu">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleFieldEdit(project.id, 'status', status)}
                  className={`flex items-center w-full px-4 py-2 text-sm ${
                    project.status === status 
                      ? 'bg-secondary rounded-md text-foreground' 
                      : 'text-gray-300 hover:bg-secondary rounded-md'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <StatusIcon status={status} />
                    <span>{formatStatus(status)}</span>
                  </div>
                  {project.status === status && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const PriorityDropdown = ({ project }: { project: Project }) => {
    const isOpen = editingField?.projectId === project.id && editingField?.field === 'priority';
    const priorities = ['NoPriority', 'Urgent', 'High', 'Medium', 'Low'];
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingField(isOpen ? null : { projectId: project.id, field: 'priority' });
          }}
          className="flex items-center gap-2 hover:bg-secondary rounded-md rounded px-2 py-1"
        >
          <PriorityBars priority={project.priority} />
        </button>
        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-48 rounded-md bg-muted shadow-lg ring-1 ring-black ring-opacity-5"
            style={{ right: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1" role="menu">
              {priorities.map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleFieldEdit(project.id, 'priority', priority)}
                  className={`flex items-center w-full px-4 py-2 text-sm ${
                    project.priority === priority 
                      ? 'bg-secondary rounded-md text-foreground' 
                      : 'text-gray-300 hover:bg-secondary rounded-md'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <PriorityBars priority={priority} />
                    <span>{formatPriority(priority)}</span>
                  </div>
                  {project.priority === priority && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('NoPriority');
  const [status, setStatus] = useState<string>('Planned');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleCreateProject = async () => {
    try {
      if (!currentWorkspace) {
        console.error('No workspace selected');
        return;
      }

      if (!title.trim()) {
        setTitleError('Title is required');
        return;
      }

      const projectData = {
        title: title.trim(),
        description: description.trim() || null,
        priority: priority as Project['priority'],
        status: status as Project['status'],
        start_date: startDate,
        end_date: endDate,
        workspace_id: currentWorkspace.id,
      };

      await createProject(projectData);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('NoPriority');
    setStatus('Planned');
    setStartDate(null);
    setEndDate(null);
    setTitleError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!validateForm()) {
      return;
    }

    handleCreateProject();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Custom styles for the DatePicker
  const datePickerCustomStyles = {
    className: "w-full rounded-lg bg-muted border border-gray-600 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    calendarClassName: "bg-muted border border-gray-600 rounded-lg shadow-xl !font-sans !z-[100] mx-auto",
    dayClassName: (date: Date) => 
      `hover:!bg-blue-500 hover:!text-foreground
      ${date.getMonth() === (endDate?.getMonth() ?? new Date().getMonth()) ? 'text-foreground' : 'text-gray-500'}`,
    monthClassName: () => "!text-foreground",
    weekDayClassName: () => "!text-gray-400",
    wrapperClassName: "flex justify-center",
  };

  // Shared DatePicker styles for modals
  const modalDatePickerStyles = {
    ...datePickerCustomStyles,
    className: "w-full rounded-lg bg-muted border border-gray-600 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    calendarClassName: "bg-muted border border-gray-600 rounded-lg shadow-xl !font-sans !z-[100] mx-auto",
    wrapperClassName: "flex justify-center w-full",
  };

  const DatePickerButton = ({ 
    project, 
    field 
  }: { 
    project: Project; 
    field: keyof Project;
  }) => {    
    return (
      <div className="flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent project details from showing
            setDateEditingProject(project);
            setEditingField(null);  // Clear any open dropdowns
          }}
          className="bg-muted hover:bg-secondary rounded-md border border-[bg-secondary rounded-md] rounded px-2 py-1 text-sm text-gray-300 w-full text-center focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}
        </button>
      </div>
    );
  };

  const DateEditModal = () => {
    if (!dateEditingProject) return null;

    const [dateError, setDateError] = useState<string>('');

    const handleDateChange = (date: Date | null) => {
      setDateError('');
      
      if (date && dateEditingProject.start_date && new Date(dateEditingProject.start_date) > date) {
        setDateError('Target date cannot be before start date');
        return;
      }
      
      handleFieldEdit(dateEditingProject.id, 'end_date', date);
      setDateEditingProject(null);
    };

    return (
      <>
        <div 
          className="fixed inset-0 bg-black/30 z-40" 
          aria-hidden="true" 
          onClick={() => setDateEditingProject(null)} 
        />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div 
            className="w-full max-w-sm transform overflow-visible rounded-2xl bg-card p-6 text-left align-middle shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium leading-6 text-foreground">
                Target date
              </h3>
              <button
                onClick={() => setDateEditingProject(null)}
                className="text-gray-400 hover:text-foreground focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-full">
                  <div className="bg-muted rounded-lg p-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">
                        {dateEditingProject.end_date ? new Date(dateEditingProject.end_date).toLocaleDateString() : '—'}
                      </span>
                      {dateEditingProject.end_date && (
                        <button
                          onClick={() => handleDateChange(null)}
                          className="text-gray-400 hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <DatePicker
                      selected={dateEditingProject.end_date ? new Date(dateEditingProject.end_date) : null}
                      onChange={handleDateChange}
                      dateFormat="MM/dd/yyyy"
                      minDate={dateEditingProject.start_date ? new Date(dateEditingProject.start_date) : undefined}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      monthsShown={1}
                      inline
                      {...modalDatePickerStyles}
                    />
                  </div>
                </div>
              </div>

              {dateError && (
                <p className="text-red-400 text-sm mt-2 text-center">{dateError}</p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      projectId
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      showSuccess('Project deleted successfully');
      setContextMenu(null); // Close the context menu
    } catch (error) {
      showError('Failed to delete project');
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      if (!currentWorkspace) return;
      
      try {
        const response = await projectsApi.list(currentWorkspace.id);
        if (response && Array.isArray(response)) {
          setProjects(response);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      }
    };

    loadProjects();
  }, [currentWorkspace]);

  const validateForm = () => {
    let isValid = true;
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Project title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    // Validate dates
    if (startDate && startDate > endDate) {
      setTitleError('Start date cannot be after end date');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (endDate && endDate < new Date()) {
      setTitleError('End date cannot be in the past');
      isValid = false;
    } else {
      setTitleError('');
    }

    return isValid;
  };

  const handleProjectUpdate = () => {
    const loadProjects = async () => {
      if (!currentWorkspace) return;
      
      try {
        const response = await projectsApi.list(currentWorkspace.id);
        if (response && Array.isArray(response)) {
          setProjects(response);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      }
    };

    loadProjects();
  };

  return (
    <>
      <div className="flex flex-col h-full w-full">
        <header className="h-14 border-b border-muted flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsModalOpen(true);
                setEditingField(null);  // Clear any open dropdowns
              }}
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 w-full">
          <div className="w-full relative">
            <table className="w-full">
              <thead>
                <tr className="w-full">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300 w-[35%]">Title</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300 w-[15%]">Priority</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300 w-[15%]">Project Lead</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300 w-[20%]">Target Date</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300 w-[15%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects && projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setEditingField(null);  // Clear any open dropdowns
                    }}
                    onContextMenu={(e) => handleContextMenu(e, project.id)}
                    className="hover:bg-secondary rounded-md cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{project.title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <PriorityDropdown
                          project={project}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-border text-gray-400 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <DatePickerButton
                          project={project}
                          field="end_date"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <StatusDropdown
                          project={project}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No projects found. Create a new project to get started.
              </div>
            )}
          </div>

          {contextMenu && (
            <div
              className="fixed bg-muted rounded-md shadow-lg py-1 z-50"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={() => handleDeleteProject(contextMenu.projectId)}
                className="w-full px-4 py-2 text-sm text-red-500 hover:bg-secondary rounded-md text-left"
              >
                Delete
              </button>
            </div>
          )}

          {/* Click anywhere else to close context menu */}
          {contextMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
          )}
        </main>

        {/* Modal for creating new project */}
        {isModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" aria-hidden="true" onClick={handleCloseModal} />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div 
                className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card p-6 text-left align-middle shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-medium leading-6 text-foreground flex items-center gap-2">
                    <Plus className="w-6 h-6" />
                    Create New Project
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-foreground focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (e.target.value.trim()) setTitleError('');
                      }}
                      className={`w-full rounded-lg bg-muted border ${titleError ? 'border-red-500' : 'border-gray-600'} px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${titleError ? 'focus:ring-red-500' : 'focus:ring-2'}`}
                    />
                    {titleError && <p className="mt-1 text-sm text-red-500">{titleError}</p>}
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <AlignLeft className="w-4 h-4" />
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg bg-muted border border-gray-600 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date
                      </label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => {
                          setStartDate(date);
                        }}
                        placeholderText="Select start date"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        monthsShown={1}
                        {...datePickerCustomStyles}
                        onMonthChange={() => {}}
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        End Date
                      </label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => {
                          setEndDate(date);
                        }}
                        placeholderText="Select end date"
                        minDate={startDate}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        monthsShown={1}
                        {...datePickerCustomStyles}
                        onMonthChange={() => {}}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Status
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg bg-muted border border-gray-600 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="Backlog">Backlog</option>
                        <option value="Planned">Planned</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-lg bg-muted border border-gray-600 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="NoPriority">No Priority</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-primary hover:bg-primary/80 px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Project details modal */}
        {selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onUpdate={handleProjectUpdate}
          />
        )}

        {/* Date editing modal */}
        <DateEditModal />
      </div>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};