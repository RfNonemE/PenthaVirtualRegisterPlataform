/*
    PENTHA - esquema inicial para Microsoft SQL Server Management Studio.
    Ejecute el archivo con una cuenta que pueda crear bases de datos.
*/

if db_id(N'dbPentha') is null
begin
    create database dbPentha;
end;
go

use dbPentha;
go

create table dbo.tbRol (
    idRol int identity(1,1) not null,
    nombre varchar(50) not null,
    descripcion varchar(250) null,
    activo bit not null constraint df_tbRol_activo default (1),
    constraint pk_tbRol primary key (idRol),
    constraint uq_tbRol_nombre unique (nombre)
);
go

create table dbo.tbUsuario (
    idUsuario int identity(1,1) not null,
    idRol int not null,
    nombreCompleto varchar(150) not null,
    correoElectronico varchar(254) not null,
    contrasenaHash varchar(255) not null,
    inicialesAvatar varchar(10) null,
    activo bit not null constraint df_tbUsuario_activo default (1),
    fechaCreacion datetime2 not null constraint df_tbUsuario_fechaCreacion default (sysdatetime()),
    fechaActualizacion datetime2 not null constraint df_tbUsuario_fechaActualizacion default (sysdatetime()),
    constraint pk_tbUsuario primary key (idUsuario),
    constraint uq_tbUsuario_correoElectronico unique (correoElectronico),
    constraint fk_tbUsuario_tbRol foreign key (idRol) references dbo.tbRol(idRol)
);
go

create table dbo.tbDocente (
    idDocente int identity(1,1) not null,
    idUsuario int not null,
    activo bit not null constraint df_tbDocente_activo default (1),
    constraint pk_tbDocente primary key (idDocente),
    constraint uq_tbDocente_idUsuario unique (idUsuario),
    constraint fk_tbDocente_tbUsuario foreign key (idUsuario) references dbo.tbUsuario(idUsuario)
);
go

create table dbo.tbEstudiante (
    idEstudiante int identity(1,1) not null,
    nombreCompleto varchar(150) not null,
    correoElectronico varchar(254) not null,
    telefono varchar(30) null,
    activo bit not null constraint df_tbEstudiante_activo default (1),
    fechaCreacion datetime2 not null constraint df_tbEstudiante_fechaCreacion default (sysdatetime()),
    constraint pk_tbEstudiante primary key (idEstudiante),
    constraint uq_tbEstudiante_correoElectronico unique (correoElectronico)
);
go

create table dbo.tbCurso (
    idCurso int identity(1,1) not null,
    idDocente int null,
    nombre varchar(150) not null,
    nivel varchar(10) not null,
    anio smallint not null,
    descripcion varchar(500) null,
    activo bit not null constraint df_tbCurso_activo default (1),
    fechaCreacion datetime2 not null constraint df_tbCurso_fechaCreacion default (sysdatetime()),
    constraint pk_tbCurso primary key (idCurso),
    constraint ck_tbCurso_anio check (anio between 2000 and 2100),
    constraint fk_tbCurso_tbDocente foreign key (idDocente) references dbo.tbDocente(idDocente)
);
go

create table dbo.tbTrimestre (
    idTrimestre bigint identity(1,1) not null,
    idCurso int not null,
    numero tinyint not null,
    fechaInicio date not null,
    fechaFin date not null,
    estado varchar(15) not null constraint df_tbTrimestre_estado default ('abierto'),
    constraint pk_tbTrimestre primary key (idTrimestre),
    constraint uq_tbTrimestre_idCurso_numero unique (idCurso, numero),
    constraint ck_tbTrimestre_numero check (numero in (1, 2, 3)),
    constraint ck_tbTrimestre_fechas check (fechaFin > fechaInicio),
    constraint ck_tbTrimestre_estado check (estado in ('abierto', 'cerrado')),
    constraint fk_tbTrimestre_tbCurso foreign key (idCurso) references dbo.tbCurso(idCurso)
);
go

create table dbo.tbInscripcion (
    idInscripcion bigint identity(1,1) not null,
    idEstudiante int not null,
    idCurso int not null,
    estado varchar(20) not null constraint df_tbInscripcion_estado default ('activa'),
    fechaInscripcion datetime2 not null constraint df_tbInscripcion_fechaInscripcion default (sysdatetime()),
    fechaRetiro datetime2 null,
    constraint pk_tbInscripcion primary key (idInscripcion),
    constraint uq_tbInscripcion_idEstudiante_idCurso unique (idEstudiante, idCurso),
    constraint ck_tbInscripcion_estado check (estado in ('activa', 'retirada')),
    constraint ck_tbInscripcion_retiro check ((estado = 'activa' and fechaRetiro is null) or (estado = 'retirada' and fechaRetiro is not null)),
    constraint fk_tbInscripcion_tbEstudiante foreign key (idEstudiante) references dbo.tbEstudiante(idEstudiante),
    constraint fk_tbInscripcion_tbCurso foreign key (idCurso) references dbo.tbCurso(idCurso)
);
go

create table dbo.tbActividad (
    idActividad tinyint not null,
    codigo varchar(30) not null,
    nombre varchar(150) not null,
    puntosMaximos decimal(5,2) not null,
    orden tinyint not null,
    activo bit not null constraint df_tbActividad_activo default (1),
    constraint pk_tbActividad primary key (idActividad),
    constraint uq_tbActividad_codigo unique (codigo),
    constraint uq_tbActividad_nombre unique (nombre),
    constraint uq_tbActividad_orden unique (orden),
    constraint ck_tbActividad_puntosMaximos check (puntosMaximos > 0 and puntosMaximos <= 100)
);
go

create table dbo.tbCalificacion (
    idCalificacion bigint identity(1,1) not null,
    idInscripcion bigint not null,
    idTrimestre bigint not null,
    idActividad tinyint not null,
    puntosObtenidos decimal(5,2) not null constraint df_tbCalificacion_puntosObtenidos default (0),
    estado varchar(20) not null constraint df_tbCalificacion_estado default ('calificada'),
    observacion varchar(500) null,
    idUsuarioRegistro int not null,
    fechaRegistro datetime2 not null constraint df_tbCalificacion_fechaRegistro default (sysdatetime()),
    fechaActualizacion datetime2 not null constraint df_tbCalificacion_fechaActualizacion default (sysdatetime()),
    constraint pk_tbCalificacion primary key (idCalificacion),
    constraint uq_tbCalificacion_inscripcion_trimestre_actividad unique (idInscripcion, idTrimestre, idActividad),
    constraint ck_tbCalificacion_puntosObtenidos check (puntosObtenidos >= 0),
    constraint ck_tbCalificacion_estado check (estado in ('calificada', 'noPresento')),
    constraint fk_tbCalificacion_tbInscripcion foreign key (idInscripcion) references dbo.tbInscripcion(idInscripcion),
    constraint fk_tbCalificacion_tbTrimestre foreign key (idTrimestre) references dbo.tbTrimestre(idTrimestre),
    constraint fk_tbCalificacion_tbActividad foreign key (idActividad) references dbo.tbActividad(idActividad),
    constraint fk_tbCalificacion_tbUsuario foreign key (idUsuarioRegistro) references dbo.tbUsuario(idUsuario)
);
go

create index ix_tbCurso_idDocente on dbo.tbCurso(idDocente);
create index ix_tbInscripcion_idCurso on dbo.tbInscripcion(idCurso);
create index ix_tbTrimestre_idCurso on dbo.tbTrimestre(idCurso);
create index ix_tbCalificacion_idTrimestre on dbo.tbCalificacion(idTrimestre);
go

/* Catálogos obligatorios del sistema. Suman 100 puntos y luego quedan protegidos. */
insert into dbo.tbRol (nombre, descripcion)
select valores.nombre, valores.descripcion
from (values
    ('Administrador', 'Gestiona usuarios, estudiantes, cursos, inscripciones y docentes.'),
    ('Docente', 'Consulta sus cursos y registra calificaciones en trimestres abiertos.')
) as valores(nombre, descripcion)
where not exists (
    select 1 from dbo.tbRol rol where rol.nombre = valores.nombre
);
go

insert into dbo.tbActividad (idActividad, codigo, nombre, puntosMaximos, orden)
select valores.idActividad, valores.codigo, valores.nombre, valores.puntosMaximos, valores.orden
from (values
    (1, 'parcial', 'Examen Parcial', cast(30.00 as decimal(5,2)), 1),
    (2, 'final', 'Examen Final', cast(30.00 as decimal(5,2)), 2),
    (3, 'verbal', 'Evaluación Verbal', cast(10.00 as decimal(5,2)), 3),
    (4, 'presentacion', 'Presentación Final', cast(20.00 as decimal(5,2)), 4),
    (5, 'portafolio', 'Portafolio', cast(10.00 as decimal(5,2)), 5)
) as valores(idActividad, codigo, nombre, puntosMaximos, orden)
where not exists (
    select 1 from dbo.tbActividad actividad where actividad.idActividad = valores.idActividad
);
go

/* Impide que la aplicación agregue, cambie o elimine las actividades fijas. */
create trigger dbo.trg_tbActividad_bloquearCambios
on dbo.tbActividad
after insert, update, delete
as
begin
    set nocount on;
    rollback transaction;
    ;throw 51001, 'Las actividades evaluativas son fijas y no pueden modificarse.', 1;
end;
go

/* Protege reglas que requieren datos de varias tablas. */
create trigger dbo.trg_tbCalificacion_validarRegistro
on dbo.tbCalificacion
after insert, update
as
begin
    set nocount on;

    /* El trimestre debe corresponder al curso de la inscripción. */
    if exists (
        select 1
        from inserted calificacion
        inner join dbo.tbInscripcion inscripcion on inscripcion.idInscripcion = calificacion.idInscripcion
        inner join dbo.tbTrimestre trimestre on trimestre.idTrimestre = calificacion.idTrimestre
        where inscripcion.idCurso <> trimestre.idCurso
    )
    begin
        rollback transaction;
        ;throw 51002, 'El trimestre no pertenece al curso de la inscripción.', 1;
    end;

    /* La nota no puede superar los puntos de su actividad y NP equivale a cero. */
    if exists (
        select 1
        from inserted calificacion
        inner join dbo.tbActividad actividad on actividad.idActividad = calificacion.idActividad
        where calificacion.puntosObtenidos > actividad.puntosMaximos
           or (calificacion.estado = 'noPresento' and calificacion.puntosObtenidos <> 0)
    )
    begin
        rollback transaction;
        ;throw 51003, 'Los puntos o el estado NP no son válidos para la actividad.', 1;
    end;

    /* Un docente solo registra notas para el curso que imparte; el administrador puede registrar o corregir. */
    if exists (
        select 1
        from inserted calificacion
        inner join dbo.tbUsuario usuario on usuario.idUsuario = calificacion.idUsuarioRegistro
        inner join dbo.tbRol rol on rol.idRol = usuario.idRol
        inner join dbo.tbInscripcion inscripcion on inscripcion.idInscripcion = calificacion.idInscripcion
        inner join dbo.tbCurso curso on curso.idCurso = inscripcion.idCurso
        left join dbo.tbDocente docente on docente.idUsuario = usuario.idUsuario
        where rol.nombre = 'Docente'
          and (docente.idDocente is null or curso.idDocente <> docente.idDocente)
    )
    begin
        rollback transaction;
        ;throw 51004, 'El docente no está asignado al curso calificado.', 1;
    end;
end;
go
