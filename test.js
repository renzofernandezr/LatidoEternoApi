const sql = require('mssql');

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

async function getMedallon(uid) {
    try {
        // Connect to the database
        await sql.connect(dbConfig);
        
        // Execute the query
        const result = await sql.query`SELECT * FROM Maestro_Medallon WHERE UID = ${uid}`;
        
        // Log the result
        console.log(result.recordset); // Use recordset to access the rows returned

    } catch (err) {
        // If an error occurs, log it
        console.error(err);
    }
}

const uid = "18B35D6B08DF4E09946036A64BBE13D700000000";
getMedallon(uid);
