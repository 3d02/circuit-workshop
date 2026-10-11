import {$} from './ui.js';
import {atlas} from './atlas.js';
import {lab,cleanupLab} from './lab.js';
import {solder,meter} from './practice.js';
import {path} from './path.js';
function route(){cleanupLab();const [raw,id]=location.hash.slice(1).split('/');const page=['explore','lab','solder','meter','path'].includes(raw)?raw:'explore';document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===page);if(a.dataset.nav===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});const main=$('#main');main.onclick=null;main.oninput=null;main.onchange=null;main.onkeydown=null;({explore:()=>atlas(id),lab:()=>lab(id),solder,meter,path})[page]();document.title=({explore:'Component Atlas',lab:'Circuit Lab',solder:'Soldering',meter:'Multimeter',path:'Your Learning Path'})[page]+' — Circuit Workshop';window.scrollTo(0,0)}
window.addEventListener('hashchange',route);route();
