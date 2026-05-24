<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDB();
    $stmt = $db->query('SELECT id, nominal FROM riwayat_honor');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach($rows as $row) {
        $id = $row['id'];
        $n = trim($row['nominal']);
        $clean = str_replace(['.', ','], '', $n);
        
        if($clean == '150') $clean = '150000';
        if($clean == '15000') $clean = '150000';
        if($clean == '300') $clean = '300000';
        if($clean == '500') $clean = '500000';
        if($clean == '1500000') $clean = '1500000'; // Just to be safe
        
        $db->exec("UPDATE riwayat_honor SET nominal = '$clean' WHERE id = $id");
    }
    
    echo "DONE. Fixed values.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
