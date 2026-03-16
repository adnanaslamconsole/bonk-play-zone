import HeroSection from "@/components/HeroSection";
import GameLoopSection from "@/components/GameLoopSection";
import CharactersSection from "@/components/CharactersSection";
import GameModesSection from "@/components/GameModesSection";
import ProgressionSection from "@/components/ProgressionSection";
import MonetizationSection from "@/components/MonetizationSection";
import ViralSection from "@/components/ViralSection";
import MetricsSection from "@/components/MetricsSection";

const Index = () => (
  <div className="min-h-screen bg-background overflow-x-hidden">
    <HeroSection />
    <GameLoopSection />
    <CharactersSection />
    <GameModesSection />
    <ProgressionSection />
    <MonetizationSection />
    <ViralSection />
    <MetricsSection />
    <footer className="py-12 text-center text-muted-foreground text-sm border-t border-border">
      <p className="font-bold text-foreground text-lg mb-2">BONK ROYALE</p>
      <p>Game Design Document — Ready for 10M+ Downloads</p>
    </footer>
  </div>
);

export default Index;
