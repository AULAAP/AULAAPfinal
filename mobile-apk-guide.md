# Guía para Generar tu APK de Android (AulApp)

Para convertir esta aplicación web en una **APK** que puedas instalar en cualquier celular Android, utilizaremos **Capacitor**. Capacitor envuelve tu aplicación web en un contenedor nativo de Android.

## Requisitos Previos en tu Computadora
1. **Node.js** instalado.
2. **Android Studio** instalado y configurado (con el SDK de Android).
3. Haber descargado este proyecto a tu computadora.

---

## Paso 1: Preparar el Proyecto
Abre una terminal en la carpeta de tu proyecto y ejecuta estos comandos:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Generar la versión de producción (Web):**
   ```bash
   npm run build
   ```

3. **Inicializar la plataforma Android (Solo la primera vez):**
   ```bash
   npx cap add android
   ```

---

## Paso 2: Sincronizar Cambios
Cada vez que hagas cambios en tu código y quieras verlos en el celular, debes repetir estos dos pasos:

1. **Volver a construir la web:**
   ```bash
   npm run build
   ```

2. **Copiar los archivos a la carpeta de Android:**
   ```bash
   npx cap copy
   ```

---

## Paso 3: Generar la APK en Android Studio
1. **Abrir el proyecto en Android Studio:**
   ```bash
   npx cap open android
   ```
   *Esto abrirá Android Studio automáticamente con la carpeta `android` de tu proyecto.*

2. **Esperar a que Gradle termine de cargar** (verás una barra de progreso abajo a la derecha).

3. **Generar la APK:**
   - En el menú superior, ve a: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - Android Studio empezará a compilar. Cuando termine, aparecerá un aviso abajo a la derecha con un enlace que dice **"locate"**.
   - Haz clic en **"locate"** y verás tu archivo `app-debug.apk`.

---

## Alternativa Rápida: PWA (Sin instalar APK)
Si no quieres pasar por todo el proceso de Android Studio, puedes usar el modo **PWA (Progressive Web App)**:

1. Despliega tu app en un servidor con HTTPS (como Hostinger).
2. Abre el sitio en el navegador de tu celular (Chrome).
3. Toca los tres puntos (menú) y selecciona **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**.
4. La app aparecerá en tu menú de aplicaciones como si fuera una app nativa, pero sin necesidad de descargar una APK.

---

## Notas de Seguridad
- **Cámara:** La aplicación ya está configurada para pedir permisos de cámara, pero en Android nativo, Capacitor gestionará esto automáticamente.
- **Icono y Splash Screen:** Puedes cambiarlos en la carpeta `android/app/src/main/res` dentro de Android Studio.
