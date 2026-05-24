<?php
$ch = curl_init();
$file = curl_file_create(__FILE__, 'text/php', 'test.php');
$data = [
    'ekskul_id' => 1,
    'tanggal' => '2024-11-20',
    'keterangan' => 'Sakit test curl',
    'surat_ijin' => $file
];

curl_setopt($ch, CURLOPT_URL, 'http://localhost/SIKASA/backend/api/siswa/izin'); // or through php dev server
// Wait, the API relies on authentication! requireRole('siswa')!
// If I hit the endpoint directly, I will get a 401 Unauthorized because there's no Bearer token.
