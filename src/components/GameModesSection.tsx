import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";

const modes = [
  {
    title: "BONK ARENA",
    emoji: "🏟️",
    desc: "32-player free-for-all on a shrinking platform. Last one standing wins!",
    players: "32 players",
    time: "2 min",
    colorClass: "border-game-pink shadow-neon",
  },
  {
    title: "OBSTACLE CHAOS",
    emoji: "🏃",
    desc: "Race through 3 rounds of deadly obstacle courses. Only half survive each round!",
    players: "48 players",
    time: "3 min",
    colorClass: "border-game-cyan",
  },
  {
    title: "TEAM BONK",
    emoji: "⚔️",
    desc: "4v4v4v4 team battles. Coordinate bonks to dominate the arena!",
    players: "16 players",
    time: "2 min",
    colorClass: "border-game-yellow",
  },
  {
    title: "BOSS BONK",
    emoji: "👹",
    desc: "All players vs one giant boss. Work together or get squished!",
    players: "20 players",
    time: "90 sec",
    colorClass: "border-game-green",
  },
];

const GameModesSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="🌎" title="GAME MODES" subtitle="4 viral modes designed for chaos and competition" colorClass="text-game-orange" />
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
      {modes.map((mode, i) => (
        <motion.div
          key={mode.title}
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className={`bg-gradient-card border-2 ${mode.colorClass} rounded-2xl p-8 transition-all`}
        >
          <span className="text-4xl">{mode.emoji}</span>
          <h3 className="text-2xl font-bold text-foreground mt-3 mb-2">{mode.title}</h3>
          <p className="text-muted-foreground mb-4">{mode.desc}</p>
          <div className="flex gap-4 text-sm">
            <span className="bg-muted px-3 py-1 rounded-full text-foreground">👥 {mode.players}</span>
            <span className="bg-muted px-3 py-1 rounded-full text-foreground">⏱ {mode.time}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default GameModesSection;
