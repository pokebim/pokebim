# Pokebim

Aplicación para gestionar proveedores de cartas Pokémon.

## Características

- Gestión de proveedores (asiáticos y europeos)
- Lista de proveedores pendientes
- Base de datos en la nube con Firebase
- Acceso desde cualquier dispositivo
- Múltiples usuarios pueden acceder simultáneamente

## Cómo ejecutar localmente

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Cómo desplegar en Internet

### Opción 1: Vercel (recomendado)

La forma más fácil de desplegar tu aplicación Pokebim es usando Vercel, la plataforma de los creadores de Next.js.

1. Crea una cuenta en [Vercel](https://vercel.com/signup) (puedes registrarte con GitHub)
2. Instala la CLI de Vercel:

```bash
npm i -g vercel
```

3. Ejecuta el siguiente comando en la raíz del proyecto:

```bash
vercel
```

4. Sigue las instrucciones. Cuando se te pida agregar variables de entorno, asegúrate de agregar todas las variables de Firebase que están en tu archivo `.env.local`.

### Opción 2: Firebase Hosting

También puedes desplegar tu aplicación en Firebase Hosting, lo que la mantendría en el mismo ecosistema que tu base de datos.

1. Instala la CLI de Firebase:

```bash
npm install -g firebase-tools
```

2. Inicia sesión en Firebase:

```bash
firebase login
```

3. Inicializa Firebase en tu proyecto:

```bash
firebase init
```

4. Selecciona "Hosting" cuando se te pregunte qué servicios deseas configurar.
5. Selecciona el proyecto que creaste en Firebase.
6. Para el directorio de archivos públicos, ingresa `out`.
7. Configura como SPA (Single Page Application).
8. Construye tu aplicación para producción:

```bash
npm run build && npm run export
```

9. Despliega tu aplicación:

```bash
firebase deploy
```

## Variables de entorno

Para que la aplicación funcione correctamente, necesitas configurar las siguientes variables de entorno en un archivo `.env.local` (para desarrollo local) o en la plataforma de despliegue (para producción):

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu-measurement-id
```

## Mantenimiento y actualizaciones

Para mantener tu aplicación actualizada:

1. Realiza cambios en tu repositorio local
2. Prueba los cambios localmente con `npm run dev`
3. Despliega los cambios siguiendo los pasos anteriores

## Soporte

Si tienes problemas, revisa la [documentación de Firebase](https://firebase.google.com/docs) o la [documentación de Next.js](https://nextjs.org/docs).
