import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";

const systems = [
  { icon: "📈", title: "Player Level", desc: "XP-based progression with milestone rewards every 5 levels" },
  { icon: "🎰", title: "Lucky Bonk Box", desc: "Random loot drops with skins, emotes, and rare characters" },
  { icon: "📅", title: "Daily Challenges", desc: "3 daily missions that refresh — keeps players coming back" },
  { icon: "🏅", title: "Season Pass", desc: "100-tier free + premium track with exclusive cosmetics" },
  { icon: "🎪", title: "Surprise Events", desc: "Limited-time modes and themed arenas every 2 weeks" },
  { icon: "⭐", title: "Character Mastery", desc: "Level up each character to unlock unique abilities and skins" },
];

const ProgressionSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="🧠" title="ADDICTION MECHANICS" subtitle="Designed for constant progression and dopamine hits" colorClass="text-game-green" />
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
      {systems.map((sys, i) => (
        <motion.div
          key={sys.title}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="bg-gradient-card border border-border rounded-2xl p-6 hover:border-game-green transition-colors"
        >
          <span className="text-3xl">{sys.icon}</span>
          <h4 className="text-lg font-bold text-foreground mt-3 mb-2">{sys.title}</h4>
          <p className="text-sm text-muted-foreground">{sys.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ProgressionSection;
