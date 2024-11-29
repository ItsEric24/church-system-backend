// Importing dependencies
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { db, initializeDatabase, checkAdmin } = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize database
initializeDatabase();

// POST request when users register for an account
app.post("/users/register", async function (request, response) {
  const {
    username,
    email,
    password,
    nationalId,
    sex,
    districtNumber,
    cardNumber,
  } = request.body;
  // Checking if user has submitted data
  if (
    !username ||
    !email ||
    !password ||
    !nationalId ||
    !sex ||
    !districtNumber ||
    !cardNumber
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

    const insertSql = `INSERT INTO members (username, email, password, nationalId, sex, districtNumber, cardNumber) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const hashedPass = await bcrypt.hash(password, 10);

    db.run(
      insertSql,
      [
        username,
        email,
        hashedPass,
        nationalId,
        sex,
        districtNumber,
        cardNumber,
      ],
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

//POST request when user logs into their account
app.post("/users/login", function (request, response) {
  //Get user data from request
  const { email, districtNumber, password } = request.body;

  // Check if user has submitted any data
  if (!email || !districtNumber || !password) {
    return response.status(400).json({ message: "Bad Request" });
  }

  const checkSql = `SELECT * FROM members WHERE email = ? OR districtNumber = ? OR password = ?`;

  db.get(checkSql, [email, password], async function (err, row) {
    if (err) {
      return response
        .status(500)
        .json({ message: "Database error during data check" });
    }

    //Check if password maches the onw in the database
    const hashedPass = await bcrypt.compare(password, row.password);

    if (hashedPass) {
      const { password, nationalId, ...other } = row;
      return response.status(200).json(other);
    } else {
      return response.status(400).json({ message: "Login unsuccessful" });
    }
  });
});

//GET request to fetch all events
app.get("/events", function (request, response) {
  const getSql = `SELECT * FROM events`;

  db.all(getSql, [], (err, rows) => {
    if (err) {
      return response.status(500).json({ message: "Unable to fetch data" });
    } else {
      response.status(200).json({ events: rows });
    }
  });
});

//POST request to create events --- (admin on
app.post("/events/add", checkAdmin, function (request, response) {
  const { eventName, eventDate, eventTime } = request.body;

  if (!eventName || !eventDate || !eventTime) {
    return response.status(400).json({ message: "Please provide all fields" });
  }

  const insertEventSql = `
  INSERT INTO events (event_name, event_date, event_time)
  VALUES (?, ?, ?)
`;

  db.run(insertEventSql, [eventName, eventDate, eventTime], (err)=>{

    if(err){
      return response.status(500).json({ message: "Error adding event"})
    }

    response.status(201).json({ message: "Event added successfully"})
  })
});

app.get("/users", function (request, response) {
  // TODO: Check if request if from admin
  // TODO: Fetch all users from database
});

app.listen(3000, function () {
  console.log("Listening on port 3000");
});
