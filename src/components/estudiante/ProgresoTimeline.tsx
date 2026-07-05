import { Check } from 'lucide-react';
import type { PasoProgreso } from '../../lib/estadoProceso';

export function ProgresoTimeline({ pasos }: { pasos: PasoProgreso[] }) {
  return (
    <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {pasos.map((paso, i) => (
        <div key={paso.clave} className="flex flex-1 sm:flex-col">
          <div className="flex flex-col items-center sm:w-full">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`hidden h-0.5 flex-1 sm:block ${
                    paso.estado !== 'pendiente' ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  paso.estado === 'completado'
                    ? 'bg-emerald-500 text-white'
                    : paso.estado === 'actual'
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-slate-200 text-slate-400'
                }`}
              >
                {paso.estado === 'completado' ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </div>
              {i < pasos.length - 1 && (
                <div
                  className={`hidden h-0.5 flex-1 sm:block ${
                    paso.estado === 'completado' ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 text-center text-[11px] font-medium leading-tight sm:mt-2 ${
                paso.estado === 'pendiente' ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              {paso.etiqueta}
            </p>
          </div>

          {/* Conector móvil (vertical) */}
          {i < pasos.length - 1 && (
            <div className="ml-3.5 flex h-6 w-0.5 sm:hidden">
              <div className={`w-full ${paso.estado === 'completado' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
