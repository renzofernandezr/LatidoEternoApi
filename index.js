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

app.get('/Maestro_Medallon/:UID', async (req, res) => {
    try {
        const { UID } = req.params;
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM Maestro_Medallon WHERE UID = ${UID}`;

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('Maestro_Medallon not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while retrieving Maestro_Medallon data');
    } finally {
        sql.close();
    }
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
                miembro.FotoUrl, 
                miembro.idUbigeo
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
                    FotoUrl: medallonData.FotoUrl,
                    idUbigeo: medallonData.idUbigeo
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

app.get('/ubigeo/:idUbigeo', async (req, res) => {
    try {
        const { idUbigeo } = req.params;
        await sql.connect(dbConfig);
        const queryResult = await sql.query`
            SELECT 
                ubi.idUbigeo, ubi.Descripcion, ubi.urlImagePais,
                CONCAT(ubi.Descripcion, ', ', parentUbi.Descripcion) AS FullDescripcion,
                parentUbi.urlImagePais AS ParentUrlImagePais
            FROM 
                Maestro_Ubigeo AS ubi
                LEFT JOIN Maestro_Ubigeo AS parentUbi ON ubi.idPadreUbigeo = parentUbi.idUbigeo
            WHERE 
                ubi.idUbigeo = ${idUbigeo}`;

        if (queryResult.recordset.length > 0) {
            const ubigeoData = queryResult.recordset[0];
            const response = {
                idUbigeo: ubigeoData.idUbigeo,
                Descripcion: ubigeoData.Descripcion,
                FullDescripcion: ubigeoData.FullDescripcion,
                urlImagePais: ubigeoData.ParentUrlImagePais,
            };
            res.json(response);
        } else {
            res.status(404).send('Ubigeo not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    } finally {
        sql.close();
    }
});




// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000 with CORS enabled.');
});
