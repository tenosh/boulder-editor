# Boulder Editor

Una aplicación web para gestionar bloques de escalada, con integración a Supabase para almacenamiento de datos e imágenes.

## Características

- Visualización de bloques de escalada con sus detalles
- Edición de información de los bloques
- Carga y optimización de imágenes
- Soporte para vista de líneas de escalada
- Selección múltiple para estilos de escalada
- Interfaz en español

## Requisitos

- Node.js 18 o superior
- Cuenta de Supabase con base de datos configurada según el esquema proporcionado
- Variables de entorno configuradas

## Configuración

1. Clona el repositorio

   ```
   git clone https://github.com/[tu-usuario]/boulder-editor.git
   cd boulder-editor
   ```

2. Instala las dependencias

   ```
   npm install
   ```

3. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_KEY=tu-clave-publica-de-supabase
   ```

4. Asegúrate de tener una tabla `boulder` en Supabase con la estructura requerida:

   ```sql
   create table public.boulder (
     id uuid not null default gen_random_uuid (),
     name text not null,
     description text null,
     grade text null,
     created_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
     updated_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
     sector_id uuid not null default gen_random_uuid (),
     quality smallint null,
     type text null,
     image text null,
     image_line text null,
     latitude numeric null,
     longitude numeric null,
     height text null,
     style json null,
     top boolean null,
     constraint boulder_pkey primary key (id),
     constraint boulder_sector_id_fkey foreign KEY (sector_id) references sector (id)
   ) TABLESPACE pg_default;
   ```

5. Configura un bucket en Supabase Storage llamado "cactux" con una carpeta "boulders" para almacenar las imágenes.

## Ejecución

Para ejecutar en modo desarrollo:

```
npm run dev
```

Para construir y ejecutar en producción:

```
npm run build
npm start
```

## Estructura del proyecto

- `app/components/` - Componentes de React
- `app/api/` - API endpoints
- `app/lib/` - Utilidades y configuración
- `app/types/` - Definiciones de tipos TypeScript

## Licencia

MIT
