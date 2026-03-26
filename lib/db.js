import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.VERCEL === '1'
    ? path.join('/tmp', 'gotten.db')
    : path.join(process.cwd(), 'data', 'gotten.db');

let db;

function getDb() {
    if (!db) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initializeDb(db);
    }
    return db;
}

function initializeDb(database) {
    database.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer TEXT NOT NULL,
            product TEXT NOT NULL,
            qty INTEGER NOT NULL,
            price INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'baru',
            deadline TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            company TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            qty TEXT NOT NULL,
            unit TEXT,
            status TEXT DEFAULT 'ok',
            min_stock TEXT
        );

        CREATE TABLE IF NOT EXISTS finished_stock (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product TEXT NOT NULL,
            color TEXT NOT NULL,
            s INTEGER DEFAULT 0,
            m INTEGER DEFAULT 0,
            l INTEGER DEFAULT 0,
            xl INTEGER DEFAULT 0,
            xxl INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ok'
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            amount_in INTEGER DEFAULT 0,
            amount_out INTEGER DEFAULT 0,
            order_id TEXT,
            type TEXT DEFAULT 'manual',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS production (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            title TEXT NOT NULL,
            stage TEXT NOT NULL,
            qty TEXT NOT NULL,
            deadline TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // Migrate existing databases: add new columns if they don't exist
    const safeAlter = (sql) => { try { database.exec(sql); } catch (e) { /* column already exists */ } };
    safeAlter("ALTER TABLE orders ADD COLUMN pelunasan INTEGER DEFAULT 0");
    safeAlter("ALTER TABLE transactions ADD COLUMN order_id TEXT");
    safeAlter("ALTER TABLE transactions ADD COLUMN type TEXT DEFAULT 'manual'");

    // Create default admin user if none exists
    const { ensureDefaultUser } = require('./auth');
    ensureDefaultUser();

    // Seed data disabled - tables start empty
    // const orderCount = database.prepare('SELECT COUNT(*) as count FROM orders').get();
    // if (orderCount.count === 0) {
    //     seedData(database);
    // }
}

function seedData(database) {
    // Seed Orders
    const insertOrder = database.prepare(`
        INSERT INTO orders (id, customer, product, qty, price, status, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const orders = [
        ['ORD-0151', 'Band Indie Jogja', 'Kaos Band Merch', 200, 12000000, 'baru', '2026-02-28'],
        ['ORD-0150', 'Tim Futsal Garuda', 'Jersey Futsal Tim', 30, 3600000, 'baru', '2026-02-25'],
        ['ORD-0149', 'Koperasi Mahasiswa UNY', 'Kaos Raglan', 150, 9750000, 'proses', '2026-02-22'],
        ['ORD-0148', 'PT Maju Jaya', 'Kaos Polo Custom', 500, 37500000, 'baru', '2026-02-20'],
        ['ORD-0147', 'CV Berkah Textile', 'T-Shirt DTF Print', 300, 19500000, 'proses', '2026-02-14'],
        ['ORD-0146', 'Universitas Gadjah Mada', 'Kaos Oblong Event', 1000, 55000000, 'proses', '2026-02-18'],
        ['ORD-0145', 'Komunitas Running Jogja', 'Kaos Dri-Fit Running', 200, 18000000, 'proses', '2026-02-14'],
        ['ORD-0144', 'PT Sentosa Abadi', 'Kemeja Kerja', 150, 15000000, 'selesai', '2026-02-12'],
        ['ORD-0143', 'Startup Hub Yogya', 'Hoodie Custom', 100, 12500000, 'selesai', '2026-02-10'],
        ['ORD-0142', 'SMA Negeri 3 Yogyakarta', 'Kaos Angkatan', 450, 24750000, 'proses', '2026-02-14'],
        ['ORD-0141', 'Cafe Delapan', 'Apron & T-Shirt Staff', 50, 5500000, 'dikirim', '2026-02-08'],
        ['ORD-0140', 'Toko Oleh-Oleh Malioboro', 'Kaos Souvenir Jogja', 2000, 90000000, 'dikirim', '2026-02-05'],
        ['ORD-0139', 'PT Digital Kreatif', 'Kaos Company Outing', 80, 5200000, 'selesai', '2026-02-03'],
        ['ORD-0138', 'SMAN 1 Sleman', 'Seragam Olahraga', 600, 33000000, 'dikirim', '2026-01-30'],
        ['ORD-0137', 'Gereja Bethel', 'Kaos Kegiatan Rohani', 250, 13750000, 'selesai', '2026-01-28'],
    ];

    const insertMany = database.transaction((items) => {
        for (const item of items) insertOrder.run(...item);
    });
    insertMany(orders);

    // Seed Customers
    const insertCustomer = database.prepare(`
        INSERT INTO customers (name, company, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
    `);
    const customers = [
        ['PT Maju Jaya', 'Distribusi Garmen', '0812-3456-7890', 'contact@majujaya.co.id', 'Jl. Malioboro No. 45, Yogyakarta'],
        ['CV Berkah Textile', 'Konveksi Partner', '0813-2345-6789', 'berkah@textile.id', 'Jl. Solo KM 8, Sleman'],
        ['Universitas Gadjah Mada', 'Institusi Pendidikan', '0274-555-123', 'humas@ugm.ac.id', 'Bulaksumur, Yogyakarta'],
        ['Komunitas Running Jogja', 'Komunitas Olahraga', '0856-4321-9876', 'runningjogja@gmail.com', 'Jl. Kaliurang KM 5, Sleman'],
        ['PT Sentosa Abadi', 'Korporasi', '0811-2233-4455', 'info@sentosa.co.id', 'Jl. Magelang No. 12, Yogyakarta'],
        ['Startup Hub Yogya', 'Co-Working Space', '0878-9876-5432', 'hello@startuphub.id', 'Jl. Gejayan No. 28, Yogyakarta'],
        ['SMA Negeri 3 Yogyakarta', 'Institusi Pendidikan', '0274-512-456', 'admin@sman3jogja.sch.id', 'Jl. Yos Sudarso No. 7, Yogyakarta'],
        ['Cafe Delapan', 'F&B', '0857-1234-5678', 'cafedelapan@gmail.com', 'Jl. Prawirotaman No. 8, Yogyakarta'],
        ['Toko Oleh-Oleh Malioboro', 'Retail Souvenir', '0812-9999-8888', 'malioborosouvenir@gmail.com', 'Jl. Malioboro No. 112, Yogyakarta'],
        ['PT Digital Kreatif', 'Digital Agency', '0877-6543-2100', 'info@digitalkreatif.id', 'Jl. Seturan No. 15, Yogyakarta'],
        ['SMAN 1 Sleman', 'Institusi Pendidikan', '0274-868-200', 'admin@sman1sleman.sch.id', 'Jl. Magelang KM 14, Sleman'],
        ['Gereja Bethel', 'Organisasi Keagamaan', '0274-515-270', 'admin@gbiyogya.org', 'Jl. Jend. Sudirman No. 32, Yogyakarta'],
        ['Band Indie Jogja', 'Komunitas Musik', '0856-1111-2222', 'baijofficials@gmail.com', 'Jl. Sosrowijayan No. 5, Yogyakarta'],
        ['Tim Futsal Garuda', 'Komunitas Olahraga', '0813-7777-8888', 'garudafutsal@gmail.com', 'Jl. Colombo No. 10, Yogyakarta'],
        ['Koperasi Mahasiswa UNY', 'Institusi Pendidikan', '0274-550-839', 'kopma@uny.ac.id', 'Kampus UNY, Karangmalang, Yogyakarta'],
    ];
    const insertCustomers = database.transaction((items) => {
        for (const item of items) insertCustomer.run(...item);
    });
    insertCustomers(customers);

    // Seed Inventory
    const insertInv = database.prepare(`
        INSERT INTO inventory (category, name, qty, unit, status, min_stock)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const inventory = [
        ['kain', 'Cotton Combed 20s - Putih', '85', 'yard', 'ok', '30'],
        ['kain', 'Cotton Combed 24s - Putih', '42', 'yard', 'ok', '25'],
        ['kain', 'Cotton Combed 30s - Putih', '15', 'yard', 'critical', '30'],
        ['kain', 'Cotton Combed 30s - Hitam', '28', 'yard', 'low', '30'],
        ['kain', 'Dry-Fit Polyester - Putih', '55', 'yard', 'ok', '20'],
        ['kain', 'Fleece Cotton - Abu', '20', 'yard', 'low', '25'],
        ['tinta', 'Tinta Plastisol - Putih', '12', 'kg', 'ok', '5'],
        ['tinta', 'Tinta Plastisol - Hitam', '8', 'kg', 'ok', '5'],
        ['tinta', 'Tinta DTF - CMYK Set', '3', 'set', 'low', '5'],
        ['tinta', 'Tinta Rubber - Multi', '5', 'kg', 'ok', '3'],
        ['benang', 'Benang Obras - Putih', '20', 'cones', 'ok', '10'],
        ['benang', 'Benang Obras - Hitam', '15', 'cones', 'ok', '10'],
        ['benang', 'Benang Jahit - Multi', '8', 'cones', 'low', '10'],
        ['benang', 'Kancing Kemeja', '500', 'pcs', 'ok', '200'],
        ['label', 'Label Woven Gotten', '2000', 'pcs', 'ok', '500'],
        ['label', 'Hangtag Gotten', '800', 'pcs', 'low', '500'],
        ['label', 'Plastik Packaging', '3000', 'pcs', 'ok', '1000'],
        ['label', 'Kardus Box', '150', 'pcs', 'ok', '50'],
    ];
    const insertInventory = database.transaction((items) => {
        for (const item of items) insertInv.run(...item);
    });
    insertInventory(inventory);

    // Seed Finished Stock
    const insertStock = database.prepare(`
        INSERT INTO finished_stock (product, color, s, m, l, xl, xxl, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const stock = [
        ['Kaos Polos Basic', 'Hitam', 45, 60, 80, 55, 30, 'ok'],
        ['Kaos Polos Basic', 'Putih', 30, 50, 65, 40, 20, 'ok'],
        ['Kaos Polos Basic', 'Navy', 10, 15, 20, 8, 5, 'low'],
        ['Kaos Polo', 'Hitam', 5, 8, 12, 6, 3, 'low'],
        ['Hoodie Basic', 'Abu-abu', 0, 3, 5, 2, 0, 'critical'],
    ];
    const insertStocks = database.transaction((items) => {
        for (const item of items) insertStock.run(...item);
    });
    insertStocks(stock);

    // Seed Transactions
    const insertTx = database.prepare(`
        INSERT INTO transactions (date, description, category, amount_in, amount_out)
        VALUES (?, ?, ?, ?, ?)
    `);
    const transactions = [
        ['2026-02-12', 'Pembayaran ORD-0148 (DP 50%)', 'Penjualan', 18750000, 0],
        ['2026-02-11', 'Pembelian Kain Cotton 30s', 'Bahan Baku', 0, 8500000],
        ['2026-02-10', 'Gaji Karyawan Produksi', 'Operasional', 0, 15000000],
        ['2026-02-10', 'Pelunasan ORD-0143', 'Penjualan', 6250000, 0],
        ['2026-02-09', 'Pembelian Tinta DTF', 'Bahan Baku', 0, 3200000],
        ['2026-02-08', 'Pembayaran ORD-0141 (Lunas)', 'Penjualan', 5500000, 0],
        ['2026-02-07', 'Listrik & Air Workshop', 'Operasional', 0, 2800000],
        ['2026-02-06', 'Pelunasan ORD-0140 (Sisa 50%)', 'Penjualan', 45000000, 0],
    ];
    const insertTxs = database.transaction((items) => {
        for (const item of items) insertTx.run(...item);
    });
    insertTxs(transactions);

    // Seed Production Pipeline
    const insertProd = database.prepare(`
        INSERT INTO production (order_id, title, stage, qty, deadline)
        VALUES (?, ?, ?, ?, ?)
    `);
    const production = [
        ['ORD-0148', 'Kaos Polo Custom', 'desain', '500 pcs', '20 Feb'],
        ['ORD-0150', 'Jersey Futsal Tim', 'desain', '30 pcs', '25 Feb'],
        ['ORD-0151', 'Kaos Band Merch', 'desain', '200 pcs', '28 Feb'],
        ['ORD-0146', 'Kaos Oblong Event', 'cutting', '1000 pcs', '18 Feb'],
        ['ORD-0147', 'T-Shirt DTF Print', 'cutting', '300 pcs', '14 Feb'],
        ['ORD-0145', 'Kaos Dri-Fit', 'cutting', '200 pcs', '14 Feb'],
        ['ORD-0142', 'Kaos Angkatan', 'cutting', '450 pcs', '14 Feb'],
        ['ORD-0149', 'Kaos Raglan', 'sewing', '120/150', '22 Feb'],
        ['ORD-0146', 'Kaos Oblong Event', 'sewing', '400/1000', '18 Feb'],
        ['ORD-0147', 'T-Shirt DTF Print', 'sewing', '150/300', '14 Feb'],
        ['ORD-0142', 'Kaos Angkatan', 'sewing', '200/450', '14 Feb'],
        ['ORD-0146', 'Kaos Oblong Event', 'sablon', '200/1000', '18 Feb'],
        ['ORD-0142', 'Kaos Angkatan', 'sablon', '100/450', '14 Feb'],
        ['ORD-0147', 'T-Shirt DTF Print', 'sablon', '80/300', '14 Feb'],
        ['ORD-0144', 'Kemeja Kerja', 'qc', '150 pcs', '12 Feb'],
        ['ORD-0143', 'Hoodie Custom', 'qc', '100 pcs', '10 Feb'],
        ['ORD-0144', 'Kemeja Kerja', 'packing', '120/150', '12 Feb'],
        ['ORD-0143', 'Hoodie Custom', 'packing', '80/100', '10 Feb'],
    ];
    const insertProds = database.transaction((items) => {
        for (const item of items) insertProd.run(...item);
    });
    insertProds(production);
}

export default getDb;
