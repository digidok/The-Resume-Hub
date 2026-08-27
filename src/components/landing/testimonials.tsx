import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TestimonialsGrid } from "@/components/landing/testimonials-grid";

export type Testimonial = {
  name: string;
  role: string;
  location: string;
  quote: string;
};

export const TESTIMONIALS: Testimonial[] = [
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

export function Testimonials() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <ScrollReveal className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          What job seekers are saying
        </h2>
        <p className="mt-2 text-slate-600">Feedback from candidates across South Africa.</p>
      </ScrollReveal>

      <TestimonialsGrid testimonials={TESTIMONIALS} />
    </section>
  );
}
