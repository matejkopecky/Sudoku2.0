/* Offline ukládání výsledků Sudoku do localStorage. */
(function(){
  const KEY='sudoku2_local_results';
  function all(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}}
  function reply(value){return Promise.resolve({ok:true,json:()=>Promise.resolve(value)});}
  window.fetch=function(url,opts){
    url=String(url);
    if(url.includes('save_result.php')){
      try {
        const entry=Object.fromEntries(opts.body.entries());
        entry.elapsed_seconds=Number(entry.elapsed_seconds)||0;
        entry.moves_count=Number(entry.moves_count)||0;
        entry.hints_used=Number(entry.hints_used)||0;
        entry.mistakes_count=Number(entry.mistakes_count)||0;
        entry.finished_at=new Date().toISOString();
        const items=all();items.push(entry);localStorage.setItem(KEY,JSON.stringify(items));
        return reply({ok:true,saved:true});
      }catch(e){return reply({ok:false,message:'Prohlížeč nepovolil místní uložení.'})}
    }
    if(url.includes('my_stats.php')){
      const items=all();const times=items.map(x=>x.elapsed_seconds).filter(x=>x>0);
      const byDifficulty=['easy','medium','hard','expert'].map(d=>{
        const group=items.filter(x=>x.difficulty===d);
        return {difficulty:d,pocet:group.length,best:group.length?Math.min(...group.map(x=>x.elapsed_seconds)):null};
      });
      return reply({ok:true,total:{total:items.length,best:times.length?Math.min(...times):null,avgtime:times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):null},dailyDone:items.filter(x=>x.is_daily==='1').length,byDifficulty,recent:items.slice(-10).reverse()});
    }
    return Promise.reject(new Error('Offline režim: nepodporovaný požadavek '+url));
  };
})();
