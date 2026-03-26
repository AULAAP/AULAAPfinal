# Guía de Despliegue en Hostinger

Esta guía te ayudará a desplegar tu aplicación (React + PHP) en un hosting compartido de Hostinger.

## Paso 1: Preparar el Frontend (React)
1. En tu terminal local, ejecuta: `npm run build`
2. Esto generará una carpeta llamada `dist`.
3. El archivo `.htaccess` que he creado en `public/` se copiará automáticamente a `dist/` si lo configuras en tu proceso de build, o puedes subirlo manualmente después.

## Paso 2: Preparar la Base de Datos (MySQL)
1. Entra al panel de Hostinger (hPanel).
2. Ve a **Bases de Datos MySQL**.
3. Crea una nueva base de datos y un usuario. **Anota el nombre de la base de datos, el usuario y la contraseña.**
4. Entra a **phpMyAdmin** para esa base de datos.
5. Haz clic en **Importar** y selecciona el archivo `SQL_SCHEMA.sql` que está en la raíz de este proyecto.

## Paso 3: Configurar el Backend (PHP)
1. Abre el archivo `php-backend/config.php`.
2. En la sección de producción (Hostinger), reemplaza los valores de `DB_NAME`, `DB_USER` y `DB_PASS` con los que creaste en el paso anterior.
3. Hostinger suele usar `localhost` como `DB_HOST`.

## Paso 4: Subir los Archivos vía FTP o Administrador de Archivos
1. Entra al **Administrador de Archivos** en Hostinger.
2. Ve a la carpeta `public_html`.
3. Sube todo el contenido de tu carpeta `dist` (de React) directamente a `public_html`.
4. Crea una carpeta llamada `api` dentro de `public_html`.
5. Sube el contenido de la carpeta `php-backend` dentro de esa nueva carpeta `api`.

## Estructura Final en Hostinger:
```
public_html/
├── index.html
├── assets/
├── .htaccess (El de React Router)
└── api/
    ├── .htaccess (El de seguridad PHP)
    ├── config.php
    ├── db.php
    └── api/
        └── beneficiaries.php
```

## Paso 5: Verificar
1. Accede a tu dominio (ej. `www.tu-sitio.com`). Deberías ver la aplicación React.
2. Prueba la conexión al backend accediendo a `www.tu-sitio.com/api/index.php`.

## Notas de Seguridad:
- Asegúrate de que el archivo `.htaccess` en la raíz esté presente para que las rutas de React funcionen al recargar la página.
- El archivo `.htaccess` en la carpeta `api` bloquea el acceso directo a `config.php`, protegiendo tus contraseñas.
