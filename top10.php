<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// top10.php
// Výpis nejlepších 10 výsledků z databáze + osobní statistiky hráče vedle tabulky.
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';
require_login();

$difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : 'all';
$allowed = array('easy','medium','hard','expert');
if (in_array($difficulty, $allowed, true)) {
    $stmt = $pdo->prepare('SELECT g.*, u.name FROM games g JOIN users u ON u.id = g.user_id WHERE g.difficulty = ? ORDER BY g.elapsed_seconds ASC, g.moves_count ASC LIMIT 10');
    $stmt->execute(array($difficulty));
} else {
    $stmt = $pdo->query('SELECT g.*, u.name FROM games g JOIN users u ON u.id = g.user_id ORDER BY g.elapsed_seconds ASC, g.moves_count ASC LIMIT 10');
}
$rows = $stmt->fetchAll();

// --- Osobní statistiky přihlášeného hráče (vedle tabulky) ---
// Počet odehraných her podle obtížnosti + nejlepší čas v dané obtížnosti.
$stmt = $pdo->prepare('SELECT difficulty, COUNT(*) AS pocet, MIN(elapsed_seconds) AS best FROM games WHERE user_id = ? GROUP BY difficulty');
$stmt->execute(array($_SESSION['user_id']));
$mine = array();
foreach ($stmt->fetchAll() as $r) { $mine[$r['difficulty']] = $r; }

// Celkové nejlepší skóre (nejrychlejší dokončená hra) a počet dohraných Daily Challenge.
$stmt = $pdo->prepare('SELECT MIN(elapsed_seconds) AS best FROM games WHERE user_id = ?');
$stmt->execute(array($_SESSION['user_id']));
$bestOverall = $stmt->fetchColumn();

$stmt = $pdo->prepare('SELECT COUNT(*) AS done FROM games WHERE user_id = ? AND is_daily = 1');
$stmt->execute(array($_SESSION['user_id']));
$dailyDone = (int)$stmt->fetchColumn();
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Top 10</title>
<link rel="stylesheet" href="assets/style.css">
<script src="assets/theme.js" defer></script>
</head>
<body>
<header class="top"><a class="brand" href="menu.php"><span class="brand-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></span><span class="brand-text"><span class="brand-name">SUDOKU</span><span class="brand-sub">od Matěje Kopeckého</span></span></a><nav><a href="menu.php">Menu</a><a href="sudoku.php">Hrát</a><a href="logout.php" class="danger">Odhlásit</a><div class="theme-dots" aria-label="Přepnutí barevného režimu"><button type="button" class="theme-dot theme-dot-dark" data-theme-choice="tmavy" title="Tmavý režim"><span>Tmavý</span></button><button type="button" class="theme-dot theme-dot-blue" data-theme-choice="modry" title="Modrý režim"><span>Modrý</span></button><button type="button" class="theme-dot theme-dot-light" data-theme-choice="svetly" title="Světlý režim"><span>Světlý</span></button></div></nav></header>
<main class="container">
  <h1>Nejlepší výsledky</h1>
  <form method="get" class="filter">
    <select name="difficulty">
      <option value="all">Vše</option>
      <?php foreach ($allowed as $d): ?>
        <option value="<?php echo e($d); ?>" <?php echo $difficulty===$d?'selected':''; ?>><?php echo e(difficulty_name($d)); ?></option>
      <?php endforeach; ?>
    </select>
    <button>Zobrazit</button>
  </form>
  <div class="top10-layout">
    <div class="table-wrap">
      <table>
        <tr><th>#</th><th>Hráč</th><th>Obtížnost</th><th>Čas</th><th>Tahy</th><th>Nápovědy</th><th>Datum</th></tr>
        <?php $i=1; foreach ($rows as $r): ?>
        <tr><td><?php echo $i++; ?></td><td><?php echo e($r['name']); ?></td><td><?php echo e(difficulty_name($r['difficulty'])); ?></td><td><?php echo e(format_seconds($r['elapsed_seconds'])); ?></td><td><?php echo (int)$r['moves_count']; ?></td><td><?php echo (int)$r['hints_used']; ?></td><td><?php echo e($r['finished_at']); ?></td></tr>
        <?php endforeach; ?>
      </table>
    </div>
    <aside class="side stats-aside">
      <h2>Moje hry podle obtížnosti</h2>
      <ul class="stat-rows">
        <?php foreach ($allowed as $d): $pocet = isset($mine[$d]) ? (int)$mine[$d]['pocet'] : 0; ?>
        <li><span><?php echo e(difficulty_name($d)); ?></span><span class="stat-count"><?php echo $pocet; ?> her</span></li>
        <?php endforeach; ?>
      </ul>
      <div class="best-score"><span>Nejlepší skóre</span><strong><?php echo $bestOverall ? e(format_seconds($bestOverall)) : '—'; ?></strong></div>
      <div class="daily-card"><span>Daily Challenge vyřešeno</span><strong><?php echo $dailyDone; ?></strong></div>
    </aside>
  </div>
</main>
<footer class="site-footer">Vytvořil: Matěj Kopecký &lt;matysek.kopecky@seznam.cz&gt;</footer>
</body>
</html>
