<?php
require_once __DIR__ . '/helpers/db.php';
$db = getDB();
try {
    $stmt = $db->query("DESCRIBE pendaftaran_ekskul");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($cols, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
