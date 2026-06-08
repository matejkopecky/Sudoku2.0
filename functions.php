<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// functions.php
// Společné pomocné funkce pro přihlášení, výpis textů a kontrolu uživatele.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function e($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

function is_logged_in() {
    return isset($_SESSION['user_id']);
}

function require_login() {
    if (!is_logged_in()) {
        header('Location: index.php');
        exit;
    }
}

function current_user_name() {
    return isset($_SESSION['user_name']) ? $_SESSION['user_name'] : 'Hráč';
}

function difficulty_name($difficulty) {
    $names = array(
        'easy' => 'Snadná',
        'medium' => 'Střední',
        'hard' => 'Těžká',
        'expert' => 'Expert'
    );
    return isset($names[$difficulty]) ? $names[$difficulty] : $difficulty;
}

function format_seconds($sec) {
    $sec = (int)$sec;
    $m = floor($sec / 60);
    $s = $sec % 60;
    return sprintf('%02d:%02d', $m, $s);
}
?>
