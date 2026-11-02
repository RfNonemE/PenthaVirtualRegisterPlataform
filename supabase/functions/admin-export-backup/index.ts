import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

const pageSize = 1000;
const tables = [
  { name: "tbRol", primaryKey: "idRol", columns: "idRol, nombre, descripcion, activo" },
  {
    name: "tbUsuario",
    primaryKey: "idUsuario",
    columns: "idUsuario, idRol, nombreCompleto, correoElectronico, inicialesAvatar, activo, fechaCreacion, fechaActualizacion",
  },
  { name: "tbDocente", primaryKey: "idDocente", columns: "idDocente, activo" },
  {
    name: "tbEstudiante",
    primaryKey: "idEstudiante",
    columns: "idEstudiante, nombreCompleto, correoElectronico, telefono, activo, fechaCreacion",
  },
  {
    name: "tbCurso",
    primaryKey: "idCurso",
    columns: "idCurso, idDocente, nombre, nivel, anio, descripcion, activo, fechaCreacion",
  },
  { name: "tbTrimestre", primaryKey: "idTrimestre", columns: "idTrimestre, idCurso, numero, fechaInicio, fechaFin, estado" },
  {
    name: "tbInscripcion",
    primaryKey: "idInscripcion",
    columns: "idInscripcion, idEstudiante, idCurso, estado, fechaInscripcion, fechaRetiro",
  },
  { name: "tbActividad", primaryKey: "idActividad", columns: "idActividad, codigo, nombre, puntosMaximos, orden, activo" },
  {
    name: "tbCalificacion",
    primaryKey: "idCalificacion",
    columns: "idCalificacion, idInscripcion, idTrimestre, idActividad, puntosObtenidos, estado, observacion, idUsuarioRegistro, fechaRegistro, fechaActualizacion",
  },
] as const;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Método no permitido." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return jsonResponse({ error: "Sesión no proporcionada." }, 401);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !publicKey || !serviceRoleKey) {
    return jsonResponse({ error: "La función no tiene configuradas las credenciales de Supabase." }, 500);
  }

  const requesterClient = createClient(projectUrl, publicKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(projectUrl, serviceRoleKey);
  const { data: { user: requester }, error: requesterError } = await requesterClient.auth.getUser();
  if (requesterError || !requester) return jsonResponse({ error: "Sesión inválida." }, 401);

  const { data: profile, error: profileError } = await adminClient
    .from("tbUsuario")
    .select("tbRol(nombre)")
    .eq("idUsuario", requester.id)
    .maybeSingle();
  if (profileError) return jsonResponse({ error: "No fue posible verificar el rol del usuario." }, 500);

  const role = profile?.tbRol;
  const roleName = Array.isArray(role) ? role[0]?.nombre : role?.nombre;
  if (roleName !== "Administrador") {
    return jsonResponse({ error: "Solo un administrador puede generar respaldos." }, 403);
  }

  try {
    const tableEntries = await Promise.all(tables.map(async (table) => {
      const rows: Record<string, unknown>[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await adminClient
          .from(table.name)
          .select(table.columns)
          .order(table.primaryKey, { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw new Error(`No fue posible consultar ${table.name}: ${error.message}`);
        if (!data) throw new Error(`Supabase no devolvió los datos de ${table.name}.`);
        rows.push(...data);
        if (data.length < pageSize) break;
      }
      return [table.name, rows] as const;
    }));

    return jsonResponse({
      application: "PENTHA",
      formatVersion: 1,
      generatedAt: new Date().toISOString(),
      excludedData: ["Credenciales de Supabase Auth", "Hashes de contraseña"],
      data: Object.fromEntries(tableEntries),
    });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "No fue posible generar el respaldo.",
    }, 500);
  }
});
