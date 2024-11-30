const sqlite = require("sqlite3");
const db = new sqlite.Database("church.db");

const initializeDatabase = () => {
  // SQL to create the members table
  const membersTableSql = `
      CREATE TABLE IF NOT EXISTS members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          email TEXT,
          password TEXT,
          nationalId TEXT,
          sex TEXT,
          districtNumber TEXT,
          cardNumber TEXT,
          isAdmin BOOLEAN DEFAULT FALSE
      )
    `;

  // SQL to create the events table
  const eventsTableSql = `
      CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_name TEXT NOT NULL,
          event_date TEXT NOT NULL,  
          event_time TEXT NOT NULL 
      )
    `;

  // Ensure members table exists
  db.run(membersTableSql, (err) => {
    if (err) {
      console.error("Error creating 'members' table:", err.message);
    } else {
      console.log("Table 'members' ensured in the database.");
    }
  });

  // Ensure events table exists
  db.run(eventsTableSql, (err) => {
    if (err) {
      console.error("Error creating 'events' table:", err.message);
    } else {
      console.log("Table 'events' ensured in the database.");
    }
  });
};

function checkAdmin(request, response, next) {
  const email = request.body.email || request.headers.authorization;

  if (!email) {
    return response.status(400).json({ message: "Bad Request" });
  }

  //Check if request is from admin using the email passed during request
  const checkAdminSql = `SELECT isAdmin FROM members WHERE email = ?`;

  db.get(checkAdminSql, [email], (err, row) => {
    if (err) {
      return response.status(500).json({ message: "Database error" });
    }

    if (!row || !row.isAdmin) {
      return response
        .status(403)
        .json({ message: "Forbidden: Only admins can add events." });
    }

    next();
  });
}

module.exports = {
  db,
  initializeDatabase,
  checkAdmin,
};
