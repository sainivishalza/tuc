import { Network, BadgeCheck, ShieldCheck, Building2, MapPin, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import ServiceIllustration from "./ServiceIllustration";

const icons = [Network, BadgeCheck, ShieldCheck, Building2, MapPin, Users];

export default function WhyUs({ dict }: { dict: Dictionary }) {
  return (
    <section id="why-us" className="relative overflow-hidden bg-surface-2 px-4 py-20 sm:px-6">
      <div className="blob top-0 right-0 h-96 w-96 bg-brand-blue/15" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          badge={dict.whyUs.badge}
          title={dict.whyUs.title}
          subtitle={dict.whyUs.subtitle}
        />

        {/* A plain two-column list, not another bordered tile grid — by
            this point in the page (Services, Categories, and Trust Badges
            all use the same icon-tile-grid shape), a fifth repeat of it
            would flatten the page's rhythm. Whitespace does the
            separating instead of card chrome. */}
        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          {dict.whyUs.items.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={item.title} delay={(i % 3) * 0.08}>
                <div className="flex items-start gap-4">
                  <ServiceIllustration icon={Icon} size={44} />
                  <div>
                    <h3 className="font-display text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
