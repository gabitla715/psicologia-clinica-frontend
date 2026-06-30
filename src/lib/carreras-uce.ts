// Lista de carreras de la Universidad Central del Ecuador.
// Si necesitas ajustarla, edita este archivo. Está agrupada por facultad para
// que sea más fácil de leer en el <select>.
export interface OpcionCarrera {
  facultad: string;
  carrera: string;
}

export const CARRERAS_UCE: OpcionCarrera[] = [
  // Facultad de Filosofía, Letras y Ciencias de la Educación
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de la Lengua y Literatura' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía del Idioma Inglés' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de la Historia y Ciencias Sociales' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de las Ciencias Experimentales — Química y Biología' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de las Ciencias Experimentales — Física y Matemática' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de las Artes y Humanidades' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de la Actividad Física y Deporte' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Pedagogía de la Informática' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Educación Inicial' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Educación Básica' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Psicología Educativa y Orientación' },
  { facultad: 'Filosofía, Letras y Ciencias de la Educación', carrera: 'Comercio y Administración' },

  // Facultad de Ingeniería y Ciencias Aplicadas
  { facultad: 'Ingeniería y Ciencias Aplicadas', carrera: 'Ingeniería en Sistemas de Información' },
  { facultad: 'Ingeniería y Ciencias Aplicadas', carrera: 'Ingeniería Civil' },
  { facultad: 'Ingeniería y Ciencias Aplicadas', carrera: 'Ingeniería Ambiental' },
  { facultad: 'Ingeniería y Ciencias Aplicadas', carrera: 'Ingeniería Química' },
  { facultad: 'Ingeniería y Ciencias Aplicadas', carrera: 'Ingeniería en Diseño Industrial' },

  // Facultad de Ciencias Médicas
  { facultad: 'Ciencias Médicas', carrera: 'Medicina' },
  { facultad: 'Ciencias Médicas', carrera: 'Enfermería' },
  { facultad: 'Ciencias Médicas', carrera: 'Obstetricia' },
  { facultad: 'Ciencias Médicas', carrera: 'Laboratorio Clínico e Histopatológico' },
  { facultad: 'Ciencias Médicas', carrera: 'Radiología' },

  // Facultades de salud específicas
  { facultad: 'Odontología', carrera: 'Odontología' },
  { facultad: 'Ciencias Veterinarias', carrera: 'Medicina Veterinaria y Zootecnia' },
  { facultad: 'Ciencias Psicológicas', carrera: 'Psicología Clínica' },
  { facultad: 'Ciencias Psicológicas', carrera: 'Psicología Industrial' },
  { facultad: 'Ciencias Psicológicas', carrera: 'Psicología Infantil y Psicorrehabilitación' },

  // Otras facultades
  { facultad: 'Jurisprudencia, Ciencias Políticas y Sociales', carrera: 'Derecho' },
  { facultad: 'Jurisprudencia, Ciencias Políticas y Sociales', carrera: 'Trabajo Social' },
  { facultad: 'Jurisprudencia, Ciencias Políticas y Sociales', carrera: 'Sociología y Ciencias Políticas' },
  { facultad: 'Comunicación Social', carrera: 'Comunicación Social' },
  { facultad: 'Comunicación Social', carrera: 'Turismo' },
  { facultad: 'Ciencias Administrativas', carrera: 'Administración Pública' },
  { facultad: 'Ciencias Administrativas', carrera: 'Administración de Empresas' },
  { facultad: 'Ciencias Administrativas', carrera: 'Contabilidad y Auditoría' },
  { facultad: 'Ciencias Económicas', carrera: 'Economía' },
  { facultad: 'Ciencias Económicas', carrera: 'Finanzas' },
  { facultad: 'Ciencias Económicas', carrera: 'Estadística' },
  { facultad: 'Ciencias Agrícolas', carrera: 'Agronomía' },
  { facultad: 'Ciencias Agrícolas', carrera: 'Turismo Ecológico' },
  { facultad: 'Ciencias Biológicas', carrera: 'Ciencias Biológicas y Ambientales' },
  { facultad: 'Ciencias Químicas', carrera: 'Química Farmacéutica' },
  { facultad: 'Ciencias Químicas', carrera: 'Bioquímica Clínica' },
  { facultad: 'Arquitectura y Urbanismo', carrera: 'Arquitectura' },
  { facultad: 'Artes', carrera: 'Artes Plásticas' },
  { facultad: 'Artes', carrera: 'Teatro' },
  { facultad: 'Cultura Física', carrera: 'Cultura Física' },
];
