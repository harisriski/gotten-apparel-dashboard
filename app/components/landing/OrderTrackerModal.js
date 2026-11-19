'use client';

import { useEffect } from 'react';
import OrderTracker from './OrderTracker';

export default function OrderTrackerModal({ isOpen, onClose, initialOrderId = '' }) {
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }

        window.addEventListener('keydown', handleKeyDown);
        // Lock body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                overflowY: 'auto'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '820px',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    borderRadius: '20px',
                    position: 'relative',
                    animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <OrderTracker initialOrderId={initialOrderId} inModal={true} onClose={onClose} />
            </div>

            <style jsx global>{`
                @keyframes modalSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(18px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
