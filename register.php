<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// register.php
// Registrace nového hráče. Heslo se ukládá pouze jako bezpečný hash.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim(isset($_POST['name']) ? $_POST['name'] : '');
    $email = trim(isset($_POST['email']) ? $_POST['email'] : '');
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $password2 = isset($_POST['password2']) ? $_POST['password2'] : '';

    if ($name === '' || $email === '' || $password === '') {
        $error = 'Vyplňte všechna pole.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'E-mail nemá správný tvar.';
    } elseif (strlen($password) < 6) {
        $error = 'Heslo musí mít alespoň 6 znaků.';
    } elseif ($password !== $password2) {
        $error = 'Hesla se neshodují.';
    } else {
        try {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
            $stmt->execute(array($name, $email, $hash));
            header('Location: index.php?registered=1');
            exit;
        } catch (PDOException $e) {
            $error = 'Tento e-mail už je pravděpodobně registrovaný.';
        }
    }
}
?>
<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Registrace - Sudoku</title><link rel="stylesheet" href="assets/style.css"><script src="assets/theme.js" defer></script></head><body class="auth-page"><div class="auth-card"><div class="auth-brand"><span class="brand-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></span><span class="brand-name">SUDOKU</span><span class="brand-sub">od Matěje Kopeckého</span></div><h1>Registrace</h1><div class="theme-dots" aria-label="Přepnutí barevného režimu"><button type="button" class="theme-dot theme-dot-dark" data-theme-choice="tmavy" title="Tmavý režim"><span>Tmavý</span></button><button type="button" class="theme-dot theme-dot-blue" data-theme-choice="modry" title="Modrý režim"><span>Modrý</span></button><button type="button" class="theme-dot theme-dot-light" data-theme-choice="svetly" title="Světlý režim"><span>Světlý</span></button></div><?php if ($error): ?><p class="message error"><?php echo e($error); ?></p><?php endif; ?><?php if ($success): ?><p class="message ok"><?php echo e($success); ?></p><?php endif; ?><form method="post"><label>Jméno hráče<input type="text" name="name" required></label><label>E-mail<input type="email" name="email" required></label><label>Heslo<input type="password" name="password" required></label><label>Heslo znovu<input type="password" name="password2" required></label><button type="submit">Vytvořit účet</button></form><p class="small"><a href="index.php">Zpět na přihlášení</a></p></div><footer class="site-footer">Vytvořil: Matěj Kopecký &lt;matysek.kopecky@seznam.cz&gt;</footer></body></html>
