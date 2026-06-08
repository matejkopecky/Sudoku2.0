<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// admin/index.php
// Jednoduchá administrace chráněná jedním heslem z config.php.
// Administrace není napojená na uživatelské účty - přístup má ten, kdo zná admin heslo.

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../functions.php';

// Spustíme session. Do ní si uložíme, že je administrátor přihlášen.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$message = '';
$error = '';

// Odhlášení z administrace.
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    header('Location: index.php');
    exit;
}

// Zpracování přihlášení administrátora.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password'])) {
    $entered = isset($_POST['admin_password']) ? $_POST['admin_password'] : '';

    // hash_equals chrání porovnání hesel proti drobným timing útokům.
    if (hash_equals((string)$admin_password, (string)$entered)) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: index.php');
        exit;
    } else {
        $error = 'Špatné administrátorské heslo.';
    }
}

$is_admin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// Pokud administrátor není přihlášený, ukážeme pouze formulář s heslem.
if (!$is_admin):
?>
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Administrace - Sudoku</title>
  <link rel="stylesheet" href="../assets/style.css">
<script src="../assets/theme.js" defer></script></head>
<body class="auth-page">
  <main class="auth-card">
    <div class="auth-brand"><span class="brand-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></span><span class="brand-name">SUDOKU</span><span class="brand-sub">administrace</span></div>
    <h1>Administrace</h1>
    <div class="theme-dots" aria-label="Přepnutí barevného režimu"><button type="button" class="theme-dot theme-dot-dark" data-theme-choice="tmavy" title="Tmavý režim"><span>Tmavý</span></button><button type="button" class="theme-dot theme-dot-blue" data-theme-choice="modry" title="Modrý režim"><span>Modrý</span></button><button type="button" class="theme-dot theme-dot-light" data-theme-choice="svetly" title="Světlý režim"><span>Světlý</span></button></div>
    <p class="small">Zadejte jedno administrátorské heslo ze souboru <strong>config.php</strong>.</p>
    <?php if ($error): ?><p class="message error"><?php echo e($error); ?></p><?php endif; ?>
    <form method="post">
      <label>Admin heslo
        <input type="password" name="admin_password" required autofocus>
      </label>
      <button type="submit">Vstoupit do administrace</button>
    </form>
    <p class="small"><a href="../index.php">Zpět na web</a></p>
  </main>
<footer class="site-footer">Vytvořil: Matěj Kopecký &lt;matysek.kopecky@seznam.cz&gt;</footer></body>
</html>
<?php
exit;
endif;

// ------------------------------------------------------------
// Akce administrátora nad uživateli
// ------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;

    if ($user_id > 0 && $action === 'reset_stats') {
        // Reset statistik = smažeme odehrané hry uživatele, účet zůstane.
        $stmt = $pdo->prepare('DELETE FROM games WHERE user_id = ?');
        $stmt->execute(array($user_id));
        $message = 'Statistiky hráče byly resetovány.';
    }

    if ($user_id > 0 && $action === 'delete_user') {
        // Smazání účtu. Díky ON DELETE CASCADE se smažou i jeho hry.
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute(array($user_id));
        $message = 'Uživatelský účet byl smazán.';
    }
}

// ------------------------------------------------------------
// Přehledové statistiky
// ------------------------------------------------------------
$total_users = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$total_games = (int)$pdo->query('SELECT COUNT(*) FROM games')->fetchColumn();
$best_time = $pdo->query('SELECT MIN(elapsed_seconds) FROM games')->fetchColumn();
$avg_time = $pdo->query('SELECT AVG(elapsed_seconds) FROM games')->fetchColumn();

// Technické informace o serveru. Hodí se při řešení problémů na hostingu.
$php_version = PHP_VERSION;
$mysql_version = 'Nezjištěno';
$pdo_driver = 'Nezjištěno';
try {
    $mysql_version = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
    $pdo_driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
} catch (Exception $e) {
    // Kdyby hosting některý údaj nepovolil, administrace zůstane funkční.
}


// Přehled hráčů včetně e-mailů, časů a počtu her.
$sql_users = '
    SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(g.id) AS games_count,
        MIN(g.elapsed_seconds) AS best_time,
        AVG(g.elapsed_seconds) AS avg_time,
        MAX(g.finished_at) AS last_game
    FROM users u
    LEFT JOIN games g ON g.user_id = u.id
    GROUP BY u.id, u.name, u.email, u.created_at
    ORDER BY u.created_at DESC
';
$players = $pdo->query($sql_users)->fetchAll();

// Posledních 50 her pro rychlou kontrolu časů.
$sql_games = '
    SELECT g.*, u.name, u.email
    FROM games g
    JOIN users u ON u.id = g.user_id
    ORDER BY g.finished_at DESC
    LIMIT 50
';
$recent_games = $pdo->query($sql_games)->fetchAll();
?>
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Administrace - Sudoku</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<header class="top">
  <a class="brand" href="../menu.php"><span class="brand-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></span><span class="brand-text"><span class="brand-name">SUDOKU</span><span class="brand-sub">administrace</span></span></a>
  <nav>
    <a href="../menu.php">Menu</a>
    <a href="../top10.php">Top 10</a>
    <a href="?logout=1" class="danger">Odhlásit admina</a>
    <div class="theme-dots" aria-label="Přepnutí barevného režimu"><button type="button" class="theme-dot theme-dot-dark" data-theme-choice="tmavy" title="Tmavý režim"><span>Tmavý</span></button><button type="button" class="theme-dot theme-dot-blue" data-theme-choice="modry" title="Modrý režim"><span>Modrý</span></button><button type="button" class="theme-dot theme-dot-light" data-theme-choice="svetly" title="Světlý režim"><span>Světlý</span></button></div>
  </nav>
</header>

<main class="container">
  <h1>Admin panel</h1>
  <p class="small">Tady vidíte hráče, e-maily, odehrané hry, časy a můžete resetovat statistiky nebo smazat účet.</p>

  <?php if ($message): ?><p class="message ok"><?php echo e($message); ?></p><?php endif; ?>

  <section class="cards admin-cards">
    <article><h2>Počet hráčů</h2><p class="number"><?php echo $total_users; ?></p></article>
    <article><h2>Počet uložených her</h2><p class="number"><?php echo $total_games; ?></p></article>
    <article><h2>Nejlepší čas</h2><p class="number"><?php echo $best_time ? e(format_seconds($best_time)) : '—'; ?></p></article>
    <article><h2>Průměrný čas</h2><p class="number"><?php echo $avg_time ? e(format_seconds((int)$avg_time)) : '—'; ?></p></article>
  </section>

  <section class="text-page admin-section">
    <h2>Technické informace</h2>
    <p class="small">Tyto údaje ukazují, na čem systém právě běží. Pomůže to při kontrole hostingu.</p>
    <div class="table-wrap">
      <table>
        <tr><th>Položka</th><th>Hodnota</th></tr>
        <tr><td>PHP verze</td><td><?php echo e($php_version); ?></td></tr>
        <tr><td>MySQL / MariaDB verze</td><td><?php echo e($mysql_version); ?></td></tr>
        <tr><td>PDO ovladač</td><td><?php echo e($pdo_driver); ?></td></tr>
        <tr><td>Název databáze z config.php</td><td><?php echo e($db_name); ?></td></tr>
        <tr><td>Server databáze z config.php</td><td><?php echo e($db_host); ?></td></tr>
      </table>
    </div>
  </section>

  <section class="text-page admin-section">
    <h2>Hráči a účty</h2>
    <div class="table-wrap">
      <table>
        <tr>
          <th>ID</th><th>Jméno</th><th>E-mail</th><th>Registrace</th><th>Her</th><th>Nejlepší čas</th><th>Průměr</th><th>Poslední hra</th><th>Akce</th>
        </tr>
        <?php foreach ($players as $p): ?>
        <tr>
          <td><?php echo (int)$p['id']; ?></td>
          <td><?php echo e($p['name']); ?></td>
          <td><?php echo e($p['email']); ?></td>
          <td><?php echo e($p['created_at']); ?></td>
          <td><?php echo (int)$p['games_count']; ?></td>
          <td><?php echo $p['best_time'] ? e(format_seconds($p['best_time'])) : '—'; ?></td>
          <td><?php echo $p['avg_time'] ? e(format_seconds((int)$p['avg_time'])) : '—'; ?></td>
          <td><?php echo $p['last_game'] ? e($p['last_game']) : '—'; ?></td>
          <td class="admin-actions">
            <form method="post" onsubmit="return confirm('Opravdu resetovat statistiky tohoto hráče? Účet zůstane, smažou se jen hry.');">
              <input type="hidden" name="user_id" value="<?php echo (int)$p['id']; ?>">
              <input type="hidden" name="action" value="reset_stats">
              <button type="submit">Reset statistik</button>
            </form>
            <form method="post" onsubmit="return confirm('Opravdu smazat celý účet? Tato akce smaže účet i všechny jeho hry.');">
              <input type="hidden" name="user_id" value="<?php echo (int)$p['id']; ?>">
              <input type="hidden" name="action" value="delete_user">
              <button type="submit" class="danger-button">Smazat účet</button>
            </form>
          </td>
        </tr>
        <?php endforeach; ?>
      </table>
    </div>
  </section>

  <section class="text-page admin-section">
    <h2>Poslední odehrané hry</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Hráč</th><th>E-mail</th><th>Obtížnost</th><th>Čas</th><th>Tahy</th><th>Nápovědy</th><th>Chyby</th><th>Datum</th></tr>
        <?php foreach ($recent_games as $g): ?>
        <tr>
          <td><?php echo e($g['name']); ?></td>
          <td><?php echo e($g['email']); ?></td>
          <td><?php echo e(difficulty_name($g['difficulty'])); ?></td>
          <td><?php echo e(format_seconds($g['elapsed_seconds'])); ?></td>
          <td><?php echo (int)$g['moves_count']; ?></td>
          <td><?php echo (int)$g['hints_used']; ?></td>
          <td><?php echo (int)$g['mistakes_count']; ?></td>
          <td><?php echo e($g['finished_at']); ?></td>
        </tr>
        <?php endforeach; ?>
      </table>
    </div>
  </section>
</main>
</body>
</html>
