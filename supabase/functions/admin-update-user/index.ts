import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Sesión no proporcionada." }, { status: 401, headers: corsHeaders });
  const projectUrl = Deno.env.get("SUPABASE_URL")!;
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const requesterClient = createClient(projectUrl, publicKey, { global: { headers: { Authorization: authorization } } });
  const adminClient = createClient(projectUrl, serviceRoleKey);
  const { data: { user: requester }, error: requesterError } = await requesterClient.auth.getUser();
  if (requesterError || !requester) return Response.json({ error: "Sesión inválida." }, { status: 401, headers: corsHeaders });

  const { data: requesterProfile } = await adminClient.from("tbUsuario").select("tbRol(nombre)").eq("idUsuario", requester.id).single();
  if ((requesterProfile as { tbRol?: { nombre?: string } } | null)?.tbRol?.nombre !== "Administrador") {
    return Response.json({ error: "Solo un administrador puede editar docentes." }, { status: 403, headers: corsHeaders });
  }

  const { idUsuario, nombreCompleto, correoElectronico } = await request.json();
  if (!idUsuario || !nombreCompleto || !correoElectronico) {
    return Response.json({ error: "Id, nombre y correo son obligatorios." }, { status: 400, headers: corsHeaders });
  }

  const { data: targetProfile, error: targetError } = await adminClient.from("tbUsuario").select("tbRol(nombre)").eq("idUsuario", idUsuario).single();
  const targetRole = (targetProfile as { tbRol?: { nombre?: string } } | null)?.tbRol?.nombre;
  const canUpdateTarget = targetRole === "Docente" || (targetRole === "Administrador" && idUsuario === requester.id);
  if (targetError || !canUpdateTarget) {
    return Response.json({ error: "Solo puedes editar docentes o tu propio perfil administrador." }, { status: 403, headers: corsHeaders });
  }

  const initials = nombreCompleto.split(" ").filter(Boolean).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  const { error: authError } = await adminClient.auth.admin.updateUserById(idUsuario, { email: correoElectronico, email_confirm: true });
  if (authError) return Response.json({ error: authError.message }, { status: 400, headers: corsHeaders });

  const { error: profileError } = await adminClient.from("tbUsuario").update({
    nombreCompleto,
    correoElectronico,
    inicialesAvatar: initials,
  }).eq("idUsuario", idUsuario);
  if (profileError) return Response.json({ error: profileError.message }, { status: 500, headers: corsHeaders });
  return Response.json({ idUsuario }, { headers: corsHeaders });
});
