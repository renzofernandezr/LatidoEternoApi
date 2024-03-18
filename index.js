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
                   mi.FechaDeNacimiento, mi.FechaDePartida, mi.Biografia, mi.Frase, 
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
                    Pais: {
                        Nombre: medallonData.PaisNombre,
                        NombreSpanish: medallonData.PaisNombreSpanish,
                        NombreCorto: medallonData.PaisNombreCorto,
                        FlagImageUrl: `https://blobcontlatidoeterno.blob.core.windows.net/app-images/banderas/${medallonData.PaisNombre}.jpg`
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


// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000 with CORS enabled.');
});
