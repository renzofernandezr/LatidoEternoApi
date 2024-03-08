const express = require('express');
const app = express();

// Define a GET route to retrieve a list of vehicles
app.get('/medallon', (req, res) => {
 res.json("hola")
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server started on port 3000.');
});


