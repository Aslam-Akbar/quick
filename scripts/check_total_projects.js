const { query } = require('../app/lib/db');

async function checkTotalProjects(email) {
  try {
    console.log('Checking for:', email);
    const users = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
        console.log('User not found');
        return;
    }
    const userId = users[0].id;
    console.log('UserId:', userId);

    const totalProjectsResult = await query('SELECT COUNT(*) as count FROM projects WHERE user_id = ?', [userId]);
    console.log('Total Projects Result:', totalProjectsResult);
    const totalProjects = Number(totalProjectsResult[0].count || 0);
    console.log('Total Projects Value:', totalProjects);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTotalProjects('hostelseetha@gmail.com');
