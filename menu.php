<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// menu.php
// Hlavní rozcestník po přihlášení.
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';
require_login();

$stmt = $pdo->prepare('SELECT COUNT(*) AS pocet, MIN(elapsed_seconds) AS best FROM games WHERE user_id = ?');
$stmt->execute(array($_SESSION['user_id']));
$my = $stmt->fetch();
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Menu - Sudoku</title>
<link rel="stylesheet" href="assets/style.css">
<script src="assets/theme.js" defer></script>
</head>
<body>
<header class="top">
  <a class="brand" href="menu.php">
    <span class="brand-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></span>
    <span class="brand-text"><span class="brand-name">SUDOKU</span><span class="brand-sub">od Matěje Kopeckého</span></span>
  </a>
  <nav>
    <span class="user-chip"><strong><?php echo e(current_user_name()); ?></strong> přihlášen</span>
    <a href="sudoku.php">Hrát</a>
    <a href="top10.php">Top 10</a>
    <a href="about.php">Co je Sudoku</a>
    <a href="logout.php" class="danger">Odhlásit</a>
    <div class="theme-dots" aria-label="Přepnutí barevného režimu">
      <button type="button" class="theme-dot theme-dot-dark" data-theme-choice="tmavy" title="Tmavý režim"><span>Tmavý</span></button>
      <button type="button" class="theme-dot theme-dot-blue" data-theme-choice="modry" title="Modrý režim"><span>Modrý</span></button>
      <button type="button" class="theme-dot theme-dot-light" data-theme-choice="svetly" title="Světlý režim"><span>Světlý</span></button>
    </div>
  </nav>
</header>
<main class="container">
  <section class="hero">
    <div>
      <span class="badge">Logická hra pro každý den</span>
      <h1>Sudoku centrum</h1>
      <p>Hrajte, měřte čas, sledujte statistiky a porovnejte se s ostatními hráči.</p>
      <a class="big-button" href="sudoku.php">Spustit hru</a>
    </div>
    <img src="assets/logo.png" alt="Sudoku logo">
  </section>
  <section class="cards">
    <article class="cat-blue">
      <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></div>
      <h2>Moje hry</h2>
      <p class="number"><?php echo (int)$my['pocet']; ?></p>
      <p>Počet uložených dohraných her.</p>
    </article>
    <article class="cat-green">
      <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg></div>
      <h2>Můj nejlepší čas</h2>
      <p class="number"><?php echo $my['best'] ? e(format_seconds($my['best'])) : '—'; ?></p>
      <p>Nejrychlejší dokončená hra.</p>
    </article>
    <article class="cat-purple">
      <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 17H6a2 2 0 0 0-2 2"/></svg></div>
      <h2>O Sudoku</h2>
      <p>Sudoku je logická hra s čísly 1 až 9. Každé číslo smí být v řádku, sloupci a bloku 3×3 pouze jednou.</p>
      <a href="about.php">Číst více →</a>
    </article>
  </section>
</main>
<footer class="site-footer">Vytvořil: Matěj Kopecký &lt;matysek.kopecky@seznam.cz&gt;</footer>
</body>
</html>
