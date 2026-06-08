<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// save_result.php
// Přijme výsledek hry z JavaScriptu a uloží ho do databáze.
// Doplněna serverová kontrola hodnot a ochrana žebříčku před automaticky dořešenými hrami.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(array('ok' => false, 'message' => 'Uživatel není přihlášen.'));
    exit;
}

$difficulty = isset($_POST['difficulty']) ? $_POST['difficulty'] : '';
$elapsed    = isset($_POST['elapsed_seconds']) ? (int)$_POST['elapsed_seconds'] : 0;
$moves      = isset($_POST['moves_count']) ? (int)$_POST['moves_count'] : 0;
$hints      = isset($_POST['hints_used']) ? (int)$_POST['hints_used'] : 0;
$mistakes   = isset($_POST['mistakes_count']) ? (int)$_POST['mistakes_count'] : 0;
$autosolved = isset($_POST['autosolved']) && $_POST['autosolved'] === '1';
$isDaily    = (isset($_POST['is_daily']) && $_POST['is_daily'] === '1') ? 1 : 0; // 1 = Daily Challenge

// Hru dořešenou počítačem do žebříčku nezapisujeme.
if ($autosolved) {
    echo json_encode(array('ok' => true, 'saved' => false, 'message' => 'Automaticky dořešená hra se neukládá.'));
    exit;
}

if (!in_array($difficulty, array('easy','medium','hard','expert'), true)) {
    echo json_encode(array('ok' => false, 'message' => 'Neplatná obtížnost.'));
    exit;
}

// Serverová kontrola rozsahů (ochrana proti nesmyslným nebo podvrženým hodnotám).
if ($elapsed < 1 || $elapsed > 86400) {
    echo json_encode(array('ok' => false, 'message' => 'Neplatný čas.'));
    exit;
}
if ($moves < 0)    { $moves = 0; }    if ($moves > 100000)    { $moves = 100000; }
if ($hints < 0)    { $hints = 0; }    if ($hints > 81)        { $hints = 81; }
if ($mistakes < 0) { $mistakes = 0; } if ($mistakes > 100000) { $mistakes = 100000; }

$stmt = $pdo->prepare('INSERT INTO games (user_id, difficulty, elapsed_seconds, moves_count, hints_used, mistakes_count, is_daily) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->execute(array($_SESSION['user_id'], $difficulty, $elapsed, $moves, $hints, $mistakes, $isDaily));

echo json_encode(array('ok' => true, 'saved' => true));
?>
