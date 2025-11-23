'use server'

import { query } from '../lib/db';
import { revalidatePath } from 'next/cache';

export async function getProjectUpdates(projectId) {
  try {
    const updates = await query('SELECT * FROM project_updates WHERE project_id = ? ORDER BY date DESC', [projectId]);
    return updates;
  } catch (error) {
    console.error('Error fetching updates:', error);
    return [];
  }
}

export async function addProjectUpdate(projectId, data) {
  try {
    await query(
      'INSERT INTO project_updates (project_id, message, type, date) VALUES (?, ?, ?, ?)',
      [projectId, data.message, data.type, data.date || new Date()]
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
        revalidatePath('/client-portal'); // Also revalidate client portal
    }
    return { success: true };
  } catch (error) {
    console.error('Error adding update:', error);
    return { success: false, error: 'Failed to add update' };
  }
}

export async function deleteProjectUpdate(updateId) {
  try {
    // Get client ID for revalidation
    const update = await query(`
      SELECT cp.id as client_id 
      FROM project_updates pu
      JOIN projects p ON pu.project_id = p.id
      JOIN client_profiles cp ON p.user_id = cp.user_id
      WHERE pu.id = ?
    `, [updateId]);

    await query('DELETE FROM project_updates WHERE id = ?', [updateId]);

    if (update.length > 0) {
        revalidatePath(`/admin/clients/${update[0].client_id}`);
        revalidatePath('/client-portal');
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting update:', error);
    return { success: false, error: 'Failed to delete update' };
  }
}
