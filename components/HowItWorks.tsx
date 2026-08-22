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

        <div className="relative mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="pointer-events-none absolute top-7 left-0 right-0 hidden h-px bg-border lg:block" />
          {dict.howItWorks.steps.map((step, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={step.title} delay={i * 0.08} className="relative flex flex-col items-center text-center">
                <div className="glass-strong relative z-10 flex h-14 w-14 items-center justify-center rounded-full text-accent-gold shadow-md">
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <span className="eyebrow gold-text mt-4 text-sm">Step {i + 1}</span>
                <h3 className="font-display mt-1 text-base font-semibold sm:text-lg">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">{step.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
