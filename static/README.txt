STATICKÝ NÁHLED (bez PHP a databáze)
====================================
Tyto stránky jsou čistě HTML a fungují i bez serveru – stačí otevřít soubor
v prohlížeči (dvojklik). Začněte souborem index.html.

  index.html     – přihlášení (formulář je jen na ukázku, vede do menu.html)
  menu.html      – hlavní rozcestník
  sudoku.html    – PLNĚ HRATELNÁ hra (generování, nápovědy, Daily Challenge…)
  top10.html     – žebříček s ukázkovými daty
  about.html     – co je Sudoku + použité zdroje
  register.html  – registrace (ukázka)

Poznámky:
- Statistiky a žebříček obsahují SMYŠLENÁ ukázková data (žádná databáze).
- Stránky používají sdílené soubory ze složky ../assets, proto tuto složku
  „static" nechte uvnitř projektu vedle složky „assets".
- Pro plný provoz s ukládáním výsledků použijte PHP verzi v kořeni projektu.
