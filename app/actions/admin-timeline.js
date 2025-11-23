'use server'

import { query } from '../lib/db';
import { revalidatePath } from 'next/cache';

export async function getProjectTimeline(projectId) {
  try {
    const timeline = await query('SELECT * FROM project_timeline WHERE project_id = ? ORDER BY id ASC', [projectId]);
    return timeline;
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }
}

export async function addTimelineEvent(projectId, data) {
  try {
    await query(
      'INSERT INTO project_timeline (project_id, label, status) VALUES (?, ?, ?)',
      [projectId, data.label, data.status]
    );
    
    // Get client ID for revalidation
    const project = await query(`
      SELECT cp.id as client_id 
      FROM projects p
      JOIN client_profiles cp ON p.user_id = cp.user_id
      WHERE p.id = ?
    `, [projectId]);

    if (project.length > 0) {
        revalidatePath(`/admin/clients/${project[0].client_id}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error adding timeline event:', error);
    return { success: false, error: 'Failed to add event' };
  }
}

export async function updateTimelineEvent(eventId, data) {
  try {
    await query(
      'UPDATE project_timeline SET label = ?, status = ? WHERE id = ?',
      [data.label, data.status, eventId]
    );

    // Get client ID for revalidation
    const event = await query(`
      SELECT cp.id as client_id 
      FROM project_timeline pt
      JOIN projects p ON pt.project_id = p.id
      JOIN client_profiles cp ON p.user_id = cp.user_id
      WHERE pt.id = ?
    `, [eventId]);

    if (event.length > 0) {
        revalidatePath(`/admin/clients/${event[0].client_id}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating timeline event:', error);
    return { success: false, error: 'Failed to update event' };
  }
}

export async function deleteTimelineEvent(eventId) {
  try {
    // Get client ID for revalidation before deleting
    const event = await query(`
      SELECT cp.id as client_id 
      FROM project_timeline pt
      JOIN projects p ON pt.project_id = p.id
      JOIN client_profiles cp ON p.user_id = cp.user_id
      WHERE pt.id = ?
    `, [eventId]);

    await query('DELETE FROM project_timeline WHERE id = ?', [eventId]);

    if (event.length > 0) {
        revalidatePath(`/admin/clients/${event[0].client_id}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    return { success: false, error: 'Failed to delete event' };
  }
}
