
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/config.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export default class Users {
    constructor() {
        this.pool = pool;
        this.saltRounds = 10;
    }

    async register(req, res, next) {
        const { name, email, password, role = 'user', description = '' } = req.body;

        if (!name || !email || !password) {
            const error = new Error('Name, email, and password are required');
            error.status = 400;
            throw error;
        }

        const existingUser = await this.pool.query(
            'SELECT * FROM users WHERE email = $1 OR name = $2',
            [email, name]
        );

        if (existingUser.rows.length > 0) {
            const error = new Error('User with this email or username already exists');
            error.status = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, this.saltRounds);

        const result = await this.pool.query(
            'INSERT INTO users (name, email, password, role, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, description',
            [name, email, hashedPassword, role, description]
        );

        const token = this.generateToken(result.rows[0]);
        return {
            user: result.rows[0],
            token
        };
    }

    async login(req, res, next) {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = new Error('Email and password are required');
            error.status = 400;
            throw error;
        }

        const result = await this.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            const error = new Error('Invalid email or password');
            error.status = 401;
            throw error;
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            const error = new Error('Invalid email or password');
            error.status = 401;
            throw error;
        }

        const token = this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token
        };
    }

    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            type: 'access',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }

    async getUsers(req, res, next) {
        const result = await this.pool.query(
            'SELECT id, name, email, role, description, created_at FROM users'
        );
        return result.rows;
    }

}