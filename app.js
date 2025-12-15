// =================================================================
// LOGIQUE DE L'APPLICATION (Refonte Catalogue)
// =================================================================
let blocId = 0;
let currentBlocForCatalog = null; // Mémorise quel bloc a demandé l'ouverture du catalogue

document.addEventListener('DOMContentLoaded', () => {
  // Chargement des données sauvegardées
  try {
    const savedData = localStorage.getItem('devisData');
    const parsedData = savedData ? JSON.parse(savedData) : null;
    
    if (parsedData && parsedData.length > 0) {
        loadFromJSON(savedData);
    } else {
        ajouterBloc(true, true); 
    }
  } catch (e) {
    ajouterBloc(true, true);
  }
  
  // Génération initiale du catalogue (pour qu'il soit prêt)
  renderCatalog();
  checkEmptyState();
  recalculer();
});

// =================================================================
// SYSTÈME DE CATALOGUE (NOUVEAU)
// =================================================================

function openCatalog(btn) {
    // 1. On mémorise quel bloc a demandé l'ouverture (c'est instantané)
    currentBlocForCatalog = btn.closest('.bloc');
    
    // 2. On attend un tout petit peu (10ms) pour laisser le navigateur finir de gérer le clic
    // avant de lancer la lourde tâche d'afficher le gros catalogue.
    setTimeout(() => {
        document.getElementById('catalog-overlay').classList.add('show');
    }, 10);
}


function closeCatalog() {
    document.getElementById('catalog-overlay').classList.remove('show');
    currentBlocForCatalog = null;
}

// Cherche la fonction renderCatalog() et remplace-la par ceci :
// Remplace la fonction renderCatalog() dans app.js
function renderCatalog() {
    const container = document.getElementById('catalog-content');
    if (!container || container.innerHTML.trim() !== "") return; 

    let html = '';

    // --- CONFIGURATION VISUELLE (Icônes & Couleurs) ---
    const catalogStyles = {
        'Print':      { icon: '🖨️', color: '#eef6fc', border: '#b6dbf5' }, // Bleu très clair
        'Paper':      { icon: '📄', color: '#fff8e1', border: '#ffe082' }, // Jaune crème
        'Finishing':  { icon: '✂️',  color: '#e8f5e9', border: '#a5d6a7' }, // Vert menthe
        'Lamination': { icon: '🛡️',  color: '#f3e5f5', border: '#ce93d8' }, // Violet clair
        'Plan':       { icon: '📐', color: '#e0f7fa', border: '#80deea' }, // Cyan
        'Big size':   { icon: '🖼️', color: '#fff3e0', border: '#ffcc80' }, // Orange clair
        'Binding':    { icon: '📒', color: '#fbe9e7', border: '#ffab91' }, // Rouge doux
        'Special':    { icon: '✨',  color: '#f5f5f5', border: '#e0e0e0' }  // Gris
    };

    // --- 1. SECTION SPECIALE : DIVERS / MANUEL ---
    html += `<div class="cat-section" style="background-color: #ffffff; border: 2px dashed var(--accent-color);">`;
    html += `<div class="cat-title" style="color: var(--accent-color);">⚡ Divers / Manuel</div>`;
    html += `<div class="type-group">`;
    html += `<button class="btn-service" style="width:100%; font-weight:bold; padding:15px; background-color:var(--secondary-color);" onclick="selectServiceFromCatalog('Custom', '', '')">
                ➕ Ajouter ligne vierge (Description libre)
             </button>`;
    html += `</div></div>`;
    
    // --- 2. BOUCLE SUR LES SERVICES EXISTANTS ---
    for (const [catName, catData] of Object.entries(window.services)) {
        // Récupération du style ou valeur par défaut
        const style = catalogStyles[catName] || { icon: '📦', color: '#ffffff', border: '#e0e0e0' };
        
        // Application du style (Fond + Bordure colorée)
        html += `<div class="cat-section" style="background-color: ${style.color}; border: 1px solid ${style.border};">`;
        
        // Titre avec l'icône
        html += `<div class="cat-title">
                    <span style="font-size: 1.4em; margin-right: 8px; vertical-align: middle;">${style.icon}</span>
                    <span style="vertical-align: middle;">${catName}</span>
                 </div>`;
        
        // Boucle sur les Types (B/W, Color, etc.)
        for (const [typeName, typeData] of Object.entries(catData)) {
            html += `<div class="type-group">`;
            
            if (typeof typeData === 'object' && !Array.isArray(typeData)) {
                 html += `<span class="type-label" style="opacity:0.8;">${typeName}</span>`;
                 html += `<div class="format-grid">`;
                 
                 for (const fmtName of Object.keys(typeData)) {
                     const safeCat = catName.replace(/'/g, "\\'");
                     const safeType = typeName.replace(/'/g, "\\'");
                     const safeFmt = fmtName.replace(/'/g, "\\'");
                     
                     let label = fmtName;
                     if(label === 'Standard' || label === 'Option') label = typeName; 

                     // Boutons avec fond blanc semi-transparent pour ressortir sur la couleur
                     html += `<button class="btn-service" style="background: rgba(255,255,255,0.7); border-color: ${style.border};" 
                                      onclick="selectServiceFromCatalog('${safeCat}', '${safeType}', '${safeFmt}')">
                                ${label}
                              </button>`;
                 }
                 html += `</div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}


function selectServiceFromCatalog(cat, type, fmt) {
    if (!currentBlocForCatalog) return;
    
    // 1. On fait le travail lourd (Ajout ligne + Calculs)
    ajouterLigne(currentBlocForCatalog, cat, type, fmt);

    // 2. On attend une fraction de seconde avant de lancer l'animation de fermeture
    // Cela évite le "jerk" visuel et rend l'interaction plus naturelle
    setTimeout(() => {
        closeCatalog();
    }, 150); 
}


// =================================================================
// GESTION DES BLOCS ET LIGNES
// =================================================================

function ajouterBloc(initialEmpty = false, doRecalc = true) {
  const blocsContainer = document.getElementById('blocs');
  const bloc = document.createElement('div');
  bloc.className = 'bloc';
  const id = 'bloc-' + blocId++;
  bloc.setAttribute('data-bloc-id', id);

  bloc.innerHTML = `
    <div class="bloc-header">
        <button class="toggle-accordion" onclick="toggleAccordion(this)"><span class="icon-chevron-down"></span></button>
        <input type="text" placeholder="Nom du bloc (ex: Flyers A5)" class="bloc-title" oninput="recalculer()">
        <label class="bloc-label">Exemplaires :</label>
        <input type="number" value="" min="0" placeholder="Qté" class="bloc-exemplaires" oninput="majExemplairesLignes(this)">
        <div class="bloc-actions">
            <button onclick="saveBlocAsPrefab(this.closest('.bloc'))" class="btn-base btn-line">💾 Save</button>
            <button onclick="dupliquerBloc(this.closest('.bloc'))" class="btn-base btn-line icon-copy">Dupliquer</button>
            <button onclick="askDeleteBloc(this.closest('.bloc'))" class="btn-base delete-btn icon-trash"></button>
        </div>
    </div>
    <div class="bloc-content">
        <table>
            <thead>
                <tr>
                    <th>Service</th><th>Type</th><th>Format</th>
                    <th style="text-align:center;">Orig.</th>
                    <th style="text-align:center;">Qté</th>
                    <th style="text-align:right;">P.U. (€)</th>
                    <th style="text-align:right;">Total (€)</th>
                    <th style="width:30px;"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div class="bloc-footer">
            <button onclick="openCatalog(this)" class="btn-base btn-action icon-plus">Ajouter Service</button>
            <div><span style="font-weight:500;">Sous-Total :</span> <span class="total-bloc-valeur">0.00</span> €</div>
        </div>
    </div>`;

  blocsContainer.appendChild(bloc);
  
  // Si ce n'est pas un chargement initial vide, on peut scroller vers le bloc
  if(doRecalc) { 
      recalculer(); 
      checkEmptyState(); 
      if(!initialEmpty) bloc.scrollIntoView({behavior:'smooth', block:'center'}); 
  }
}

// Nouvelle version de ajouterLigne qui gère la fusion des colonnes pour le mode "Custom"
function ajouterLigne(blocOrBtn, catVal, typeVal, fmtVal) {
  // Récupération du bloc
  const bloc = blocOrBtn.classList.contains('bloc') ? blocOrBtn : blocOrBtn.closest('.bloc');
  const tbody = bloc.querySelector('tbody');
  const exBloc = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 1;
  const tr = document.createElement('tr');

  // Détection : Est-ce une ligne catalogue ou une ligne personnalisée ?
  // Si 'catVal' est 'Custom' OU n'existe pas dans nos services, c'est du manuel.
  const isCustom = (catVal === 'Custom' || !window.services[catVal]);

  let htmlCells = '';

  if (isCustom) {
      // --- MODE MANUEL : Fusion des 3 colonnes ---
      // On affiche une seule grande zone de texte.
      // On garde des inputs cachés pour "type" et "format" pour que le moteur de calcul (qui attend 3 valeurs) continue de fonctionner sans erreur.
      
      const displayVal = (catVal === 'Custom') ? '' : catVal; // Si c'est un nouveau, vide. Sinon (chargement), on met le texte.

      htmlCells = `
        <td colspan="3">
            <input type="text" class="service-category" value="${displayVal}" placeholder="Description libre (ex: Forfait Création, Livraison...)" style="width:100%; font-weight:500; color:var(--primary-color);">
            
            <input type="hidden" class="service-type" value=" ">
            <input type="hidden" class="service-format" value=" ">
        </td>
      `;
  } else {
      // --- MODE CATALOGUE : 3 colonnes distinctes (Inchangé) ---
      htmlCells = `
        <td>
            <select class="service-category" disabled>
                <option value="${catVal}">${catVal}</option>
            </select>
        </td>
        <td>
            <select class="service-type" disabled>
                <option value="${typeVal}">${typeVal}</option>
            </select>
        </td>
        <td>
            <select class="service-format" disabled onchange="recalculer()">
                <option value="${fmtVal}">${fmtVal === 'Standard' ? '-' : fmtVal}</option>
            </select>
        </td>
      `;
  }

  tr.innerHTML = `
    ${htmlCells}
    <td><input type="number" value="1" min="1" class="ligne-originaux" style="width:50px; text-align:center;" oninput="recalculer()"></td>
    <td><input type="number" value="${exBloc}" min="0" class="ligne-exemplaire" style="width:50px; text-align:center;" oninput="recalculer()"></td>
    <td><input type="number" step="0.0001" placeholder="0.0000" class="pu-input custom" oninput="recalculer()"></td>
    <td class="total">0.00</td>
    <td><button onclick="this.closest('tr').remove(); recalculer()" style="color:var(--accent-color); border:none; background:none; cursor:pointer;"><span class="icon-x"></span></button></td>
  `;

  tbody.appendChild(tr);
  recalculer();
}



function askDeleteBloc(bloc) {
    openModal('Supprimer ?', 'Supprimer ce bloc ?', () => {
        bloc.style.opacity = '0';
        bloc.style.maxHeight = '0';
        bloc.style.marginBottom = '0';
        setTimeout(() => { bloc.remove(); recalculer(); checkEmptyState(); }, 300);
        showToast("Bloc supprimé.");
    });
}

function askResetApp() {
    openModal('Réinitialiser ?', 'Tout effacer ?', () => {
        document.getElementById('blocs').innerHTML = '';
        try { localStorage.removeItem('devisData'); } catch(e) {}
        ajouterBloc(true, true); 
        checkEmptyState();
        showToast("Devis réinitialisé !");
    });
}

function majExemplairesLignes(input) {
    const val = input.value;
    const bloc = input.closest('.bloc');
    bloc.querySelectorAll('.ligne-exemplaire').forEach(inp => inp.value = val);
    recalculer();
}

// =================================================================
// MOTEUR DE CALCUL (INCHANGÉ MAIS ESSENTIEL)
// =================================================================

function getFormatFactor(fmt) {
    if(!fmt) return 1;
    if(fmt.includes('A3') || fmt.includes('A1') || fmt.includes('A2')) {
        if(fmt.includes('A3')) return 2;
        if(fmt.includes('A2')) return 4;
        if(fmt.includes('A1')) return 8;
        if(fmt.includes('A0')) return 16;
    }
    if(fmt.includes('A5')) return 0.5;
    if(fmt.includes('A6')) return 0.25;
    return 1;
}

function recalculer() {
    const volumes = calculateGlobalVolumes();
    let totalGeneral = 0;

    document.querySelectorAll('.bloc').forEach(bloc => {
        let totalBloc = 0;
        
        bloc.querySelectorAll('tbody tr').forEach(tr => {
            const result = calculateLinePrice(tr, volumes);
            updateLineUI(tr, result);
            totalBloc += result.finalTotal;
        });

        const qtyBloc = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 0;
        bloc.querySelector('.total-bloc-valeur').textContent = totalBloc.toFixed(2);
        bloc.dataset.total = totalBloc.toFixed(2);
        bloc.dataset.qty = qtyBloc;
        
        totalGeneral += totalBloc;
    });

    document.getElementById('total-general').textContent = totalGeneral.toFixed(2) + ' €';
    saveData();
}

function calculateGlobalVolumes() {
    const volumesParGroupe = {};
    document.querySelectorAll('.bloc tbody tr').forEach(tr => {
        const cat = tr.querySelector('.service-category').value;
        const type = tr.querySelector('.service-type').value;
        const fmt = tr.querySelector('.service-format').value;
        if(!cat || !type || !fmt) return;

        const origInput = tr.querySelector('.ligne-originaux');
        const exInput = tr.querySelector('.ligne-exemplaire');
        let orig = parseFloat(origInput.value) || 0;
        let ex = parseFloat(exInput.value) || 0;

        let isFixed = false;
        try {
             const data = window.services[cat][type][fmt];
             if(data && data[0].fixed_price) isFixed = true;
        } catch(e){}

        if(isFixed) {
            // Force les quantités à 1 pour les frais fixes (imposition)
            if(ex !== 1 || orig !== 1) {
                 // On ne modifie pas les inputs visuels pour ne pas perturber l'user, 
                 // mais le calcul se fait sur base 1
            }
        } else {
            if(cat === 'Print') {
                if(fmt.includes('A5')) ex = Math.ceil(ex / 2) * 2;
                else if(fmt.includes('A6')) ex = Math.ceil(ex / 4) * 4;
            }
        }
        
        const qteReelle = isFixed ? 1 : (orig * ex);
        const groupKey = `${cat}|${type}`;
        if(!volumesParGroupe[groupKey]) volumesParGroupe[groupKey] = 0;
        volumesParGroupe[groupKey] += (qteReelle * getFormatFactor(fmt));
    });
    return volumesParGroupe;
}

function calculateLinePrice(tr, globalVolumes) {
    const cat = tr.querySelector('.service-category').value;
    const type = tr.querySelector('.service-type').value;
    const fmt = tr.querySelector('.service-format').value;
    const res = { puBase: 0, puFinal: 0, finalTotal: 0, qteReelle: 0, isFixed: false, mint: 0, valid: false };

    if(!cat || !type || !fmt) return res;
    res.valid = true;

    const orig = parseFloat(tr.querySelector('.ligne-originaux').value) || 0;
    const ex = parseFloat(tr.querySelector('.ligne-exemplaire').value) || 0;
    
    try {
         const d = window.services[cat][type][fmt];
         if(d && d[0].fixed_price) res.isFixed = true;
    } catch(e){}

    let finalEx = ex;
    if (res.isFixed) {
        finalEx = 1; 
        res.qteReelle = 1;
    } else {
        if (cat === 'Print') {
            if(fmt.includes('A5')) finalEx = Math.ceil(finalEx / 2) * 2;
            else if(fmt.includes('A6')) finalEx = Math.ceil(finalEx / 4) * 4;
        }
        res.qteReelle = orig * finalEx;
    }

    try {
        const grille = window.services[cat][type][fmt];
        if(grille) {
            if(res.isFixed) {
                res.puBase = grille[0].prix || 0;
            } else {
                const groupKey = `${cat}|${type}`;
                let volRef = globalVolumes[groupKey] || 0;
                const factor = getFormatFactor(fmt);
                const volumeLocaL = volRef / factor; 
                
                const palier = [...grille].reverse().find(p => (p.min || 0) <= volumeLocaL) || grille[0];
                res.puBase = palier.prix || 0;
                res.mint = palier.mint || 0;
            }
        }
    } catch(e) {}

    const puInput = tr.querySelector('.pu-input');
    const puManuel = parseFloat(puInput.value);
    res.puFinal = (isNaN(puManuel) || puManuel === 0) ? res.puBase : puManuel;

    let tot = res.qteReelle * res.puFinal;
    if(res.mint > 0 && res.qteReelle > 0 && tot < res.mint) tot = res.mint;
    
    res.finalTotal = tot;
    return res;
}

function updateLineUI(tr, res) {
    const puInput = tr.querySelector('.pu-input');
    const totalCell = tr.querySelector('.total');
    if(!res.valid) { totalCell.textContent = '0.00'; return; }

    puInput.placeholder = res.puBase.toFixed(4);
    const isCustom = (!isNaN(parseFloat(puInput.value)) && parseFloat(puInput.value) !== 0 && Math.abs(parseFloat(puInput.value) - res.puBase) > 0.00001);
    if(isCustom) puInput.classList.add('custom'); else puInput.classList.remove('custom');
    totalCell.textContent = res.finalTotal.toFixed(2);
    
    // Visuel pour frais fixes
    if(res.isFixed) {
        tr.querySelector('.ligne-originaux').disabled = true;
        tr.querySelector('.ligne-exemplaire').disabled = true;
        tr.querySelector('.ligne-originaux').value = 1; 
        tr.querySelector('.ligne-exemplaire').value = 1; 
    }
}

// =================================================================
// PERSISTENCE (SAVE / LOAD)
// =================================================================

function saveData() {
    const data = [];
    document.querySelectorAll('.bloc').forEach(b => {
        const lines = [];
        b.querySelectorAll('tbody tr').forEach(tr => {
            lines.push({
                c: tr.querySelector('.service-category').value,
                t: tr.querySelector('.service-type').value,
                f: tr.querySelector('.service-format').value,
                o: tr.querySelector('.ligne-originaux').value,
                e: tr.querySelector('.ligne-exemplaire').value,
                p: tr.querySelector('.pu-input').value
            });
        });
        data.push({
            title: b.querySelector('.bloc-title').value,
            qty: b.querySelector('.bloc-exemplaires').value,
            lines: lines
        });
    });
    localStorage.setItem('devisData', JSON.stringify(data));
}

function loadFromJSON(json) {
    const data = JSON.parse(json);
    document.getElementById('blocs').innerHTML = '';
    data.forEach(d => {
        ajouterBloc(false, false); 
        const b = document.getElementById('blocs').lastElementChild;
        b.querySelector('.bloc-title').value = d.title || '';
        b.querySelector('.bloc-exemplaires').value = d.qty || '';
        const tbody = b.querySelector('tbody');
        tbody.innerHTML = ''; 
        
        d.lines.forEach(l => {
            // On utilise la nouvelle fonction ajouterLigne avec les paramètres
            ajouterLigne(b, l.c, l.t, l.f);
            
            // On remplit les autres champs
            const tr = tbody.lastElementChild;
            tr.querySelector('.ligne-originaux').value = l.o;
            tr.querySelector('.ligne-exemplaire').value = l.e;
            tr.querySelector('.pu-input').value = l.p;
        });
    });
    recalculer(); 
}

function checkEmptyState() {
    const isEmpty = document.querySelectorAll('.bloc').length === 0;
    document.getElementById('empty-state').style.display = isEmpty ? 'block' : 'none';
}

function dupliquerBloc(bloc) {
    saveData();
    const data = JSON.parse(localStorage.getItem('devisData'));
    let index = Array.from(bloc.parentNode.children).indexOf(bloc);
    if(index > -1 && data.length > index) {
        const dup = JSON.parse(JSON.stringify(data[index]));
        dup.title += " (Copie)";
        data.splice(index + 1, 0, dup);
        loadFromJSON(JSON.stringify(data));
        showToast("Bloc dupliqué !");
    }
}

// =================================================================
// UI UTILS & EXPORTS
// =================================================================

function toggleAccordion(btn) {
    const content = btn.closest('.bloc').querySelector('.bloc-content');
    const icon = btn.querySelector('span');
    if(content.classList.contains('hidden-content')) {
         content.classList.remove('hidden-content');
         icon.className = 'icon-chevron-down';
         setTimeout(() => { content.style.paddingTop = '15px'; content.style.paddingBottom = '20px'; }, 300); 
    } else {
         content.style.paddingTop = '0'; content.style.paddingBottom = '0';
         content.classList.add('hidden-content');
         icon.className = 'icon-chevron-right';
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// --- MODALES GÉNÉRIQUES ---
function openModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    const overlay = document.getElementById('modal-overlay');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    overlay.classList.add('show');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.onclick = () => { if(onConfirm) onConfirm(); closeModal(); };
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

// --- EXPORT TEXTE ---
function copierDevis() { generateTextReport(false); }
function copierDevisDetaille() { generateTextReport(true); }

function generateTextReport(detailed) {
    let text = `📄 DEVIS - ${new Date().toLocaleDateString('fr-FR')}\n=================\n`;
    let totalG = 0;
    document.querySelectorAll('.bloc').forEach((b, i) => {
        const title = b.querySelector('.bloc-title').value || `Lot ${i+1}`;
        const totalB = parseFloat(b.dataset.total) || 0;
        const qty = parseFloat(b.dataset.qty) || 0;
        totalG += totalB;
        if (!detailed) {
            text += `▪️ ${title} (${qty} ex) : ${totalB.toFixed(2)} €\n`;
        } else {
            text += `\n📦 ${title.toUpperCase()} (${qty} ex)\n`;
            b.querySelectorAll('tbody tr').forEach((tr) => {
               const cat = tr.querySelector('.service-category').value;
               if(!cat) return;
               const type = tr.querySelector('.service-type').value;
               const fmt = tr.querySelector('.service-format').value;
               const tot = tr.querySelector('.total').textContent;
               const lbl = `${cat} ${type} ${fmt === 'Standard' ? '' : fmt}`;
               text += `   ▫️ ${lbl} : ${tot} €\n`;
            });
            text += `   > Sous-total : ${totalB.toFixed(2)} €\n`;
        }
    });
    text += `\n💰 TOTAL : ${totalG.toFixed(2)} €`;
    copierTexte(text);
}

// --- EXPORT EXCEL ---
function copierPourExcel() {
    let text = "";
    const volumes = calculateGlobalVolumes();
    document.querySelectorAll('.bloc').forEach(bloc => {
        bloc.querySelectorAll('tbody tr').forEach(tr => {
            const res = calculateLinePrice(tr, volumes);
            if(!res.valid) return;

            const cat = tr.querySelector('.service-category').value;
            const type = tr.querySelector('.service-type').value;
            const fmt = tr.querySelector('.service-format').value;
            
            let nom = `${cat} ${type}`;
            if(fmt !== 'Standard' && fmt !== 'Option') nom += ` ${fmt}`;

            let excelQte = res.qteReelle;
            let excelPU = res.puFinal;

            if (res.mint > 0 && (res.qteReelle * res.puFinal) < res.mint) {
                excelQte = 1; excelPU = res.mint; nom += " (Forfait Min)";
            } else {
                 if (cat === 'Print' || cat === 'Paper') {
                    if (fmt.includes('A5')) { excelQte /= 2; excelPU *= 2; nom = nom.replace('A5', 'A4'); }
                    else if (fmt.includes('A6')) { excelQte /= 4; excelPU *= 4; nom = nom.replace('A6', 'A4'); }
                 }
            }
            const strQte = excelQte.toString().replace('.', ',');
            const strPU = excelPU.toFixed(4).replace('.', ',');
            text += `1\t${nom}\t${strQte}\t${strPU}\n`;
        });
    });
    copierTexte(text);
    showToast("Copié pour Excel (Minima & Conversions appliqués) !");
}

function copierTexte(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy'); 
    document.body.removeChild(el);
}

// =================================================================
// SYSTÈME PREFABS (Adapté au catalogue)
// =================================================================

function saveBlocAsPrefab(bloc) {
    const title = bloc.querySelector('.bloc-title').value || "Prefab";
    const lines = [];
    bloc.querySelectorAll('tbody tr').forEach(tr => {
        lines.push({
            c: tr.querySelector('.service-category').value,
            t: tr.querySelector('.service-type').value,
            f: tr.querySelector('.service-format').value,
            o: tr.querySelector('.ligne-originaux').value,
            e: tr.querySelector('.ligne-exemplaire').value,
            p: tr.querySelector('.pu-input').value
        });
    });
    const prefab = { title, qty: bloc.querySelector('.bloc-exemplaires').value, lines };
    const existing = JSON.parse(localStorage.getItem('devisPrefabs') || '[]');
    existing.push(prefab);
    localStorage.setItem('devisPrefabs', JSON.stringify(existing));
    showToast("Prefab sauvegardé !");
}

function openPrefabModal() {
    const overlay = document.getElementById('prefab-overlay');
    const container = document.getElementById('prefab-list');
    overlay.classList.add('show');
    
    const existing = JSON.parse(localStorage.getItem('devisPrefabs') || '[]');
    container.innerHTML = '';

    if(existing.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Aucun prefab sauvegardé.</p>';
        return;
    }

    existing.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'prefab-item';
        item.innerHTML = `
            <div class="prefab-info">
                <strong>${p.title}</strong>
                <small>${p.lines.length} lignes | Qté: ${p.qty}</small>
            </div>
            <div class="prefab-actions">
                <button onclick="loadPrefab(${index})" class="btn-base btn-action">Charger</button>
                <button onclick="deletePrefab(${index})" class="btn-base delete-btn icon-trash"></button>
            </div>
        `;
        container.appendChild(item);
    });
}

function closePrefabModal() {
    document.getElementById('prefab-overlay').classList.remove('show');
}

function deletePrefab(index) {
    if(!confirm("Supprimer ce prefab ?")) return;
    const prefabs = JSON.parse(localStorage.getItem('devisPrefabs'));
    prefabs.splice(index, 1);
    localStorage.setItem('devisPrefabs', JSON.stringify(prefabs));
    openPrefabModal(); 
}

function loadPrefab(index) {
    const prefabs = JSON.parse(localStorage.getItem('devisPrefabs'));
    const p = prefabs[index];
    if(!p) return;

    ajouterBloc(false, false); 
    const bloc = document.getElementById('blocs').lastElementChild;
    bloc.querySelector('.bloc-title').value = p.title;
    bloc.querySelector('.bloc-exemplaires').value = p.qty;

    const tbody = bloc.querySelector('tbody');
    tbody.innerHTML = '';

    p.lines.forEach(l => {
        // Nouvelle méthode d'ajout
        ajouterLigne(bloc, l.c, l.t, l.f);
        
        const tr = tbody.lastElementChild;
        try {
            tr.querySelector('.ligne-originaux').value = l.o;
            tr.querySelector('.ligne-exemplaire').value = l.e;
            tr.querySelector('.pu-input').value = l.p;
        } catch(e) {
            console.warn("Ligne incompatible", e);
        }
    });

    closePrefabModal();
    recalculer();
    checkEmptyState();
    bloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast("Prefab chargé !");
}

// Exposer globalement
window.openPrefabModal = openPrefabModal;
window.closePrefabModal = closePrefabModal; 
window.loadPrefab = loadPrefab;
window.deletePrefab = deletePrefab;
window.saveBlocAsPrefab = saveBlocAsPrefab;
