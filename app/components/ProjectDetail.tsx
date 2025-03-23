'use client';
import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Calendar, User } from 'lucide-react';
import type { Project } from '../types';
import { useProject } from '../contexts/ProjectContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, onUpdate }) => {
  const { updateProjectField } = useProject();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status);
  const [priority, setPriority] = useState(project.priority);
  const [startDate, setStartDate] = useState<Date | null>(project.start_date ? new Date(project.start_date) : null);
  const [endDate, setEndDate] = useState<Date | null>(project.end_date ? new Date(project.end_date) : null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStatus(project.status);
      setPriority(project.priority);
      setStartDate(project.start_date ? new Date(project.start_date) : null);
      setEndDate(project.end_date ? new Date(project.end_date) : null);
      setError('');
    }
  }, [isEditing, project]);

  const statusOptions = [
    { value: 'Backlog', label: 'Backlog' },
    { value: 'Planned', label: 'Planned' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'NoPriority', label: 'No Priority' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  const handleSave = async () => {
    try {
      setError('');

      // Validate title
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      // Validate dates
      if (startDate && endDate && startDate > endDate) {
        setError('Start date cannot be after end date');
        return;
      }

      // Update all fields
      await updateProjectField(project.id, 'title', title);
      await updateProjectField(project.id, 'description', description || null);
      await updateProjectField(project.id, 'status', status);
      await updateProjectField(project.id, 'priority', priority);
      await updateProjectField(project.id, 'start_date', startDate?.toISOString() || null);
      await updateProjectField(project.id, 'end_date', endDate?.toISOString() || null);

      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    }
  };

  const datePickerCustomStyles = {
    className: "w-full rounded-lg bg-muted border border-gray-600 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500",
    calendarClassName: "bg-muted border border-gray-600 rounded-lg shadow-xl !font-sans",
    dayClassName: (date: Date) => 
      `hover:!bg-blue-500 hover:!text-foreground
      ${date.getMonth() === (endDate?.getMonth() ?? new Date().getMonth()) ? 'text-foreground' : 'text-gray-500'}`,
    monthClassName: () => "!text-foreground",
    weekDayClassName: () => "!text-gray-400",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="w-[800px] h-[600px] bg-muted rounded-lg shadow-xl flex flex-col">
        <header className="flex items-center justify-between p-6 border-b border-muted">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold bg-muted rounded px-2 py-1 w-96 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h2 className="text-xl font-semibold">{project.title}</h2>
          )}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                >
                  <Save className="w-5 h-5" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-32 bg-muted rounded p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-gray-200">{project.description || 'No description'}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-muted rounded px-3 py-1.5 text-foreground border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="px-2 py-1 text-sm bg-indigo-500/20 text-indigo-400 rounded-full">
                  {project.status}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Priority</h3>
              {isEditing ? (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="bg-muted rounded px-3 py-1.5 text-foreground border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="px-2 py-1 text-sm bg-indigo-500/20 text-indigo-400 rounded-full">
                  {project.priority}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Timeline</h3>
              <div className="flex items-center gap-4 text-sm">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-gray-400 mb-1 block">Start Date</label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        placeholderText="Select start date"
                        maxDate={endDate || undefined}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        {...datePickerCustomStyles}
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 mb-1 block">End Date</label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        placeholderText="Select end date"
                        minDate={startDate || undefined}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        {...datePickerCustomStyles}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-400">Start Date:</span>
                      <span className="ml-2 text-gray-200">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">End Date:</span>
                      <span className="ml-2 text-gray-200">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Project Lead</h3>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-200">No Assigned Project Lead</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Assigned Members</h3>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-200">No Assigned Members</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Milestones</h3>
              <span className="text-gray-200">No Milestones</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
