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

app.get('/medallon/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        await sql.connect(dbConfig);
        
        // Corrected SQL query
        const result = await sql.query`
            SELECT m.idMedallon, m.UID, m.estado, m.URL, mi.*
            FROM Maestro_Medallon AS m
            INNER JOIN Miembro AS mi ON m.UID = mi.UID_Medallon
            WHERE m.UID = ${uid}`;

        if (result.recordset.length > 0) {
            const medallonData = result.recordset[0];
            // Constructing the main object with specified parameters
            const medallonWithMiembro = {
                idMedallon: medallonData.idMedallon,
                UID: medallonData.UID,
                estado: medallonData.estado,
                URL: medallonData.URL,
                Miembro: {
                    // Extract Miembro details; ensure these match your Miembro table's schema
                    CodigoMiembro: medallonData.CodigoMiembro,
                    CodigoUsuario: medallonData.CodigoUsuario,
                    Nombre: medallonData.Nombre,
                    Apellido: medallonData.Apellido,
                    Biografia: medallonData.Biografia,
                    UID_Medallon: medallonData.UID_Medallon,
                    FotoUrl: medallonData.FotoUrl
                }
            };

            res.json(medallonWithMiembro);
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
    console.log('Server started on port 3000 with CORS enabled.');
});
