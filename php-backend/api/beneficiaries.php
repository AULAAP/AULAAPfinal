<?php
require_once '../db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener beneficiarios
        $church_id = isset($_GET['church_id']) ? $_GET['church_id'] : null;
        
        if ($church_id) {
            $stmt = $db->prepare("SELECT * FROM beneficiaries WHERE church_id = ?");
            $stmt->execute([$church_id]);
        } else {
            $stmt = $db->query("SELECT * FROM beneficiaries");
        }
        
        $beneficiaries = $stmt->fetchAll();
        echo json_encode($beneficiaries);
        break;

    case 'POST':
        // Crear beneficiario
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id) && !empty($data->name) && !empty($data->church_id)) {
            $stmt = $db->prepare("INSERT INTO beneficiaries (id, name, age, gender, section, status, photo_url, owner_id, church_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            if ($stmt->execute([
                $data->id,
                $data->name,
                $data->age,
                $data->gender,
                $data->section,
                $data->status,
                $data->photo_url,
                $data->owner_id,
                $data->church_id
            ])) {
                http_response_code(201);
                echo json_encode(["message" => "Beneficiario creado con éxito."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo crear el beneficiario."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }
        break;

    case 'PUT':
        // Actualizar beneficiario
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id)) {
            $stmt = $db->prepare("UPDATE beneficiaries SET name = ?, age = ?, gender = ?, section = ?, status = ?, photo_url = ? WHERE id = ?");
            
            if ($stmt->execute([
                $data->name,
                $data->age,
                $data->gender,
                $data->section,
                $data->status,
                $data->photo_url,
                $data->id
            ])) {
                echo json_encode(["message" => "Beneficiario actualizado con éxito."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo actualizar el beneficiario."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "ID de beneficiario no proporcionado."]);
        }
        break;

    case 'DELETE':
        // Eliminar beneficiario
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($id) {
            $stmt = $db->prepare("DELETE FROM beneficiaries WHERE id = ?");
            if ($stmt->execute([$id])) {
                echo json_encode(["message" => "Beneficiario eliminado con éxito."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo eliminar el beneficiario."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "ID de beneficiario no proporcionado."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Método no permitido."]);
        break;
}
?>
