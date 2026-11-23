/* Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz */
// assets/sudoku.js
// Herní logika Sudoku (běží celá v prohlížeči; výsledky ukládá save_result.php).
// Hlavní vlastnosti:
//  - generátor tvoří hádanky se ZARUČENĚ jedním řešením (uniqueness),
//  - počítání chyb se nenafukuje při opakované kontrole,
//  - automatické vyřešení se NEukládá do žebříčku,
//  - na jednu hru jsou nejvýše 3 nápovědy (pak je tlačítko nedostupné),
//  - Daily Challenge: náhodná hra, jejíž dokončení se počítá zvlášť.

(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', function(){
    var boardEl = document.getElementById('board');
    if (!boardEl) { return; }

    var diffEl = document.getElementById('difficulty');
    var newBtn = document.getElementById('new');
    var checkBtn = document.getElementById('check');
    var hintBtn = document.getElementById('hint');
    var autoBtn = document.getElementById('autoSolve');
    var timerEl = document.getElementById('timer');
    var progressBar = document.getElementById('progressBar');
    var donePercent = document.getElementById('donePercent');
    var filledCount = document.getElementById('filledCount');
    var remainingMoves = document.getElementById('remainingMoves');
    var possibleSteps = document.getElementById('possibleSteps');
    var movesCount = document.getElementById('movesCount');
    var mistakesCount = document.getElementById('mistakesCount');
    var hintsUsedEl = document.getElementById('hintsUsed');
    var dbStats = document.getElementById('dbStats');
    var dailyBtn = document.getElementById('daily');         // tlačítko Daily Challenge
    var dailyDoneEl = document.getElementById('dailyDone');  // počet dohraných výzev
    var diffStatsEl = document.getElementById('diffStats');  // přehled her podle obtížnosti

    var solution = '';
    var puzzle = '';
    var given = [];
    var startedAt = null;
    var timer = null;
    var solved = false;
    var autoSolved = false;          // hra dořešena počítačem -> neukládáme do žebříčku
    var moves = 0;
    var hints = 0;
    var mistakes = 0;
    var countedMistakes = {};        // ať se stejná chyba nepočítá při každém kliknutí znovu
    var autoTimer = null;
    var selectedInput = null;        // aktuálně vybrané políčko (pro číselník)
    var isDaily = false;             // je rozehraná hra Daily Challenge?
    var HINT_LIMIT = 3;              // nejvýše 3 nápovědy na jednu hru

    var DIFF = { easy: 40, medium: 32, hard: 26, expert: 22 };
    // Kolik polí se nejvýš pokusíme odstranit. Vyšší = těžší (méně nápověd),
    // ale uniqueness je vždy zachována, takže hádanka je vždy řešitelná logikou.
    var REMOVE_TARGET = { easy: 41, medium: 49, hard: 54, expert: 64 };

    // ---- Drobné pomocné funkce ----
    function rand(max){ return Math.floor(Math.random() * max); }   // náhodné celé číslo 0..max-1

    // Náhodně zamíchá pole (Fisher–Yates). Slouží k variabilitě generovaných hádanek.
    function shuffle(arr){
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = rand(i + 1);
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function pad2(n){ return n < 10 ? '0' + n : String(n); }   // doplní nulu (5 -> "05")
    function fmt(sec){ sec = parseInt(sec, 10) || 0; return pad2(Math.floor(sec / 60)) + ':' + pad2(sec % 60); }  // sekundy -> MM:SS
    function row(i){ return Math.floor(i / 9); }               // řádek políčka 0..8 (index 0..80)
    function col(i){ return i % 9; }                           // sloupec políčka 0..8
    function boxOf(i){ return Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3); }  // číslo bloku 3x3 (0..8)

    // Vrátí zvolenou obtížnost z rozbalovací nabídky (výchozí 'easy').
    function getDifficulty(){
      return diffEl && DIFF[diffEl.value] ? diffEl.value : 'easy';
    }

    // Vytvoří vždy platně vyplněné sudoku pomocí osvědčeného „pattern" vzorce.
    function makeFullGrid(){
      var numbers = shuffle([1,2,3,4,5,6,7,8,9]);
      var bandOrder = shuffle([0,1,2]);
      var stackOrder = shuffle([0,1,2]);
      var rows = [];
      var cols = [];
      var i, j;

      for (i = 0; i < 3; i++) {
        var band = bandOrder[i];
        var innerRows = shuffle([0,1,2]);
        for (j = 0; j < 3; j++) { rows.push(band * 3 + innerRows[j]); }
      }
      for (i = 0; i < 3; i++) {
        var stack = stackOrder[i];
        var innerCols = shuffle([0,1,2]);
        for (j = 0; j < 3; j++) { cols.push(stack * 3 + innerCols[j]); }
      }

      var grid = [];
      for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
          var pattern = (rows[r] * 3 + Math.floor(rows[r] / 3) + cols[c]) % 9;
          grid.push(numbers[pattern]);
        }
      }
      return grid;
    }

    // Počítá řešení hádanky, ale zastaví se hned po dosažení `limit` (stačí nám zjistit, zda je 1 nebo víc).
    // Používá heuristiku „nejméně možností" (MRV), aby byl rychlý i u těžkých hádanek.
    function countSolutions(arr, limit){
      var b = arr.slice();
      var count = 0;

      function solve(){
        if (count >= limit) { return; }
        var pos = -1, best = 10, bestCand = null;
        for (var i = 0; i < 81; i++) {
          if (b[i] !== 0) { continue; }
          var r = Math.floor(i / 9), c = i % 9;
          var used = {};
          for (var k = 0; k < 9; k++) { used[b[r * 9 + k]] = 1; used[b[k * 9 + c]] = 1; }
          var sr = Math.floor(r / 3) * 3, sc = Math.floor(c / 3) * 3;
          for (var rr = 0; rr < 3; rr++) {
            for (var cc = 0; cc < 3; cc++) { used[b[(sr + rr) * 9 + (sc + cc)]] = 1; }
          }
          var cand = [];
          for (var n = 1; n <= 9; n++) { if (!used[n]) { cand.push(n); } }
          if (cand.length < best) { best = cand.length; pos = i; bestCand = cand; if (best === 0) { break; } }
        }
        if (pos === -1) { count++; return; }      // vše vyplněno = jedno řešení
        if (best === 0) { return; }                // slepá ulička
        for (var x = 0; x < bestCand.length; x++) {
          b[pos] = bestCand[x];
          solve();
          b[pos] = 0;
          if (count >= limit) { return; }
        }
      }

      solve();
      return count;
    }

    // Vyrobí hádanku se ZARUČENĚ jedním řešením.
    function makePuzzle(level){
      var full = makeFullGrid();
      solution = full.join('');

      var puz = full.slice();
      var order = shuffle(full.map(function(_, k){ return k; }));
      var target = REMOVE_TARGET[level] || REMOVE_TARGET.easy;
      var removed = 0;

      for (var i = 0; i < order.length && removed < target; i++) {
        var idx = order[i];
        var backup = puz[idx];
        if (backup === 0) { continue; }
        puz[idx] = 0;
        if (countSolutions(puz, 2) !== 1) {
          puz[idx] = backup;     // odebráním by vzniklo víc řešení -> vrátíme zpět
        } else {
          removed++;
        }
      }

      puzzle = puz.join('');
      return puzzle;
    }

    // Spustí stopky při úplně prvním tahu (dřív stojí na 00:00).
    function startTimer(){
      if (timer) { return; }
      startedAt = Date.now();
      timer = setInterval(function(){
        if (timerEl) { timerEl.textContent = fmt(Math.floor((Date.now() - startedAt) / 1000)); }
      }, 250);
    }

    // Zastaví stopky (po dohrání hry).
    function stopTimer(){
      if (timer) { clearInterval(timer); }
      timer = null;
    }

    // Vrátí uplynulý čas v sekundách (nejméně 1).
    function elapsed(){ return startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 1; }

    // Vrátí všech 81 vstupních políček desky jako pole.
    function allInputs(){
      return Array.prototype.slice.call(boardEl.querySelectorAll('input.digit'));
    }

    // Aktuální stav desky jako 81znakový řetězec ('0' = prázdné). Slouží k porovnání s řešením.
    function gridStr(){
      var arr = allInputs();
      var out = '';
      for (var i = 0; i < 81; i++) { out += arr[i] && arr[i].value ? arr[i].value : '0'; }
      return out;
    }

    // Zruší červené zvýraznění chybných políček z poslední kontroly.
    function clearBad(){
      var cells = boardEl.querySelectorAll('.bad');
      for (var i = 0; i < cells.length; i++) { cells[i].classList.remove('bad'); }
    }

    // Bezpečně nastaví hodnotu políčka – povolí jen jednu číslici 1–9.
    function setCellValue(input, value){
      var v = String(value || '').replace(/[^1-9]/g, '');
      input.value = v ? v.charAt(v.length - 1) : '';
    }

    // Zvýraznění: vybrané políčko a jeho řádek/sloupec/blok (peer).
    function highlight(){
      var ins = allInputs();
      for (var i = 0; i < ins.length; i++) {
        var cell = ins[i].parentNode;
        cell.classList.remove('selected', 'peer');
      }
      if (!selectedInput) { return; }
      var sel = parseInt(selectedInput.getAttribute('data-index'), 10);
      if (isNaN(sel)) { return; }
      for (i = 0; i < 81; i++) {
        var c = ins[i].parentNode;
        if (i === sel) { c.classList.add('selected'); }
        else if (row(i) === row(sel) || col(i) === col(sel) || boxOf(i) === boxOf(sel)) { c.classList.add('peer'); }
      }
    }

    // Vykreslí mřížku 9×9 z textového zápisu hádanky a navěsí ovládání na každé políčko.
    function render(puz){
      boardEl.innerHTML = '';
      boardEl.classList.remove('is-generating');
      given = [];
      selectedInput = null;
      for (var i = 0; i < 81; i++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-index', String(i));

        var input = document.createElement('input');
        input.className = 'digit';
        input.type = 'text';
        input.maxLength = 1;
        input.setAttribute('data-index', String(i));
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[1-9]');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('aria-label', 'Políčko ' + (i + 1));

        var ch = puz && puz.length === 81 ? puz.charAt(i) : '0';
        if (ch && ch !== '0') {
          input.value = ch;
          input.readOnly = true;
          input.className += ' prefilled';
          given[i] = true;
        } else {
          input.value = '';
          given[i] = false;
        }

        (function(index, inp){
          inp.addEventListener('focus', function(){ selectedInput = inp; highlight(); });

          inp.addEventListener('beforeinput', function(e){
            if (inp.readOnly) { e.preventDefault(); return; }
            if (e.data && !/^[1-9]+$/.test(e.data)) { e.preventDefault(); }
          });

          inp.addEventListener('input', function(){
            if (inp.readOnly) { return; }
            startTimer();
            var old = inp.getAttribute('data-last') || '';
            setCellValue(inp, inp.value);
            var now = inp.value;
            if (old !== now && now !== '') { moves++; }
            inp.setAttribute('data-last', now);
            clearBad();
            highlight();
            updateLiveStats();
            if (gridStr() === solution) { finish(false); }
          });

          inp.addEventListener('paste', function(e){
            if (inp.readOnly) { e.preventDefault(); return; }
            e.preventDefault();
            var text = (e.clipboardData || window.clipboardData).getData('text') || '';
            setCellValue(inp, text);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          });

          inp.addEventListener('keydown', function(e){
            if ((e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') && !inp.readOnly) {
              if (e.key === '0') { e.preventDefault(); }
              inp.value = '';
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              return;
            }
            var next = null;
            if (e.key === 'ArrowUp') { next = index - 9; }
            if (e.key === 'ArrowDown') { next = index + 9; }
            if (e.key === 'ArrowLeft' && col(index) > 0) { next = index - 1; }
            if (e.key === 'ArrowRight' && col(index) < 8) { next = index + 1; }
            if (next !== null && next >= 0 && next < 81) {
              e.preventDefault();
              var inputs = allInputs();
              if (inputs[next]) { inputs[next].focus(); inputs[next].select(); }
            }
          });
        })(i, input);

        cell.appendChild(input);
        boardEl.appendChild(cell);
      }
      updateLiveStats();
    }

    // Spočítá, kolik prázdných políček má aktuálně jen jedinou možnou číslici (nápověda o postupu).
    function countPossibleSteps(){
      var g = gridStr();
      var count = 0;
      for (var i = 0; i < 81; i++) {
        if (g.charAt(i) !== '0') { continue; }
        var used = {};
        var r = row(i), c = col(i);
        for (var x = 0; x < 9; x++) {
          used[g.charAt(r * 9 + x)] = true;
          used[g.charAt(x * 9 + c)] = true;
        }
        var sr = Math.floor(r / 3) * 3;
        var sc = Math.floor(c / 3) * 3;
        for (var rr = 0; rr < 3; rr++) {
          for (var cc = 0; cc < 3; cc++) { used[g.charAt((sr + rr) * 9 + (sc + cc))] = true; }
        }
        var opts = 0;
        for (var n = 1; n <= 9; n++) { if (!used[String(n)]) { opts++; } }
        if (opts === 1) { count++; }
      }
      return count;
    }

    // Přepočítá a zobrazí živé statistiky (procenta, vyplněno, tahy, chyby, nápovědy…).
    function updateLiveStats(){
      var g = gridStr();
      var filled = 0;
      for (var i = 0; i < 81; i++) { if (g.charAt(i) !== '0') { filled++; } }
      var percent = Math.round((filled / 81) * 100);
      if (progressBar) { progressBar.style.width = percent + '%'; }
      if (donePercent) { donePercent.textContent = percent + ' %'; }
      if (filledCount) { filledCount.textContent = String(filled); }
      if (remainingMoves) { remainingMoves.textContent = String(81 - filled); }
      if (possibleSteps) { possibleSteps.textContent = String(countPossibleSteps()); }
      if (movesCount) { movesCount.textContent = String(moves); }
      if (mistakesCount) { mistakesCount.textContent = String(mistakes); }
      if (hintsUsedEl) { hintsUsedEl.textContent = String(hints); }
      refreshHintButton();
    }

    // Popisek tlačítka nápovědy ukazuje, kolik nápověd ještě zbývá: (3), (2), (1).
    // Po vyčerpání (nebo po dořešení) tlačítko zešedne a nejde na něj kliknout.
    function refreshHintButton(){
      if (!hintBtn) { return; }
      var left = Math.max(0, HINT_LIMIT - hints);
      hintBtn.textContent = 'Nápověda (' + left + ')';
      hintBtn.disabled = (left === 0 || solved);
    }

    // Doplní jedno náhodné prázdné políčko správným číslem.
    // Na jednu hru jsou povoleny nejvýše 3 nápovědy; pak je nutné spustit novou hru.
    function hint(){
      if (solved) { return; }
      if (hints >= HINT_LIMIT) {                 // limit vyčerpán -> nic nedělej
        toast('Využil(a) jste všechny 3 nápovědy. Spusťte novou hru.');
        refreshHintButton();
        return;
      }
      startTimer();
      var ins = allInputs();
      var empty = [];
      for (var i = 0; i < 81; i++) { if (ins[i] && !ins[i].value && !given[i]) { empty.push(i); } }
      if (!empty.length) { return; }
      var idx = empty[rand(empty.length)];
      ins[idx].value = solution.charAt(idx);
      ins[idx].setAttribute('data-last', ins[idx].value);
      hints++;
      moves++;
      clearBad();
      highlight();
      updateLiveStats();
      if (gridStr() === solution) { finish(false); }
    }

    // Porovná vyplněná políčka s řešením a chybná označí. Každou chybu počítá jen jednou.
    function check(){
      if (solved) { return; }
      var ins = allInputs();
      var cells = boardEl.querySelectorAll('.cell');
      clearBad();
      var ok = true;
      var wrong = 0;
      for (var i = 0; i < 81; i++) {
        if (!ins[i]) { continue; }
        if (ins[i].value !== solution.charAt(i)) {
          ok = false;
          if (ins[i].value) {
            if (cells[i]) { cells[i].classList.add('bad'); }
            wrong++;
            // každou chybu počítáme jen jednou, ne při každém kliknutí znovu
            if (!countedMistakes[i]) { countedMistakes[i] = true; mistakes++; }
          }
        } else {
          delete countedMistakes[i];   // políčko je teď správně
        }
      }
      updateLiveStats();
      if (ok) { finish(false); }
      else { toast(wrong === 0 ? 'Zatím nic chybného, jen doplňte zbytek.' : 'Nalezeno chybných políček: ' + wrong); }
    }

    // Počítač postupně doplní celé řešení. Takto „vyřešená" hra se NEukládá do žebříčku.
    function autoSolve(){
      if (solved) { return; }
      startTimer();
      autoSolved = true;
      if (autoTimer) { clearInterval(autoTimer); }
      autoTimer = setInterval(function(){
        var ins = allInputs();
        var did = false;
        for (var i = 0; i < 81; i++) {
          if (ins[i] && !ins[i].value) {
            ins[i].value = solution.charAt(i);
            ins[i].setAttribute('data-last', ins[i].value);
            did = true;
            break;
          }
        }
        clearBad();
        updateLiveStats();
        if (!did || gridStr() === solution) {
          clearInterval(autoTimer);
          autoTimer = null;
          finish(true);
        }
      }, 70);
    }

    // Ukončí hru: zastaví čas a (kromě dořešení počítačem) uloží výsledek do databáze.
    // U Daily Challenge přidá příznak is_daily, podle kterého se počítají dohrané výzvy.
    function finish(viaAuto){
      if (solved) { return; }
      solved = true;
      stopTimer();
      refreshHintButton();
      var secs = elapsed();

      // Hru dořešenou počítačem do žebříčku neukládáme (jinak by šel snadno podvést).
      if (viaAuto || autoSolved) {
        showWinModal(secs, true);
        return;
      }

      var data = new FormData();
      data.append('difficulty', getDifficulty());
      data.append('elapsed_seconds', secs);
      data.append('moves_count', moves);
      data.append('hints_used', hints);
      data.append('mistakes_count', mistakes);
      data.append('is_daily', isDaily ? '1' : '0');
      fetch('save_result.php', { method: 'POST', body: data })
        .then(function(r){ return r.json(); })
        .then(function(j){
          loadDbStats();
          var msg = '';
          if (j && j.ok === false) { msg = j.message || ''; }
          else if (isDaily) { msg = 'Daily Challenge dokončena a započítána do tabulky vyřešeno.'; }
          showWinModal(secs, false, msg);
        })
        .catch(function(){ showWinModal(secs, false, 'Výsledek se nepodařilo uložit do databáze.'); });
    }

    // Připraví novou hru. Parametr daily určuje, zda jde o Daily Challenge.
    function startGame(daily){
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      stopTimer();
      if (timerEl) { timerEl.textContent = '00:00'; }
      startedAt = null;
      solved = false;
      autoSolved = false;
      isDaily = !!daily;
      moves = 0;
      hints = 0;          // nová hra = znovu 3 nápovědy
      mistakes = 0;
      countedMistakes = {};
      closeModal();
      refreshHintButton();

      // Daily Challenge = náhodná obtížnost, ať je výzva pokaždé jiná.
      if (isDaily && diffEl) {
        var diffs = ['easy','medium','hard','expert'];
        diffEl.value = diffs[rand(diffs.length)];
        toast('Daily Challenge: ' + diffName(getDifficulty()) + ' — hodně štěstí!');
      }

      // U těžších obtížností může generování chvilku trvat, proto ukážeme stav.
      boardEl.classList.add('is-generating');
      boardEl.setAttribute('data-generating', daily ? 'Připravuji Daily Challenge…' : 'Generuji hádanku…');
      setTimeout(function(){
        render(makePuzzle(getDifficulty()));
      }, 20);
    }

    function newGame(){ startGame(false); }          // běžná nová hra
    function dailyChallenge(){ startGame(true); }    // náhodná denní výzva

    // ---- Hezké okno místo alertu ----
    function ensureModal(){
      if (document.getElementById('winModal')) { return; }
      var ov = document.createElement('div');
      ov.id = 'winModal';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="winTitle">' +
          '<h2 id="winTitle">Hotovo!</h2>' +
          '<p id="winText" class="small"></p>' +
          '<div id="winStats" class="modal-stats"></div>' +
          '<div class="modal-actions">' +
            '<button type="button" id="winNew">Nová hra</button>' +
            '<button type="button" id="winClose" class="ghost">Zavřít</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function(e){ if (e.target === ov) { closeModal(); } });
      document.getElementById('winNew').addEventListener('click', newGame);
      document.getElementById('winClose').addEventListener('click', closeModal);
    }

    // Zobrazí výherní okno se souhrnem (čas, obtížnost, tahy, nápovědy, chyby).
    function showWinModal(secs, viaAuto, warn){
      ensureModal();
      var ov = document.getElementById('winModal');
      document.getElementById('winTitle').textContent = viaAuto ? 'Vyřešeno počítačem' : 'Vyřešeno!';
      document.getElementById('winText').textContent = viaAuto
        ? 'Hru dořešil počítač, proto se výsledek neukládá do žebříčku.'
        : (warn ? warn : 'Skvělá práce. Výsledek byl uložen do databáze.');
      document.getElementById('winStats').innerHTML =
        '<span>Čas <strong>' + fmt(secs) + '</strong></span>' +
        '<span>Obtížnost <strong>' + diffName(getDifficulty()) + '</strong></span>' +
        '<span>Tahy <strong>' + moves + '</strong></span>' +
        '<span>Nápovědy <strong>' + hints + '</strong></span>' +
        '<span>Chyby <strong>' + mistakes + '</strong></span>';
      ov.classList.add('open');
    }

    // Zavře výherní okno.
    function closeModal(){
      var ov = document.getElementById('winModal');
      if (ov) { ov.classList.remove('open'); }
    }

    // Přeloží kód obtížnosti na český název.
    function diffName(d){
      var n = { easy:'Snadná', medium:'Střední', hard:'Těžká', expert:'Expert' };
      return n[d] || d;
    }

    // Krátká plovoucí hláška dole uprostřed (např. počet chyb).
    function toast(text){
      var t = document.getElementById('toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast';
        document.body.appendChild(t);
      }
      t.textContent = text;
      t.classList.add('show');
      clearTimeout(t._t);
      t._t = setTimeout(function(){ t.classList.remove('show'); }, 2200);
    }

    // Vypíše počet odehraných her a nejlepší čas pro každou obtížnost.
    function renderDifficultyStats(by){
      if (!diffStatsEl) { return; }
      var order = ['easy','medium','hard','expert'];
      var label = { easy:'Snadná', medium:'Střední', hard:'Těžká', expert:'Expert' };
      var cnt = {}, best = {};
      for (var i = 0; i < by.length; i++) { cnt[by[i].difficulty] = by[i].pocet; best[by[i].difficulty] = by[i].best; }
      var html = '';
      for (var k = 0; k < order.length; k++) {
        var d = order[k];
        var c = parseInt(cnt[d] || 0, 10);
        var b = best[d] ? fmt(parseInt(best[d], 10)) : '—';
        html += label[d] + ': <strong>' + c + '</strong> her, nejlepší <strong>' + b + '</strong><br>';
      }
      diffStatsEl.innerHTML = html;
    }

    // Načte osobní statistiky z my_stats.php (souhrn a počet Daily Challenge).
    function loadDbStats(){
      fetch('my_stats.php')
        .then(function(r){ return r.json(); })
        .then(function(j){
          if (!j || !j.ok) { if (dbStats) { dbStats.textContent = 'Statistiky nejsou dostupné.'; } return; }
          var total = j.total || {};
          var html = 'Dohrané hry: <strong>' + String(total.total || 0) + '</strong><br>' +
            'Nejlepší čas: <strong>' + (total.best ? fmt(parseInt(total.best, 10)) : '—') + '</strong><br>' +
            'Průměrný čas: <strong>' + (total.avgtime ? fmt(parseInt(total.avgtime, 10)) : '—') + '</strong>';
          if (dbStats) { dbStats.innerHTML = html; }
          if (dailyDoneEl) { dailyDoneEl.textContent = String(j.dailyDone || 0); }
          renderDifficultyStats(j.byDifficulty || []);
        })
        .catch(function(){ if (dbStats) { dbStats.textContent = 'Statistiky se nepodařilo načíst.'; } });
    }

    if (newBtn) { newBtn.addEventListener('click', newGame); }
    if (diffEl) { diffEl.addEventListener('change', newGame); }
    if (checkBtn) { checkBtn.addEventListener('click', check); }
    if (hintBtn) { hintBtn.addEventListener('click', hint); }
    if (autoBtn) { autoBtn.addEventListener('click', autoSolve); }
    if (dailyBtn) { dailyBtn.addEventListener('click', dailyChallenge); }

    ensureModal();
    loadDbStats();
    newGame();
  });
})();
