/** Suomalainen rekisterikilpi: asiakas tunnistaa auton kadulla tästä. */
export function LicensePlate({ plate }: { plate: string }) {
  return (
    <span
      className="inline-flex h-9 shrink-0 items-stretch overflow-hidden rounded-md border-2 border-[#111] bg-white text-[#111]"
      role="img"
      aria-label={`License plate ${plate}`}
    >
      <span className="flex w-5 items-end justify-center bg-[#0a47b8] pb-0.5 text-[8px] font-bold text-white">FIN</span>
      <span className="flex items-center px-2 font-display text-xl font-bold tracking-wide">{plate}</span>
    </span>
  );
}
