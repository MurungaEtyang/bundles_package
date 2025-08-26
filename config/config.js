import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcrypt';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultData = {
    name: process.env.DEFAULT_NAME || 'Evans Murunga',
    email: process.env.DEFAULT_EMAIL || 'murungaevans84@gmail.com',
    role: process.env.DEFAULT_ROLE || 'admin',
    password: process.env.DEFAULT_PASSWORD || 'Evans1324$M',
};

const dbConfig = {
    host: process.env.DB_HOST || '102.212.247.216',
    user: process.env.DB_USER || 'okiya_user',
    password: process.env.DB_PASSWORD || 'Evans1324$M',
    database: process.env.DB_NAME || 'okiya_omtatah_db',
    port: process.env.DB_PORT || 5432,
    max: 50, // Increased pool size
    min: 10,  // Minimum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Reduced timeout
    maxUses: 7500, // Close and remove a connection after it has been used this many times
    allowExitOnIdle: true,
    application_name: 'trading-app',
    query_timeout: 10000, // 10 seconds query timeout
    statement_timeout: 10000, // 10 seconds statement timeout
};

const pool = new pg.Pool(dbConfig);

async function setupDatabase() {
    try {
        console.log(`Connecting to database: ${dbConfig.host}/${dbConfig.database}`);
        await pool.connect();
        console.log('Database connected successfully.');

        const sqlFilePath = path.join(__dirname, 'database.sql');
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found: ${sqlFilePath}`);
        }

        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('Running SQL schema file...');
        await pool.query(sql);
        console.log('Schema setup complete.');

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [defaultData.email]);

        if (result.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(defaultData.password, 10);

            try {
                const insertResult = await pool.query(
                    `INSERT INTO users (name, email, password, role, description)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (email) DO NOTHING
                     RETURNING *`,
                    [
                        defaultData.name,
                        defaultData.email,
                        hashedPassword,
                        defaultData.role,
                        'Default company admin account'
                    ]
                );

                if (insertResult.rows.length > 0) {
                    console.log('Default company admin inserted successfully:');
                    console.log(insertResult.rows[0]);
                } else {
                    console.log('Default company admin already exists, skipping insert.');
                }
            } catch (insertError) {
                console.error('Error inserting default company admin:', insertError);
            }
        } else {
            console.log('Default company admin already exists, skipping insert.');
        }
    } catch (err) {
        console.error('❌ Error setting up the database:', err.stack);
    }
}

setupDatabase()
    .then(() => console.log('✅ Setup completed.'))
    .catch(err => console.error('❌ Error during setup:', err));

export default pool;
