<?php
require 'backend/config/database.php';
try {
    $db = getDB();
    echo "Users list:\n";
    $stmt = $db->query("SELECT id, username, role FROM users");
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
