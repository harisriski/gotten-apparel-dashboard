import styles from './landing.module.css';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Stats from './components/landing/Stats';
import ProductionDetails from './components/landing/ProductionDetails';
import Pricing from './components/landing/Pricing';
import Steps from './components/landing/Steps';
import Portfolio from './components/landing/Portfolio';
import Contact from './components/landing/Contact';
import FloatingWA from './components/landing/FloatingWA';
import Footer from './components/landing/Footer';

export default function LandingPage() {
  return (
    <main className={styles.landingRoot}>
      <Navbar />
      <Hero />
      <Stats />
      <ProductionDetails />
      <Pricing />
      <Steps />
      <Portfolio />
      <Contact />
      <Footer />
      <FloatingWA />
    </main>
  );
}
