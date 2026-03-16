import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";

const items = [
  { icon: "👗", label: "Character Skins", desc: "100+ cosmetic skins per season", tag: "Core Revenue" },
  { icon: "🎫", label: "Battle Pass", desc: "$4.99/season with exclusive rewards", tag: "$4.99" },
  { icon: "💃", label: "Emotes & Dances", desc: "Funny victory dances and taunts", tag: "Viral" },
  { icon: "🎨", label: "Arena Themes", desc: "Custom arena decorations", tag: "Premium" },
];

const MonetizationSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="💰" title="MONETIZATION" subtitle="Fair, cosmetic-only — zero pay-to-win" colorClass="text-game-yellow" />
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ x: i % 2 === 0 ? -20 : 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-card border border-border rounded-2xl p-6 flex items-start gap-4"
        >
          <span className="text-4xl">{item.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-foreground">{item.label}</h4>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{item.tag}</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto mt-8 bg-gradient-card border border-game-yellow rounded-2xl p-6 text-center"
    >
      <p className="text-foreground font-bold text-lg">🚫 No Pay-to-Win — All gameplay advantages are earned through skill</p>
    </motion.div>
  </section>
);

export default MonetizationSection;
