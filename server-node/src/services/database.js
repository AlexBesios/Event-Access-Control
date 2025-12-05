/* global require, process, __dirname, Buffer, module */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../../api/event_access.db');
        this.db = null;
        this.SQL = null;
    }

    async init() {
        this.SQL = await initSqlJs();
        
        try {
            const filebuffer = fs.readFileSync(this.dbPath);
            this.db = new this.SQL.Database(filebuffer);
        } catch {
            this.db = new this.SQL.Database();
            this.initDatabase();
        }
    }

    initDatabase() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                face_data BLOB NOT NULL,
                face_image BLOB,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        this.saveDatabase();
    }

    saveDatabase() {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
    }

    reloadDatabase() {
        try {
            const filebuffer = fs.readFileSync(this.dbPath);
            if (this.db) {
                this.db.close();
            }
            this.db = new this.SQL.Database(filebuffer);
        } catch (error) {
            console.error('Error reloading database:', error);
        }
    }

    getAllMembers() {
        this.reloadDatabase();
        const stmt = this.db.prepare(`
            SELECT id, first_name, last_name, email, phone, face_image 
            FROM members 
            ORDER BY id DESC
        `);
        const members = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            members.push(row);
        }
        stmt.free();
        return members;
    }

    getMemberById(id) {
        this.reloadDatabase();
        const stmt = this.db.prepare(`
            SELECT id, first_name, last_name, email, phone 
            FROM members 
            WHERE id = ?
        `);
        stmt.bind([id]);
        let member = null;
        if (stmt.step()) {
            member = stmt.getAsObject();
        }
        stmt.free();
        return member;
    }

    getMemberByEmail(email) {
        this.reloadDatabase();
        const stmt = this.db.prepare(`
            SELECT id, first_name, last_name, email, phone 
            FROM members 
            WHERE email = ?
        `);
        stmt.bind([email]);
        let member = null;
        if (stmt.step()) {
            member = stmt.getAsObject();
        }
        stmt.free();
        return member;
    }

    deleteMember(id) {
        const stmt = this.db.prepare('DELETE FROM members WHERE id = ?');
        stmt.bind([id]);
        stmt.step();
        stmt.free();
        this.saveDatabase();
        return { changes: 1 };
    }

    close() {
        if (this.db) {
            this.saveDatabase();
            this.db.close();
        }
    }
}

const dbService = new DatabaseService();

module.exports = dbService;
