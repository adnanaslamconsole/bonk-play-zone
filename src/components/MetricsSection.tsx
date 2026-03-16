import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";

const metrics = [
  { value: "10M+", label: "Target Downloads", color: "text-game-yellow" },
  { value: "40%", label: "Day-1 Retention", color: "text-game-cyan" },
  { value: "15%", label: "Day-7 Retention", color: "text-game-pink" },
  { value: "5%", label: "Day-30 Retention", color: "text-game-green" },
];

const reasons = [
  "Ultra-simple controls — learn in 3 seconds, master over months",
  "Physics-based chaos creates unique, shareable moments every match",
  "30-second to 3-minute sessions fit mobile play patterns perfectly",
  "Social mechanics drive organic downloads via friend invites",
  "Auto-clip system feeds TikTok/YouTube Shorts content pipeline",
  "Seasonal events create FOMO and re-engagement spikes",
  "Low device requirements capture 90%+ of Android market",
  "Cosmetic-only monetization builds player trust and long-term LTV",
];

const MetricsSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="🎯" title="WHY 10M+ DOWNLOADS" subtitle="The strategic foundation for viral scale" colorClass="text-game-cyan" />

    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: "spring" }}
          className="bg-gradient-card border border-border rounded-2xl p-6 text-center"
        >
          <div className={`text-4xl md:text-5xl font-bold ${m.color}`}>{m.value}</div>
          <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
        </motion.div>
      ))}
    </div>

    <div className="max-w-3xl mx-auto">
      {reasons.map((reason, i) => (
        <motion.div
          key={i}
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 mb-4"
        >
          <span className="text-game-yellow text-lg">✅</span>
          <p className="text-foreground">{reason}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto mt-12 bg-gradient-card border-2 border-game-pink rounded-2xl p-8 text-center shadow-neon"
    >
      <p className="text-xl font-bold text-foreground">
        🎬 Designed to go viral on TikTok, YouTube Shorts, and streaming platforms.
      </p>
    </motion.div>
  </section>
);

export default MetricsSection;
