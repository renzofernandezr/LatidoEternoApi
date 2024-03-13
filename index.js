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
    res.json("holas");
});

app.get('/medallon/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        await sql.connect(dbConfig);

        const queryResult = await sql.query`
            SELECT 
                maestro.idMedallon,
                maestro.UID,
                maestro.estado,
                miembro.CodigoMiembro AS idMiembro,
                miembro.Nombre,
                miembro.Apellido,
                miembro.FechaDeNacimiento,
                miembro.FechaDePartida,
                miembro.Frase,
                miembro.Biografia,
                miembro.FotoUrl 
            FROM 
                Maestro_Medallon AS maestro
            INNER JOIN 
                Miembro AS miembro
            ON 
                maestro.UID = miembro.UID_Medallon
            WHERE 
                maestro.UID = ${uid}`;

        if (queryResult.recordset.length > 0) {
            const medallonData = queryResult.recordset[0];

            const response = {
                idMedallon: medallonData.idMedallon,
                UID: medallonData.UID,
                estado: medallonData.estado,
                Miembro: {
                    idMiembro: medallonData.idMiembro,
                    Nombre: medallonData.Nombre,
                    Apellido: medallonData.Apellido,
                    FechaDeNacimiento: medallonData.FechaDeNacimiento,
                    FechaDePartida: medallonData.FechaDePartida,
                    Frase: medallonData.Frase,
                    Biografia: medallonData.Biografia,
                    FotoUrl: medallonData.FotoUrl  // Include FotoUrl in the Miembro object
                }
            };

            res.json(response);
        } else {
            res.status(404).send('Medallon not found');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('An error occurred while retrieving Medallon data');
    } finally {
        sql.close();
    }
});



// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000 with CORS enabled.');
});
