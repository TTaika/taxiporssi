import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../state/AppContext";
import { MarketScreen } from "../screens/MarketScreen";
import { RidesScreen } from "../screens/RidesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AppHeader } from "./AppHeader";
import { DutyBar } from "./DutyBar";
import { TabBar } from "./TabBar";
import { Toast } from "./Toast";
import { RequestSheet } from "./request/RequestSheet";
import { DriverRideView } from "./request/DriverRideView";

const SCREENS = {
  market: MarketScreen,
  rides: RidesScreen,
  profile: ProfileScreen,
};

export function DriverApp() {
  const { state } = useApp();
  const scrollRef = useRef<HTMLElement>(null);
  const Screen = SCREENS[state.tab];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [state.tab]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-night">
      <AppHeader />

      <main ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>

      <DutyBar />
      <TabBar />

      <AnimatePresence>
        {state.active && <RequestSheet key={state.active.request.id} active={state.active} />}
      </AnimatePresence>
      <AnimatePresence>
        {state.driverRide && <DriverRideView key={state.driverRide.tripId} ride={state.driverRide} />}
      </AnimatePresence>

      <Toast role="driver" />
    </div>
  );
}
