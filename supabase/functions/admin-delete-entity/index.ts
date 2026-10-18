import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Método no permitido." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return jsonResponse({ error: "Sesión no proporcionada." }, 401);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "La solicitud debe contener JSON válido." }, 400);
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return jsonResponse({ error: "La solicitud debe contener una entidad y un identificador." }, 400);
  }

  const { entity, id } = payload as { entity?: unknown; id?: unknown };
  let entityId: string | number;
  if (typeof id === "number" && Number.isSafeInteger(id) && id > 0) {
    entityId = id;
  } else if (typeof id === "string" && /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0) {
    entityId = Number(id);
  } else if (typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    entityId = id;
  } else {
    return jsonResponse({ error: "Entidad o identificador inválido." }, 400);
  }
  if (entity !== "course" && entity !== "student") {
    return jsonResponse({ error: "Entidad o identificador inválido." }, 400);
  }

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !publicKey || !serviceRoleKey) {
    return jsonResponse({ error: "La función no tiene configuradas las credenciales de Supabase." }, 500);
  }

  const requesterClient = createClient(projectUrl, publicKey, { global: { headers: { Authorization: authorization } } });
  const adminClient = createClient(projectUrl, serviceRoleKey);
  const { data: { user: requester }, error: requesterError } = await requesterClient.auth.getUser();
  if (requesterError || !requester) return jsonResponse({ error: "Sesión inválida." }, 401);

  const { data: profile, error: profileError } = await adminClient
    .from("tbUsuario")
    .select("tbRol(nombre)")
    .eq("idUsuario", requester.id)
    .maybeSingle();
  if (profileError) return jsonResponse({ error: "No fue posible verificar el rol del usuario." }, 500);
  if (!profile) return jsonResponse({ error: "Solo un administrador puede eliminar cursos o estudiantes." }, 403);

  const role = profile?.tbRol;
  const roleName = Array.isArray(role) ? role[0]?.nombre : role?.nombre;
  if (roleName !== "Administrador") {
    return jsonResponse({ error: "Solo un administrador puede eliminar cursos o estudiantes." }, 403);
  }

  const table = entity === "course" ? "tbCurso" : "tbEstudiante";
  const key = entity === "course" ? "idCurso" : "idEstudiante";
  const relationColumn = entity === "course" ? "idCurso" : "idEstudiante";
  const { data: entityRecord, error: entityError } = await adminClient
    .from(table)
    .select(key)
    .eq(key, entityId)
    .maybeSingle();
  if (entityError) return jsonResponse({ error: entityError.message }, 500);
  if (!entityRecord) return jsonResponse({ error: "El elemento que intentas eliminar ya no existe." }, 404);

  const { data: enrollments, error: enrollmentError } = await adminClient
    .from("tbInscripcion")
    .select("idInscripcion")
    .eq(relationColumn, entityId);
  if (enrollmentError) return jsonResponse({ error: enrollmentError.message }, 500);

  const enrollmentIds = (enrollments ?? []).map((enrollment: { idInscripcion: string | number }) => enrollment.idInscripcion);
  let trimesterIds: (string | number)[] = [];
  if (entity === "course") {
    const { data: trimesters, error: trimesterError } = await adminClient
      .from("tbTrimestre")
      .select("idTrimestre")
      .eq("idCurso", entityId);
    if (trimesterError) return jsonResponse({ error: trimesterError.message }, 500);
    trimesterIds = (trimesters ?? []).map((trimester: { idTrimestre: string | number }) => trimester.idTrimestre);
  }

  if (enrollmentIds.length > 0) {
    const { error: gradeError } = await adminClient
      .from("tbCalificacion")
      .delete()
      .in("idInscripcion", enrollmentIds);
    if (gradeError) return jsonResponse({ error: gradeError.message }, 500);
  }
  if (trimesterIds.length > 0) {
    const { error: gradeError } = await adminClient
      .from("tbCalificacion")
      .delete()
      .in("idTrimestre", trimesterIds);
    if (gradeError) return jsonResponse({ error: gradeError.message }, 500);
  }

  if (enrollmentIds.length > 0) {
    const { error: deleteEnrollmentError } = await adminClient
      .from("tbInscripcion")
      .delete()
      .in("idInscripcion", enrollmentIds);
    if (deleteEnrollmentError) return jsonResponse({ error: deleteEnrollmentError.message }, 500);
  }
  if (trimesterIds.length > 0) {
    const { error: deleteTrimesterError } = await adminClient
      .from("tbTrimestre")
      .delete()
      .in("idTrimestre", trimesterIds);
    if (deleteTrimesterError) return jsonResponse({ error: deleteTrimesterError.message }, 500);
  }

  const { data: deletedRecord, error: deleteError } = await adminClient
    .from(table)
    .delete()
    .eq(key, entityId)
    .select(key)
    .maybeSingle();
  if (deleteError) return jsonResponse({ error: deleteError.message }, 500);
  if (!deletedRecord) return jsonResponse({ error: "No fue posible eliminar el elemento solicitado." }, 409);

  return jsonResponse({ message: entity === "course" ? "Curso eliminado correctamente." : "Estudiante eliminado correctamente." });
});
