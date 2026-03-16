import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import charactersLineup from "@/assets/characters-lineup.png";

const characters = [
  { name: "Bonky", ability: "Ground Pound", personality: "Goofy class clown", color: "bg-game-orange" },
  { name: "Blobette", ability: "Bubble Shield", personality: "Sassy and sweet", color: "bg-game-pink" },
  { name: "Zappy", ability: "Lightning Dash", personality: "Hyperactive gremlin", color: "bg-game-cyan" },
  { name: "Chunko", ability: "Belly Slam", personality: "Sleepy heavyweight", color: "bg-game-green" },
  { name: "Sir Bonks-a-Lot", ability: "Hammer Spin", personality: "Pompous knight", color: "bg-game-purple" },
  { name: "Wobbly", ability: "Jelly Bounce", personality: "Perpetually dizzy", color: "bg-game-blue" },
  { name: "Fluffernaut", ability: "Cloud Jump", personality: "Spacey dreamer", color: "bg-game-yellow" },
  { name: "Cactus Carl", ability: "Spike Roll", personality: "Prickly prankster", color: "bg-game-green" },
  { name: "Toast", ability: "Butter Slide", personality: "Always popping up", color: "bg-game-orange" },
  { name: "DJ Bonk", ability: "Sound Wave", personality: "Drops beats & opponents", color: "bg-game-pink" },
];

const CharactersSection = () => (
  <section className="py-24 px-4">
    <SectionTitle emoji="👾" title="CHARACTERS" subtitle="10 unique bonkers with meme-worthy personalities" colorClass="text-game-pink" />

    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto mb-12"
    >
      <img src={charactersLineup} alt="Character lineup" className="w-full" />
    </motion.div>

    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
      {characters.map((char, i) => (
        <motion.div
          key={char.name}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.05, rotate: [-1, 1, 0] }}
          className="bg-gradient-card border border-border rounded-2xl p-4 text-center cursor-pointer hover:shadow-neon transition-shadow"
        >
          <div className={`w-12 h-12 rounded-full ${char.color} mx-auto mb-3 opacity-80`} />
          <h4 className="font-bold text-foreground text-sm">{char.name}</h4>
          <p className="text-xs text-game-cyan mt-1">⚡ {char.ability}</p>
          <p className="text-xs text-muted-foreground mt-1">{char.personality}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CharactersSection;
