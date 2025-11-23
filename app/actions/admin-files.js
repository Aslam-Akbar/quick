'use server'

import { query } from '../lib/db';
import { revalidatePath } from 'next/cache';

export async function getClientFiles(clientId) {
  try {
    // Get user_id first
    const clients = await query('SELECT user_id FROM client_profiles WHERE id = ?', [clientId]);
    if (clients.length === 0) return [];
    const userId = clients[0].user_id;

    const files = await query('SELECT * FROM recent_files WHERE user_id = ? ORDER BY id DESC', [userId]);
    return files;
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
}

export async function addClientFile(clientId, data) {
  try {
    // Get user_id
    const clients = await query('SELECT user_id FROM client_profiles WHERE id = ?', [clientId]);
    if (clients.length === 0) return { success: false, message: 'Client not found' };
    const userId = clients[0].user_id;

    await query(
      'INSERT INTO recent_files (user_id, name, type, url, size, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, data.name, data.type, data.url, data.size || '0 KB', new Date()]
    );
    
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath('/client-portal');
    
    return { success: true };
  } catch (error) {
    console.error('Error adding file:', error);
    return { success: false, error: 'Failed to add file' };
  }
}

export async function deleteClientFile(fileId) {
  try {
    // Get client ID for revalidation
    const file = await query(`
      SELECT cp.id as client_id 
      FROM recent_files rf
      JOIN client_profiles cp ON rf.user_id = cp.user_id
      WHERE rf.id = ?
    `, [fileId]);

    await query('DELETE FROM recent_files WHERE id = ?', [fileId]);

    if (file.length > 0) {
        revalidatePath(`/admin/clients/${file[0].client_id}`);
        revalidatePath('/client-portal');
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: 'Failed to delete file' };
  }
}
