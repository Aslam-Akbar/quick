'use server'

import { query } from '../lib/db';

export async function getClients() {
  try {
    const clients = await query(`
      SELECT cp.*, u.email 
      FROM client_profiles cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.id DESC
    `);
    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

export async function getClientById(id) {
  try {
    const clients = await query(`
      SELECT cp.*, u.email 
      FROM client_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ?
    `, [id]);
    return clients[0] || null;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}

export async function createClient(data) {
  try {
    // First, create the user account
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [data.email]);
    
    if (existingUser.length > 0) {
      return { success: false, message: 'Email already exists' };
    }

    // Create user with provided password
    const userResult = await query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [data.email, data.password]
    );

    const userId = userResult.insertId;

    // Create client profile
    await query(
      `INSERT INTO client_profiles (user_id, company_name, contact_name, plan_type, phone, address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.company_name, data.contact_name, data.plan_type, data.phone || null, data.address || null]
    );

    return { success: true, message: 'Client created successfully' };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, message: error.message || 'Failed to create client' };
  }
}

export async function deleteClient(clientId) {
  try {
    // First, get the user_id from client_profiles
    const clients = await query('SELECT user_id FROM client_profiles WHERE id = ?', [clientId]);
    
    if (clients.length === 0) {
      return { success: false, message: 'Client not found' };
    }

    const userId = clients[0].user_id;

    // Delete related data first (Cascade manually if foreign keys don't cascade)
    // 1. Delete Projects & Timeline
    const projects = await query('SELECT id FROM projects WHERE user_id = ?', [userId]);
    for (const project of projects) {
        await query('DELETE FROM project_timeline WHERE project_id = ?', [project.id]);
    }
    await query('DELETE FROM projects WHERE user_id = ?', [userId]);

    // 2. Delete Invoices
    await query('DELETE FROM invoices WHERE user_id = ?', [userId]);

    // 3. Delete Tickets
    await query('DELETE FROM tickets WHERE user_id = ?', [userId]);

    // 4. Delete Meetings
    await query('DELETE FROM meetings WHERE user_id = ?', [userId]);

    // 5. Delete Recent Files
    await query('DELETE FROM recent_files WHERE user_id = ?', [userId]);

    // 6. Delete client profile
    await query('DELETE FROM client_profiles WHERE id = ?', [clientId]);

    // 7. Delete associated user account
    await query('DELETE FROM users WHERE id = ?', [userId]);

    return { success: true, message: 'Client deleted successfully' };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, message: error.message || 'Failed to delete client' };
  }
}

export async function updateClient(clientId, data) {
  try {
    // 1. Get user_id
    const clients = await query('SELECT user_id FROM client_profiles WHERE id = ?', [clientId]);
    if (clients.length === 0) return { success: false, message: 'Client not found' };
    const userId = clients[0].user_id;

    // 2. Update client_profiles
    await query(
      `UPDATE client_profiles 
       SET company_name = ?, contact_name = ?, plan_type = ?, phone = ?, address = ?
       WHERE id = ?`,
      [data.company_name, data.contact_name, data.plan_type, data.phone || null, data.address || null, clientId]
    );

    // 3. Update users (email)
    if (data.email) {
        const existing = await query('SELECT id FROM users WHERE email = ? AND id != ?', [data.email, userId]);
        if (existing.length > 0) {
            return { success: false, message: 'Email already in use by another client' };
        }
        await query('UPDATE users SET email = ? WHERE id = ?', [data.email, userId]);
    }

    return { success: true, message: 'Client updated successfully' };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, message: error.message || 'Failed to update client' };
  }
}
