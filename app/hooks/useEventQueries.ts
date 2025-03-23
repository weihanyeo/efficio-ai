import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { EventDetail, User, AgendaItem, ChecklistItem } from '../types/event';
import type { Database } from '../types/database.types';
import { formatEventDate } from '../components/utils/dateUtils';

type EventRow = Database['public']['Tables']['events']['Row'];

interface SupabaseEventOrganizerRow {
  user_id: string | null;
  role: string | null;
}

interface SupabaseEventAttendeeRow {
  user_id: string | null;
  status: string | null;
}

interface SupabaseEventAgendaItemRow {
  id: string;
  time: string;
  title: string;
  description: string | null;
  speaker: string | null;
}

interface SupabaseEventChecklistItemRow {
  id: string;
  task: string;
  completed: boolean;
  assigned_to: string | null;
}

interface EventWithRelations extends EventRow {
  event_organizers: SupabaseEventOrganizerRow[];
  event_attendees: SupabaseEventAttendeeRow[];
  event_agenda_items: SupabaseEventAgendaItemRow[];
  event_checklist_items: SupabaseEventChecklistItemRow[];
}

interface SupabaseProfile {
  id: string;
  full_name: string | null;
  email: string;
}

export const useEventQueries = () => {
  const fetchEvents = useCallback(async (workspaceId: string): Promise<EventDetail[]> => {
    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_organizers(
            user_id,
            role
          ),
          event_attendees(
            user_id,
            status
          ),
          event_agenda_items(*),
          event_checklist_items(*)
        `)
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;
      if (!events) return [];

      // Get all unique user IDs from organizers and attendees
      const userIds = new Set<string>();
      (events as EventWithRelations[]).forEach(event => {
        event.event_organizers?.forEach((org: SupabaseEventOrganizerRow) => {
          if (org.user_id) userIds.add(org.user_id);
        });
        event.event_attendees?.forEach((att: SupabaseEventAttendeeRow) => {
          if (att.user_id) userIds.add(att.user_id);
        });
      });

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', Array.from(userIds));

      if (usersError) throw usersError;
      if (!users) return [];

      // Create a map of user details
      const userMap = new Map(users.map(user => [user.id, user]));

      // Transform the data to match the EventDetail type
      return (events as EventWithRelations[]).map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        date: event.date,
        location: event.location || '',
        description: event.description || '',
        type: event.type as EventDetail['type'],
        color: event.color || 'bg-primary',
        organizers: event.event_organizers?.map((org: SupabaseEventOrganizerRow) => ({
          id: org.user_id || '',
          name: userMap.get(org.user_id || '')?.full_name || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userMap.get(org.user_id || '')?.email || ''}`,
          role: org.role || 'member'
        })) || [],
        attendees: event.event_attendees?.map((att: SupabaseEventAttendeeRow) => ({
          id: att.user_id || '',
          name: userMap.get(att.user_id || '')?.full_name || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userMap.get(att.user_id || '')?.email || ''}`,
          status: att.status || 'pending'
        })) || [],
        agenda: event.event_agenda_items?.map((item: SupabaseEventAgendaItemRow): AgendaItem => ({
          id: item.id,
          time: item.time,
          title: item.title,
          description: item.description || '',
          speaker: item.speaker || ''
        })) || [],
        checklist: event.event_checklist_items?.map((item: SupabaseEventChecklistItemRow): ChecklistItem => ({
          id: item.id,
          task: item.task,
          completed: item.completed || false,
          assignedTo: item.assigned_to || undefined
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }, []);

  const createEvent = useCallback(async (workspaceId: string, event: Omit<EventDetail, 'id'>) => {
    try {
      // Format the date to YYYY-MM-DD
      const formattedDate = formatEventDate(new Date(event.date));

      // Log the data being sent to the database for debugging
      console.log("Creating event with data:", {
        title: event.title,
        start_time: event.startTime,
        end_time: event.endTime,
        date: formattedDate,
        workspace_id: workspaceId
      });

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          title: event.title,
          start_time: event.startTime,
          end_time: event.endTime,
          date: formattedDate,
          location: event.location,
          description: event.description,
          type: event.type,
          color: event.color,
          workspace_id: workspaceId,
          user_id: user.id, // Add the user_id field to associate the event with the current user
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert organizers
      if (event.organizers.length > 0) {
        const { error: organizersError } = await supabase
          .from('event_organizers')
          .insert(
            event.organizers.map((organizer) => ({
              event_id: eventData.id,
              user_id: organizer.id,
              role: organizer.role,
            }))
          );

        if (organizersError) throw organizersError;
      }

      // Insert attendees
      if (event.attendees.length > 0) {
        const { error: attendeesError } = await supabase
          .from('event_attendees')
          .insert(
            event.attendees.map((attendee) => ({
              event_id: eventData.id,
              user_id: attendee.id,
              status: attendee.status,
            }))
          );

        if (attendeesError) throw attendeesError;
      }

      // Insert agenda items
      if (event.agenda.length > 0) {
        const { error: agendaError } = await supabase
          .from('event_agenda_items')
          .insert(
            event.agenda.map((item) => ({
              event_id: eventData.id,
              time: item.time,
              title: item.title,
              description: item.description,
              speaker: item.speaker,
            }))
          );

        if (agendaError) throw agendaError;
      }

      // Insert checklist items
      if (event.checklist.length > 0) {
        const { error: checklistError } = await supabase
          .from('event_checklist_items')
          .insert(
            event.checklist.map((item) => ({
              event_id: eventData.id,
              task: item.task,
              completed: item.completed,
              assigned_to: item.assignedTo,
            }))
          );

        if (checklistError) throw checklistError;
      }

      console.log("Event created successfully:", eventData);
      return eventData;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (
    eventId: string,
    eventData: Partial<EventDetail>,
    workspaceId?: string
  ): Promise<void> => {
    try {
      // Get the workspace_id if not provided
      let workspace_id = workspaceId;
      if (!workspace_id) {
        // Fetch the workspace_id from the event if not provided
        const { data: eventDetails, error: fetchError } = await supabase
          .from('events')
          .select('workspace_id')
          .eq('id', eventId)
          .single();
        
        if (fetchError) throw fetchError;
        workspace_id = eventDetails.workspace_id;
      }
      
      console.log("Updating event with workspace_id:", workspace_id);
      
      // Update main event data
      if (Object.keys(eventData).some(key => 
        ['title', 'startTime', 'endTime', 'date', 'location', 'description', 'type', 'color'].includes(key)
      )) {
        const { error: eventError } = await supabase
          .from('events')
          .update({
            title: eventData.title,
            start_time: eventData.startTime,
            end_time: eventData.endTime,
            date: eventData.date,
            location: eventData.location,
            description: eventData.description,
            type: eventData.type,
            color: eventData.color
          })
          .eq('id', eventId);

        if (eventError) throw eventError;
      }

      // Update organizers if changed
      if (eventData.organizers) {
        // Delete existing organizers
        await supabase
          .from('event_organizers')
          .delete()
          .eq('event_id', eventId);

        // Add new organizers
        if (eventData.organizers.length > 0) {
          const { error: organizersError } = await supabase
            .from('event_organizers')
            .insert(
              eventData.organizers.map((org: User) => ({
                event_id: eventId,
                user_id: org.id,
                role: org.role || 'member'
              }))
            );

          if (organizersError) throw organizersError;
        }
      }

      // Update attendees if changed
      if (eventData.attendees) {
        // Delete existing attendees
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId);

        // Add new attendees
        if (eventData.attendees.length > 0) {
          const { error: attendeesError } = await supabase
            .from('event_attendees')
            .insert(
              eventData.attendees.map((att: User) => ({
                event_id: eventId,
                user_id: att.id,
                status: att.status || 'pending'
              }))
            );

          if (attendeesError) throw attendeesError;
        }
      }

      // Update agenda items if changed
      if (eventData.agenda) {
        // Delete existing agenda items
        await supabase
          .from('event_agenda_items')
          .delete()
          .eq('event_id', eventId);

        // Add new agenda items
        if (eventData.agenda.length > 0) {
          const { error: agendaError } = await supabase
            .from('event_agenda_items')
            .insert(
              eventData.agenda.map((item: AgendaItem) => ({
                event_id: eventId,
                time: item.time,
                title: item.title,
                description: item.description,
                speaker: item.speaker
              }))
            );

          if (agendaError) throw agendaError;
        }
      }

      // Update checklist items if provided
      if (eventData.checklist) {
        try {
          console.log("Updating checklist items for event:", eventId);
          
          // Delete existing items first
          const { error: deleteError } = await supabase
            .from('event_checklist_items')
            .delete()
            .eq('event_id', eventId);
            
          if (deleteError) {
            console.error("Error deleting checklist items:", deleteError);
            throw deleteError;
          }
          
          // If there are no new items, we're done
          if (eventData.checklist.length === 0) {
            return;
          }
          
          // Insert new items
          const { error: insertError } = await supabase
            .from('event_checklist_items')
            .insert(
              eventData.checklist.map(item => ({
                event_id: eventId,
                task: item.task,
                completed: item.completed || false,
                assigned_to: item.assignedTo || null
              }))
            );
            
          if (insertError) {
            console.error("Error inserting checklist items:", insertError);
            
            // Try to insert items individually if bulk insert fails
            for (const item of eventData.checklist) {
              const { error: singleInsertError } = await supabase
                .from('event_checklist_items')
                .insert({
                  event_id: eventId,
                  task: item.task,
                  completed: item.completed || false,
                  assigned_to: item.assignedTo || null
                });
                
              if (singleInsertError) {
                console.error("Error inserting individual checklist item:", singleInsertError);
                // Continue trying other items instead of failing completely
              }
            }
          }
        } catch (checklistError) {
          console.error("Error handling checklist items:", checklistError);
          throw checklistError;
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }, []);

  const fetchWorkspaceUsers = useCallback(async (workspaceId: string): Promise<User[]> => {
    try {
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          member_id,
          role,
          profiles:member_id(
            id,
            full_name,
            email
          )
        `)
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;
      if (!members) return [];

      // Transform the data to match the User type
      return members.map((member: { member_id: string; role: string; profiles: SupabaseProfile }) => ({
        id: member.member_id,
        name: member.profiles.full_name || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles.email || ''}`,
        role: member.role || 'member',
        eventCount: 0 // This would need to be calculated if needed
      }));
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      throw error;
    }
  }, []);

  return {
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchWorkspaceUsers
  };
}; 