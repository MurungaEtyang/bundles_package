import pool from '../config/config.js';

class MpesaCredentials {
    // Get the latest M-Pesa credentials
    static async getCredentials() {
        const query = `
            SELECT * FROM mpesa_credentials 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        
        const result = await pool.query(query);
        return result.rows[0] || null;
    }

    // Add new M-Pesa credentials
    static async addCredentials(credentials) {
        const { consumer_key, consumer_secret, short_code, pass_key } = credentials;
        
        const query = `
            INSERT INTO mpesa_credentials 
            (consumer_key, consumer_secret, short_code, pass_key)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at
        `;

        const result = await pool.query(query, [
            consumer_key,
            consumer_secret,
            short_code,
            pass_key
        ]);

        return result.rows[0];
    }

    // Get M-Pesa callback URL from environment
    static getCallbackUrl() {
        return process.env.MPESA_CALLBACK_URL || 'https://www.bingwasokonii.com/api/mpesa/callback';
    }
}

export default MpesaCredentials;
