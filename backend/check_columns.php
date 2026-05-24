<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    $stmt = $db->query("DESCRIBE ekstrakurikuler");
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo $e->getMessage();
}
