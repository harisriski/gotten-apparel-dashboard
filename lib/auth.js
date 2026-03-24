import crypto from 'crypto';
import getDb from './db';

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

// Session token cookie name
export const SESSION_COOKIE = 'gotten_session';

// Hash a password
export function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return `${salt}:${hash}`;
}

// Verify a password against a hash
export function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return hash === verifyHash;
}

// Generate a session token
export function generateSessionToken() {
    return crypto.randomBytes(48).toString('hex');
}

// Create a new session
export function createSession(userId) {
    const db = getDb();
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(`
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (?, ?, ?)
    `).run(token, userId, expiresAt);

    return { token, expiresAt };
}

// Validate a session token
export function validateSession(token) {
    if (!token) return null;
    const db = getDb();
    const session = db.prepare(`
        SELECT s.*, u.username, u.display_name, u.role 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token);

    return session || null;
}

// Delete a session (logout)
export function deleteSession(token) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Clean up expired sessions
export function cleanExpiredSessions() {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

// Initialize default admin user if no users exist
export function ensureDefaultUser() {
    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const passwordHash = hashPassword('admin123');
        db.prepare(`
            INSERT INTO users (username, password_hash, display_name, role) 
            VALUES (?, ?, ?, ?)
        `).run('admin', passwordHash, 'Admin', 'admin');
        console.log('Default admin user created (username: admin, password: admin123)');
    }
}
