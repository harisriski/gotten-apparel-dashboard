import './globals.css';

export const metadata = {
  title: 'Gotten Indonesia — Custom Jersey Dri-Fit Klaten | Mulai Rp95rb/Stel',
  description:
    'Custom jersey dryfit premium Klaten sejak 2018. Tersedia 4 model jersey: Classic, Half Print, Full Print Atasan & Premium (Mulai Rp95.000/stel lengkap baju + celana). Min. 12 pcs bonus 1 pcs kelipatan.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet" />
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
