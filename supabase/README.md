# Configuración de Supabase para PENTHA

## 1. Crear la estructura

En **Supabase → SQL Editor**, ejecuta primero el script que ya tienes con las tablas `tbRol`, `tbUsuario`, `tbDocente`, `tbEstudiante`, `tbCurso`, `tbTrimestre`, `tbInscripcion`, `tbActividad` y `tbCalificacion`.

Después ejecuta [02_auth_and_policies.sql](02_auth_and_policies.sql). Este segundo archivo agrega las políticas RLS, permisos de administrador/docente e índices necesarios para que el frontend se conecte de manera segura.

## 2. Configurar Authentication

En **Authentication → Providers → Email**, habilita el proveedor Email. Para una aplicación académica interna se recomienda desactivar **Confirm email** durante las pruebas iniciales; si se activa en producción, agrega la URL de Vercel a **Authentication → URL Configuration → Redirect URLs**.

En **Authentication → URL Configuration** establece:

```text
Site URL: https://TU-PROYECTO.vercel.app
Redirect URLs: http://localhost:5173/**, https://TU-PROYECTO.vercel.app/**
```

## 3. Crear el primer administrador

1. En **Authentication → Users**, crea el usuario administrador con correo y contraseña.
2. En SQL Editor, consulta su UUID:

```sql
select id, email from auth.users order by created_at desc;
```

3. Sustituye los valores y ejecuta este registro de perfil. La instrucción se ejecuta desde SQL Editor, por lo que no está limitada por RLS.

```sql
contrasena
```

Este es el único usuario que se crea manualmente. Después, el administrador podrá crear docentes desde PENTHA.

## 4. Desplegar la función para crear docentes

La contraseña de un docente no puede crearse directamente desde React, ya que ello expondría una clave de administrador. La Edge Function `admin-create-user` crea el usuario en Supabase Auth y su perfil académico de forma segura.

Instala el CLI de Supabase, inicia sesión y vincula el proyecto:

```powershell
npm install -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy admin-create-user
supabase functions deploy admin-update-user
supabase functions deploy admin-delete-entity
```

Las funciones utilizan automáticamente `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` disponibles en el entorno de Edge Functions. La función `admin-delete-entity` permite que un administrador elimine cursos o estudiantes junto con sus inscripciones y calificaciones asociadas, y admite identificadores numéricos o UUID. No copies la clave `service_role` al navegador, al archivo `.env.local` ni a Vercel.
x
## 5. Configurar la aplicación React

Copia `.env.example` como `.env.local` en la raíz del proyecto y completa solo estas dos variables:

```text
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA_O_ANON_KEY
```

La clave pública/publishable es segura para el navegador porque RLS limita los datos que cada sesión puede consultar o modificar. No uses una clave `service_role` con el prefijo `VITE_`.

Para desarrollo, reinicia Vite después de guardar `.env.local`:

```powershell
npm run dev
```

## 6. Configurar Vercel

En **Vercel → Project → Settings → Environment Variables**, crea las mismas variables de `.env.local` para Production, Preview y Development:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Después realiza un nuevo despliegue. Vercel insertará estas variables en el build del frontend.

## Verificación

1. Inicia sesión con el administrador creado en Supabase Auth.
2. Registra un docente desde Usuarios, indicando una contraseña temporal de al menos ocho caracteres.
3. Inicia sesión como el docente y confirma que solo ve sus cursos.
4. Crea un estudiante, inscríbelo en un curso y registra una calificación o `NP`.
5. Recarga el navegador: los datos deben mantenerse porque se leen desde PostgreSQL en Supabase.
