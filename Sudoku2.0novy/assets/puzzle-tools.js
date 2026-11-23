(() => {
  const type = document.body.dataset.puzzle;
  const status = document.getElementById('puzzleStatus');
  const grid = document.getElementById('puzzleGrid');
  if (!grid) return;
  const download = (name, obj) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  if (type === 'create-nonogram') {
    const cells = Array(100).fill(false);
    for(let i=0;i<100;i++){
      const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Řádek ${Math.floor(i/10)+1}, sloupec ${i%10+1}`);b.setAttribute('aria-pressed','false');
      b.addEventListener('click',()=>{cells[i]=!cells[i];b.classList.toggle('filled',cells[i]);b.setAttribute('aria-pressed',String(cells[i]));});grid.append(b);
    }
    document.getElementById('clearPuzzle').addEventListener('click',()=>{cells.fill(false);grid.querySelectorAll('button').forEach(b=>{b.classList.remove('filled');b.setAttribute('aria-pressed','false');});status.textContent='Mřížka vymazána.';});
    document.getElementById('savePuzzle').addEventListener('click',()=>{const matrix=Array.from({length:10},(_,r)=>cells.slice(r*10,(r+1)*10).map(Number));download('muj-nonogram.json',{type:'nonogram',size:10,grid:matrix});status.textContent='Hádanka byla stažena ve formátu JSON.';});
  }
  if(type==='create-sudoku'){
    const inputs=[];
    for(let i=0;i<81;i++){const el=document.createElement('input');el.inputMode='numeric';el.maxLength=1;el.setAttribute('aria-label',`Řádek ${Math.floor(i/9)+1}, sloupec ${i%9+1}`);el.addEventListener('input',()=>{el.value=el.value.replace(/[^1-9]/g,'').slice(-1);status.textContent='';});grid.append(el);inputs.push(el);}
    document.getElementById('clearPuzzle').addEventListener('click',()=>{inputs.forEach(e=>e.value='');status.textContent='Mřížka vymazána.';});
    document.getElementById('savePuzzle').addEventListener('click',()=>{const vals=inputs.map(e=>Number(e.value)||0);const valid=group=>{const nums=group.filter(Boolean);return new Set(nums).size===nums.length;};
      for(let i=0;i<9;i++){if(!valid(vals.slice(i*9,i*9+9))||!valid(Array.from({length:9},(_,r)=>vals[r*9+i]))){status.textContent='Chyba: opakující se číslo v řádku nebo sloupci.';return;}}
      for(let r=0;r<9;r+=3)for(let c=0;c<9;c+=3){if(!valid(Array.from({length:9},(_,k)=>vals[(r+Math.floor(k/3))*9+c+k%3]))){status.textContent='Chyba: opakující se číslo v bloku 3 × 3.';return;}}
      download('moje-sudoku.json',{type:'sudoku',size:9,grid:Array.from({length:9},(_,r)=>vals.slice(r*9,r*9+9))});status.textContent='Zadání bylo staženo ve formátu JSON.';
    });
  }
  if(type==='play-nonogram'){
    const size=5, solution=[0,1,1,1,0,1,0,0,0,1,1,0,1,0,1,1,0,0,0,1,0,1,1,1,0], player=Array(25).fill(0);
    const clues=(nums)=>{const out=[];let run=0;for(const n of [...nums,0]){if(n)run++;else if(run){out.push(run);run=0;}}return out.length?out.join('\n'):'0';};
    grid.append(document.createElement('div'));
    for(let c=0;c<size;c++){const el=document.createElement('div');el.className='clue';el.textContent=clues(Array.from({length:size},(_,r)=>solution[r*size+c]));grid.append(el);}
    for(let r=0;r<size;r++){
      const clue=document.createElement('div');clue.className='clue';clue.textContent=clues(solution.slice(r*size,r*size+size)).replaceAll('\n',' ');grid.append(clue);
      for(let c=0;c<size;c++){const i=r*size+c;const el=document.createElement('button');el.className='cell';el.type='button';el.setAttribute('aria-label',`Řádek ${r+1}, sloupec ${c+1}`);
        el.addEventListener('click',e=>{player[i]=(player[i]+1)%3;el.classList.toggle('filled',player[i]===1);el.classList.toggle('marked',player[i]===2);if(player.every((v,j)=>(v===1)===(solution[j]===1)))status.textContent='Výborně! Nonogram je vyřešený.';else status.textContent='';});grid.append(el);
      }
    }
    document.getElementById('clearPuzzle').addEventListener('click',()=>{player.fill(0);grid.querySelectorAll('.cell').forEach(el=>el.className='cell');status.textContent='Mřížka vymazána.';});
  }
})();
