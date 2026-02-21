import { cn } from "@/lib/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Flame, type LucideIcon, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background scanner-noise">
      {/* Full Screen Comic Overlays */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: "url(/assets/overlays/comic-noise.png)",
          backgroundSize: "512px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-10 mix-blend-multiply"
        style={{
          backgroundImage: "url(/assets/overlays/paper-texture.png)",
          backgroundSize: "256px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-30 mix-blend-multiply"
        style={{ backgroundImage: "url(/assets/overlays/vignette.png)", backgroundSize: "cover" }}
      />

      {/* Paper texture and noise are handled by globals.css and scanner-noise class */}

      <main className="container mx-auto px-4 relative z-10 pt-16 pb-20">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 relative"
          >
            <div className="zine-border p-2 bg-white inline-block relative shadow-zine-lg">
              <img
                src="/lunchtable/hero-illustration.png"
                alt="LunchTable"
                width={800}
                height={400}
                className="w-full max-w-3xl h-auto mx-auto grayscale contrast-125"
              />
              {/* Decorative "Fuckup" assets */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: -15 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -bottom-10 -left-10 w-32 h-32 z-20 pointer-events-none"
              >
                <img
                  src="/lunchtable/overdue-notice.png"
                  alt="Overdue"
                  width={128}
                  height={128}
                  className="drop-shadow-2xl"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: 40 }}
                animate={{ opacity: 1, scale: 1, rotate: 20 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute -top-10 -right-10 w-24 h-24 z-20 pointer-events-none"
              >
                <img
                  src="/lunchtable/crushed-cigarette.png"
                  alt="Bad Decisions"
                  width={96}
                  height={96}
                  className="drop-shadow-2xl"
                />
              </motion.div>
              <div className="absolute inset-0 scanner-noise pointer-events-none opacity-20" />
            </div>

            <div className="relative mt-12">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.2, duration: 1 }}
                className="absolute bottom-4 left-0 h-4 bg-reputation/30 -rotate-1 z-0"
              />
              <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter ink-bleed relative z-10">
                LunchTable
              </h1>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="max-w-2xl text-xl md:text-3xl font-black mb-12 leading-none uppercase tracking-tight font-heading"
          >
            Manage your{" "}
            <span className="text-reputation bg-black text-white px-2 py-1 rotate-1 inline-block">
              Reputation
            </span>
            .
            <br />
            Protect your{" "}
            <span className="text-stability border-2 border-black px-2 py-1 -rotate-1 inline-block mt-2">
              Stability
            </span>
            .
            <br />
            <span className="font-special text-primary/70 normal-case tracking-normal text-2xl mt-4 block">
              Rule the social hierarchy of the hallway.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="flex flex-col sm:flex-row items-center gap-8"
          >
            <Link to="/lunchtable">
              <button
                type="button"
                className="tcg-button-primary px-12 py-6 text-2xl flex items-center gap-4 group uppercase shadow-zine-lg hover:shadow-zine transition-all ink-wash"
              >
                <span>Enter The Hallway</span>
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
            </Link>

            <Link to="/news">
              <button
                type="button"
                className="tcg-button px-12 py-6 text-2xl flex items-center gap-4 group uppercase hover:bg-black hover:text-white transition-all shadow-zine hover:shadow-zine-lg"
              >
                <span>The Bulletin</span>
              </button>
            </Link>
          </motion.div>
        </section>
        {/* Features Grid - Zine Style */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-7xl mx-auto mb-40">
          <FeatureCard
            title="Slander & Gossip"
            description="Use weaponized nostalgia to dismantle your rivals. Every secret is a tactical advantage."
            icon={Flame}
            delay={0.2}
          />
          <FeatureCard
            title="Reputation Grind"
            description="Climb from Outcast to Apex. Your social standing determines your power at The Table."
            icon={Trophy}
            delay={0.4}
            featured
          />
          <FeatureCard
            title="School Spirits"
            description="A raw, evolving world of trauma and triumph. New stereotypes added every semester."
            icon={Sparkles}
            delay={0.6}
          />
        </section>

        {/* Call to Action - Paper Cutout Style */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="paper-panel p-12 text-center relative rotate-1 torn-paper-edge shadow-zine-lg ink-wash">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-6 ink-bleed-advanced">
                Final Enrollment
              </h2>
              <p className="text-lg font-black mb-10 max-w-lg mx-auto uppercase tracking-tight">
                Don't be a nobody. Join the hierarchy today and claim your locker.
              </p>

              <Link to="/signup">
                <button
                  type="button"
                  className="tcg-button-primary px-10 py-5 text-2xl font-black uppercase hover:scale-105 transition-transform shadow-zine-lg hover:shadow-zine ink-wash"
                >
                  Join The In-Crowd
                </button>
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
  delay,
  featured,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  delay: number;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -8, rotate: featured ? 0 : 1 }}
      className={cn(
        "paper-panel p-8 relative group transition-all duration-300",
        featured ? "bg-white zine-border shadow-zine-lg scale-105 z-10" : "hover:shadow-zine-lg"
      )}
    >
      <div className="mb-6 inline-flex p-4 border-2 border-primary bg-white shadow-zine-sm group-hover:shadow-zine transition-all group-hover:-rotate-3">
        <Icon
          className={cn(
            "w-8 h-8",
            featured ? "text-primary" : "text-primary/40 group-hover:text-primary"
          )}
        />
      </div>

      <h3 className="text-2xl font-black mb-3 uppercase ink-bleed group-hover:ink-bleed-advanced transition-all">{title}</h3>

      <p className="font-bold text-primary/60 leading-tight uppercase text-xs group-hover:text-primary transition-colors">
        {description}
      </p>

      {featured && (
        <div className="absolute -top-3 -right-3 bg-reputation text-primary px-2 py-1 border-2 border-primary font-black text-[10px] uppercase rotate-12 shadow-zine-sm">
          Highly Recommended
        </div>
      )}
    </motion.div>
  );
}
