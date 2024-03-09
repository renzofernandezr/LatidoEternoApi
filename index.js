const express = require('express');
const sql = require('mssql');
const app = express();

// Middleware to set CORS headers
app.use((req, res, next) => {
    // Allow all origins
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Support cookies and HTTP authentication
    res.header('Access-Control-Allow-Credentials', 'true');

    // Support additional HTTP methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    next();
});

// Database configuration
const dbConfig = {
    user: 'dev',
    password: 'LatidoEterno2024',
    server: 'latido-eterno-server.database.windows.net', 
    database: 'LatidoEternoDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Function to get a Medallon by UID
async function getMedallon(uid) {
    try {
        // Ensure a single connection pool is used for multiple requests
        await sql.connect(dbConfig);

        // Execute the query
        const result = await sql.query`SELECT * FROM Maestro_Medallon WHERE UID = ${uid}`;
        return result.recordset; // Return the recordset

    } catch (err) {
        throw err; // Rethrow the error to be caught by the route handler
    }
}

// Test route
app.get('/hola', (req, res) => {
    res.json("hola");
});

// Endpoint to get a Medallon by UID
app.get('/medallon/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        const recordset = await getMedallon(uid); // Call the function with uid

        // If a result is found, return the first record
        if (recordset.length > 0) {
            res.json(recordset[0]);
        } else {
            // If no result is found, return an empty JSON object
            res.json({});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000 with CORS enabled.');
});
