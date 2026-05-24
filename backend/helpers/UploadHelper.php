<?php
/**
 * Upload Helper
 * Handles file uploads with validation
 */

class UploadHelper {
    
    /**
     * Upload a file
     * @param array $file The $_FILES element
     * @param string $targetDir Target directory relative to project root
     * @param array $allowedExts Allowed extensions
     * @return string|null Path to uploaded file or null on failure
     */
    public static function upload(array $file, string $targetDir, array $allowedExts = ['jpg', 'jpeg', 'png', 'pdf']): ?string {
        if (!isset($file['name']) || $file['error'] !== UPLOAD_ERR_OK) {
            error_log("UploadHelper: Invalid file or upload error " . ($file['error'] ?? 'unknown'));
            return null;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExts)) {
            error_log("UploadHelper: Invalid extension $ext");
            return null;
        }

        // Ensure directory exists
        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0777, true)) {
                error_log("UploadHelper: Failed to create directory $targetDir");
                return null;
            }
        }

        // Generate unique name
        $newName = uniqid('reg_', true) . '.' . $ext;
        $targetPath = $targetDir . '/' . $newName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            return $targetPath;
        }

        error_log("UploadHelper: Failed to move uploaded file to $targetPath");
        return null;
    }
}
