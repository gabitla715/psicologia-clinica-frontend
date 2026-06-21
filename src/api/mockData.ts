import type { Usuario } from '../types/auth';

// Usuarios de prueba
export const USUARIOS_MOCK: Array<Usuario & { contrasena: string }> = [
  {
    id: 1,
    identificacion: '1700000001',
    nombres: 'Gabriel',
    apellidos: 'Ruales',
    email: 'admin@uce.edu.ec',
    rol: 'ADMIN',
    debeCambiarContrasena: false,
    contrasena: 'Admin123',
  },
  {
    id: 2,
    identificacion: '1700000002',
    nombres: 'Gabriela',
    apellidos: 'Tumbaco',
    email: 'psicologo@uce.edu.ec',
    rol: 'PSICOLOGO',
    debeCambiarContrasena: false,
    contrasena: 'Psico123',
  },
  {
    id: 3,
    identificacion: '1700000003',
    nombres: 'Juan',
    apellidos: 'Guevara',
    email: 'coordinador@uce.edu.ec',
    rol: 'COORDINADOR',
    debeCambiarContrasena: true,
    contrasena: 'Coord123',
  },
  {
    id: 4,
    identificacion: '1700000004',
    nombres: 'María',
    apellidos: 'Estudiante',
    email: 'estudiante@uce.edu.ec',
    rol: 'ESTUDIANTE',
    debeCambiarContrasena: false,
    servicioInteres: 'GENERAL',
    contrasena: 'Estud123',
  },
];
