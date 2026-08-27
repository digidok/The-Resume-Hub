import { ScrollReveal, ScrollStagger } from "@/components/motion/scroll-reveal";
import { MotionCard } from "@/components/motion/motion-card";

type CityBuilding = { x: number; width: number; height: number; spike?: boolean };

type City = {
  name: string;
  country: string;
  flag: string;
  blurb: string;
  buildings: CityBuilding[];
  /** Once a real photo is uploaded to public/images/cities/, set this and the
   * illustration below is swapped for the real thing automatically. */
  photo?: string;
};

const CITIES: City[] = [
  {
    name: "Sandton",
    country: "South Africa",
    flag: "🇿🇦",
    blurb: "Home base — Africa's richest square mile",
    buildings: [
      { x: 4, width: 14, height: 46 },
      { x: 20, width: 10, height: 68 },
      { x: 32, width: 16, height: 58 },
      { x: 50, width: 12, height: 80 },
      { x: 64, width: 14, height: 52 },
      { x: 80, width: 16, height: 64 },
    ],
  },
  {
    name: "Nairobi",
    country: "Kenya",
    flag: "🇰🇪",
    blurb: "East Africa's tech and business hub",
    buildings: [
      { x: 6, width: 16, height: 50 },
      { x: 24, width: 12, height: 74 },
      { x: 38, width: 18, height: 44 },
      { x: 58, width: 14, height: 62 },
      { x: 74, width: 20, height: 40 },
    ],
  },
  {
    name: "Lagos",
    country: "Nigeria",
    flag: "🇳🇬",
    blurb: "West Africa's biggest job market",
    buildings: [
      { x: 2, width: 10, height: 56 },
      { x: 14, width: 12, height: 72 },
      { x: 28, width: 10, height: 44 },
      { x: 40, width: 14, height: 64 },
      { x: 56, width: 10, height: 50 },
      { x: 68, width: 12, height: 78 },
      { x: 82, width: 14, height: 46 },
    ],
  },
  {
    name: "Marrakech",
    country: "Morocco",
    flag: "🇲🇦",
    blurb: "North Africa's gateway city",
    buildings: [
      { x: 6, width: 20, height: 34 },
      { x: 28, width: 16, height: 28 },
      { x: 46, width: 8, height: 82, spike: true },
      { x: 58, width: 18, height: 30 },
      { x: 78, width: 18, height: 26 },
    ],
  },
  {
    name: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    blurb: "The continent's oldest megacity",
    buildings: [
      { x: 4, width: 18, height: 42 },
      { x: 24, width: 12, height: 60 },
      { x: 38, width: 22, height: 36 },
      { x: 62, width: 14, height: 54 },
      { x: 78, width: 18, height: 38 },
    ],
  },
  {
    name: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    blurb: "Where the SA diaspora goes to work",
    buildings: [
      { x: 4, width: 14, height: 40 },
      { x: 20, width: 10, height: 58 },
      { x: 34, width: 8, height: 90, spike: true },
      { x: 46, width: 12, height: 50 },
      { x: 62, width: 16, height: 64 },
      { x: 82, width: 14, height: 44 },
    ],
  },
];

function CitySkyline({ buildings }: { buildings: CityBuilding[] }) {
  return (
    <svg viewBox="0 0 100 90" className="h-24 w-full sm:h-28" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="skyline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-400)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-brand-700)" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {buildings.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={90 - b.height}
          width={b.width}
          height={b.height}
          rx={b.spike ? 1 : 1.5}
          fill="url(#skyline-fill)"
        />
      ))}
    </svg>
  );
}

export function AfricaShowcase() {
  return (
    <section className="border-y border-slate-200 bg-gradient-to-b from-brand-900 to-brand-950 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-accent-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-400">
            Proudly African
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Built in Sandton. Built for the continent.
          </h2>
          <p className="mt-2 text-white/70">
            Resume Hub job seekers apply across South Africa, the rest of Africa, and the
            diaspora hotspots South Africans move to for work.
          </p>
        </ScrollReveal>

        <ScrollStagger className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CITIES.map((city) => (
            <MotionCard key={city.name}>
              <div className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-accent-400/40 hover:bg-white/10">
                {city.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={city.photo}
                    alt={`${city.name}, ${city.country}`}
                    className="h-24 w-full rounded-lg object-cover sm:h-28"
                  />
                ) : (
                  <CitySkyline buildings={city.buildings} />
                )}
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-lg leading-none">{city.flag}</span>
                  <p className="text-sm font-semibold text-white">{city.name}</p>
                </div>
                <p className="text-xs text-white/50">{city.country}</p>
                <p className="mt-1 text-xs text-white/70">{city.blurb}</p>
              </div>
            </MotionCard>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
