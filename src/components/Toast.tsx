import { AnimatePresence, motion } from "framer-motion";
import { useApp, type Role } from "../state/AppContext";

export function Toast({ role }: { role: Role }) {
  const { state } = useApp();
  const toast = state.toasts[role];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-4" role="status">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-full border border-line bg-deck-2 px-4 py-2.5 font-medium text-ink shadow-xl"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
