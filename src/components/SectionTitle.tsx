import { motion } from "framer-motion";

interface SectionTitleProps {
  emoji: string;
  title: string;
  subtitle?: string;
  colorClass?: string;
}

const SectionTitle = ({ emoji, title, subtitle, colorClass = "text-game-yellow" }: SectionTitleProps) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    className="text-center mb-12"
  >
    <span className="text-5xl mb-4 block">{emoji}</span>
    <h2 className={`text-4xl md:text-5xl font-bold ${colorClass} mb-3`}>{title}</h2>
    {subtitle && <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{subtitle}</p>}
  </motion.div>
);

export default SectionTitle;
