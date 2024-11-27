// Importing dependencies
const express = require("express");
const sqlite = require("sqlite3");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors())
const db = new sqlite.Database("church.db");

app.get("/test", function (request, response) {
  const sql = `
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT,
            password TEXT,
            nationalId TEXT,
            sex TEXT,
            districtNumber TEXT,
            isAdmin BOOLEAN DEFAULT FALSE
        )
    `;
  db.run(sql, (err) => {
    if (err) {
      response.status(500).json({ error: err.message });
    } else {
      response.json({ message: "Table created successfully" });
    }
  });
});
// POST request when users register for an account
app.post("/register", async function (request, response) {
  const { username, email, password, nationalId, sex, districtNumber } =
    request.body;
  // Checking if user has submitted data
  if (
    !username ||
    !email ||
    !password ||
    !nationalId ||
    !sex ||
    !districtNumber
  ) {
    return response.status(400).json({ message: "Bad request" });
  }

  const checkSql = `SELECT * FROM members WHERE email = ? OR nationalId = ?`;
  db.get(checkSql, [email, nationalId], async (err, row) => {
    if (err) {
      return response
        .status(500)
        .json({ error: "Database error during duplicate check" });
    }

    if (row) {
      // Member is already registered
      return response.status(400).json({
        message: "Member already registered with this email or national ID",
      });
    }

    const insertSql = `INSERT INTO members (username, email, password, nationalId, sex, districtNumber) VALUES (?, ?, ?, ?, ?, ?)`;
    const hashedPass = await bcrypt.hash(password, 10);

    db.run(
      insertSql,
      [username, email, hashedPass, nationalId, sex, districtNumber],
      function (err) {
        if (err) {
          return response.status(500).json({ error: err.message });
        } else {
          return response
            .status(200)
            .json({ message: "Register successfully" });
        }
      }
    );
  });
});

app.post("/login", function (request, response) {
  //Get user data from request
  const { email, districtNumber, password } = request.body;

  // Check if user has submitted any data
  if (!email || !districtNumber || !password) {
    return response.status(400).json({ message: "Bad Request" });
  }

  // TODO: Check the userdata against userInfo in database\
  const checkSql = `SELECT * FROM members WHERE email = ? OR districtNumber = ? OR password = ?`

  db.get(checkSql, [email, password], async function(err, row){

    if(err){
      return response.status(500).json({ message: "Database error during data check"})
    }

    //Check if password maches the onw in the database
    const hashedPass = await bcrypt.compare(password, row.password)

    if(hashedPass){
      return response.status(200).json(row)

    }else{
      return response.status(400).json({message: "Login unsuccessful"})
    }

  })
});

app.get("/events", function (request, response) {
  // TODO: Fetch event data from database

  response.status(200).json({ message: "Request Successfull" });
});

app.get("/users", function (request, response) {
  // TODO: Check if request if from admin
  // TODO: Fetch all users from database
});

app.listen(3000, function () {
  console.log("Listening on port 3000");
});
