import './globals.css';

export const metadata = {
  title: 'Gotten Apparel — Dashboard',
  description: 'Dashboard manajemen produksi kaos premium untuk Gotten Apparel Yogyakarta',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
                        (function() {
                            const theme = localStorage.getItem('gotten-theme') || 'dark';
                            document.documentElement.setAttribute('data-theme', theme);
                        })();
                    `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
