<?php
/**
 * Configuración de la Base de Datos
 * Se puede configurar mediante variables de entorno en Hostinger o editando directamente aquí.
 */

// Detectar si estamos en local o producción
$is_local = ($_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1');

if ($is_local) {
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'beneficiary_system');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    // CONFIGURACIÓN PARA HOSTINGER (Reemplazar con tus datos reales)
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost'); // Hostinger suele usar 'localhost'
    define('DB_NAME', getenv('DB_NAME') ?: 'u123456789_beneficiary');
    define('DB_USER', getenv('DB_USER') ?: 'u123456789_user');
    define('DB_PASS', getenv('DB_PASS') ?: 'tu_password_seguro');
}

define('DB_CHARSET', 'utf8mb4');

// Configuración de CORS (Permitir acceso desde el frontend de React)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}
?>
