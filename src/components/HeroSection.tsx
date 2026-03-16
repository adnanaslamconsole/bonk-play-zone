import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import arenaHero from "@/assets/arena-hero.jpg";
import characterBonky from "@/assets/character-bonky.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={arenaHero} alt="Bonk Royale Arena" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "var(--gradient-glow)" }} />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <img src={characterBonky} alt="Bonky mascot" className="w-32 h-32 mx-auto drop-shadow-2xl" />
        </motion.div>

        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-8xl lg:text-9xl font-bold text-gradient-hero tracking-tight leading-none mb-4"
        >
          BONK ROYALE
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-8 font-semibold"
        >
          A chaotic multiplayer brawl where goofy characters bonk each other off shrinking arenas using wacky power-ups!
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/play" className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-gold hover:scale-105 transition-transform inline-block">
            🎮 Play Solo
          </Link>
          <Link to="/play?mode=party" className="px-8 py-4 rounded-2xl border-2 border-game-pink text-foreground font-bold text-lg shadow-neon hover:scale-105 transition-transform inline-block">
            👫 Play with Friends
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 flex justify-center gap-8 text-muted-foreground"
        >
          {["10M+ Downloads", "40% D1 Retention", "Cross-Platform"].map((stat) => (
            <span key={stat} className="text-sm font-semibold tracking-wide uppercase">{stat}</span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </motion.div>
    </section>
  );
};

export default HeroSection;
