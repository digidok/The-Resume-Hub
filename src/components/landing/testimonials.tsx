import { Quote } from "lucide-react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

type Testimonial = {
  name: string;
  role: string;
  location: string;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Thabo Mokoena",
    role: "HR Manager",
    location: "Johannesburg",
    quote:
      "Resume Hub completely transformed my CV. It now reflects my experience professionally and is much better structured for ATS systems.",
  },
  {
    name: "Nomsa Dlamini",
    role: "Financial Administrator",
    location: "Pretoria",
    quote:
      "The ATS analysis showed me exactly where my CV was weak. The recommendations were practical and easy to implement.",
  },
  {
    name: "Liam Jacobs",
    role: "Mechanical Engineer",
    location: "Cape Town",
    quote:
      "I was impressed by how the platform identified the skills most relevant to the engineering positions I was applying for.",
  },
  {
    name: "Ayanda Ndlovu",
    role: "Talent Acquisition Specialist",
    location: "Durban",
    quote: "My previous CV was too generic. Resume Hub helped me create a CV that was much more targeted to the roles I wanted.",
  },
  {
    name: "Zanele Khumalo",
    role: "Marketing Coordinator",
    location: "Johannesburg",
    quote: "The process was quick and straightforward. I uploaded my CV and ended up with something that looked far more professional.",
  },
  {
    name: "Sipho Mthembu",
    role: "Mining Engineer",
    location: "Rustenburg",
    quote: "Resume Hub helped me present my technical mining experience much more effectively.",
  },
  {
    name: "Leah Williams",
    role: "Project Manager",
    location: "Cape Town",
    quote: "The tailored CV feature saved me a huge amount of time when applying for different project management positions.",
  },
  {
    name: "Bongani Cele",
    role: "Operations Manager",
    location: "Durban",
    quote: "I particularly liked the job matching because it helped me focus on vacancies that actually suited my experience.",
  },
  {
    name: "Nokuthula Ncube",
    role: "Accountant",
    location: "Johannesburg",
    quote:
      "My CV had all the right information but wasn't presented properly. Resume Hub helped me turn it into a much stronger professional document.",
  },
  {
    name: "Daniel Petersen",
    role: "IT Specialist",
    location: "Pretoria",
    quote: "The keyword analysis was extremely useful. I could immediately see which technical skills needed to be highlighted.",
  },
  {
    name: "Precious Maseko",
    role: "Graduate",
    location: "Johannesburg",
    quote: "As a graduate, I didn't know how to make my limited experience stand out. Resume Hub helped me present my skills much better.",
  },
  {
    name: "Michael van der Merwe",
    role: "Construction Manager",
    location: "Gauteng",
    quote: "The new CV communicates my management experience much more clearly. It was exactly what I needed.",
  },
  {
    name: "Lerato Molefe",
    role: "Human Resources Officer",
    location: "Bloemfontein",
    quote: "The platform made the job-search process much more organised. I no longer had different CVs scattered across my phone.",
  },
  {
    name: "Sibusiso Khanyile",
    role: "Electrical Technician",
    location: "Richards Bay",
    quote: "The ATS feedback was something I had never considered before. It completely changed how I approach my CV.",
  },
  {
    name: "Chantelle Adams",
    role: "Sales Manager",
    location: "Cape Town",
    quote: "The CV is professional, clean and focused on achievements rather than just listing responsibilities.",
  },
  {
    name: "Mandla Sithole",
    role: "Procurement Specialist",
    location: "Johannesburg",
    quote: "I used Resume Hub to create a targeted version of my CV for a specific vacancy and found the process very easy.",
  },
  {
    name: "Karabo Mokoena",
    role: "Supply Chain Specialist",
    location: "Pretoria",
    quote: "The job recommendations were much more relevant than the random vacancies I was finding elsewhere.",
  },
  {
    name: "Jared Williams",
    role: "Civil Engineer",
    location: "Johannesburg",
    quote: "Resume Hub helped me identify gaps between my CV and the position I wanted. That was extremely useful.",
  },
  {
    name: "Nandi Cele",
    role: "Office Manager",
    location: "Durban",
    quote: "I hadn't updated my CV in years. Resume Hub made the process simple and gave me a much more modern CV.",
  },
  {
    name: "Kagiso Molefe",
    role: "Finance Manager",
    location: "Midrand",
    quote: "The professional summary generated for my CV was much stronger than the one I had written myself.",
  },
  {
    name: "Anele Jinga",
    role: "Recruitment Consultant",
    location: "East London",
    quote: "As someone who works in recruitment, I know how important CV structure is. Resume Hub delivered a very professional result.",
  },
  {
    name: "Ryan Naidoo",
    role: "Software Developer",
    location: "Johannesburg",
    quote: "The platform helped me highlight the technical skills that were actually relevant to the jobs I wanted.",
  },
  {
    name: "Thembeka Zulu",
    role: "Nurse",
    location: "Durban",
    quote: "My CV finally looks professional and properly presents my qualifications and experience.",
  },
  {
    name: "Matthew Botha",
    role: "Sales Executive",
    location: "Pretoria",
    quote: "The cover-letter tool saved me a lot of time. I could create a targeted application instead of sending generic letters.",
  },
  {
    name: "Asanda Mbeki",
    role: "Administrator",
    location: "Gqeberha",
    quote: "I liked how easy the platform was to use from my phone. I didn't need a computer to update my CV.",
  },
  {
    name: "Kyle Smith",
    role: "Business Analyst",
    location: "Johannesburg",
    quote: "The job matching gave me a much better idea of which positions I should prioritise.",
  },
  {
    name: "Thandeka Ndlovu",
    role: "Legal Assistant",
    location: "Pretoria",
    quote: "Resume Hub helped me turn a basic CV into something that actually represents my professional experience.",
  },
  {
    name: "Siyabonga Dube",
    role: "Logistics Manager",
    location: "Durban",
    quote: "The application tracking feature made it much easier to keep track of where I had applied.",
  },
  {
    name: "Melissa Daniels",
    role: "Communications Specialist",
    location: "Cape Town",
    quote: "Everything being in one platform makes the job search much less stressful.",
  },
  {
    name: "Lungelo Mkhize",
    role: "Senior Operations Manager",
    location: "Johannesburg",
    quote: "Resume Hub is more than a CV builder. It gives you the tools to manage your entire job search.",
  },
];

const ROW_1 = TESTIMONIALS.slice(0, 15);
const ROW_2 = TESTIMONIALS.slice(15);

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:w-96">
      <Quote className="h-5 w-5 shrink-0 text-accent-400" />
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
          {initials(testimonial.name)}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
          <p className="text-xs text-slate-500">
            {testimonial.role} · {testimonial.location}
          </p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ testimonials, direction }: { testimonials: Testimonial[]; direction: "left" | "right" }) {
  return (
    <div className="marquee-row overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div className={`flex w-max gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}>
        {[...testimonials, ...testimonials].map((testimonial, i) => (
          <TestimonialCard key={`${testimonial.name}-${i}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <ScrollReveal className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Job seekers are getting hired with Resume Hub.
        </h2>
        <p className="mt-2 text-slate-600">Real feedback from candidates across South Africa.</p>
      </ScrollReveal>

      <div className="mt-10 space-y-4">
        <MarqueeRow testimonials={ROW_1} direction="left" />
        <MarqueeRow testimonials={ROW_2} direction="right" />
      </div>
    </section>
  );
}
