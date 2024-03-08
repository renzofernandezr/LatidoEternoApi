const express = require('express');
const sql = require('mssql');
const app = express();

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


// Define a GET route to retrieve a list of vehicles
app.get('/hola', (req, res) => {
 res.json("hola")
});

// Endpoint to get a Medallon by UID
app.get('/medallon/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM Maestro_Medallon WHERE UID = ${uid}`;

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('Medallon not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server started on port 3000.');
});


