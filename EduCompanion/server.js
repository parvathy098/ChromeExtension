const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 3002;

// In-memory storage for demo purposes
let blockedSites = [];
let todos = [];
let notes = [];

// Middleware
app.use(cors()); // Enable CORS to allow requests from your Chrome extension
app.use(bodyParser.json()); // Parse JSON bodies

// -------------- Root Route --------------
// This route handles the root URL and responds with a simple message
app.get("/", (req, res) => {
  res.send(
    "Server is running. Use /api/blocked-sites, /api/todos, or /api/notes for API requests."
  );
});

// -------------- API for Blocked Sites --------------

// Get all blocked sites
app.get("/api/blocked-sites", (req, res) => {
  res.json(blockedSites);
});

// Add a blocked site
app.post("/api/blocked-sites", (req, res) => {
  const { site } = req.body;
  if (site) {
    blockedSites.push(site);
    console.log("Blocked Sites:", blockedSites); // Log the array to see what's inside
    res.json({ message: "Site added to blocked list", blockedSites });
  } else {
    res.status(400).json({ message: "Invalid site" });
  }
});

// Clear all blocked sites
app.post("/api/clear-blocked-sites", (req, res) => {
  blockedSites = [];
  res.json({ message: "All blocked sites cleared", blockedSites });
});

// -------------- API for To-Do List --------------

// Get all to-do items
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

// Add a to-do item
app.post("/api/todos", (req, res) => {
  const { todo } = req.body;
  if (todo) {
    todos.push(todo);
    res.json({ message: "To-Do item added", todos });
  } else {
    res.status(400).json({ message: "Invalid to-do item" });
  }
});

// Clear all to-do items
app.post("/api/clear-todos", (req, res) => {
  todos = [];
  res.json({ message: "All to-do items cleared", todos });
});

// -------------- API for Notes --------------

// Get all notes
app.get("/api/notes", (req, res) => {
  res.json(notes);
});

// Add a note
app.post("/api/notes", (req, res) => {
  const { note } = req.body;
  if (note) {
    notes.push(note);
    res.json({ message: "Note added", notes });
  } else {
    res.status(400).json({ message: "Invalid note" });
  }
});

// Clear all notes
app.post("/api/clear-notes", (req, res) => {
  notes = [];
  res.json({ message: "All notes cleared", notes });
});

// -------------- Start the Server --------------
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
