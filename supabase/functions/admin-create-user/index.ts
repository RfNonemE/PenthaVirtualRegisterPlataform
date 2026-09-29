import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return Response.json({ error: "Sesión no proporcionada." }, { status: 401, headers: corsHeaders });
  }

  const projectUrl = Deno.env.get("SUPABASE_URL")!;
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const requesterClient = createClient(projectUrl, publicKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(projectUrl, serviceRoleKey);

  const { data: { user: requester }, error: requesterError } = await requesterClient.auth.getUser();
  if (requesterError || !requester) {
    return Response.json({ error: "Sesión inválida." }, { status: 401, headers: corsHeaders });
  }

  const { data: requesterProfile } = await adminClient
    .from("tbUsuario")
    .select("idRol, tbRol(nombre)")
    .eq("idUsuario", requester.id)
    .single();

  if ((requesterProfile as { tbRol?: { nombre?: string } } | null)?.tbRol?.nombre !== "Administrador") {
    return Response.json({ error: "Solo un administrador puede crear docentes." }, { status: 403, headers: corsHeaders });
  }

  const { nombreCompleto, correoElectronico, contrasena } = await request.json();
  if (!nombreCompleto || !correoElectronico || !contrasena || contrasena.length < 8) {
    return Response.json({ error: "Nombre, correo y contraseña de al menos 8 caracteres son obligatorios." }, { status: 400, headers: corsHeaders });
  }

  const { data: docenteRole, error: roleError } = await adminClient
    .from("tbRol")
    .select("idRol")
    .eq("nombre", "Docente")
    .single();

  if (roleError || !docenteRole) {
    return Response.json({ error: "No se encontró el rol Docente." }, { status: 500, headers: corsHeaders });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: correoElectronico,
    password: contrasena,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return Response.json({ error: createError?.message ?? "No fue posible crear el usuario." }, { status: 400, headers: corsHeaders });
  }

  const initials = nombreCompleto.split(" ").filter(Boolean).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  const { error: profileError } = await adminClient.from("tbUsuario").insert({
    idUsuario: created.user.id,
    idRol: docenteRole.idRol,
    nombreCompleto,
    correoElectronico,
    inicialesAvatar: initials,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: profileError.message }, { status: 500, headers: corsHeaders });
  }

  const { error: teacherError } = await adminClient.from("tbDocente").insert({ idDocente: created.user.id });
  if (teacherError) {
    return Response.json({ error: teacherError.message }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ idUsuario: created.user.id }, { headers: corsHeaders });
});
