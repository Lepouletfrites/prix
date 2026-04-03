/**
 * =================================================================
 * APP.JS - LOGIQUE DE L'APPLICATION (Refonte Catalogue)
 * =================================================================
 */

// --- 1. ÉTAT GLOBAL & CONSTANTES ---
let blocId = 0;
let currentBlocForCatalog = null; // Mémorise le bloc demandant l'ouverture du catalogue

// --- 2. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Chargement des données temporaires (Devis en cours)
    const savedData = localStorage.getItem('devisData');
    const parsedData = savedData ? JSON.parse(savedData) : null;

    if (parsedData && parsedData.length > 0) {
      loadFromJSON(savedData);
    } else {
      // Si vide, on crée un premier bloc par défaut
      ajouterBloc(true, true);
    }
  } catch (e) {
    console.warn("Erreur chargement init, reset...", e);
    ajouterBloc(true, true);
  }

  // Préparation de l'interface
  renderCatalog();
  checkEmptyState();
  recalculer();
  
  // Vérification du thème (Dark/Light)
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    const btn = document.querySelector('button[onclick="toggleTheme()"]');
    if (btn) btn.textContent = '☀️';
  }
});

/**
 * =================================================================
 * 3. SYSTÈME DE CATALOGUE
 * =================================================================
 */

function openCatalog(btn) {
  currentBlocForCatalog = btn.closest('.bloc');
  // Petit délai pour fluidité UI avant d'afficher l'overlay
  setTimeout(() => {
    document.getElementById('catalog-overlay').classList.add('show');
  }, 10);
}

function closeCatalog() {
  document.getElementById('catalog-overlay').classList.remove('show');
  currentBlocForCatalog = null;
}

function renderCatalog() {
  const container = document.getElementById('catalog-content');
  if (!container || container.innerHTML.trim() !== "") return;

  const catalogStyles = {
    'Print':      { icon: '🖨️', color: '#eef6fc', border: '#b6dbf5' },
    'Paper':      { icon: '📄', color: '#fff8e1', border: '#ffe082' },
    'Finishing':  { icon: '✂️', color: '#e8f5e9', border: '#a5d6a7' },
    'Lamination': { icon: '🛡️', color: '#f3e5f5', border: '#ce93d8' },
    'Plan':       { icon: '📐', color: '#e0f7fa', border: '#80deea' },
    'Big size':   { icon: '🖼️', color: '#fff3e0', border: '#ffcc80' },
    'Binding':    { icon: '📒', color: '#fbe9e7', border: '#ffab91' },
    'Special':    { icon: '✨', color: '#f5f5f5', border: '#e0e0e0' }
  };

  // On crée deux zones : Le menu latéral (sidebar) et le contenu (main)
  let sidebarHtml = '<div class="catalog-sidebar">';
  let mainHtml = '<div class="catalog-main">';

  // 1. Onglet "Divers / Manuel" (Actif par défaut)
  sidebarHtml += `<div class="sidebar-item active" data-target="Custom" onclick="switchCategory('Custom')">⚡ Divers</div>`;
  
  mainHtml += `
    <div id="cat-Custom" class="cat-content" style="display: block; background-color: #ffffff; border: 2px dashed var(--accent-color);">
      <div class="cat-title" style="color: var(--accent-color);">⚡ Divers / Manuel</div>
      <div class="type-group">
        <button class="btn-service" style="width:100%; font-weight:bold; padding:15px; background-color:var(--secondary-color);" 
                onclick="selectServiceFromCatalog('Custom', '', '')">
          ➕ Ajouter ligne vierge (Description libre)
        </button>
      </div>
    </div>`;

  // 2. Boucle sur les autres catégories
  if (window.services) {
    for (const [catName, catData] of Object.entries(window.services)) {
      const style = catalogStyles[catName] || { icon: '📦', color: '#ffffff', border: '#e0e0e0' };
      const safeId = catName.replace(/\s+/g, '-'); // Sécurité pour les ID (ex: "Big size" -> "Big-size")
      
      // Lien dans le menu latéral
      sidebarHtml += `<div class="sidebar-item" data-target="${safeId}" onclick="switchCategory('${safeId}')">${style.icon} ${catName}</div>`;
      
      // Boîte de contenu (cachée par défaut avec display:none)
      mainHtml += `<div id="cat-${safeId}" class="cat-content" style="display: none; background-color: ${style.color}; border: 1px solid ${style.border};">`;
      mainHtml += `  <div class="cat-title"><span style="font-size: 1.4em; margin-right: 8px;">${style.icon}</span> ${catName}</div>`;
      
      for (const [typeName, typeData] of Object.entries(catData)) {
        mainHtml += `<div class="type-group">`;
        
        if (typeof typeData === 'object' && !Array.isArray(typeData)) {
          mainHtml += `<span class="type-label" style="opacity:0.8;">${typeName}</span>`;
          mainHtml += `<div class="format-grid">`;
          
          for (const fmtName of Object.keys(typeData)) {
            const safeCat = catName.replace(/'/g, "\\'");
            const safeType = typeName.replace(/'/g, "\\'");
            const safeFmt = fmtName.replace(/'/g, "\\'");
            let label = (fmtName === 'Standard' || fmtName === 'Option') ? typeName : fmtName;

            mainHtml += `<button class="btn-service" style="background: rgba(255,255,255,0.7); border-color: ${style.border};" 
                        onclick="selectServiceFromCatalog('${safeCat}', '${safeType}', '${safeFmt}')">
                        ${label}
                     </button>`;
          }
          mainHtml += `</div>`;
        }
        mainHtml += `</div>`;
      }
      mainHtml += `</div>`;
    }
  }

  sidebarHtml += '</div>';
  mainHtml += '</div>';

  // On injecte le tout
  container.innerHTML = `<div class="catalog-layout">${sidebarHtml}${mainHtml}</div>`;
}

// Fonction pour basculer d'un onglet à l'autre
function switchCategory(catId) {
    // 1. Cacher tous les contenus
    document.querySelectorAll('.cat-content').forEach(el => el.style.display = 'none');
    
    // 2. Retirer la classe 'active' de tous les onglets du menu
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    
    // 3. Afficher le bon contenu
    const targetContent = document.getElementById('cat-' + catId);
    if (targetContent) targetContent.style.display = 'block';
    
    // 4. Mettre en surbrillance le bon onglet
    const targetTab = document.querySelector(`.sidebar-item[data-target="${catId}"]`);
    if (targetTab) targetTab.classList.add('active');
}
function selectServiceFromCatalog(cat, type, fmt) {
  if (!currentBlocForCatalog) return;
  ajouterLigne(currentBlocForCatalog, cat, type, fmt);
  setTimeout(() => closeCatalog(), 150); // Petite pause pour l'animation
}


/**
 * =================================================================
 * 4. GESTION DES BLOCS & LIGNES
 * =================================================================
 */

function ajouterBloc(initialEmpty = false, doRecalc = true) {
  const blocsContainer = document.getElementById('blocs');
  const bloc = document.createElement('div');
  bloc.className = 'bloc';
  bloc.setAttribute('data-bloc-id', 'bloc-' + blocId++);

  bloc.innerHTML = `
    <div class="bloc-header">
        <button class="toggle-accordion" onclick="toggleAccordion(this)"><span class="icon-chevron-down"></span></button>
        <input type="text" placeholder="Nom du bloc (ex: Flyers A5)" class="bloc-title" oninput="recalculer()">
        <label class="bloc-label">Exemplaires :</label>
        <input type="number" value="" min="0" placeholder="Qté" class="bloc-exemplaires" oninput="majExemplairesLignes(this)">
        
        <div class="bloc-actions">
            <button onclick="moveBloc(this, -1)" class="btn-base btn-line" title="Monter">⬆</button>
            <button onclick="moveBloc(this, 1)" class="btn-base btn-line" title="Descendre">⬇</button>
            <button onclick="saveBlocAsPrefab(this.closest('.bloc'))" class="btn-base btn-line" title="Sauver Prefab">💾</button>
            <button onclick="dupliquerBloc(this.closest('.bloc'))" class="btn-base btn-line icon-copy" title="Dupliquer"></button>
            <button onclick="askDeleteBloc(this.closest('.bloc'))" class="btn-base delete-btn icon-trash" title="Supprimer"></button>
        </div>
    </div>
    <div class="bloc-content">
        <table>
            <thead>
                <tr>
                    <th style="text-align:left; padding-left:10px;">Désignation</th>
                    
                    <th style="text-align:center; width:60px;">Orig.</th>
                    <th style="text-align:center; width:60px;">Qté</th> <th style="text-align:right; width:80px;">P.U. (€)</th>
                    <th style="text-align:right; width:90px;">Total (€)</th>
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
  
  if (doRecalc) { 
      recalculer(); 
      checkEmptyState(); 
      if (!initialEmpty) {
          bloc.scrollIntoView({behavior:'smooth', block:'center'});
          setTimeout(() => {
            const titleInput = bloc.querySelector('.bloc-title');
            if(titleInput) titleInput.focus();
          }, 100);
      }
  }
}


function ajouterLigne(blocOrBtn, catVal, typeVal, fmtVal) {
  const bloc = blocOrBtn.classList.contains('bloc') ? blocOrBtn : blocOrBtn.closest('.bloc');
  const tbody = bloc.querySelector('tbody');
  const exBloc = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 1;
  const tr = document.createElement('tr');

  // Mode "Custom" (Ligne vierge) ou Service inconnu
  const isCustom = (catVal === 'Custom' || !(window.services && window.services[catVal]));
  let htmlCell = '';

  if (isCustom) {
      // --- CAS 1 : MANUEL (Champ libre) ---
      const displayVal = (catVal === 'Custom') ? '' : catVal;
      htmlCell = `
        <td style="padding-left:10px;">
            <input type="text" class="service-category" value="${displayVal}" 
                   placeholder="Description libre..." 
                   style="width:100%; font-weight:500; border:none; background:transparent; color:var(--primary-color);">
            
            <input type="hidden" class="service-type" value=" ">
            <input type="hidden" class="service-format" value=" ">
        </td>`;
  } else {
      // --- CAS 2 : CATALOGUE ---
      
      // 1. On cherche si un NOM PERSONNALISÉ existe dans les données (propriété "change")
      let customName = null;
      try {
          const dataArray = window.services[catVal][typeVal][fmtVal];
          if (Array.isArray(dataArray)) {
              const found = dataArray.find(item => item.change);
              if (found) customName = found.change;
          }
      } catch (e) { /* Pas de custom name, on continue */ }

      // 2. Construction de l'affichage
      let contentHtml = '';

      if (customName) {
          // A. Si nom personnalisé : On affiche JUSTE le nom (comme demandé)
          contentHtml = `<span style="font-weight:600; color:var(--text-color);">${customName}</span>`;
      } else {
          // B. Sinon : Affichage standard (Catégorie Type + Format en petit)
          let displayFormat = (fmtVal === 'Standard' || fmtVal === 'Option') ? '' : fmtVal;
          contentHtml = `
            <div style="display:flex; flex-direction:column; line-height:1.2;">
                <span style="font-weight:600; color:var(--text-color);">${catVal} <span style="font-weight:400; opacity:0.8;">${typeVal}</span></span>
                ${displayFormat ? `<span style="font-size:0.85em; color:var(--accent-color);">${displayFormat}</span>` : ''}
            </div>`;
      }

      htmlCell = `
        <td style="padding-left:10px; vertical-align:middle;">
            ${contentHtml}
            <input type="hidden" class="service-category" value="${catVal}">
            <input type="hidden" class="service-type" value="${typeVal}">
            <input type="hidden" class="service-format" value="${fmtVal}">
        </td>`;
  }

  tr.innerHTML = `
    ${htmlCell}
    <td><input type="number" value="1" min="1" class="ligne-originaux" style="width:100%; text-align:center;" oninput="recalculer()"></td>
    <td><input type="number" value="${exBloc}" min="0" class="ligne-exemplaire" style="width:100%; text-align:center;" oninput="recalculer()"></td>
    <td><input type="number" step="0.0001" placeholder="0.0000" class="pu-input custom" style="width:100%; text-align:right;" oninput="recalculer()"></td>
    <td class="total" style="text-align:right; font-weight:bold;">0.00</td>
    <td style="text-align:center;">
        <button onclick="this.closest('tr').remove(); recalculer()" style="color:#ff6b6b; border:none; background:none; cursor:pointer; font-size:1.2em;">
            &times;
        </button>
    </td>`;

  tbody.appendChild(tr);
  recalculer();
}



function majExemplairesLignes(input) {
    const val = input.value;
    const bloc = input.closest('.bloc');
    bloc.querySelectorAll('.ligne-exemplaire').forEach(inp => inp.value = val);
    recalculer();
}

function askDeleteBloc(bloc) {
    openModal('Supprimer ?', 'Voulez-vous supprimer ce bloc ?', () => {
        bloc.style.opacity = '0';
        bloc.style.maxHeight = '0';
        bloc.style.marginBottom = '0';
        setTimeout(() => { bloc.remove(); recalculer(); checkEmptyState(); }, 300);
        showToast("Bloc supprimé.");
    });
}

function dupliquerBloc(bloc) {
    saveData();
    const data = JSON.parse(localStorage.getItem('devisData'));
    const allBlocs = Array.from(document.querySelectorAll('.bloc'));
    let index = allBlocs.indexOf(bloc);
    
    if(index > -1 && data.length > index) {
        const dup = JSON.parse(JSON.stringify(data[index]));
        dup.title += " (Copie)";
        data.splice(index + 1, 0, dup);
        loadFromJSON(JSON.stringify(data));
        showToast("Bloc dupliqué !");
    }
}

function moveBloc(btn, direction) {
    const bloc = btn.closest('.bloc');
    const container = document.getElementById('blocs');
    
    if (direction === -1 && bloc.previousElementSibling) {
        container.insertBefore(bloc, bloc.previousElementSibling);
    } else if (direction === 1 && bloc.nextElementSibling) {
        container.insertBefore(bloc.nextElementSibling, bloc);
    } else {
        return; // Pas de mouvement possible
    }
    bloc.scrollIntoView({behavior:'smooth', block:'center'});
    saveData();
}

/**
 * =================================================================
 * 5. MOTEUR DE CALCUL (Core Logic)
 * =================================================================
 */

// Convertit un format (A3, A4, A5...) en facteur de multiplication
function getFormatFactor(fmt) {
    if (!fmt) return 1;
    if (fmt.includes('A3')) return 2;
    if (fmt.includes('A2')) return 4;
    if (fmt.includes('A1')) return 8;
    if (fmt.includes('A0')) return 16;
    if (fmt.includes('A5')) return 0.5;
    if (fmt.includes('A6')) return 0.25;
    return 1;
}

// Fonction principale de recalcul
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

        // Mise à jour affichage bloc
        const qtyBloc = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 0;
        bloc.querySelector('.total-bloc-valeur').textContent = totalBloc.toFixed(2);
        bloc.dataset.total = totalBloc.toFixed(2);
        bloc.dataset.qty = qtyBloc;
        
        totalGeneral += totalBloc;
    });

    document.getElementById('total-general').textContent = totalGeneral.toFixed(2) + ' €';
    saveData(); // Sauvegarde auto à chaque calcul
}

// Calcule les volumes globaux par type (pour les prix dégressifs)
function calculateGlobalVolumes() {
    const volumesParGroupe = {};
    document.querySelectorAll('.bloc tbody tr').forEach(tr => {
        const cat = tr.querySelector('.service-category').value;
        const type = tr.querySelector('.service-type').value;
        const fmt = tr.querySelector('.service-format').value;
        if (!cat || !type || !fmt) return;

        const orig = parseFloat(tr.querySelector('.ligne-originaux').value) || 0;
        let ex = parseFloat(tr.querySelector('.ligne-exemplaire').value) || 0;

        // Vérification si prix fixe
        let isFixed = false;
        try {
             if (window.services[cat][type][fmt][0].fixed_price) isFixed = true;
        } catch(e){}

        if (isFixed) {
            // Pas d'accumulation de volume pour les frais fixes
        } else {
            // --- CORRECTION ICI : Ajout de || cat === 'Paper' ---
            // Ajustement "Coup de main" pour A5/A6 (optimisation planche)
            // On arrondit à la planche supérieure pour Print ET Paper
            if (cat === 'Print' || cat === 'Paper') {
                if (fmt.includes('A5')) ex = Math.ceil(ex / 2) * 2;
                else if (fmt.includes('A6')) ex = Math.ceil(ex / 4) * 4;
            }
            
            const qteReelle = (orig * ex);
            const groupKey = `${cat}|${type}`;
            if (!volumesParGroupe[groupKey]) volumesParGroupe[groupKey] = 0;
            
            // On normalise le volume en équivalent A4 (ou format de base)
            volumesParGroupe[groupKey] += (qteReelle * getFormatFactor(fmt));
        }
    });
    return volumesParGroupe;
}
// Calcule le prix d'une ligne spécifique
// Calcule le prix d'une ligne spécifique
function calculateLinePrice(tr, globalVolumes) {
    const cat = tr.querySelector('.service-category').value;
    const type = tr.querySelector('.service-type').value;
    const fmt = tr.querySelector('.service-format').value;
    
    const res = { puBase: 0, puFinal: 0, finalTotal: 0, qteReelle: 0, isFixed: false, mint: 0, valid: false };

    if (!cat || !type || !fmt) return res;
    res.valid = true;

    const orig = parseFloat(tr.querySelector('.ligne-originaux').value) || 0;
    const ex = parseFloat(tr.querySelector('.ligne-exemplaire').value) || 0;
    
    // 1. Détermine si c'est un forfait
    try {
         const d = window.services[cat][type][fmt];
         if (d && d[0].fixed_price) res.isFixed = true;
    } catch(e){}

    // 2. Calcul Quantité Réelle
    let finalEx = ex;
    if (res.isFixed) {
        finalEx = 1; 
        res.qteReelle = 1;
    } else {
        // --- CORRECTION ICI : Ajout de || cat === 'Paper' ---
        if (cat === 'Print' || cat === 'Paper') {
            if (fmt.includes('A5')) finalEx = Math.ceil(finalEx / 2) * 2;
            else if (fmt.includes('A6')) finalEx = Math.ceil(finalEx / 4) * 4;
        }
        res.qteReelle = orig * finalEx;
    }

    // 3. Recherche du P.U. dans la grille
    try {
        const grille = window.services[cat][type][fmt];
        if (grille) {
            if (res.isFixed) {
                res.puBase = grille[0].prix || 0;
            } else {
                const groupKey = `${cat}|${type}`;
                let volRef = globalVolumes[groupKey] || 0;
                const factor = getFormatFactor(fmt);
                const volumeLocaL = volRef / factor; // Retour au volume de base pour comparer à la grille
                
                // Trouve le bon palier (le plus haut min <= volume)
                const palier = [...grille].reverse().find(p => (p.min || 0) <= volumeLocaL) || grille[0];
                res.puBase = palier.prix || 0;
                res.mint = palier.mint || 0;
            }
        }
    } catch(e) {}

    // 4. Override manuel du P.U.
    const puInput = tr.querySelector('.pu-input');
    const puManuel = parseFloat(puInput.value);
    res.puFinal = (isNaN(puManuel) || puManuel === 0) ? res.puBase : puManuel;

    // 5. Total avec Minimum de facturation
    let tot = res.qteReelle * res.puFinal;
    if (res.mint > 0 && res.qteReelle > 0 && tot < res.mint) tot = res.mint;
    
    res.finalTotal = tot;
    return res;
}

function updateLineUI(tr, res) {
    const puInput = tr.querySelector('.pu-input');
    const totalCell = tr.querySelector('.total');
    
    if (!res.valid) { totalCell.textContent = '0.00'; return; }

    puInput.placeholder = res.puBase.toFixed(4);
    
    // Style "custom" si le prix diffère du calcul auto
    const isCustomPrice = (!isNaN(parseFloat(puInput.value)) && parseFloat(puInput.value) !== 0 && Math.abs(parseFloat(puInput.value) - res.puBase) > 0.00001);
    if(isCustomPrice) puInput.classList.add('custom'); else puInput.classList.remove('custom');
    
    totalCell.textContent = res.finalTotal.toFixed(2);
    
    // Gestion visuelle des frais fixes (Inputs désactivés)
    const inpOrig = tr.querySelector('.ligne-originaux');
    const inpEx = tr.querySelector('.ligne-exemplaire');
    
    if (res.isFixed) {
        if (!inpOrig.disabled) {
            inpOrig.disabled = true;
            inpEx.disabled = true;
            inpOrig.value = 1; 
            inpEx.value = 1;
        }
    } else {
         if (inpOrig.disabled) {
            inpOrig.disabled = false;
            inpEx.disabled = false;
         }
    }
}


/**
 * =================================================================
 * 6. PERSISTENCE (Sauvegarde & Chargement)
 * =================================================================
 */

// Sauvegarde l'état courant dans LocalStorage
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

// Reconstruit l'interface depuis un JSON
function loadFromJSON(json) {
    let data;
    try {
        data = (typeof json === 'string') ? JSON.parse(json) : json;
    } catch(e) { return; }

    document.getElementById('blocs').innerHTML = '';
    
    data.forEach(d => {
        ajouterBloc(false, false); 
        const b = document.getElementById('blocs').lastElementChild;
        b.querySelector('.bloc-title').value = d.title || '';
        b.querySelector('.bloc-exemplaires').value = d.qty || '';
        
        const tbody = b.querySelector('tbody');
        tbody.innerHTML = ''; 
        
        d.lines.forEach(l => {
            ajouterLigne(b, l.c, l.t, l.f);
            const tr = tbody.lastElementChild;
            // Restauration des valeurs
            tr.querySelector('.ligne-originaux').value = l.o;
            tr.querySelector('.ligne-exemplaire').value = l.e;
            tr.querySelector('.pu-input').value = l.p;
        });
    });
    recalculer(); 
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

/**
 * =================================================================
 * 7. GESTION DES PROJETS (Sauvegardes nommées)
 * =================================================================
 */

function saveProject() {
    document.getElementById('save-overlay').classList.add('show');
    setTimeout(() => document.getElementById('save-project-name').focus(), 100);
}

function closeSaveModal() {
    document.getElementById('save-overlay').classList.remove('show');
    document.getElementById('save-project-name').value = ''; 
}

function confirmSaveProject() {
    const nameInput = document.getElementById('save-project-name');
    const name = nameInput.value.trim();

    if (!name) { showToast("Veuillez entrer un nom !"); return; }

    saveData(); 
    const currentData = localStorage.getItem('devisData');
    if (!currentData || currentData === "[]") {
        showToast("Rien à sauvegarder (Devis vide)");
        closeSaveModal();
        return;
    }

    const projects = JSON.parse(localStorage.getItem('myProjects') || '{}');
    projects[name] = {
        date: new Date().toLocaleString(),
        data: JSON.parse(currentData),
        total: document.getElementById('total-general').textContent
    };

    localStorage.setItem('myProjects', JSON.stringify(projects));
    closeSaveModal();
    showToast(`Devis "${name}" sauvegardé !`);
}

function openProjectsModal() {
    const overlay = document.getElementById('projects-overlay');
    const container = document.getElementById('projects-list');
    const projects = JSON.parse(localStorage.getItem('myProjects') || '{}');
    
    overlay.classList.add('show');
    container.innerHTML = '';

    const names = Object.keys(projects);
    if (names.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Aucun devis sauvegardé.</p>';
        return;
    }

    names.forEach(name => {
        const p = projects[name];
        // Échappement des guillemets simples pour le HTML onclick
        const safeName = name.replace(/'/g, "\\'");
        
        const item = document.createElement('div');
        item.className = 'project-item';
        item.innerHTML = `
            <div class="project-info">
                <strong>${name}</strong>
                <small>📅 ${p.date} • 💰 ${p.total}</small>
            </div>
            <div class="project-actions">
                <button onclick="loadProject('${safeName}')" class="btn-base btn-action">Ouvrir</button>
                <button onclick="deleteProject('${safeName}')" class="btn-base delete-btn icon-trash"></button>
            </div>
        `;
        container.appendChild(item);
    });
}

function closeProjectsModal() {
    document.getElementById('projects-overlay').classList.remove('show');
}

function loadProject(name) {
    if (!confirm(`Ouvrir le devis "${name}" ? \n⚠️ Le devis actuel non sauvegardé sera perdu.`)) return;

    const projects = JSON.parse(localStorage.getItem('myProjects') || '{}');
    const project = projects[name];

    if (project && project.data) {
        localStorage.setItem('devisData', JSON.stringify(project.data));
        loadFromJSON(project.data);
        closeProjectsModal();
        showToast(`Devis "${name}" chargé !`);
    } else {
        showToast("Erreur de chargement.");
    }
}

function deleteProject(name) {
    if (!confirm(`Supprimer définitivement "${name}" ?`)) return;
    const projects = JSON.parse(localStorage.getItem('myProjects') || '{}');
    delete projects[name];
    localStorage.setItem('myProjects', JSON.stringify(projects));
    openProjectsModal(); // Rafraîchir la liste
    showToast("Devis supprimé.");
}

/**
 * =================================================================
 * 8. SYSTÈME DE PREFABS (Modèles de blocs)
 * =================================================================
 */

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
    const existing = JSON.parse(localStorage.getItem('devisPrefabs') || '[]');
    
    overlay.classList.add('show');
    container.innerHTML = '';

    if (existing.length === 0) {
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
            </div>`;
        container.appendChild(item);
    });
}

function closePrefabModal() {
    document.getElementById('prefab-overlay').classList.remove('show');
}

function loadPrefab(index) {
    const prefabs = JSON.parse(localStorage.getItem('devisPrefabs'));
    const p = prefabs[index];
    if (!p) return;

    ajouterBloc(false, false);
    const bloc = document.getElementById('blocs').lastElementChild;
    bloc.querySelector('.bloc-title').value = p.title;
    bloc.querySelector('.bloc-exemplaires').value = p.qty;

    const tbody = bloc.querySelector('tbody');
    tbody.innerHTML = '';

    p.lines.forEach(l => {
        ajouterLigne(bloc, l.c, l.t, l.f);
        const tr = tbody.lastElementChild;
        if(l.o) tr.querySelector('.ligne-originaux').value = l.o;
        if(l.e) tr.querySelector('.ligne-exemplaire').value = l.e;
        if(l.p) tr.querySelector('.pu-input').value = l.p;
    });

    closePrefabModal();
    recalculer();
    bloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast("Prefab chargé !");
}

function deletePrefab(index) {
    if (!confirm("Supprimer ce prefab ?")) return;
    const prefabs = JSON.parse(localStorage.getItem('devisPrefabs'));
    prefabs.splice(index, 1);
    localStorage.setItem('devisPrefabs', JSON.stringify(prefabs));
    openPrefabModal(); 
}


/**
 * =================================================================
 * 9. UI & UTILITAIRES (Toast, Modal, Events)
 * =================================================================
 */

// --- Gestion des clics extérieurs (Fermeture modales) ---
window.addEventListener('click', function(e) {
    if (e.target.id === 'projects-overlay') closeProjectsModal();
    if (e.target.id === 'save-overlay') closeSaveModal();
    if (e.target.id === 'prefab-overlay') closePrefabModal();
    if (e.target.id === 'catalog-overlay') closeCatalog();
    if (e.target.id === 'modal-overlay') closeModal();
});

// --- Raccourci clavier (Entrée) dans la modale de sauvegarde ---
const saveInput = document.getElementById('save-project-name');
if(saveInput) {
    saveInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') confirmSaveProject();
    });
}

// --- Empty State ---
function checkEmptyState() {
    const isEmpty = document.querySelectorAll('.bloc').length === 0;
    const emptyState = document.getElementById('empty-state');
    if(emptyState) emptyState.style.display = isEmpty ? 'block' : 'none';
}

// --- Toasts (Notifications) ---
function showToast(msg) {
    const t = document.getElementById('toast');
    if(!t) return;
    document.getElementById('toast-message').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// --- Modales Génériques ---
function openModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    const overlay = document.getElementById('modal-overlay');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    // Clonage pour reset les event listeners précédents
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.onclick = () => { if(onConfirm) onConfirm(); closeModal(); };
    overlay.classList.add('show');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

// --- Accordéons (Tout plier / déplier) ---
let allCollapsed = false;
function toggleAccordion(btn) {
    const content = btn.closest('.bloc').querySelector('.bloc-content');
    const icon = btn.querySelector('span');
    
    if (content.classList.contains('hidden-content')) {
         // Ouvrir
         content.classList.remove('hidden-content');
         icon.className = 'icon-chevron-down';
         setTimeout(() => { content.style.paddingTop = '15px'; content.style.paddingBottom = '20px'; }, 300); 
    } else {
         // Fermer
         content.style.paddingTop = '0'; content.style.paddingBottom = '0';
         content.classList.add('hidden-content');
         icon.className = 'icon-chevron-right';
    }
}

function toggleAllAccordions() {
    allCollapsed = !allCollapsed;
    const contents = document.querySelectorAll('.bloc-content');
    const icons = document.querySelectorAll('.toggle-accordion span');
    
    contents.forEach((content, index) => {
        if (allCollapsed) {
            content.classList.add('hidden-content');
            content.style.paddingTop = '0'; content.style.paddingBottom = '0';
            if(icons[index]) icons[index].className = 'icon-chevron-right';
        } else {
            content.classList.remove('hidden-content');
            setTimeout(() => { content.style.paddingTop = '15px'; content.style.paddingBottom = '20px'; }, 50);
            if(icons[index]) icons[index].className = 'icon-chevron-down';
        }
    });
    showToast(allCollapsed ? "Vue compacte activée" : "Vue détaillée activée");
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.querySelector('button[onclick="toggleTheme()"]');
    const isDark = document.body.classList.contains('dark-mode');
    
    if (isDark) {
        btn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        btn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}

/**
 * =================================================================
 * 10. EXPORTS (Presse-papier)
 * =================================================================
 */

function copierTexte(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy'); 
    document.body.removeChild(el);
}

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
               const type = tr.querySelector('.service-type').value;
               const fmt = tr.querySelector('.service-format').value;
               const tot = tr.querySelector('.total').textContent;
               
               if(!cat) return;

               // --- MODIFICATION ICI : On fait juste confiance à la fonction ---
               const lbl = getDisplayName(cat, type, fmt);
               // ---------------------------------------------------------------

               text += `   ▫️ ${lbl} : ${tot} €\n`;
            });
            text += `   > Sous-total : ${totalB.toFixed(2)} €\n`;
        }
    });
    text += `\n💰 TOTAL TVAC : ${totalG.toFixed(2)} €`;
    copierTexte(text);
    showToast("Devis copié !");
}



function copierPourExcel() {
    let text = "";
    const volumes = calculateGlobalVolumes();
    
    document.querySelectorAll('.bloc').forEach(bloc => {
        bloc.querySelectorAll('tbody tr').forEach(tr => {
            const res = calculateLinePrice(tr, volumes);
            if(!res.valid) return;

            // --- 1. Récupération des valeurs brutes des champs ---
            // On prend directement ce que l'utilisateur a tapé
            let valOriginaux = parseFloat(tr.querySelector('.ligne-originaux').value) || 1;
            let valExemplaires = parseFloat(tr.querySelector('.ligne-exemplaire').value) || 1;

            const cat = tr.querySelector('.service-category').value;
            const type = tr.querySelector('.service-type').value;
            const fmt = tr.querySelector('.service-format').value;
            
            let nom = getDisplayName(cat, type, fmt); 
            let excelPU = res.puFinal;

            // --- 2. Gestion du Minimum de facturation ---
            // Si le total ligne est < au minimum, on force tout à 1 pour que le total fasse le prix min
            if (res.mint > 0 && (res.qteReelle * res.puFinal) < res.mint) {
                valOriginaux = 1;
                valExemplaires = 1; 
                excelPU = res.mint;  
            } else {
                // --- 3. Correction A5/A6 (Arrondi Supérieur sur les EXEMPLAIRES) ---
                if (cat === 'Print' || cat === 'Paper') {
                    if (fmt.includes('A5')) { 
                        // On divise le nombre d'exemplaires par 2 et on arrondit au-dessus
                        valExemplaires = Math.ceil(valExemplaires / 2); 
                        excelPU = excelPU * 2; 
                        nom = nom.replace('A5', 'A4');
                    } 
                    else if (fmt.includes('A6')) { 
                        // On divise le nombre d'exemplaires par 4 et on arrondit au-dessus
                        valExemplaires = Math.ceil(valExemplaires / 4); 
                        excelPU = excelPU * 4; 
                        nom = nom.replace('A6', 'A4'); 
                    }
                }
            }
            
            // --- 4. Formatage ---
            const strOrig = valOriginaux.toString().replace('.', ',');
            const strEx = valExemplaires.toString().replace('.', ',');
            const strPU = excelPU.toFixed(4).replace('.', ',');

            // --- 5. Construction de la ligne ---
            // ORDRE DEMANDÉ : Quantité (Orig) | Nom | Nb Exemplaire | Prix Unitaire
            text += `${strOrig}\t${nom}\t${strEx}\t${strPU}\n`;
        });
    });
    
    copierTexte(text);
    showToast("Copié pour Excel !");
}


// Fonction utilitaire intelligente pour le nommage
// Fonction utilitaire intelligente pour le nommage
// À placer dans la section UTILS ou EXPORTS de ton app.js
function getDisplayName(cat, type, fmt) {
    let customName = null;

    // 1. Recherche du nom personnalisé dans TOUS les paliers
    try {
        const dataArray = window.services[cat][type][fmt];
        if (Array.isArray(dataArray)) {
            // On cherche le premier élément qui possède la propriété "change"
            // Peu importe s'il est au début, au milieu ou à la fin du tableau
            const found = dataArray.find(item => item.change);
            if (found) {
                return found.change; 
            }
        }
    } catch (e) {
        // Erreur d'accès ou donnée inexistante, on continue
    }

    // 2. Sinon, construction automatique
    let fullName = `${cat}`;
    if (type && type !== ' ' && type !== 'Standard') {
        fullName += ` ${type}`;
    }

    // 3. Ajout du format par défaut (si pas de nom personnalisé trouvé)
    if (fmt && fmt !== ' ' && fmt !== 'Standard' && fmt !== 'Option') {
        fullName += ` ${fmt}`;
    }
    
    return fullName;
}


/**
 * =================================================================
 * 11. EXPOSITION GLOBALE (Pour le HTML)
 * =================================================================
 */
// Ces fonctions sont appelées via onclick="..." dans le HTML
window.saveProject = saveProject;
window.openProjectsModal = openProjectsModal;
window.closeProjectsModal = closeProjectsModal;
window.loadProject = loadProject;
window.deleteProject = deleteProject;
window.openPrefabModal = openPrefabModal;
window.closePrefabModal = closePrefabModal; 
window.loadPrefab = loadPrefab;
window.deletePrefab = deletePrefab;
window.saveBlocAsPrefab = saveBlocAsPrefab;
window.askDeleteBloc = askDeleteBloc;
window.moveBloc = moveBloc;
window.dupliquerBloc = dupliquerBloc;
window.openCatalog = openCatalog;
window.toggleAccordion = toggleAccordion;
window.toggleTheme = toggleTheme;
window.copierDevis = copierDevis;
window.copierDevisDetaille = copierDevisDetaille;
window.copierPourExcel = copierPourExcel;
window.askResetApp = askResetApp;
window.toggleAllAccordions = toggleAllAccordions;
window.selectServiceFromCatalog = selectServiceFromCatalog;
window.recalculer = recalculer;
window.majExemplairesLignes = majExemplairesLignes;
window.confirmSaveProject = confirmSaveProject;
window.switchCategory = switchCategory;
