import { MessageCircle, Search, PackageCheck, ClipboardCheck, Home } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";

const icons = [MessageCircle, Search, PackageCheck, ClipboardCheck, Home];

export default function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <section id="how-it-works" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          badge={dict.howItWorks.badge}
          title={dict.howItWorks.title}
          subtitle={dict.howItWorks.subtitle}
        />

        <div className="relative mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="pointer-events-none absolute top-7 left-0 right-0 hidden h-px brand-gradient opacity-30 lg:block" />
          {dict.howItWorks.steps.map((step, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={step.title} delay={i * 0.08} className="relative flex flex-col items-center text-center">
                <div className="brand-gradient relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md">
                  <Icon size={22} />
                </div>
                <span className="mt-3 text-xs font-bold text-muted">STEP {i + 1}</span>
                <h3 className="font-display mt-1 text-sm font-bold sm:text-base">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">{step.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
