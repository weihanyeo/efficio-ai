'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useProjectQueries } from '../hooks/useProjectQueries';
import type { Project } from '../types';

interface ProjectContextType {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  refreshProjects: () => Promise<void>;
  updateProjectField: (projectId: string, field: keyof Project, value: any) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { currentWorkspace } = useWorkspace();
  const { fetchProjects, updateProject, createProject: createProjectQuery, deleteProject: deleteProjectQuery } = useProjectQueries();

  const refreshProjects = async () => {
    if (currentWorkspace) {
      const fetchedProjects = await fetchProjects(currentWorkspace.id);
      setProjects(fetchedProjects);
    }
  };

  const updateProjectField = async (projectId: string, field: keyof Project, value: any) => {
    try {
      const updatedProject = await updateProject(projectId, { [field]: value });
      if (updatedProject) {
        // Refresh the entire projects list to ensure we have the latest data
        await refreshProjects();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      const success = await deleteProjectQuery(projectId);
      if (success) {
        setProjects(prev => prev.filter(project => project.id !== projectId));
      }
      return success;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  const createProject = async (projectData: Partial<Project>) => {
    try {
      const newProject = await createProjectQuery(projectData);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshProjects();
  }, [currentWorkspace]);

  return (
    <ProjectContext.Provider value={{
      projects,
      setProjects,
      refreshProjects,
      updateProjectField,
      createProject,
      deleteProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};