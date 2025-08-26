import pool from '../config/config.js';

class Transactions {
    static async getAllTransactions(req, res) {
        try {
            // Simple query to get all transactions ordered by most recent first
            const result = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
            
            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transactions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

export default Transactions;
