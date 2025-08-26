import pool from '../config/config.js';

class OffersController {
    // Get all offers with optional filtering by category
    static async getOffers(category = null) {
        let query = `
            SELECT id, name, description, price, type, category, created_at, updated_at 
            FROM offers
        `;

        const params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Add a new offer
    static async addOffer(offerData) {
        const { name, description, price, type, category } = offerData;

        const validCategories = ['data', 'sms', 'voice'];
        if (!validCategories.includes(category)) {
            throw new Error('Invalid offer category. Must be one of: data, sms, voice');
        }

        const query = `
            INSERT INTO offers (name, description, price, type, category)
            VALUES ($1, $2, $3, $4, $5)
                RETURNING id, name, description, price, type, category, created_at, updated_at
        `;

        const values = [name, description, price, type, category];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Update an existing offer
    static async updateOffer(id, updateData) {
        const { name, description, price, type, category } = updateData;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (price !== undefined) {
            updates.push(`price = $${paramCount++}`);
            values.push(price);
        }
        if (type !== undefined) {
            updates.push(`type = $${paramCount++}`);
            values.push(type);
        }
        if (category !== undefined) {
            updates.push(`category = $${paramCount++}`);
            values.push(category);
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        updates.push(`updated_at = NOW()`);

        values.push(id);
        const query = `
            UPDATE offers
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, description, price, type, category, created_at, updated_at
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async deleteOffer(id) {
        const query = 'DELETE FROM offers WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getOfferById(id) {
        const query = 'SELECT * FROM offers WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async deleteAllOffers() {
        const query = 'DELETE FROM offers RETURNING id';
        const result = await pool.query(query);
        return result.rowCount;
    }
}

export default OffersController;