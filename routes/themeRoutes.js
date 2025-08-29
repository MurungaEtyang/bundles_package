import express from 'express';
import ThemeServices from '../controller/ThemeServices.js';
import {authenticateJwt} from "../middleware/authenticateJwt.js";

const router = express.Router();

router.get('/theme-settings', async (req, res) => {
    try {
        const settings = await ThemeServices.getAllThemeSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/theme-settings/:section', async (req, res) => {
    try {
        const setting = await ThemeServices.getThemeSetting(req.params.section);
        if (!setting) {
            return res.status(404).json({ error: 'Theme setting not found' });
        }
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/theme-settings', authenticateJwt, async (req, res) => {
    const { section, styles } = req.body;
    
    if (!section || !styles) {
        return res.status(400).json({ error: 'Section and styles are required' });
    }

    try {
        const result = await ThemeServices.upsertThemeSetting(section, styles);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/theme-settings/:section', async (req, res) => {
    try {
        const result = await ThemeServices.deleteThemeSetting(req.params.section);
        if (!result) {
            return res.status(404).json({ error: 'Theme setting not found' });
        }
        res.json({ message: 'Theme setting deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
