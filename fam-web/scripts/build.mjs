import {loadVault,saveVault} from './vault.mjs';
import {scan,build} from './library.mjs';
const v=await loadVault();await saveVault(v);await scan(v);console.log(JSON.stringify(await build(v),null,2));
console.log('Локальный экспорт готов. Публикация не выполнялась.');
