import { z } from 'zod';

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
// REGISTRO DE ESTUDIANTE
// Incluye TODOS los campos que exige el backend en /auth/register-student.
// ──────────────────────────────────────────────────────────────
export const registroSchema = z
  .object({
    // Identificación y credenciales
    nombres: z.string().min(1, 'Ingresa tus nombres'),
    apellidos: z.string().min(1, 'Ingresa tus apellidos'),
    identificacion: z
      .string()
      .min(10, 'La cédula debe tener 10 dígitos')
      .max(20, 'Máximo 20 caracteres')
      .regex(/^[a-zA-Z0-9]+$/, 'Solo números o letras'),
    email: z.string().min(1, 'El correo es obligatorio').email('Correo no válido'),
    contrasena: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmarContrasena: z.string(),
    telefono: z.string().min(7, 'Ingresa un teléfono válido'),

    // Datos académicos
    carrera: z.string().min(1, 'Selecciona o ingresa tu carrera'),
    semestre: z.string().min(1, 'Indica tu semestre o paralelo'),

    // Datos demográficos
    fechaNacimiento: z
      .string()
      .min(1, 'Ingresa tu fecha de nacimiento')
      .refine((v) => new Date(v) < new Date(), { message: 'La fecha debe ser en el pasado' }),
    direccion: z.string().min(10, 'Mínimo 10 caracteres'),
    nacionalidad: z.string().min(1, 'Indica tu nacionalidad'),
    etnia: z.string().min(1, 'Indica tu etnia'),
    genero: z.string().min(1, 'Indica tu género'),
    sexo: z.string().min(1, 'Indica tu sexo'),

    // Discapacidad
    tieneDiscapacidad: z.boolean(),
    tipoDiscapacidad: z.string().optional(),
    porcentajeDiscapacidad: z.coerce
      .number()
      .min(0, 'Mínimo 0')
      .max(100, 'Máximo 100')
      .optional(),
    conadisId: z.string().optional(),

    // Preferencia local (no se envía al backend)
    servicioInteres: z.enum(['CLINICA', 'GENERAL'], {
      errorMap: () => ({ message: 'Selecciona un servicio' }),
    }),

    // Aceptaciones legales
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
      !data.tieneDiscapacidad ||
      (data.tipoDiscapacidad && data.tipoDiscapacidad.length > 0),
    {
      message: 'Indica el tipo de discapacidad',
      path: ['tipoDiscapacidad'],
    }
  );

export type RegistroFormValues = z.infer<typeof registroSchema>;
