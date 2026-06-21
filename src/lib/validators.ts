import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no válido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

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

export const registroSchema = z
  .object({
    nombres: z.string().min(1, 'Ingresa tus nombres'),
    apellidos: z.string().min(1, 'Ingresa tus apellidos'),
    identificacion: z
      .string()
      .min(10, 'La cédula debe tener 10 dígitos')
      .max(10, 'La cédula debe tener 10 dígitos')
      .regex(/^\d+$/, 'Solo números'),
    email: z.string().min(1, 'El correo es obligatorio').email('Correo no válido'),
    contrasena: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmarContrasena: z.string(),
    servicioInteres: z.enum(['CLINICA', 'GENERAL'], {
      errorMap: () => ({ message: 'Selecciona un servicio' }),
    }),
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
  });

export type RegistroFormValues = z.infer<typeof registroSchema>;
