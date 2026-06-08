<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// logout.php
// Odhlášení: vyprázdní data relace, zruší session cookie a vrátí uživatele na login.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$_SESSION = array();

// Zrušíme i session cookie v prohlížeči.
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}

session_destroy();
header('Location: index.php');
exit;
?>
