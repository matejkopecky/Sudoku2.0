# SUDOKU 1.0

**Autor:** Matěj Kopecký ([kopecky.matej@spssol.cz](mailto:kopecky.matej@spssol.cz))

Webová hra Sudoku s uživatelskými účty, žebříčkem nejlepších časů, osobními
statistikami a denní výzvou (Daily Challenge).

---

## 1. Co to je

SUDOKU 1.0 je kompletní webová aplikace pro hraní sudoku v prohlížeči. Hráč se
zaregistruje, přihlásí a hraje hádanky ve čtyřech obtížnostech. Systém měří čas,
počítá tahy, nápovědy i chyby a vše ukládá do databáze MySQL. Výsledky se
porovnávají v žebříčku TOP 10 a každý hráč vidí své osobní statistiky.

Hlavní vlastnosti:

- Generátor hádanek se **zaručeně jediným řešením** (hra je vždy logicky řešitelná).
- Tři barevné režimy: tmavý (výchozí), modrý a světlý.
- Číselník pro zadávání i ovládání klávesnicí, zvýrazňování řádku/sloupce/bloku.
- Nápověda s limitem **3 na hru**, kontrola řešení, automatické dořešení.
- **Daily Challenge** – náhodná výzva, jejíž dokončení se počítá zvlášť.
- Žebříček TOP 10 a osobní statistiky podle obtížnosti.
- Administrace (přehled hráčů, mazání účtů, reset statistik).

Aplikace **nepoužívá žádné externí frameworky ani knihovny** – PHP, HTML, CSS
i herní logika v JavaScriptu jsou napsané ručně.

---

## 2. Použité zdroje

Při vývoji a úpravách byl využit jazykový model **Claude Opus 4.8** (Anthropic) –
pomohl s laděním generátoru hádanek, návrhem vzhledu a kontrolou kódu.

Podklady a inspirace ke konceptu a algoritmům:

- **Pravidla a historie sudoku** – Wikipedia: <https://cs.wikipedia.org/wiki/Sudoku>
- **Řešitelské techniky** – Conceptis Puzzles:
  <https://www.conceptispuzzles.com/index.aspx?uri=puzzle/sudoku/techniques>
- **Algoritmus zpětného prohledávání (backtracking)** – obecný postup informatiky,
  na kterém stojí řešení hádanky i ověření jednoznačnosti řešení.
- **„Pattern" generování plně vyplněné mřížky** – známý rychlý způsob, jak vytvořit
  vždy platné sudoku, ze kterého se pak odebírají políčka.
- **Písma** – Google Fonts: Sora a Plus Jakarta Sans (<https://fonts.google.com/>).
- **PHP PDO** – bezpečný přístup k databázi: <https://www.php.net/manual/en/book.pdo.php>

---

## 3. Databáze a její struktura

Aplikace používá **MySQL / MariaDB** (přístup se nastavuje v `config.php`).
Schéma vytvoří `install.php` nebo soubor `database.sql`. Databáze má dvě tabulky.

### Tabulka `users` (hráči)

| Sloupec         | Typ                              | Význam |
|-----------------|----------------------------------|--------|
| `id`            | INT UNSIGNED, AUTO_INCREMENT, PK | Jednoznačné číslo hráče. |
| `name`          | VARCHAR(100)                     | Jméno hráče (zobrazuje se v žebříčku). |
| `email`         | VARCHAR(190), UNIQUE             | Přihlašovací e-mail, musí být unikátní. |
| `password_hash` | VARCHAR(255)                     | Bezpečný otisk hesla (bcrypt přes `password_hash`). Heslo se nikdy neukládá v čitelné podobě. |
| `created_at`    | DATETIME                         | Datum a čas registrace. |

### Tabulka `games` (dohrané hry)

| Sloupec           | Typ                                         | Význam |
|-------------------|---------------------------------------------|--------|
| `id`              | INT UNSIGNED, AUTO_INCREMENT, PK            | Jednoznačné číslo hry. |
| `user_id`         | INT UNSIGNED, FK → `users.id`               | Který hráč hru dohrál. Při smazání hráče se smažou i jeho hry (ON DELETE CASCADE). |
| `difficulty`      | ENUM('easy','medium','hard','expert')       | Obtížnost: snadná / střední / těžká / expert. |
| `elapsed_seconds` | INT UNSIGNED                                | Čas dohrání v sekundách. |
| `moves_count`     | INT UNSIGNED                                | Počet tahů hráče. |
| `hints_used`      | INT UNSIGNED                                | Počet použitých nápověd (0–3). |
| `mistakes_count`  | INT UNSIGNED                                | Počet chyb nalezených při kontrole. |
| `is_daily`        | TINYINT(1)                                  | 1 = šlo o Daily Challenge, 0 = běžná hra. |
| `finished_at`     | DATETIME                                    | Kdy byla hra dohrána. |

**Indexy:** `idx_top (difficulty, elapsed_seconds)` pro rychlé sestavení žebříčku
a `idx_user (user_id)` pro rychlé osobní statistiky.

> **Založení databáze:** Celé schéma vytvoří `install.php` (nebo ručně `database.sql`).
> Skript zakládá databázi od nuly – při spuštění nejdřív zahodí tabulky `users` a `games`
> a vytvoří je znovu v aktuální podobě. Opětovné spuštění tedy databázi kompletně resetuje
> (smaže existující data).

---

## 4. Jak funguje samotné sudoku

Sudoku je logická hra na mřížce 9×9, rozdělené do devíti bloků 3×3. Cílem je
doplnit čísla 1–9 tak, aby se žádné číslo **neopakovalo** v jednom řádku, v jednom
sloupci ani v jednom bloku 3×3. Hra nevyžaduje počítání – jen logiku, vylučování
možností a trpělivost.

Jak to řeší tato aplikace (vše v `assets/sudoku.js`):

1. **Plná mřížka** – funkce `makeFullGrid()` vytvoří kompletně a platně vyplněné
   sudoku pomocí osvědčeného „pattern" vzorce a náhodného zamíchání čísel, řádků
   a sloupců (kvůli pestrosti).
2. **Odebírání políček** – funkce `makePuzzle()` postupně odebírá políčka, ale
   odebrání ponechá jen tehdy, pokud hádanka **zůstane jednoznačně řešitelná**.
   Jednoznačnost ověřuje `countSolutions()` (backtracking s heuristikou „nejméně
   možností", který se zastaví, jakmile najde druhé řešení).
3. **Hra** – hráč zadává čísla, `validate()` průběžně zvýrazní konflikty,
   `check()` porovná desku s řešením, `hint()` doplní jedno políčko (max 3×).
   Po vyplnění celé desky se zavolá `finish()`, který uloží výsledek.

Díky kroku 2 nikdy nevznikne hádanka s více řešeními, takže hráč nemůže dostat
„správné", ale systémem odmítnuté řešení.

---

## 5. Jak funguje systém (architektura)

Aplikace má dvě části:

**Klient (prohlížeč):** Veškerá herní logika běží v JavaScriptu (`assets/sudoku.js`)
– generování hádanky, ovládání, kontrola, časomíra a statistiky. Server se tím
nezatěžuje a hra je svižná.

**Server (PHP + MySQL):** Stará se o trvalá data a bezpečnost:

- **Přihlášení a relace** – `functions.php` spravuje PHP session; `index.php`
  ověřuje heslo přes `password_verify`, `register.php` ukládá nový účet s bcrypt
  hashem, `logout.php` korektně vymaže relaci i cookie.
- **Ukládání výsledků** – po dohrání pošle JavaScript data na `save_result.php`.
  Ten **na serveru kontroluje** rozsahy hodnot a obtížnost a **odmítá** hry
  dořešené počítačem (`autosolved`), aby se nedal podvádět žebříček.
- **Žebříček a statistiky** – `top10.php` vypíše nejlepší časy a osobní přehled
  podle obtížnosti; `my_stats.php` posílá osobní statistiky zpět
  JavaScriptu jako JSON.
- **Bezpečnost** – všechny dotazy jdou přes PDO s připravenými dotazy (ochrana
  proti SQL injection), výstupy se ošetřují funkcí `e()` (ochrana proti XSS),
  hesla se ukládají jen jako hash.

**Daily Challenge:** Tlačítko spustí náhodnou hru s příznakem, který se při
dohrání uloží do sloupce `games.is_daily = 1`. Počet dohraných výzev se pak
počítá jako počet her s tímto příznakem.

**Barevné režimy:** `assets/theme.js` přepíná motiv (ukládá volbu do
`localStorage`) a obsluhuje mobilní „hamburger" menu.

---

## 6. Popis souborů

### Kořen projektu

| Soubor | K čemu slouží |
|--------|---------------|
| `index.php` | Přihlašovací stránka (e-mail + heslo). |
| `register.php` | Registrace nového hráče (ukládá bcrypt hash hesla). |
| `logout.php` | Odhlášení – vymaže relaci i session cookie. |
| `menu.php` | Hlavní rozcestník po přihlášení (rychlé statistiky, odkazy). |
| `sudoku.php` | Herní stránka (deska, panel nástrojů, statistický panel). |
| `top10.php` | Žebříček TOP 10 + osobní statistiky hráče podle obtížnosti. |
| `about.php` | „Co je Sudoku" + použité zdroje. |
| `save_result.php` | Přijme a ověří výsledek hry, uloží ho do databáze (JSON odpověď). |
| `my_stats.php` | Vrací osobní statistiky jako JSON pro JavaScript. |
| `functions.php` | Společné funkce: relace, přihlášení, převody, ošetření výstupu. |
| `config.example.php` | Vzor konfigurace – zkopírujte na `config.php` a doplňte přístupy. |
| `config.php` | Skutečné přístupy k DB a heslo do administrace. **Není v ZIPu** a nesmí se zveřejnit. |
| `install.php` | Instalátor – založí celou databázi od nuly podle `database.sql`. Po instalaci smazat. |
| `database.sql` | SQL skript se schématem databáze (pro ruční založení). |
| `README.md` | Tato dokumentace. |
| `README.txt` | Stručný návod k instalaci. |
| `OPRAVY.txt` | Seznam provedených oprav a úprav. |
| `preview.html` | Samostatný náhled vzhledu (vše v jednom souboru, bez serveru). |

### Složka `assets/`

| Soubor | K čemu slouží |
|--------|---------------|
| `sudoku.js` | Veškerá herní logika (generování, hra, kontrola, statistiky). |
| `theme.js` | Přepínání barevných režimů a mobilní menu. |
| `style.css` | Kompletní vzhled celého systému (tři motivy, responzivní). |
| `logo.png` | Logo hry. |

### Složka `admin/`

| Soubor | K čemu slouží |
|--------|---------------|
| `index.php` | Administrace – přihlášení jedním heslem z `config.php`, přehled hráčů, mazání účtů, reset statistik. |

### Složka `static/`

Čistě HTML verze hlavních stránek, které jdou spustit i bez PHP a databáze
(na ukázku vzhledu a hraní). `static/sudoku.html` je plně hratelný. Stránky
sdílejí soubory ze složky `assets`, proto je nechte uvnitř projektu.

---

## 7. Klíčové funkce v `assets/sudoku.js`

V kódu jsou všechny okomentované; zde je rychlý přehled:

- `makeFullGrid()` – vytvoří kompletně vyplněné platné sudoku.
- `countSolutions(arr, limit)` – spočítá řešení, ale zastaví se po dosažení `limit`
  (stačí zjistit, zda je řešení jediné).
- `makePuzzle(level)` – z plné mřížky odebere políčka tak, aby zůstala jednoznačnost.
- `render(puz)` – vykreslí desku 9×9 a navěsí ovládání.
- `validate()` – zvýrazní konflikty (stejné číslo v řádku/sloupci/bloku).
- `hint()` – doplní jedno políčko; na hru je limit 3 nápověd.
- `refreshHintButton()` – obnoví popisek a dostupnost tlačítka nápovědy.
- `check()` – porovná desku s řešením a označí chybná políčka.
- `autoSolve()` – počítač postupně dořeší desku (taková hra se neukládá).
- `finish(viaAuto)` – ukončí hru a (kromě autosolve) uloží výsledek.
- `startGame(daily)` / `newGame()` / `dailyChallenge()` – příprava nové hry / denní výzvy.
- `updateLiveStats()` – přepočet živých statistik v bočním panelu.
- `loadDbStats()` / `renderDifficultyStats()` – načtení a zobrazení osobních statistik z `my_stats.php`.

---

## 8. Instalace

1. Nahrajte obsah projektu na server s PHP 7.3+ a MySQL/MariaDB.
2. Zkopírujte `config.example.php` na `config.php` a doplňte přístupy k databázi
   a heslo do administrace (`$admin_password`).
3. Otevřete v prohlížeči `install.php` (založí tabulky), pak ho **smažte**.
4. Otevřete `index.php`, zaregistrujte účet a hrajte.
5. Administrace je ve složce `/admin/` (heslo z `config.php`).

> Soubor `config.php` záměrně není součástí balíčku, aby se při aktualizaci
> nepřepsaly ostré přístupy k databázi.
