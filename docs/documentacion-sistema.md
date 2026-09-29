# PENTHA — Documentación técnica y de datos

## 1. Diagrama de Flujos de Datos

El código PlantUML se encuentra en [flujo-datos.puml](flujo-datos.puml). Corresponde a un DFD de nivel 1 y separa el sistema en cuatro procesos.

1. **Autenticación y control de acceso:** administrador y docente envían sus credenciales; el sistema consulta usuarios, roles y perfil docente para determinar la sesión y sus permisos.
2. **Administración académica:** únicamente el administrador registra estudiantes, los inscribe en cursos, crea cursos y asigna o cambia el docente responsable. Estas operaciones actualizan estudiantes, inscripciones, cursos, trimestres y docentes.
3. **Registro de calificaciones:** el docente selecciona uno de sus cursos, un trimestre y una actividad fija. El sistema verifica que el estudiante esté inscrito, que el trimestre corresponda al curso y que la nota no exceda el máximo de la actividad. La entrada `NP` se almacena como `noPresento` y suma cero puntos.
4. **Consulta de resultados:** los usuarios autorizados solicitan el resumen. El sistema obtiene estudiantes inscritos, trimestres y calificaciones para calcular el total de 0 a 100 y el estado final.

Las actividades no son configurables por los usuarios. El catálogo contiene: Examen Parcial (30), Examen Final (30), Evaluación Verbal (10), Presentación Final (20) y Portafolio (10).

## 2. Diccionario de Datos

Convenciones: las tablas utilizan el prefijo `tb`; los campos se escriben en camelCase empezando en minúscula; los tipos SQL también se expresan en minúscula. `PK` indica clave primaria y `FK` clave foránea.

### Módulo: Seguridad y usuarios

#### tbRol

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idRol | int | No | PK, identity | Identificador del rol. |
| nombre | varchar(50) | No | unique | Nombre del rol: Administrador o Docente. |
| descripcion | varchar(250) | Sí | — | Alcance funcional del rol. |
| activo | bit | No | default 1 | Indica si el rol puede utilizarse. |

#### tbUsuario

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idUsuario | int | No | PK, identity | Identificador del usuario. |
| idRol | int | No | FK → tbRol.idRol | Rol de acceso. |
| nombreCompleto | varchar(150) | No | — | Nombre visible del usuario. |
| correoElectronico | varchar(254) | No | unique | Correo usado para autenticación. |
| contrasenaHash | varchar(255) | No | — | Hash de contraseña; nunca se guarda la contraseña plana. |
| inicialesAvatar | varchar(10) | Sí | — | Iniciales mostradas por la interfaz. |
| activo | bit | No | default 1 | Habilita o bloquea el acceso. |
| fechaCreacion | datetime2 | No | default sysdatetime() | Fecha de alta. |
| fechaActualizacion | datetime2 | No | default sysdatetime() | Fecha de última modificación. |

#### tbDocente

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idDocente | int | No | PK, identity | Identificador del perfil docente. |
| idUsuario | int | No | FK → tbUsuario.idUsuario, unique | Cuenta de usuario que representa al docente. |
| activo | bit | No | default 1 | Indica si el docente puede asignarse a cursos. |

Relación del módulo: `tbRol 1 ── N tbUsuario` y `tbUsuario 1 ── 0..1 tbDocente`.

### Módulo: Estudiantes e inscripciones

#### tbEstudiante

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idEstudiante | int | No | PK, identity | Identificador del estudiante. |
| nombreCompleto | varchar(150) | No | — | Nombre completo. |
| correoElectronico | varchar(254) | No | unique | Correo de contacto. |
| telefono | varchar(30) | Sí | — | Teléfono de contacto. |
| activo | bit | No | default 1 | Conserva el historial sin borrar al estudiante. |
| fechaCreacion | datetime2 | No | default sysdatetime() | Fecha de registro. |

#### tbInscripcion

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idInscripcion | bigint | No | PK, identity | Identificador de la inscripción. |
| idEstudiante | int | No | FK → tbEstudiante.idEstudiante | Estudiante inscrito. |
| idCurso | int | No | FK → tbCurso.idCurso | Curso asignado. |
| estado | varchar(20) | No | check | `activa` o `retirada`. |
| fechaInscripcion | datetime2 | No | default sysdatetime() | Fecha de inscripción. |
| fechaRetiro | datetime2 | Sí | — | Fecha de retiro si aplica. |

Regla: `unique(idEstudiante, idCurso)`. La tabla resuelve la relación muchos a muchos entre estudiantes y cursos.

### Módulo: Cursos y periodos académicos

#### tbCurso

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idCurso | int | No | PK, identity | Identificador del curso impartido. |
| idDocente | int | Sí | FK → tbDocente.idDocente | Docente actualmente asignado; puede ser nulo. |
| nombre | varchar(150) | No | — | Nombre del curso. |
| nivel | varchar(10) | No | — | Nivel académico, por ejemplo A1 o B2. |
| anio | smallint | No | check | Año lectivo entre 2000 y 2100. |
| descripcion | varchar(500) | Sí | — | Descripción académica. |
| activo | bit | No | default 1 | Permite archivar un curso sin eliminarlo. |
| fechaCreacion | datetime2 | No | default sysdatetime() | Fecha de registro. |

#### tbTrimestre

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idTrimestre | bigint | No | PK, identity | Identificador del trimestre. |
| idCurso | int | No | FK → tbCurso.idCurso | Curso al que pertenece. |
| numero | tinyint | No | check | Número 1, 2 o 3. |
| fechaInicio | date | No | — | Inicio del trimestre. |
| fechaFin | date | No | check | Debe ser posterior a fechaInicio. |
| estado | varchar(15) | No | check | `abierto` o `cerrado`. |

Regla: `unique(idCurso, numero)`. La relación es `tbCurso 1 ── N tbTrimestre`.

### Módulo: Evaluación y calificaciones

#### tbActividad

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idActividad | tinyint | No | PK | Identificador del catálogo fijo. |
| codigo | varchar(30) | No | unique | Código técnico: parcial, final, verbal, presentacion o portafolio. |
| nombre | varchar(150) | No | unique | Nombre visible de la actividad. |
| puntosMaximos | decimal(5,2) | No | check | Máximo de puntos permitido. |
| orden | tinyint | No | unique | Orden de presentación. |
| activo | bit | No | default 1 | Indicador de disponibilidad. |

Esta tabla se carga una vez con cinco registros que suman 100 puntos. No se expone una operación de alta, modificación o eliminación desde la interfaz.

#### tbCalificacion

| Campo | Tipo | Nulo | Clave / regla | Descripción |
|---|---|---:|---|---|
| idCalificacion | bigint | No | PK, identity | Identificador de la calificación. |
| idInscripcion | bigint | No | FK → tbInscripcion.idInscripcion | Inscripción del estudiante evaluado. |
| idTrimestre | bigint | No | FK → tbTrimestre.idTrimestre | Trimestre de la evaluación. |
| idActividad | tinyint | No | FK → tbActividad.idActividad | Actividad fija evaluada. |
| puntosObtenidos | decimal(5,2) | No | check y trigger | Puntos de 0 al máximo de la actividad. |
| estado | varchar(20) | No | check | `calificada` o `noPresento`. |
| observacion | varchar(500) | Sí | — | Comentario del docente. |
| idUsuarioRegistro | int | No | FK → tbUsuario.idUsuario | Docente o administrador que registró la nota. |
| fechaRegistro | datetime2 | No | default sysdatetime() | Fecha de creación. |
| fechaActualizacion | datetime2 | No | default sysdatetime() | Fecha de última actualización. |

Regla: `unique(idInscripcion, idTrimestre, idActividad)`. Un trigger valida que el trimestre pertenezca al mismo curso de la inscripción, que la nota no exceda el máximo y que `noPresento` tenga cero puntos.

Relaciones del módulo: `tbInscripcion 1 ── N tbCalificacion`, `tbTrimestre 1 ── N tbCalificacion` y `tbActividad 1 ── N tbCalificacion`.

## 3. Especificaciones Técnicas del Sistema

### Arquitectura del Software

**Estado actual.** PENTHA es una aplicación web de una sola página (SPA) construida con React 18, TypeScript y Vite. La pantalla principal, las vistas y el estado están concentrados en `src/app/App.tsx`. La información de usuarios, cursos, estudiantes, trimestres, actividades y calificaciones se mantiene con `useState`; por tanto, los datos se pierden al recargar y no existe autenticación de servidor.

**Arquitectura objetivo.** Para operar con SQL Server, se recomienda una arquitectura en tres capas:

```text
Cliente React (navegador)
        │ HTTPS / JSON
API REST (controladores → servicios → repositorios)
        │ SQL parametrizado / ORM
SQL Server (tablas, restricciones, índices y triggers)
```

La API debe aplicar autorización por rol en el servidor: solo administradores gestionan estudiantes, inscripciones y docentes; docentes solo registran calificaciones de sus cursos y trimestres abiertos. La base de datos conserva las restricciones de integridad aunque una petición eluda la interfaz.

### Lógica de Interfaz y Estilos

- Interfaz React con componentes funcionales y estado local mediante `useState`.
- Navegación por vistas: Panel Principal, Cursos, detalle de curso, Estudiantes, Usuarios y Calificaciones.
- Roles visibles: Administrador y Docente. El menú y los botones se condicionan por rol.
- Flujo docente: Cursos → curso específico → trimestre → actividad fija → **Ingresar calificaciones**. La captura masiva permite una nota por estudiante o `NP`.
- Flujo administrador: crea estudiantes, los inscribe desde Estudiantes o desde el detalle del Curso, crea cursos y reasigna su docente.
- Estilos con Tailwind CSS y variables de tema. La interfaz usa componentes propios, iconos de `lucide-react`, tipografía Inter para texto general y JetBrains Mono para valores numéricos.
- Diseño adaptable mediante cuadrículas y puntos de quiebre `md` y `lg`; las tablas se desplazan horizontalmente cuando el ancho no es suficiente.

### Especificaciones de Hardware

Las siguientes especificaciones son una referencia para una institución pequeña o mediana; deben ajustarse tras medir usuarios concurrentes, volumen histórico y respaldo requerido.

| Componente | Mínimo | Recomendado |
|---|---|---|
| Equipo cliente | procesador de 2 núcleos, 4 gb ram, navegador actualizado | procesador de 4 núcleos, 8 gb ram, pantalla 1366 × 768 o superior |
| Servidor de aplicación | 2 vcpu, 2 gb ram, 20 gb ssd | 2–4 vcpu, 4–8 gb ram, 40 gb ssd |
| Servidor SQL Server | 2 vcpu, 4 gb ram, 30 gb ssd | 4 vcpu, 8–16 gb ram, 80 gb ssd con espacio para copias de seguridad |
| Red | conexión estable de 5 mbps por usuario | red cableada o wi-fi empresarial; HTTPS y copias de seguridad externas |

Para desarrollo se recomienda Windows 10/11, Node.js LTS, npm y SQL Server Express o Developer Edition con SQL Server Management Studio. Para producción se requiere una edición de SQL Server licenciada conforme a la política de la institución, monitoreo, copias de seguridad automáticas y control de acceso al servidor.
