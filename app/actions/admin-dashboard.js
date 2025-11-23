'use server'

import { query } from '../lib/db';

export async function getAdminDashboardStats() {
  try {
    const clients = await query('SELECT COUNT(*) as count FROM client_profiles');
    const projects = await query('SELECT COUNT(*) as count FROM projects WHERE status = "In Progress"');
    const totalProjects = await query('SELECT COUNT(*) as count FROM projects');
    const invoices = await query('SELECT COUNT(*) as count FROM invoices WHERE status = "paid"');
    const tickets = await query('SELECT COUNT(*) as count FROM tickets WHERE status = "open"');

    return {
      clients: clients[0].count,
      projects: projects[0].count,
      totalProjects: totalProjects[0].count,
      invoices: invoices[0].count,
      tickets: tickets[0].count
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { clients: 0, projects: 0, invoices: 0, tickets: 0 };
  }
}

export async function getRecentActivity() {
  try {
    // Fetch recent tickets
    const tickets = await query(`
      SELECT t.id, t.subject as title, 'ticket' as type, t.created_at as date, cp.company_name as client
      FROM tickets t
      JOIN client_profiles cp ON t.user_id = cp.user_id
      ORDER BY t.created_at DESC LIMIT 5
    `);

    // Fetch recent project updates
    const updates = await query(`
      SELECT pu.id, pu.message as title, 'update' as type, pu.date, p.name as project
      FROM project_updates pu
      JOIN projects p ON pu.project_id = p.id
      ORDER BY pu.date DESC LIMIT 5
    `);

    // Fetch recent files
    const files = await query(`
      SELECT rf.id, rf.name as title, 'file' as type, rf.date, cp.company_name as client
      FROM recent_files rf
      JOIN client_profiles cp ON rf.user_id = cp.user_id
      ORDER BY rf.date DESC LIMIT 5
    `);

    // Combine and sort
    const allActivity = [...tickets, ...updates, ...files]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    return allActivity;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
