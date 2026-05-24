<?php
require 'backend/config/database.php';
$db = getDB();

$stmt = $db->query("SELECT * FROM kelas");
$kelas = $stmt->fetchAll(PDO::FETCH_ASSOC);

$romanMap = [
    '7' => 'VII',
    '8' => 'VIII',
    '9' => 'IX',
    '10' => 'X',
    '11' => 'XI',
    '12' => 'XII',
    '1' => 'I',
    '2' => 'II',
    '3' => 'III',
    '4' => 'IV',
    '5' => 'V',
    '6' => 'VI'
];

foreach ($kelas as $k) {
    preg_match('/^(\d+)(\s*)(.*)$/', $k['nama_kelas'], $matches);
    
    if (count($matches) >= 4 && isset($romanMap[$matches[1]])) {
        $numberPart = $matches[1];
        $restPart = $matches[3];
        
        $newNama = $romanMap[$numberPart] . ' ' . trim($restPart);
        
        $updateStmt = $db->prepare("UPDATE kelas SET nama_kelas = :new_nama WHERE id = :id");
        $updateStmt->execute([
            ':new_nama' => $newNama,
            ':id' => $k['id']
        ]);
        echo "Updated " . $k['nama_kelas'] . " to " . $newNama . "\n";
    }
}
echo "Done.\n";
