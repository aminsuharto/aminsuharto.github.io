<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (!$rawInput) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No data received']);
        exit;
    }

    $data = json_decode($rawInput, true);
    if ($data === null || !isset($data['members'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON structure']);
        exit;
    }

    $formattedJson = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if (file_put_contents($dataFile, $formattedJson) === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to write to data.json']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

// GET request
if (file_exists($dataFile)) {
    echo file_get_contents($dataFile);
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'data.json not found']);
}
?>
