import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') || '').trim();

        let query = `
            SELECT o.*, 
                   wo.wo_number,
                   (SELECT COUNT(*) FROM transactions t WHERE t.order_id = o.id) as tx_count
            FROM orders o
            LEFT JOIN work_orders wo ON wo.order_id = o.id
            WHERE o.deleted_at IS NOT NULL
        `;
        const params = [];

        if (search) {
            query += ' AND (o.id LIKE ? OR o.customer LIKE ? OR o.product LIKE ? OR wo.wo_number LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ' ORDER BY o.deleted_at DESC';

        const rows = db.prepare(query).all(...params);

        // Parse items JSON
        const items = rows.map(r => {
            let parsedItems = [];
            try {
                parsedItems = typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []);
            } catch {
                parsedItems = [];
            }
            return {
                ...r,
                items: parsedItems
            };
        });

        return NextResponse.json({
            items,
            total: items.length
        });
    } catch (error) {
        console.error('GET /api/trash error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { action, id } = body;

        if (action === 'restore') {
            if (!id) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            // Restore order, work order, and transactions
            db.prepare('UPDATE orders SET deleted_at = NULL WHERE id = ?').run(id);
            db.prepare('UPDATE work_orders SET deleted_at = NULL WHERE order_id = ?').run(id);
            db.prepare('UPDATE transactions SET deleted_at = NULL WHERE order_id = ?').run(id);

            // Restore customer in customers table if not exists
            if (order.customer && order.customer.trim()) {
                const custName = order.customer.trim();
                const existingCust = db.prepare('SELECT id FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1').get(custName);
                if (!existingCust) {
                    db.prepare(`
                        INSERT INTO customers (name, company, phone, email, address, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(
                        custName,
                        order.company || '',
                        order.phone || '',
                        order.email || '',
                        order.address || '',
                        order.tanggal || order.created_at || new Date().toISOString()
                    );
                }
            }

            return NextResponse.json({ message: 'Order restored successfully', id });
        }

        if (action === 'restore_all') {
            const trashedOrders = db.prepare('SELECT * FROM orders WHERE deleted_at IS NOT NULL').all();

            db.prepare('UPDATE orders SET deleted_at = NULL WHERE deleted_at IS NOT NULL').run();
            db.prepare('UPDATE work_orders SET deleted_at = NULL WHERE deleted_at IS NOT NULL').run();
            db.prepare('UPDATE transactions SET deleted_at = NULL WHERE deleted_at IS NOT NULL').run();

            // Re-sync all restored customers
            for (const order of trashedOrders) {
                if (order.customer && order.customer.trim()) {
                    const custName = order.customer.trim();
                    const existingCust = db.prepare('SELECT id FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1').get(custName);
                    if (!existingCust) {
                        db.prepare(`
                            INSERT INTO customers (name, company, phone, email, address, created_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `).run(
                            custName,
                            order.company || '',
                            order.phone || '',
                            order.email || '',
                            order.address || '',
                            order.tanggal || order.created_at || new Date().toISOString()
                        );
                    }
                }
            }

            return NextResponse.json({ message: 'All orders restored successfully', count: trashedOrders.length });
        }

        if (action === 'destroy') {
            if (!id) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const custName = order.customer ? order.customer.trim() : '';

            // Permanently delete linked records
            db.prepare('DELETE FROM transactions WHERE order_id = ?').run(id);
            db.prepare('DELETE FROM work_orders WHERE order_id = ?').run(id);
            db.prepare('DELETE FROM orders WHERE id = ?').run(id);

            // If customer has no active orders left, remove from customers table
            if (custName) {
                const remaining = db.prepare(`
                    SELECT COUNT(*) as count 
                    FROM orders 
                    WHERE LOWER(TRIM(customer)) = LOWER(TRIM(?)) AND deleted_at IS NULL
                `).get(custName);

                if (!remaining || remaining.count === 0) {
                    db.prepare(`
                        DELETE FROM customers 
                        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
                    `).run(custName);
                }
            }

            return NextResponse.json({ message: 'Order permanently deleted', id });
        }

        if (action === 'destroy_all') {
            // Delete all trashed records permanently
            db.prepare('DELETE FROM transactions WHERE deleted_at IS NOT NULL').run();
            db.prepare('DELETE FROM work_orders WHERE deleted_at IS NOT NULL').run();
            db.prepare('DELETE FROM orders WHERE deleted_at IS NOT NULL').run();

            // Clean orphan customers with no active orders
            db.prepare(`
                DELETE FROM customers 
                WHERE LOWER(TRIM(name)) NOT IN (
                    SELECT LOWER(TRIM(customer)) FROM orders WHERE customer IS NOT NULL AND TRIM(customer) != '' AND deleted_at IS NULL
                )
            `).run();

            return NextResponse.json({ message: 'Trash emptied successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('POST /api/trash error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
