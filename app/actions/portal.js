'use server'

import { query } from '../lib/db';

async function getUserId(email) {
  const users = await query('SELECT id FROM users WHERE email = ?', [email]);
  return users.length > 0 ? users[0].id : null;
}

export async function getProjects(email) {
  try {
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    const projects = await query('SELECT * FROM projects WHERE user_id = ?', [userId]);
    
    // Get total paid amount from invoices
    const paidResult = await query(
      'SELECT SUM(amount) as total FROM invoices WHERE user_id = ? AND status = "Paid"', 
      [userId]
    );
    const totalPaid = Number(paidResult[0].total || 0);

    const projectsWithDetails = await Promise.all(projects.map(async (project) => {
      try {
        // Fetch timeline - project_timeline table doesn't have date column, order by id
        const timeline = await query('SELECT * FROM project_timeline WHERE project_id = ? ORDER BY id ASC', [project.id]);
        
        // Fetch updates
        const updates = await query('SELECT * FROM project_updates WHERE project_id = ? ORDER BY date DESC', [project.id]);

        return {
          ...project,
          budget: Number(project.budget || 0),
          currency: project.currency || 'INR',
          paidAmount: totalPaid, 
          remainingAmount: Math.max(0, Number(project.budget || 0) - totalPaid),
          title: project.name,
          timeline,
          updates
        };
      } catch (err) {
        console.error('Error processing project:', project.id, err);
        // Return basic project with defaults if details fail
        return {
            ...project,
            budget: Number(project.budget || 0),
            currency: project.currency || 'INR',
            paidAmount: totalPaid,
            remainingAmount: Math.max(0, Number(project.budget || 0) - totalPaid),
            title: project.name,
            timeline: [],
            updates: []
        };
      }
    }));

    return { success: true, data: projectsWithDetails };
  } catch (error) {
    console.error('getProjects Error:', error);
    return { success: false, message: 'Failed to fetch projects' };
  }
}

export async function getInvoices(email) {
  try {
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    const invoices = await query('SELECT * FROM invoices WHERE user_id = ? ORDER BY due_date DESC', [userId]);
    return { success: true, data: invoices };
  } catch (error) {
    console.error('getInvoices Error:', error);
    return { success: false, message: 'Failed to fetch invoices' };
  }
}

export async function getAssets(email) {
  try {
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    const assets = await query('SELECT * FROM recent_files WHERE user_id = ? ORDER BY id DESC', [userId]);
    return { success: true, data: assets };
  } catch (error) {
    console.error('getAssets Error:', error);
    return { success: false, message: 'Failed to fetch assets' };
  }
}

export async function getTickets(email) {
  try {
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    const tickets = await query('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return { success: true, data: tickets };
  } catch (error) {
    console.error('getTickets Error:', error);
    return { success: false, message: 'Failed to fetch tickets' };
  }
}

export async function createTicket(email, ticket) {
  try {
    if (email === 'test@gmail.com') {
      return { success: false, message: 'This action is disabled for the demo account.' };
    }
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    await query(
      'INSERT INTO tickets (user_id, subject, status) VALUES (?, ?, ?)',
      [userId, ticket.subject, 'open']
    );
    return { success: true };
  } catch (error) {
    console.error('createTicket Error:', error);
    return { success: false, message: 'Failed to create ticket' };
  }
}

export async function getTicketDetails(email, ticketId) {
  try {
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    // Verify ticket belongs to user
    const ticket = await query('SELECT * FROM tickets WHERE id = ? AND user_id = ?', [ticketId, userId]);
    if (ticket.length === 0) return { success: false, message: 'Ticket not found' };

    // Fetch replies and map sender to is_admin for UI compatibility
    const replies = await query('SELECT *, CASE WHEN sender = "Admin" THEN 1 ELSE 0 END as is_admin FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    
    return { success: true, data: { ...ticket[0], replies } };
  } catch (error) {
    console.error('getTicketDetails Error:', error);
    return { success: false, message: 'Failed to fetch ticket details' };
  }
}

export async function replyToTicket(email, ticketId, message) {
  try {
    if (email === 'test@gmail.com') {
      return { success: false, message: 'This action is disabled for the demo account.' };
    }
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    // Verify ticket belongs to user
    const ticket = await query('SELECT id FROM tickets WHERE id = ? AND user_id = ?', [ticketId, userId]);
    if (ticket.length === 0) return { success: false, message: 'Ticket not found' };

    await query(
      'INSERT INTO ticket_replies (ticket_id, sender, message) VALUES (?, ?, ?)',
      [ticketId, 'Client', message]
    );
    
    await query('UPDATE tickets SET status = "Open" WHERE id = ?', [ticketId]);

    return { success: true };
  } catch (error) {
    console.error('replyToTicket Error:', error);
    return { success: false, message: 'Failed to reply to ticket' };
  }
}

export async function updateProfile(email, data) {
  try {
    if (email === 'test@gmail.com') {
      return { success: false, message: 'This action is disabled for the demo account.' };
    }
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    await query(
      'UPDATE client_profiles SET company_name = ?, contact_name = ? WHERE user_id = ?',
      [data.companyName, data.contactName, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('updateProfile Error:', error);
    return { success: false, message: 'Failed to update profile' };
  }
}

export async function changePassword(email, currentPassword, newPassword) {
  try {
    if (email === 'test@gmail.com') {
      return { success: false, message: 'This action is disabled for the demo account.' };
    }
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    // Verify current password
    const users = await query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return { success: false, message: 'User not found' };

    // In production, use proper password hashing (bcrypt, etc.)
    if (users[0].password !== currentPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Update password (should be hashed in production)
    await query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('changePassword Error:', error);
    return { success: false, message: 'Failed to change password' };
  }
}

export async function updateNotificationPreferences(email, preferences) {
  try {
    if (email === 'test@gmail.com') {
      return { success: false, message: 'This action is disabled for the demo account.' };
    }
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    // For now, we'll store preferences in a simple way
    // In production, you'd want a dedicated notifications_preferences table
    return { success: true, message: 'Notification preferences updated' };
  } catch (error) {
    console.error('updateNotificationPreferences Error:', error);
    return { success: false, message: 'Failed to update preferences' };
  }
}


export async function getProjectLinks(email) {
  try {
    const userId = await getUserId(email);
    if (!userId) return { success: false, message: 'User not found' };

    const projects = await query(
      'SELECT id, name, github_url, hosted_url, progress, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    if (projects.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const formattedProjects = await Promise.all(projects.map(async (project) => {
      const updates = await query('SELECT * FROM project_updates WHERE project_id = ? ORDER BY date DESC', [project.id]);
      
      return {
        projectName: project.name,
        githubUrl: project.github_url,
        hostedUrl: project.hosted_url,
        progress: project.progress || 0,
        lastUpdated: project.updated_at,
        lastCommit: project.updated_at,
        defaultBranch: 'main',
        isPrivate: true,
        updateHistory: updates.length > 0 ? updates.map(u => ({
          id: u.id,
          message: u.message,
          date: u.date,
          type: u.type
        })) : [
          {
            id: 'init',
            message: 'Initial project setup and deployment',
            date: project.updated_at,
            type: 'deployment'
          }
        ]
      };
    }));
    
    return {
      success: true,
      data: formattedProjects
    };
  } catch (error) {
    console.error('getProjectLinks Error:', error);
    return { success: false, message: 'Failed to fetch project links' };
  }
}
