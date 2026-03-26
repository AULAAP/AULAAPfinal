<?php
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo json_encode([
        "status" => "success",
        "message" => "Conexión a la base de datos establecida con éxito.",
        "database" => DB_NAME,
        "php_version" => phpversion()
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "No se pudo establecer la conexión."
    ]);
}
?>
