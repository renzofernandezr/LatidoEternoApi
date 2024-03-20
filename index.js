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

async function getUrlFromMiembroContenido(idMiembro, Tipo) {
    try {
        // Assuming sql is your database connection object and it's already configured
        await sql.connect(dbConfig);
        const result = await sql.query`
            SELECT url 
            FROM Miembro_Contenido 
            WHERE idMiembro = ${idMiembro} AND Tipo = ${Tipo}`;

        if (result.recordset.length > 0) {
            // Assuming the query returns at least one row, return the URL of the first match
            return result.recordset[0].url;
        } else {
            // Handle the case where no matching row is found
            console.log('No matching Miembro_Contenido found.');
            return null;
        }
    } catch (err) {
        console.error('Error retrieving URL from Miembro_Contenido:', err);
        return null;
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

// Assuming getUrlFromMiembroContenido is defined and available in the scope

app.get('/medallon/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        await sql.connect(dbConfig);
        const queryResult = await sql.query`
            SELECT m.idMedallon, m.UID, m.estado, 
                   mi.CodigoMiembro, mi.CodigoUsuario, mi.Nombre AS MiembroNombre, mi.Apellido, 
                   mi.FechaDeNacimiento, mi.FechaDePartida, mi.Biografia, mi.Frase,mi.relacion,mi.fechacreacion 
                   p.Nombre AS PaisNombre, p.NombreSpanish AS PaisNombreSpanish, p.nombreCorto AS PaisNombreCorto,
                   e.nombre AS EstadoNombre
            FROM Maestro_Medallon AS m
            JOIN Miembro AS mi ON m.UID = mi.UID_Medallon
            JOIN Maestro_Paises AS p ON mi.idPais = p.id
            JOIN Estados AS e ON mi.idEstado = e.id
            WHERE m.UID = ${uid}`;

        if (queryResult.recordset.length > 0) {
            const medallonData = queryResult.recordset[0];
            const avatarUrl = await getUrlFromMiembroContenido(medallonData.CodigoMiembro, 'avatar');
            const bannerUrl = await getUrlFromMiembroContenido(medallonData.CodigoMiembro, 'banner');

            // Constructing the response object with additional AvatarUrl and BannerUrl
            const response = {
                idMedallon: medallonData.idMedallon,
                UID: medallonData.UID,
                estado: medallonData.estado,
                Miembro: {
                    CodigoMiembro: medallonData.CodigoMiembro,
                    CodigoUsuario: medallonData.CodigoUsuario,
                    Nombre: medallonData.MiembroNombre,
                    Apellido: medallonData.Apellido,
                    FechaDeNacimiento: medallonData.FechaDeNacimiento,
                    FechaDePartida: medallonData.FechaDePartida,
                    Biografia: medallonData.Biografia,
                    Frase: medallonData.Frase,
                    Relacion: medallonData.relacion,
                    Fechacreacion: medallonData.fechacreacion,

                    Pais: {
                        Nombre: medallonData.PaisNombre,
                        NombreSpanish: medallonData.PaisNombreSpanish,
                        NombreCorto: medallonData.PaisNombreCorto,
                        FlagImageUrl: `https://blobcontlatidoeterno.blob.core.windows.net/app-images/banderas/flag-of-${medallonData.PaisNombre}.jpg`
                    },
                    Estado: {
                        Nombre: medallonData.EstadoNombre
                    },
                    AvatarUrl: avatarUrl,
                    BannerUrl: bannerUrl
                }
            };
            res.json(response);
        } else {
            res.status(404).send('Medallon not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    } finally {
        sql.close();
    }
});

app.get('/media/:idMiembro', async (req, res) => {
    try {
        const { idMiembro } = req.params; // Extracting idMiembro from the route parameters

        await sql.connect(dbConfig); // Connecting to the database
        const result = await sql.query`
            SELECT * FROM Miembro_Contenido 
            WHERE IdMiembro = ${idMiembro} 
            AND (Tipo = 'video' OR Tipo = 'imagen') 
            AND estado = 'a'`; // Fetching only active ('AC') videos or images

        if (result.recordset.length > 0) {
            // If there are results, send them back
            res.json(result.recordset);
        } else {
            // If no results, send a 404 Not Found response
            res.status(404).send('No media found for the provided IdMiembro.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while retrieving media data.');
    } finally {
        await sql.close(); // Ensure the database connection is closed after the operation
    }
});

app.get('/members/:CodigoUsuario', async (req, res) => {
    try {
        // Extract CodigoUsuario from the URL parameter
        const { CodigoUsuario } = req.params;

        // Connect to the database
        await sql.connect(dbConfig);

        // Query to fetch all members linked to the given CodigoUsuario
        const result = await sql.query`
            SELECT 
                CodigoMiembro, CodigoUsuario, Nombre, Apellido, FechaDeNacimiento, 
                FechaDePartida, Biografia, UID_Medallon, Frase, idPais, idEstado, 
                relacion, fechacreacion 
            FROM Miembro 
            WHERE CodigoUsuario = ${CodigoUsuario}`;

        // Check if members were found
        if (result.recordset.length > 0) {
            // Send the result as JSON
            res.json(result.recordset);
        } else {
            // Handle case where no members are found
            res.status(404).send('No members found for the provided CodigoUsuario.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while retrieving members.');
    } finally {
        await sql.close(); // Ensure to close the database connection
    }
});



// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000 with CORS enabled.');
});
