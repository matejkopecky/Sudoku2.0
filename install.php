<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// install.php
// Instalátor: založí celou databázi OD NULY podle database.sql
// (tabulky users a games). POZOR: stávající tabulky users a games se přitom
// zahodí i s daty. Po úspěšné instalaci tento soubor z bezpečnostních důvodů smažte.

require_once __DIR__ . '/config.php';

$sql = file_get_contents(__DIR__ . '/database.sql');

// Odstraníme CREATE DATABASE a USE – připojení už směřuje na konkrétní DB z config.php.
$sql = preg_replace('/CREATE DATABASE.*?;\s*/is', '', $sql);
$sql = preg_replace('/USE\s+[^;]+;\s*/is', '', $sql);

try {
    $pdo->exec($sql);
    echo '<h1>Instalace hotová</h1>';
    echo '<p>Databáze byla kompletně založena od nuly (tabulky <strong>users</strong> a <strong>games</strong>).</p>';
    echo '<p>Nyní prosím smažte soubor <strong>install.php</strong>.</p>';
    echo '<p><a href="index.php">Přejít na přihlášení</a></p>';
} catch (PDOException $e) {
    echo '<h1>Chyba instalace</h1>';
    echo '<p>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
}
?>
