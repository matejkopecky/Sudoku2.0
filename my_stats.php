<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// my_stats.php
// Vrací osobní statistiky hráče jako JSON pro JavaScript.
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(array('ok' => false));
    exit;
}

$stmt = $pdo->prepare('SELECT COUNT(*) AS total, MIN(elapsed_seconds) AS best, AVG(elapsed_seconds) AS avgtime FROM games WHERE user_id = ?');
$stmt->execute(array($_SESSION['user_id']));
$total = $stmt->fetch();

$stmt = $pdo->prepare('SELECT difficulty, COUNT(*) AS pocet, MIN(elapsed_seconds) AS best FROM games WHERE user_id = ? GROUP BY difficulty');
$stmt->execute(array($_SESSION['user_id']));
$by = $stmt->fetchAll();

// Počet dokončených Daily Challenge (her označených příznakem is_daily).
$stmt = $pdo->prepare('SELECT COUNT(*) AS done FROM games WHERE user_id = ? AND is_daily = 1');
$stmt->execute(array($_SESSION['user_id']));
$dailyDone = (int)$stmt->fetchColumn();

echo json_encode(array('ok'=>true, 'total'=>$total, 'byDifficulty'=>$by, 'dailyDone'=>$dailyDone));
?>
