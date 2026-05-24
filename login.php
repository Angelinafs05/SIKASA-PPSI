<?php
session_start();
include 'koneksi.php';

$error_msg = "";

// Logika hanya jalan jika form dikirim (tombol Masuk diklik)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $query = mysqli_query($conn, "SELECT * FROM users WHERE username='$username'");
    $data  = mysqli_fetch_assoc($query);

    if ($data) {
        if (password_verify($password, $data['password'])) {
            $_SESSION['login']  = true;
            $_SESSION['role']   = $data['role'];
            $_SESSION['ref_id'] = $data['ref_id'];

            // Redirect sesuai role
            switch ($data['role']) {
                case 'admin':
                    header("Location: admin/index.php");
                    break;
                case 'pelatih':
                    header("Location: pelatih/index.php");
                    break;
                case 'siswa':
                    header("Location: siswa/index.php");
                    break;
                case 'pembimbing':
                    header("Location: pembimbing/index.php");
                    break;
            }
            exit;
        } else {
            $error_msg = "Password salah!";
        }
    } else {
        $error_msg = "Username tidak ditemukan!";
    }
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Login | SIKASA</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Segoe UI", sans-serif;
        }

        body {
            height: 100vh;
            background: linear-gradient(135deg, #1e1b8f, #312e81);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .login-box {
            background: #ffffff;
            width: 380px;
            padding: 40px 35px;
            border-radius: 16px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.18);
            text-align: center;
            animation: fadeIn 0.6s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(15px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .login-box h2 {
            margin-bottom: 5px;
            color: #1e1b8f;
            font-weight: 700;
        }

        .login-subtitle {
            font-size: 13px;
            color: #777;
            margin-bottom: 25px;
        }

        /* Gaya Pesan Error */
        .alert-error {
            background: #ffebee;
            color: #c62828;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 15px;
            border: 1px solid #ffcdd2;
        }

        label {
            display: block;
            text-align: left;
            font-size: 13px;
            margin-bottom: 5px;
            margin-top: 15px;
            color: #444;
        }

        input {
            width: 100%;
            padding: 11px 12px;
            border-radius: 10px;
            border: 1px solid #ddd;
            font-size: 14px;
            background: #f9fafc;
            transition: 0.25s;
        }

        input:focus {
            outline: none;
            border-color: #1e1b8f;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(30, 27, 143, 0.15);
        }

        button {
            width: 100%;
            padding: 13px;
            margin-top: 25px;
            background: #1e1b8f;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.25s;
        }

        button:hover {
            background: #161379;
            transform: translateY(-2px);
        }

        .register-link {
            margin-top: 18px;
            font-size: 13px;
        }

        .register-link a {
            color: #1e1b8f;
            text-decoration: none;
            font-weight: 600;
        }

        .register-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>

    <div class="login-box">
        <h2>SIKASA</h2>
        <div class="login-subtitle">Sistem Informasi Kegiatan Siswa</div>

        <?php if ($error_msg !== "") : ?>
            <div class="alert-error"><?php echo $error_msg; ?></div>
        <?php endif; ?>

        <form action="login.php" method="POST" autocomplete="off">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" required>
            </div>

            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required>
            </div>

            <button type="submit">Masuk</button>
        </form>

        <div class="register-link">
            Belum punya akun? <a href="register.html">Register dulu</a>
        </div>
    </div>

</body>

</html>