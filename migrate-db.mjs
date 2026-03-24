import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'gotten.db');
const db = new Database(DB_PATH);

// Migration: Add new columns if they don't exist
const newColumns = [
    { name: 'tanggal', type: 'TEXT' },
    { name: 'company', type: 'TEXT' },
    { name: 'email', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'items', type: 'TEXT' },
    { name: 'subtotal', type: 'INTEGER DEFAULT 0' },
    { name: 'potongan', type: 'INTEGER DEFAULT 0' },
    { name: 'dp', type: 'INTEGER DEFAULT 0' },
    { name: 'shipping_cost', type: 'INTEGER DEFAULT 0' },
    { name: 'shipping_term', type: 'TEXT' },
    { name: 'shipping_method', type: 'TEXT' },
    { name: 'shipping_date', type: 'TEXT' }
];

for (const col of newColumns) {
    try {
        db.prepare(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`Added column ${col.name}`);
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log(`Column ${col.name} already exists. `);
        } else {
            console.error(err);
        }
    }
}

// Migration: Drop unused columns (sizes, color, material)
const columnsToDrop = ['sizes', 'color', 'material'];

for (const col of columnsToDrop) {
    try {
        // Check if column exists first
        const tableInfo = db.prepare("PRAGMA table_info(orders)").all();
        const columnExists = tableInfo.some(c => c.name === col);
        if (columnExists) {
            db.prepare(`ALTER TABLE orders DROP COLUMN ${col}`).run();
            console.log(`Dropped column: ${col}`);
        } else {
            console.log(`Column ${col} does not exist, skipping.`);
        }
    } catch (err) {
        console.error(`Error dropping column ${col}:`, err.message);
    }
}

console.log('Migration complete.');
