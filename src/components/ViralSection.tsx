import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";

const features = [
  { icon: "📹", title: "Auto Replay Clips", desc: "AI captures the funniest moments — one-tap share to TikTok/YouTube Shorts" },
  { icon: "🤣", title: "Meme Emotes", desc: "Trendy emotes that reference viral memes — updated monthly" },
  { icon: "👫", title: "Squad Play", desc: "Invite friends with a single link — play together in 5 seconds" },
  { icon: "🌍", title: "Global Leaderboards", desc: "Country, city, and friend rankings with weekly resets" },
  { icon: "🎃", title: "Seasonal Events", desc: "Halloween, Christmas, Summer — themed arenas, characters, and limited skins" },
  { icon: "🏆", title: "Streamer Mode", desc: "Built-in tournament tools and spectator mode for content creators" },
];

const ViralSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="📈" title="VIRAL GROWTH" subtitle="Built-in systems that make the game spread organically" colorClass="text-game-purple" />
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="bg-gradient-card border border-border rounded-2xl p-6 flex gap-4 items-start hover:border-game-purple transition-colors"
        >
          <span className="text-3xl shrink-0">{f.icon}</span>
          <div>
            <h4 className="font-bold text-foreground mb-1">{f.title}</h4>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ViralSection;
