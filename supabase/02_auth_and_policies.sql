-- Ejecuta este archivo DESPUÉS del script de tablas que ya preparaste.
-- Refuerza RLS y habilita el acceso correcto para administrador y docente.

alter table public."tbRol" enable row level security;

create policy "rolesConsultaAutenticada"
on public."tbRol"
for select to authenticated
using (true);

create policy "administradorGestionaDocentes"
on public."tbDocente"
for all to authenticated
using ((select public."fnEsAdministrador"()))
with check ((select public."fnEsAdministrador"()));

create policy "docenteConsultaSuPerfil"
on public."tbDocente"
for select to authenticated
using ("idDocente" = (select auth.uid()));

create or replace function public."fnPuedeVerCurso"(curso uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select public."fnEsAdministrador"())
  or exists (
    select 1
    from public."tbCurso" cursoActual
    where cursoActual."idCurso" = curso
      and cursoActual."idDocente" = (select auth.uid())
  );
$$;

create or replace function public."fnPuedeVerTrimestre"(trimestre uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."tbTrimestre" trimestreActual
    where trimestreActual."idTrimestre" = trimestre
      and public."fnPuedeVerCurso"(trimestreActual."idCurso")
  );
$$;

create or replace function public."fnPuedeRegistrarCalificacion"(trimestre uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select public."fnEsAdministrador"())
  or exists (
    select 1
    from public."tbTrimestre" trimestreActual
    inner join public."tbCurso" curso
      on curso."idCurso" = trimestreActual."idCurso"
    where trimestreActual."idTrimestre" = trimestre
      and trimestreActual."estado" = 'abierto'
      and curso."idDocente" = (select auth.uid())
  );
$$;

create policy "docenteConsultaEstudiantesDeSusCursos"
on public."tbEstudiante"
for select to authenticated
using (
  exists (
    select 1
    from public."tbInscripcion" inscripcion
    where inscripcion."idEstudiante" = "tbEstudiante"."idEstudiante"
      and public."fnPuedeVerCurso"(inscripcion."idCurso")
  )
);
drop policy if exists "usuariosConsultanInscripcionesAutorizadas" on public."tbInscripcion";

create policy "usuariosConsultanInscripcionesAutorizadas"
on public."tbInscripcion"
for select to authenticated
using (public."fnPuedeVerCurso"("idCurso"));


drop policy if exists "usuariosConsultanCalificacionesAutorizadas" on public."tbCalificacion";

create policy "usuariosConsultanCalificacionesAutorizadas"
on public."tbCalificacion"
for select to authenticated
using (public."fnPuedeVerTrimestre"("idTrimestre"));

drop policy if exists "usuariosRegistranCalificacionesAutorizadas" on public."tbCalificacion";

create policy "usuariosRegistranCalificacionesAutorizadas"
on public."tbCalificacion"
for insert to authenticated
with check (public."fnPuedeRegistrarCalificacion"("idTrimestre"));

drop policy if exists "usuariosActualizanCalificacionesAutorizadas" on public."tbCalificacion";

create policy "usuariosActualizanCalificacionesAutorizadas"
on public."tbCalificacion"
for update to authenticated
using (public."fnPuedeRegistrarCalificacion"("idTrimestre"))
with check (public."fnPuedeRegistrarCalificacion"("idTrimestre"));

-- Índices para los filtros de las políticas RLS y las consultas de la aplicación.
create index if not exists "ix_tbCurso_idDocente" on public."tbCurso" ("idDocente");
create index if not exists "ix_tbTrimestre_idCurso" on public."tbTrimestre" ("idCurso");
create index if not exists "ix_tbInscripcion_idCurso" on public."tbInscripcion" ("idCurso");
create index if not exists "ix_tbInscripcion_idEstudiante" on public."tbInscripcion" ("idEstudiante");
create index if not exists "ix_tbCalificacion_idTrimestre" on public."tbCalificacion" ("idTrimestre");
