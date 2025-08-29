import pool from "../config/config.js";


class ThemeServices {

    static async getAllThemeSettings() {
        try {
            const result = await pool.query(
                'SELECT * FROM theme_settings ORDER BY section'
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching theme settings:', error);
            throw error;
        }
    }

    static async getThemeSetting(section) {
        try {
            const result = await pool.query(
                'SELECT * FROM theme_settings WHERE section = $1',
                [section]
            );
            return result.rows[0];
        } catch (error) {
            console.error(`Error fetching theme setting for section ${section}:`, error);
            throw error;
        }
    }

    static async upsertThemeSetting(section, styles) {

        const defaultStyles = {
            background_color: "#ffffff",
            font_color: "#000000",
            font_family: "Arial, sans-serif",
            font_size: "16px"
        };

        const finalStyles = styles ? { ...defaultStyles, ...styles } : defaultStyles;

        try {
            const result = await pool.query(
                `INSERT INTO theme_settings (section, styles, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (section) 
                 DO UPDATE SET 
                    styles = $2,
                    updated_at = NOW()
                 RETURNING *`,
                [section, finalStyles]
            );
            return result.rows[0];
        } catch (error) {
            console.error(`Error upserting theme setting for section ${section}:`, error);
            throw error;
        }
    }

    static async deleteThemeSetting(section) {
        try {
            const result = await pool.query(
                'DELETE FROM theme_settings WHERE section = $1 RETURNING *',
                [section]
            );
            return result.rows[0];
        } catch (error) {
            console.error(`Error deleting theme setting for section ${section}:`, error);
            throw error;
        }
    }
}

export default ThemeServices;