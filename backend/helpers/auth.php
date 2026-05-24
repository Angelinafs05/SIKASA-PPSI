<?php
/**
 * JWT Authentication Helper
 * Menggunakan firebase/php-jwt
 */

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

define('JWT_SECRET', 'sikasa_secret_key_change_in_production_2024');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 86400); // 24 jam

/**
 * Generate JWT token untuk user
 */
function generateToken(array $user): string {
    $payload = [
        'iss' => 'sikasa_api',
        'iat' => time(),
        'exp' => time() + JWT_EXPIRY,
        'sub' => $user['id'],
        'role' => $user['role'],
        'ref_id' => $user['ref_id'] ?? null,
    ];
    
    return JWT::encode($payload, JWT_SECRET, JWT_ALGORITHM);
}

/**
 * Decode dan validasi JWT token
 * Return payload jika valid, null jika tidak
 */
function decodeToken(string $token): ?object {
    try {
        return JWT::decode($token, new Key(JWT_SECRET, JWT_ALGORITHM));
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Ambil token dari header Authorization
 */
function getBearerToken(): ?string {
    $headers = '';
    
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $headers = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $headers = $requestHeaders['Authorization'] ?? '';
    }
    
    if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    
    return null;
}

/**
 * Middleware: Wajib login
 * Return user payload jika token valid, exit 401 jika tidak
 */
function requireAuth(): object {
    $token = getBearerToken();
    
    if (!$token) {
        errorResponse('Token tidak ditemukan', 401);
    }
    
    $payload = decodeToken($token);
    
    if (!$payload) {
        errorResponse('Token tidak valid atau sudah expired', 401);
    }
    
    return $payload;
}

/**
 * Middleware: Wajib role tertentu
 */
function requireRole(string ...$roles): object {
    $user = requireAuth();
    
    if (!in_array($user->role, $roles)) {
        errorResponse('Akses ditolak. Role tidak sesuai.', 403);
    }
    
    return $user;
}
