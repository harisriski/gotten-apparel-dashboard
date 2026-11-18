// Utility terpusat perhitungan status pembayaran pesanan Gotten Apparel

export function getOrderPaymentStatus(order) {
    if (!order) {
        return {
            status: 'belum_lunas',
            label: 'Belum Lunas',
            badgeClass: 'pending',
            icon: 'hourglass_empty',
            color: '#f59e0b',
            totalPaid: 0,
            totalPrice: 0,
            diikhlaskan: 0,
            sisa: 0,
            daysLate: 0,
            isLunas: false,
            isDiikhlaskan: false,
            isMacet: false
        };
    }

    const totalPaid = (parseInt(order.dp, 10) || 0) + (parseInt(order.pelunasan, 10) || 0);
    const totalPrice = parseInt(order.price, 10) || 0;
    const diikhlaskan = parseInt(order.piutang_diikhlaskan, 10) || 0;
    const sisa = Math.max(0, totalPrice - totalPaid - diikhlaskan);

    // 1. Lunas Penuh
    if (totalPrice > 0 && totalPaid >= totalPrice) {
        return {
            status: 'lunas',
            label: 'Lunas',
            badgeClass: 'selesai',
            icon: 'check_circle',
            color: '#10b981',
            totalPaid,
            totalPrice,
            diikhlaskan: 0,
            sisa: 0,
            daysLate: 0,
            isLunas: true,
            isDiikhlaskan: false,
            isMacet: false
        };
    }

    // 2. Lunas dengan Piutang Diikhlaskan
    if (diikhlaskan > 0 && (totalPaid + diikhlaskan) >= totalPrice) {
        return {
            status: 'diikhlaskan',
            label: 'Lunas (Diikhlaskan)',
            badgeClass: 'diikhlaskan',
            icon: 'handshake',
            color: '#3b82f6',
            totalPaid,
            totalPrice,
            diikhlaskan,
            sisa: 0,
            daysLate: 0,
            isLunas: false,
            isDiikhlaskan: true,
            isMacet: false
        };
    }

    // 3. Piutang Macet: Sisa > 0, Status bukan 'pending', dan lewat 30 hari dari tanggal selesai (atau deadline jika tanggal selesai belum tercatat)
    let isMacet = false;
    let daysLate = 0;
    if (sisa > 0 && order.status !== 'pending') {
        const refDateStr = order.tanggal_selesai || order.deadline;
        if (refDateStr) {
            const refDate = new Date(refDateStr);
            if (!isNaN(refDate.getTime())) {
                const now = new Date();
                const diffTime = now.getTime() - refDate.getTime();
                daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (daysLate > 30) {
                    isMacet = true;
                }
            }
        }
    }

    if (isMacet) {
        return {
            status: 'macet',
            label: `Piutang Macet (${daysLate} hr)`,
            badgeClass: 'macet',
            icon: 'error_outline',
            color: '#ef4444',
            totalPaid,
            totalPrice,
            diikhlaskan,
            sisa,
            daysLate,
            isLunas: false,
            isDiikhlaskan: false,
            isMacet: true
        };
    }

    // 4. Belum Lunas Aktif
    return {
        status: 'belum_lunas',
        label: 'Belum Lunas',
        badgeClass: 'pending',
        icon: 'hourglass_empty',
        color: '#f59e0b',
        totalPaid,
        totalPrice,
        diikhlaskan,
        sisa,
        daysLate: Math.max(0, daysLate),
        isLunas: false,
        isDiikhlaskan: false,
        isMacet: false
    };
}

export function formatCurrency(num) {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
}
