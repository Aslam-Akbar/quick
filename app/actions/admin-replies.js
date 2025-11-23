'use server'

import { query } from '../lib/db';
import { revalidatePath } from 'next/cache';

export async function getTicketDetails(ticketId) {
  try {
    const ticket = await query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (ticket.length === 0) return null;

    const replies = await query('SELECT *, CASE WHEN sender = "Admin" THEN 1 ELSE 0 END as is_admin FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    
    return { ...ticket[0], replies };
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return null;
  }
}

export async function replyToTicket(ticketId, message, isAdmin = true) {
  try {
    // Check if ticket exists
    const ticket = await query('SELECT user_id FROM tickets WHERE id = ?', [ticketId]);
    if (ticket.length === 0) return { success: false, message: 'Ticket not found' };
    
    // Insert reply with sender 'Admin'
    await query(
      'INSERT INTO ticket_replies (ticket_id, sender, message) VALUES (?, ?, ?)',
      [ticketId, 'Admin', message]
    );
    
    if (isAdmin) {
        await query('UPDATE tickets SET status = "In Progress" WHERE id = ? AND status = "Open"', [ticketId]);
    }

    // Get client ID for revalidation
    const client = await query(`
      SELECT cp.id as client_id 
      FROM tickets t
      JOIN client_profiles cp ON t.user_id = cp.user_id
      WHERE t.id = ?
    `, [ticketId]);

    if (client.length > 0) {
        revalidatePath(`/admin/clients/${client[0].client_id}`);
        revalidatePath('/client-portal');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error replying to ticket:', error);
    return { success: false, error: 'Failed to reply' };
  }
}
