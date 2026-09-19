import { useEffect, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AppProvider, useApp } from "./state/AppContext";
import { DriverApp } from "./components/DriverApp";
import { PresenterPanel } from "./components/PresenterPanel";
import { RoleSwitch } from "./components/RoleSwitch";
import { CustomerApp } from "./customer/CustomerApp";

export default function App() {
  return (
    <AppProvider>
      <MotionConfig reducedMotion="user">
        <Shell />
      </MotionConfig>
    </AppProvider>
  );
}

/*
  Puhelimessa yksi sovellus kerrallaan ja vaihtokytkin ylhäällä.
  Isolla näytöllä puhelinkehys ja esittäjän paneeli, leveällä näytöllä molemmat puhelimet rinnakkain.
*/
function Shell() {
  const { state } = useApp();
  // Tila on yhteinen, joten piilossa olevaa puhelinta ei tarvitse pitää renderöitynä.
  const bothFit = useMediaQuery("(min-width: 1280px)");
  const showCustomer = bothFit || state.role === "customer";
  const showDriver = bothFit || state.role === "driver";

  return (
    <div className="flex h-full flex-col pt-[var(--safe-top,env(safe-area-inset-top))] lg:pt-0">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-[#060c17] px-4 py-2 lg:hidden">
        <span className="text-sm font-medium text-ink-3">Demo</span>
        <RoleSwitch />
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center lg:gap-12 lg:p-8 xl:gap-10">
        <PresenterPanel />
        {showCustomer && (
          <PhoneSlot label="Customer app">
            <CustomerApp />
          </PhoneSlot>
        )}
        {showDriver && (
          <PhoneSlot label="Driver app">
            <DriverApp />
          </PhoneSlot>
        )}
      </div>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function PhoneSlot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="flex h-full w-full flex-col items-center justify-center sm:max-w-[480px] lg:w-[400px] lg:max-w-none"
    >
      <p className="mb-3 hidden shrink-0 text-sm font-medium text-ink-3 xl:block">{label}</p>
      <div className="min-h-0 w-full flex-1 lg:max-h-[860px] lg:overflow-hidden lg:rounded-[52px] lg:border-[10px] lg:border-[#1c2638] lg:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </section>
  );
}
