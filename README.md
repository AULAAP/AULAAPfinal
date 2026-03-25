# AULAPP 1.0 - Gestión de Beneficiarios

Esta es una plataforma profesional para la gestión y seguimiento de asistencia de beneficiarios, integrada con Firebase y Google Gemini AI.

## 🚀 Despliegue rápido en Vercel

1. Sube este código a un repositorio de GitHub.
2. Conecta tu cuenta de GitHub con [Vercel](https://vercel.com).
3. Importa este repositorio.
4. Vercel detectará automáticamente que es un proyecto **Vite** y lo configurará.

## 🛠️ Configuración de Firebase

El proyecto ya incluye el archivo `firebase-applet-config.json`. Si deseas usar variables de entorno en Vercel por seguridad, configura las siguientes:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

## 🤖 Inteligencia Artificial (Opcional)

Para habilitar la función de "Artificar" fotos, añade tu API Key de Gemini:
- `GEMINI_API_KEY`

## 💻 Instalación Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```
