// import { Navbar } from '@/components/landing/header/Navbar';
import { HeroSection } from './hero-section/HeroSection';
import { DataTable } from './DataTable';
import { FeaturesSection } from './feature-section/FeaturesSection';
import { Footer } from './Footer';

export default function LandingPage() {
  return (
    <section className="flex flex-col">
      {/* <Navbar></Navbar> */}
      <HeroSection></HeroSection>
      <DataTable></DataTable>
      <FeaturesSection></FeaturesSection>
      <Footer></Footer>
    </section>
  );
}
