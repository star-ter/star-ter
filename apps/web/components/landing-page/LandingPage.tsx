import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import AiSection from './AiSection';
import CtaSection from './CtaSection';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full overflow-y-auto">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AiSection />
      <CtaSection />
    </div>
  );
}
