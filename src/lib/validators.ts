import { z } from 'zod';

// ──────────────────────────────────────────────────────────────
// VALIDACIÓN DE CÉDULA ECUATORIANA (algoritmo módulo 10)
// ──────────────────────────────────────────────────────────────
//
// Reglas oficiales del Registro Civil:
// - Debe tener exactamente 10 dígitos numéricos.
// - Los dos primeros corresponden al código de provincia (01 a 24, o 30).
// - El tercer dígito debe ser menor a 6 (0-5) para personas naturales.
// - Los primeros 9 dígitos se multiplican alternadamente por [2,1,2,1,2,1,2,1,2].
//   Si el resultado de cada multiplicación es ≥ 10, se le restan 9.
// - Se suman todos los resultados.
// - El verificador esperado = (10 - (suma % 10)) % 10 == último dígito.
export function esCedulaEcuatorianaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  const validaProvincia =
    (provincia >= 1 && provincia <= 24) || provincia === 30;
  if (!validaProvincia) return false;

  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) return false; // personas naturales: 0..5

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let producto = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (producto >= 10) producto -= 9;
    suma += producto;
  }
  const verificadorEsperado = (10 - (suma % 10)) % 10;
  const verificadorReal = parseInt(cedula.charAt(9), 10);
  return verificadorEsperado === verificadorReal;
}

/**
 * Valida una identificación que puede ser cédula ecuatoriana (10 dígitos)
 * o pasaporte (6 a 20 caracteres alfanuméricos).
 */
function esIdentificacionValida(valor: string): boolean {
  // Si tiene exactamente 10 dígitos, debe pasar el algoritmo de cédula.
  if (/^\d{10}$/.test(valor)) {
    return esCedulaEcuatorianaValida(valor);
  }
  // Pasaporte: alfanumérico, 6 a 20 caracteres.
  return /^[A-Za-z0-9]{6,20}$/.test(valor);
}

// ──────────────────────────────────────────────────────────────
// Expresiones regulares reutilizables
// ──────────────────────────────────────────────────────────────
const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]+$/;
const REGEX_TELEFONO_EC = /^0\d{9}$/; // Ecuador: 10 dígitos empezando con 0

// ──────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no válido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// ──────────────────────────────────────────────────────────────
// CAMBIO DE CONTRASEÑA
// ──────────────────────────────────────────────────────────────
export const cambiarContrasenaSchema = z
  .object({
    contrasenaActual: z.string().min(1, 'Ingresa tu contraseña actual'),
    contrasenaNueva: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmarContrasena: z.string(),
  })
  .refine((data) => data.contrasenaNueva === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  });
export type CambiarContrasenaValues = z.infer<typeof cambiarContrasenaSchema>;

// ──────────────────────────────────────────────────────────────
// RECUPERAR CONTRASEÑA — paso 1 (pedir email)
// ──────────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no válido'),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// ──────────────────────────────────────────────────────────────
// RECUPERAR CONTRASEÑA — paso 2 (nuevo password con token)
// ──────────────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'El enlace de recuperación es inválido'),
    contrasenaNueva: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmarContrasena: z.string(),
  })
  .refine((data) => data.contrasenaNueva === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ──────────────────────────────────────────────────────────────
// REGISTRO DE ESTUDIANTE
// (sin servicio interés: el estudiante lo elige después del login)
// ──────────────────────────────────────────────────────────────
export const registroSchema = z
  .object({
    nombres: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .max(80, 'Máximo 80 caracteres')
      .regex(REGEX_SOLO_LETRAS, 'Solo se permiten letras'),

    apellidos: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .max(80, 'Máximo 80 caracteres')
      .regex(REGEX_SOLO_LETRAS, 'Solo se permiten letras'),

    identificacion: z
      .string()
      .min(6, 'Mínimo 6 caracteres')
      .max(20, 'Máximo 20 caracteres')
      .refine(esIdentificacionValida, {
        message: 'Cédula ecuatoriana inválida o pasaporte fuera de formato',
      }),

    email: z
      .string()
      .min(1, 'El correo es obligatorio')
      .email('Correo no válido'),

    contrasena: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),

    confirmarContrasena: z.string(),

    telefono: z
      .string()
      .regex(REGEX_TELEFONO_EC, 'Debe ser un número ecuatoriano (10 dígitos comenzando con 0)'),

    carrera: z.string().min(1, 'Selecciona tu carrera'),

    semestre: z
      .string()
      .min(1, 'Selecciona tu semestre')
      .refine((v) => /^([1-9]|10)$/.test(v), { message: 'Semestre inválido' }),

    fechaNacimiento: z
      .string()
      .min(1, 'Ingresa tu fecha de nacimiento')
      .refine((v) => new Date(v) < new Date(), { message: 'La fecha debe ser en el pasado' })
      .refine(
        (v) => {
          // Edad mínima: 15 años, máxima: 80 (rango sensato para estudiantes universitarios)
          const fechaN = new Date(v);
          const hoy = new Date();
          const edad = hoy.getFullYear() - fechaN.getFullYear();
          return edad >= 15 && edad <= 80;
        },
        { message: 'La edad debe estar entre 15 y 80 años' }
      ),

    direccion: z.string().min(10, 'Mínimo 10 caracteres').max(200, 'Máximo 200 caracteres'),

    nacionalidad: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .regex(REGEX_SOLO_LETRAS, 'Solo se permiten letras'),

    etnia: z.string().min(1, 'Selecciona tu etnia'),
    genero: z.string().min(1, 'Selecciona tu género'),
    sexo: z.string().min(1, 'Selecciona tu sexo'),

    // Discapacidad como radio "SI" / "NO" — más claro que un checkbox.
    discapacidad: z.enum(['SI', 'NO'], {
      errorMap: () => ({ message: 'Selecciona una opción' }),
    }),
    tipoDiscapacidad: z.string().optional(),
    porcentajeDiscapacidad: z.coerce
      .number()
      .min(0, 'Mínimo 0')
      .max(100, 'Máximo 100')
      .optional(),
    conadisId: z.string().optional(),

    aceptaTerminos: z.boolean().refine((v) => v === true, {
      message: 'Debes aceptar los Términos y Condiciones',
    }),
    aceptaDatos: z.boolean().refine((v) => v === true, {
      message: 'Debes autorizar el tratamiento de tus datos personales',
    }),
  })
  .refine((data) => data.contrasena === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  })
  .refine(
    (data) =>
      data.discapacidad === 'NO' ||
      (data.tipoDiscapacidad && data.tipoDiscapacidad.trim().length > 0),
    {
      message: 'Indica el tipo de discapacidad',
      path: ['tipoDiscapacidad'],
    }
  );

export type RegistroFormValues = z.infer<typeof registroSchema>;

// ──────────────────────────────────────────────────────────────
// Helpers de "auto-limpieza" para inputs en tiempo real
// ──────────────────────────────────────────────────────────────
/** Quita todo lo que no sea letra (mantiene tildes, ñ, espacios y guiones). */
export function limpiarSoloLetras(valor: string): string {
  return valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]/g, '');
}

/** Quita todo lo que no sea dígito y trunca a `largoMax`. */
export function limpiarSoloDigitos(valor: string, largoMax = 10): string {
  return valor.replace(/\D/g, '').slice(0, largoMax);
}
