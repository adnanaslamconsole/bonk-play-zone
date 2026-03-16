import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";

const steps = [
  { emoji: "🚀", label: "Join Match", desc: "Tap play, instantly matched with 32 players", color: "border-game-cyan" },
  { emoji: "💥", label: "Chaos Begins", desc: "Arena shrinks, obstacles spawn, power-ups drop", color: "border-game-pink" },
  { emoji: "🤪", label: "BONK!", desc: "Smash, bump, and bonk opponents off the edge", color: "border-game-orange" },
  { emoji: "😂", label: "Funny Moments", desc: "Physics-based ragdoll chaos creates meme clips", color: "border-game-green" },
  { emoji: "🏆", label: "Win Rewards", desc: "Coins, XP, and random loot boxes", color: "border-game-yellow" },
  { emoji: "✨", label: "Unlock & Upgrade", desc: "New characters, skins, emotes, and abilities", color: "border-game-purple" },
  { emoji: "🔄", label: "Play Again!", desc: "One tap to rematch — the loop is addictive", color: "border-game-pink" },
];

const GameLoopSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="🕹" title="CORE GAMEPLAY LOOP" subtitle="The addictive cycle that keeps players coming back" colorClass="text-game-cyan" />
    <div className="max-w-4xl mx-auto relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-6 mb-8 md:pl-16 relative"
        >
          <div className={`hidden md:flex absolute left-4 w-8 h-8 rounded-full bg-muted border-2 ${step.color} items-center justify-center text-lg shrink-0`}>
            {i + 1}
          </div>
          <div className="bg-gradient-card rounded-2xl p-6 border border-border flex-1 hover:shadow-neon transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{step.emoji}</span>
              <h3 className="text-xl font-bold text-foreground">{step.label}</h3>
            </div>
            <p className="text-muted-foreground">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default GameLoopSection;
