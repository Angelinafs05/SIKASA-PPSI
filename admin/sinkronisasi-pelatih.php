<?php
include '../koneksi.php';

$q = mysqli_query($conn, "
    SELECT * FROM pelatih 
    WHERE id NOT IN (
        SELECT ref_id FROM users WHERE role='pelatih'
    )
");

while ($p = mysqli_fetch_assoc($q)) {

    $username = strtolower(str_replace(' ', '', $p['nama_pelatih']));
    $password = password_hash('123456', PASSWORD_DEFAULT);

    mysqli_query($conn, "
        INSERT INTO users (username, password, role, ref_id)
        VALUES (
            '$username',
            '$password',
            'pelatih',
            '{$p['id']}'
        )
    ");
}

echo "Sinkronisasi selesai!";
