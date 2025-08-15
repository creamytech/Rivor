import MarketingTopBar from "@/components/marketing/TopBar";
import Link from "next/link";
import { HeroSection } from "@/components/marketing/sections/HeroSection";
import { SocialProofSection } from "@/components/marketing/sections/SocialProofSection";
import { CoreFeaturesSection } from "@/components/marketing/sections/CoreFeaturesSection";
import { HowItWorksSection } from "@/components/marketing/sections/HowItWorksSection";
import { IntegrationsSection } from "@/components/marketing/sections/IntegrationsSection";
import { PricingSection } from "@/components/marketing/sections/PricingSection";
import { AboutSection } from "@/components/marketing/sections/AboutSection";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";
import { FooterSection } from "@/components/marketing/sections/FooterSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <MarketingTopBar />
      
      {/* IA: Home sections in order → Hero, Social Proof, Core Features, How It Works, Integrations, Pricing, About, Final CTA, Footer */}
      <HeroSection />
      <SocialProofSection />
      <CoreFeaturesSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <PricingSection />
      <AboutSection />
      <FinalCTASection />
      <FooterSection />

    </div>
  );
}
