import { useState } from 'react';
import { Mail, Phone, GraduationCap, IdCard, Info, Lock, MapPin, Clock3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { actualizarPerfilEstudiante } from '../../api/authService';
import { extraerMensajeError } from '../../api/client';

export function MisDatos() {
  const { usuario, refrescarPerfil } = useAuth();

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [direccion, setDireccion] = useState(usuario?.datosEstudiante?.direccion ?? '');
  const [semestre, setSemestre] = useState(usuario?.datosEstudiante?.semestre ?? '');
  const [horarioAcademico, setHorarioAcademico] = useState(usuario?.datosEstudiante?.horarioAcademico ?? '');

  if (!usuario) return null;

  function iniciarEdicion() {
    setTelefono(usuario!.telefono ?? '');
    setDireccion(usuario!.datosEstudiante?.direccion ?? '');
    setSemestre(usuario!.datosEstudiante?.semestre ?? '');
    setHorarioAcademico(usuario!.datosEstudiante?.horarioAcademico ?? '');
    setError(null);
    setExito(false);
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await actualizarPerfilEstudiante({ telefono, direccion, semestre, horarioAcademico });
      await refrescarPerfil();
      setEditando(false);
      setExito(true);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudieron guardar tus datos.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Mis datos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Esta es la información con la que estás registrado en la plataforma.
      </p>

      {exito && !editando && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Tus datos se actualizaron correctamente.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Datos NO editables: correo, cédula y nombres/apellidos */}
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          Datos de tu cuenta (no editables)
        </p>
        <div className="grid gap-5 border-b border-slate-100 pb-5 sm:grid-cols-2">
          <Dato icono={<Mail className="h-4 w-4" />} etiqueta="Correo institucional" valor={usuario.email} />
          <Dato icono={<IdCard className="h-4 w-4" />} etiqueta="Cédula" valor={usuario.identificacion} />
          <Dato icono={<IdCard className="h-4 w-4" />} etiqueta="Nombres y apellidos" valor={`${usuario.nombres} ${usuario.apellidos}`} />
          <Dato
            icono={<GraduationCap className="h-4 w-4" />}
            etiqueta="Carrera"
            valor={usuario.datosEstudiante?.carrera ?? 'No registrada'}
          />
        </div>

        {/* Datos editables */}
        <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Datos de contacto (puedes actualizarlos)
        </p>

        {!editando ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Dato icono={<Phone className="h-4 w-4" />} etiqueta="Teléfono" valor={usuario.telefono || 'No registrado'} />
            <Dato icono={<MapPin className="h-4 w-4" />} etiqueta="Dirección" valor={usuario.datosEstudiante?.direccion || 'No registrada'} />
            <Dato icono={<GraduationCap className="h-4 w-4" />} etiqueta="Semestre / paralelo" valor={usuario.datosEstudiante?.semestre || 'No registrado'} />
            <Dato icono={<Clock3 className="h-4 w-4" />} etiqueta="Horario académico" valor={usuario.datosEstudiante?.horarioAcademico || 'No registrado'} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Teléfono" valor={telefono} onChange={setTelefono} placeholder="0991234567" />
            <Campo etiqueta="Dirección" valor={direccion} onChange={setDireccion} placeholder="Av. América y Pérez Guerrero" />
            <Campo etiqueta="Semestre / paralelo" valor={semestre} onChange={setSemestre} placeholder="5to Semestre - Paralelo B" />
            <Campo etiqueta="Horario académico" valor={horarioAcademico} onChange={setHorarioAcademico} placeholder="Lunes a viernes de 07:00 a 13:00" />
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex gap-3">
          {!editando ? (
            <button onClick={iniciarEdicion} className="btn-primary px-4 py-2 text-sm">
              Actualizar mis datos
            </button>
          ) : (
            <>
              <button onClick={guardar} disabled={guardando} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => setEditando(false)}
                disabled={guardando}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-xs text-brand-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Por seguridad, tu correo, cédula y nombres no se pueden modificar desde aquí. Si hay un
            error en esos datos, comunícate con el Área de Bienestar Estudiantil en{' '}
            <strong>bienestar.filosofia@uce.edu.ec</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icono}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
        <p className="text-sm font-medium text-slate-800">{valor}</p>
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  placeholder,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</span>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="campo-input mt-1"
      />
    </label>
  );
}
