# Backend PHP para Sistema de Beneficiarios

Este es un ejemplo de cómo implementar el backend en PHP para conectarse a la base de datos SQL generada.

## Requisitos
- Servidor Web (Apache/Nginx)
- PHP 7.4 o superior
- MySQL/MariaDB
- Extensión PDO de PHP habilitada

## Instalación
1. Copia el contenido de la carpeta `php-backend` a tu servidor web (ej. `/var/www/html/api`).
2. Crea la base de datos en MySQL usando el archivo `SQL_SCHEMA.sql` que se encuentra en la raíz del proyecto.
3. Edita el archivo `config.php` con tus credenciales de base de datos.

## Endpoints Disponibles
- `GET /api/beneficiaries.php`: Obtiene todos los beneficiarios.
- `GET /api/beneficiaries.php?church_id=ID`: Obtiene beneficiarios de una iglesia específica.
- `POST /api/beneficiaries.php`: Crea un nuevo beneficiario (enviar JSON en el cuerpo).
- `PUT /api/beneficiaries.php`: Actualiza un beneficiario existente (enviar JSON con ID).
- `DELETE /api/beneficiaries.php?id=ID`: Elimina un beneficiario por su ID.

## Seguridad
- El archivo `config.php` incluye cabeceras CORS para permitir peticiones desde tu frontend.
- Se utiliza `PDO` con sentencias preparadas para prevenir inyecciones SQL.
- **Nota:** Debes implementar un sistema de autenticación (ej. JWT) para proteger estos endpoints en producción.
