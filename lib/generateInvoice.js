import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatCurrency(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Helper: load logo image and convert to base64 via canvas
function loadLogoAsBase64() {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Render at high resolution for crisp PDF
            canvas.width = img.naturalWidth * 2;
            canvas.height = img.naturalHeight * 2;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            // Fallback: try SVG version
            const svgImg = new Image();
            svgImg.crossOrigin = 'anonymous';
            svgImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 280;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };
            svgImg.onerror = () => resolve(null);
            svgImg.src = '/logo gotten.svg';
        };
        img.src = '/logo-gotten.png';
    });
}

export async function generateInvoicePDF(order) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Parse items
    let items = [];
    try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch (e) {
        items = [];
    }

    // ===== HEADER WITH LOGO =====
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
        // Logo dimensions: maintain aspect ratio, height ~14mm
        const logoH = 14;
        const logoW = logoH * (1024 / 280); // approximate aspect ratio of the logo
        doc.addImage(logoBase64, 'PNG', margin, y - 5, logoW, logoH);
    }

    // Location text below logo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Klaten, Indonesia', margin, y + 14);

    // Invoice title (right side)
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NOTA', pageWidth - margin, 26, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`No: ${order.id || '-'}`, pageWidth - margin, 34, { align: 'right' });
    doc.text(`Tanggal: ${formatDate(order.tanggal || order.created_at)}`, pageWidth - margin, 40, { align: 'right' });

    // Separator line
    y = 48;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ===== CUSTOMER INFO =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Kepada:', margin, y);

    // Customer details (left side)
    const leftX = margin;
    const rightX = pageWidth / 2 + 10;
    let leftY = y + 6;
    let rightY = y + 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text(order.customer || '-', leftX, leftY);
    leftY += 5;
    doc.setFont('helvetica', 'normal');
    if (order.company) {
        doc.text(order.company, leftX, leftY);
        leftY += 5;
    }
    if (order.phone) {
        doc.text(`Tel: ${order.phone}`, leftX, leftY);
        leftY += 5;
    }
    if (order.email) {
        doc.text(`Email: ${order.email}`, leftX, leftY);
        leftY += 5;
    }
    if (order.address) {
        const addressLines = doc.splitTextToSize(order.address, contentWidth / 2 - 10);
        doc.text(addressLines, leftX, leftY);
        leftY += addressLines.length * 5;
    }

    // Right column - Order info
    doc.setFont('helvetica', 'bold');
    doc.text('Detail Pesanan:', rightX, y);
    doc.setFont('helvetica', 'normal');

    const orderInfo = [
        ['Produk', order.product || '-'],
        ['Status', (order.status || 'baru').toUpperCase()],
        ['Deadline', formatDate(order.shipping_date || order.deadline)],
    ];

    orderInfo.forEach(([label, value]) => {
        doc.setTextColor(100, 100, 100);
        doc.text(`${label}:`, rightX, rightY);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(value, rightX + 30, rightY);
        doc.setFont('helvetica', 'normal');
        rightY += 5;
    });

    y = Math.max(leftY, rightY) + 8;

    // ===== ITEMS TABLE =====
    const tableData = items.map((item, index) => {
        const qty = parseInt(item.qty) || 0;
        const unitPrice = parseInt(item.unit_price) || 0;
        const totalPrice = qty * unitPrice;
        return [
            String(index + 1),
            item.description || '-',
            String(qty),
            formatCurrency(unitPrice),
            formatCurrency(totalPrice),
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['No', 'Deskripsi Produk', 'Qty', 'Harga Satuan', 'Total']],
        body: tableData,
        theme: 'plain',
        styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 35 },
            4: { halign: 'right', cellWidth: 35 },
        },
        margin: { left: margin, right: margin },
        didParseCell: function (data) {
            if (data.section === 'body') {
                data.cell.styles.fillColor = data.row.index % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
            }
        }
    });

    y = doc.lastAutoTable.finalY + 8;

    // ===== SUMMARY =====
    const subtotal = items.reduce((sum, item) => {
        return sum + (parseInt(item.qty) || 0) * (parseInt(item.unit_price) || 0);
    }, 0);
    const potonganPersen = parseFloat(order.potongan) || 0;
    const potonganAmount = Math.round(subtotal * (potonganPersen / 100));
    const shippingCost = parseInt(order.shipping_cost) || 0;
    const total = subtotal - potonganAmount + shippingCost;
    const dp = parseInt(order.dp) || 0;
    const sisaTagihan = Math.max(0, total - dp);

    const summaryX = pageWidth - margin - 80;
    const summaryValX = pageWidth - margin;

    // Summary rows
    const summaryRows = [
        { label: 'Subtotal', value: formatCurrency(subtotal), bold: false },
    ];

    if (potonganPersen > 0) {
        summaryRows.push({ label: `Potongan (${potonganPersen}%)`, value: `- ${formatCurrency(potonganAmount)}`, bold: false });
    }

    summaryRows.push({ label: 'Biaya Pengiriman', value: formatCurrency(shippingCost), bold: false });

    // Draw summary
    summaryRows.forEach(row => {
        doc.setFontSize(9);
        doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(row.label, summaryX, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.text(row.value, summaryValX, y, { align: 'right' });
        y += 6;
    });

    // Total line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(summaryX - 5, y - 2, summaryValX, y - 2);
    y += 4;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL', summaryX, y, { align: 'right' });
    doc.text(formatCurrency(total), summaryValX, y, { align: 'right' });
    y += 8;

    // DP & Sisa Tagihan
    if (dp > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Down Payment (DP)', summaryX, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.text(formatCurrency(dp), summaryValX, y, { align: 'right' });
        y += 6;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Sisa Tagihan', summaryX, y, { align: 'right' });
    doc.text(formatCurrency(sisaTagihan), summaryValX, y, { align: 'right' });
    y += 15;

    // ===== SHIPPING INFO =====
    if (order.shipping_method || order.shipping_term) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Informasi Pengiriman', margin, y);
        y += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);

        if (order.shipping_method) {
            doc.text(`Metode: ${order.shipping_method}`, margin, y);
            y += 5;
        }
        if (order.shipping_date || order.deadline) {
            doc.text(`Tanggal Pengiriman: ${formatDate(order.shipping_date || order.deadline)}`, margin, y);
            y += 5;
        }
        if (order.shipping_term) {
            const termLines = doc.splitTextToSize(`Catatan: ${order.shipping_term}`, contentWidth);
            doc.text(termLines, margin, y);
            y += termLines.length * 5;
        }
        y += 5;
    }

    // ===== FOOTER =====
    // Check if we need a new page
    if (y > 250) {
        doc.addPage();
        y = 20;
    }

    y += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Signature area
    const sigLeftX = margin + 10;
    const sigRightX = pageWidth - margin - 50;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Pemesan,', sigLeftX, y);
    doc.text('Hormat Kami,', sigRightX, y);
    y += 25;

    doc.setFont('helvetica', 'bold');
    doc.text('__________________', sigLeftX - 3, y);
    doc.text('__________________', sigRightX - 3, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(order.customer || '(Nama Pemesan)', sigLeftX, y);
    doc.text('Gotten Indonesia', sigRightX, y);

    // Bottom note
    y += 15;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Nota ini merupakan bukti pemesanan yang sah dari Gotten Indonesia.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Terima kasih atas kepercayaan Anda. Hubungi kami jika ada pertanyaan.', pageWidth / 2, y, { align: 'center' });

    return doc;
}

export async function downloadInvoice(order) {
    const doc = await generateInvoicePDF(order);
    doc.save(`Nota_${order.id || 'Pesanan'}_${order.customer || ''}.pdf`);
}
