<?php
// Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
// index.php
// Přihlašovací stránka. Uživatel zadá e-mail a heslo.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

if (is_logged_in()) {
    header('Location: menu.php');
    exit;
}

$error = '';
$success = isset($_GET['registered']) ? 'Registrace proběhla úspěšně. Nyní se prosím přihlaste.' : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim(isset($_POST['email']) ? $_POST['email'] : '');
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    if ($email === '' || $password === '') {
        $error = 'Vyplňte e-mail i heslo.';
    } else {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute(array($email));
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            header('Location: menu.php');
            exit;
        } else {
            $error = 'Nesprávný e-mail nebo heslo.';
        }
    }
}
?>
<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Přihlášení - Sudoku</title><link rel="stylesheet" href="assets/style.css"><script src="assets/theme.js" defer></script></head><body class="auth-page"><div class="rain" aria-hidden="true"><span style="left:0%;animation-duration:7s;animation-delay:-0s">1</span><span style="left:7%;animation-duration:8s;animation-delay:-1s">2</span><span style="left:14%;animation-duration:9s;animation-delay:-2s">3</span><span style="left:21%;animation-duration:10s;animation-delay:-3s">4</span><span style="left:28%;animation-duration:11s;animation-delay:-4s">5</span><span style="left:35%;animation-duration:12s;animation-delay:-5s">6</span><span style="left:42%;animation-duration:13s;animation-delay:-6s">7</span><span style="left:49%;animation-duration:14s;animation-delay:-7s">8</span><span style="left:56%;animation-duration:7s;animation-delay:-8s">9</span><span style="left:63%;animation-duration:8s;animation-delay:-0s">1</span><span style="left:70%;animation-duration:9s;animation-delay:-1s">2</span><span style="left:77%;animation-duration:10s;animation-delay:-2s">3</span><span style="left:84%;animation-duration:11s;animation-delay:-3s">4</span><span style="left:91%;animation-duration:12s;animation-delay:-4s">5</span><span style="left:98%;animation-duration:13s;animation-delay:-5s">6</span><span style="left:5%;animation-duration:14s;animation-delay:-6s">7</span><span style="left:12%;animation-duration:7s;animation-delay:-7s">8</span><span style="left:19%;animation-duration:8s;animation-delay:-8s">9</span><span style="left:26%;animation-duration:9s;animation-delay:-0s">1</span><span style="left:33%;animation-duration:10s;animation-delay:-1s">2</span><span style="left:40%;animation-duration:11s;animation-delay:-2s">3</span><span style="left:47%;animation-duration:12s;animation-delay:-3s">4</span><span style="left:54%;animation-duration:13s;animation-delay:-4s">5</span><span style="left:61%;animation-duration:14s;animation-delay:-5s">6</span><span style="left:68%;animation-duration:7s;animation-delay:-6s">7</span><span style="left:75%;animation-duration:8s;animation-delay:-7s">8</span><span style="left:82%;animation-duration:9s;animation-delay:-8s">9</span><span style="left:89%;animation-duration:10s;animation-delay:-0s">1</span><span style="left:96%;animation-duration:11s;animation-delay:-1s">2</span><span style="left:3%;animation-duration:12s;animation-delay:-2s">3</span></div><div class="auth-card"><div class="auth-brand"><span class="brand-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></span><span class="brand-name">SUDOKU</span><span class="brand-sub">od Matěje Kopeckého</span></div><h1>Přihlášení</h1><div class="theme-dots" aria-label="Přepnutí barevného režimu"><button type="button" class="theme-dot theme-dot-dark" data-theme-choice="tmavy" title="Tmavý režim"><span>Tmavý</span></button><button type="button" class="theme-dot theme-dot-blue" data-theme-choice="modry" title="Modrý režim"><span>Modrý</span></button><button type="button" class="theme-dot theme-dot-light" data-theme-choice="svetly" title="Světlý režim"><span>Světlý</span></button></div><?php if ($error): ?><p class="message error"><?php echo e($error); ?></p><?php endif; ?><?php if ($success): ?><p class="message ok"><?php echo e($success); ?></p><?php endif; ?><form method="post"><label>E-mail<input type="email" name="email" required></label><label>Heslo<input type="password" name="password" required></label><button type="submit">Přihlásit se</button></form><p class="small">Nemáte účet? <a href="register.php">Registrace</a></p></div><footer class="site-footer">Vytvořil: Matěj Kopecký &lt;matysek.kopecky@seznam.cz&gt;</footer></body></html>
