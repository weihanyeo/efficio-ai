import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

export const useProjectQueries = () => {
    const fetchProjects = useCallback(async (workspaceId: string): Promise<Project[]> => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data) return [];
            return data as Project[];
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }, []);

    const createProject = async (projectData: Partial<Project>): Promise<Project> => {
        try {
            // Validation
            if (!projectData.workspace_id) {
                throw new Error('Workspace ID is required');
            }
            if (!projectData.title || !projectData.title.trim()) {
                throw new Error('Title is required');
            }
            if (projectData.end_date && new Date(projectData.end_date) < new Date()) {
                throw new Error('End date cannot be in the past');
            }

            // Set default values
            const data = {
                ...projectData,
                title: projectData.title.trim(),
                description: projectData.description?.trim() || null,
                status: projectData.status || 'Planned',
                priority: projectData.priority || 'NoPriority',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: newProject, error } = await supabase
                .from('projects')
                .insert([data])
                .select('*')
                .single();

            if (error) throw error;
            if (!newProject) throw new Error('Failed to create project: No project returned');

            return newProject as Project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    const updateProject = async (projectId: string, updates: Partial<Project>) => {
        try {
            // Add updated_at timestamp
            const data = {
                ...updates,
                updated_at: new Date().toISOString()
            };

            const { data: updatedProject, error } = await supabase
                .from('projects')
                .update(data)
                .eq('id', projectId)
                .select('*')
                .single();

            if (error) throw error;
            if (!updatedProject) throw new Error('Failed to update project: No project returned');

            return updatedProject as Project;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    };

    const deleteProject = async (projectId: string): Promise<boolean> => {
        try {
            // First verify the project exists
            const { data: existingProject, error: fetchError } = await supabase
                .from('projects')
                .select('id')
                .eq('id', projectId)
                .single();

            if (fetchError || !existingProject) {
                console.error('Project not found:', projectId);
                return false;
            }

            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) {
                console.error('Database deletion error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    };

    return {
        fetchProjects,
        createProject,
        updateProject,
        deleteProject
    };
};