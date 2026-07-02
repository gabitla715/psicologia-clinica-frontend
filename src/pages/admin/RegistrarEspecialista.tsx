import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminUserService, type RegistrarEspecialistaRequest } from '../../api/adminUserService';
import { extraerMensajeError } from '../../api/client';
import {
  esIdentificacionValida,
  REGEX_TELEFONO_EC,
  limpiarSoloDigitos,
} from '../../lib/validators';

const VACIO: RegistrarEspecialistaRequest = {
  identification: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialty: '',
  professionalCode: '',
};

type Errores = Partial<Record<keyof RegistrarEspecialistaRequest, string>>;

function validar(datos: RegistrarEspecialistaRequest): Errores {
  const errores: Errores = {};
  if (!esIdentificacionValida(datos.identification)) {
    errores.identification = 'Cédula ecuatoriana inválida o pasaporte fuera de formato';
  }
  if (!REGEX_TELEFONO_EC.test(datos.phone)) {
    errores.phone = 'Debe ser un número ecuatoriano (10 dígitos comenzando con 0)';
  }
  if (!datos.firstName.trim()) errores.firstName = 'Los nombres son obligatorios';
  if (!datos.lastName.trim()) errores.lastName = 'Los apellidos son obligatorios';
  if (!/^\S+@\S+\.\S+$/.test(datos.email)) errores.email = 'Correo no válido';
  if (!datos.specialty.trim()) errores.specialty = 'La especialidad es obligatoria';
  if (!datos.professionalCode.trim()) errores.professionalCode = 'El código profesional es obligatorio';
  return errores;
}

export function RegistrarEspecialista() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState<RegistrarEspecialistaRequest>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar<K extends keyof RegistrarEspecialistaRequest>(campo: K, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    const erroresValidacion = validar(datos);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return;

    setEnviando(true);
    setError(null);
    try {
      await adminUserService.registrarEspecialista(datos);
      navigate('/usuarios', {
        state: { mensaje: `Especialista ${datos.firstName} ${datos.lastName} registrado correctamente.` },
      });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar el especialista.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Registrar especialista</h1>
      <p className="mt-1 text-sm text-slate-500">
        Crea una cuenta con privilegios de especialista (Psicología Clínica o General). El
        sistema envía las credenciales de acceso al correo registrado.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={manejarEnvio} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Cédula *" error={errores.identification}>
            <input
              required
              value={datos.identification}
              onChange={(e) => actualizar('identification', limpiarSoloDigitos(e.target.value, 10))}
              className="campo-input"
              maxLength={10}
              inputMode="numeric"
            />
          </Campo>
          <Campo label="Teléfono *" error={errores.phone}>
            <input
              required
              value={datos.phone}
              onChange={(e) => actualizar('phone', limpiarSoloDigitos(e.target.value, 10))}
              className="campo-input"
              inputMode="numeric"
            />
          </Campo>
          <Campo label="Nombres *" error={errores.firstName}>
            <input
              required
              value={datos.firstName}
              onChange={(e) => actualizar('firstName', e.target.value)}
              className="campo-input"
            />
          </Campo>
          <Campo label="Apellidos *" error={errores.lastName}>
            <input
              required
              value={datos.lastName}
              onChange={(e) => actualizar('lastName', e.target.value)}
              className="campo-input"
            />
          </Campo>
        </div>

        <Campo label="Correo institucional *" error={errores.email}>
          <input
            required
            type="email"
            value={datos.email}
            onChange={(e) => actualizar('email', e.target.value)}
            className="campo-input"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Especialidad *" error={errores.specialty}>
            <input
              required
              placeholder="Psicología Clínica / Psicología General"
              value={datos.specialty}
              onChange={(e) => actualizar('specialty', e.target.value)}
              className="campo-input"
            />
          </Campo>
          <Campo label="Código profesional (Senescyt) *" error={errores.professionalCode}>
            <input
              required
              value={datos.professionalCode}
              onChange={(e) => actualizar('professionalCode', e.target.value)}
              className="campo-input"
            />
          </Campo>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {enviando ? 'Registrando…' : 'Registrar especialista'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
