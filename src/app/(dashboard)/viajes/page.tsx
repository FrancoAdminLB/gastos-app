import { getTrips } from "@/app/actions/trips";
import { TripActions } from "@/components/trip-actions";
import { formatDate, formatCurrency } from "@/lib/format";
import Link from "next/link";
import { Plane, ChevronRight } from "lucide-react";

export default async function ViajesPage() {
  const trips = await getTrips();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Viajes</h2>
        <TripActions />
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
            <Plane className="h-7 w-7 text-[rgba(255,255,255,0.4)]" />
          </div>
          <div>
            <p className="font-medium text-white">Sin viajes</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
              Crea tu primer viaje para empezar
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl glass divide-y divide-[rgba(255,255,255,0.06)]">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/viajes/${trip.id}`}
              className="flex items-center gap-3 px-4 py-4 active:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(123,97,255,0.15)] flex items-center justify-center shrink-0">
                <Plane className="h-5 w-5 text-[#7B61FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{trip.nombre}</p>
                <p className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5">
                  {formatDate(trip.fechaInicio)}
                  {trip.fechaFin && ` — ${formatDate(trip.fechaFin)}`}
                  {" "}&middot; {trip._count.expenses} gastos
                </p>
              </div>
              {trip.presupuestoTotal && (
                <span className="text-sm font-semibold tabular-nums text-[rgba(255,255,255,0.5)] shrink-0">
                  {formatCurrency(trip.presupuestoTotal, trip.monedaBase)}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-[rgba(255,255,255,0.2)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
