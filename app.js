// =================================================================
// LOGIQUE DE L'APPLICATION (Générateur de Devis)
// =================================================================
let blocId = 0;

/**
 * Initialisation au chargement du DOM.
 * Charge les données sauvegardées ou crée un bloc vide.
 */
document.addEventListener('DOMContentLoaded', () => {
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
  checkEmptyState();
  recalculer();
});

// --- SYSTÈME MODAL (Confirmation personnalisée) ---

function openModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    const overlay = document.getElementById('modal-overlay');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    overlay.classList.add('show');

    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.onclick = () => {
        if(onConfirm) onConfirm();
        closeModal();
    };
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

// --- ACTIONS PRINCIPALES ---

function askResetApp() {
    openModal(
      'Réinitialiser le devis ?', 
      'Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.', 
      () => {
        document.getElementById('blocs').innerHTML = '';
        try { localStorage.removeItem('devisData'); } catch(e) {}
        ajouterBloc(true, true); 
        checkEmptyState();
        showToast("Devis réinitialisé !");
    });
}

function askDeleteBloc(bloc) {
    openModal(
      'Supprimer ce bloc ?', 
      'Voulez-vous supprimer ce bloc du devis ?', 
      () => {
        bloc.style.opacity = '0';
        bloc.style.maxHeight = '0';
        bloc.style.marginBottom = '0';
        setTimeout(() => {
            bloc.remove();
            recalculer();
            checkEmptyState();
        }, 300);
        showToast("Bloc supprimé.");
    });
}

function ajouterBloc(initialEmpty = false, doRecalc = true) {
  const blocsContainer = document.getElementById('blocs');
  const bloc = document.createElement('div');
  bloc.className = 'bloc';
  const id = 'bloc-' + blocId++;
  bloc.setAttribute('data-bloc-id', id);

  const initialTitle = "";
  const initialQty = "";
  const placeholderTitle = "Nom du bloc (ex: Flyers A5)";
  const placeholderQty = "Qté";

  bloc.innerHTML = `
    <div class="bloc-header">
        <button class="toggle-accordion" title="Afficher/Masquer" onclick="toggleAccordion(this)">
            <span class="icon-chevron-down"></span>
        </button>
        <input type="text" placeholder="${placeholderTitle}" value="${initialTitle}" class="bloc-title" oninput="recalculer()">
        
        <label class="bloc-label">Exemplaires :</label>
        <input type="number" value="${initialQty}" min="0" placeholder="${placeholderQty}" class="bloc-exemplaires" oninput="majExemplairesLignes(this)">
        
        <div class="bloc-actions">
            <button onclick="saveBlocAsPrefab(this.closest('.bloc'))" title="Sauvegarder en Prefab" class="btn-base btn-line">💾 Save</button>
            <button onclick="dupliquerBloc(this.closest('.bloc'))" title="Dupliquer" class="btn-base btn-line icon-copy">Dupliquer</button>
            <button onclick="askDeleteBloc(this.closest('.bloc'))" title="Supprimer" class="btn-base delete-btn icon-trash"></button>
        </div>
    </div>

    <div class="bloc-content">
        <table>
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th style="text-align: center;">Orig.</th>
                    <th style="text-align: center;">Qté</th>
                    <th style="text-align: right;">P.U. (€)</th>
                    <th style="text-align: right;">Total (€)</th>
                    <th style="width: 30px;"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div class="bloc-footer">
            <button onclick="ajouterLigne(this)" class="btn-base btn-line icon-plus">Ajouter Ligne</button>
            <div>
                <span style="font-weight: 500;">Sous-Total :</span> 
                <span class="total-bloc-valeur">0.00</span> €
            </div>
        </div>
    </div>
  `;

  blocsContainer.appendChild(bloc);
  
  if(!initialEmpty) {
      ajouterLigne(bloc.querySelector('button[onclick^="ajouterLigne"]'));
  }
  
  if(doRecalc) {
      recalculer();
      checkEmptyState();
      if(!initialEmpty) {
         bloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }
}

function ajouterLigne(btn) {
  const bloc = btn.closest('.bloc');
  const tbody = bloc.querySelector('tbody');
  const exBloc = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 1;
  
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td><select class="service-category" onchange="majTypeOptions(this)"><option value="">- Choix -</option></select></td>
    <td><select class="service-type" disabled onchange="majFormatOptions(this)"><option value="">- Type -</option></select></td>
    <td><select class="service-format" disabled onchange="recalculer()"><option value="">- Taille -</option></select></td>
    <td><input type="number" value="1" min="1" class="ligne-originaux" style="width: 50px; text-align: center;" oninput="recalculer()"></td>
    <td><input type="number" value="${exBloc}" min="0" class="ligne-exemplaire" style="width: 50px; text-align: center;" oninput="recalculer()"></td>
    <td><input type="number" step="0.0001" placeholder="0.0000" class="pu-input" oninput="recalculer()"></td>
    <td class="total">0.00</td>
    <td>
        <button onclick="this.closest('tr').remove(); recalculer()" style="color: var(--accent-color); border: none; background: none; cursor: pointer; font-size: 14px;">
            <span class="icon-x"></span>
        </button>
    </td>
  `;

  const selCat = tr.querySelector('.service-category');
  Object.keys(window.services).forEach(k => {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = k;
      selCat.appendChild(opt);
  });

  tbody.appendChild(tr);
}

// --- CALCULS & CASCADES ---

function majTypeOptions(selCat) {
    const tr = selCat.closest('tr');
    const selType = tr.querySelector('.service-type');
    const selFmt = tr.querySelector('.service-format');
    const cat = selCat.value;

    selType.innerHTML = '<option value="">- Type -</option>';
    selFmt.innerHTML = '<option value="">- Taille -</option>';
    
    if(cat && window.services[cat]) {
        selType.disabled = false;
        selType.style.backgroundColor = '#fff';
        
        const data = window.services[cat];
        const is3Lvl = Object.values(data).some(v => !Array.isArray(v));
        
        Object.keys(data).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = k;
            selType.appendChild(opt);
        });
        
        if(!is3Lvl) {
           selFmt.disabled = true;
           selFmt.style.backgroundColor = '#eee';
        } else {
           selFmt.disabled = true;
           selFmt.style.backgroundColor = '#eee';
        }
    } else {
        selType.disabled = true;
        selType.style.backgroundColor = '#eee';
        selFmt.disabled = true;
        selFmt.style.backgroundColor = '#eee';
    }
    recalculer();
}

function majFormatOptions(selType) {
    const tr = selType.closest('tr');
    const cat = tr.querySelector('.service-category').value;
    const type = selType.value;
    const selFmt = tr.querySelector('.service-format');
    
    selFmt.innerHTML = '<option value="">- Taille -</option>';
    
    try {
        const data = window.services[cat][type];
        if (data && !Array.isArray(data)) {
            selFmt.disabled = false;
            selFmt.style.backgroundColor = '#fff';
            
            Object.keys(data).forEach(k => {
                const opt = document.createElement('option');
                opt.value = k; opt.textContent = k;
                selFmt.appendChild(opt);
            });
        } else {
            selFmt.disabled = true;
            selFmt.style.backgroundColor = '#eee';
        }
    } catch(e) {
        selFmt.disabled = true;
        selFmt.style.backgroundColor = '#eee';
    }

    recalculer();
}

function majExemplairesLignes(input) {
    const val = input.value;
    const bloc = input.closest('.bloc');
    bloc.querySelectorAll('.ligne-exemplaire').forEach(inp => inp.value = val);
    recalculer();
}

/**
 * Utilitaire pour récupérer le coefficient de division selon le format
 * A4 = 1 (Référence)
 * A5 = 2 (2 A5 dans un A4) -> On divisera le prix par 2
 * A6 = 4 (4 A6 dans un A4) -> On divisera le prix par 4
 */
function getCoefFormat(fmt) {
    if (fmt === 'A5') return 2;
    if (fmt === 'A6') return 4;
    return 1;
}

/**
 * Fonction principale de calcul REVISÉE
 * Corrige le problème de synchronisation entre A4 et A5
 */
function recalculer() {
    let totalGeneral = 0;
    
    // Cette map stockera le volume TOTAL converti en A4 pour chaque couple Categorie|Type
    // Ex: "Print|Couleur" -> 1500 (équivalent A4)
    const volumesParService = {}; 
    
    // Tableau temporaire pour stocker les infos de chaque ligne afin d'éviter de relire le DOM deux fois
    const cacheLignes = [];

    // --- ÉTAPE 1 : CALCULER LES VOLUMES GLOBAUX ---
    document.querySelectorAll('.bloc').forEach(bloc => {
        bloc.querySelectorAll('tbody tr').forEach(tr => {
            const cat = tr.querySelector('.service-category').value;
            const type = tr.querySelector('.service-type').value;
            const fmt = tr.querySelector('.service-format').value;
            
            if(!cat || !type) return;

            // Récupération des inputs
            const origInput = tr.querySelector('.ligne-originaux');
            const exInput = tr.querySelector('.ligne-exemplaire');
            const orig = parseFloat(origInput.value) || 0;
            let ex = parseFloat(exInput.value) || 0;

            // Vérification Prix Fixe
            let isFixed = false;
            try {
                const root = window.services[cat][type];
                // On regarde si la structure est un tableau direct ou par format
                const targetData = Array.isArray(root) ? root : (root[fmt] || root['A4']); 
                if (targetData && targetData[0] && targetData[0].fixed_price) {
                    isFixed = true;
                }
            } catch(e) {}

            // Application règles Inputs
            if (isFixed) {
                ex = 1;
                origInput.value = 1; exInput.value = 1;
                origInput.disabled = true; exInput.disabled = true;
            } else {
                origInput.disabled = false; exInput.disabled = false;
                // Arrondi de production
                if(['Print'].includes(cat)) {
                    if(fmt === 'A5') ex = Math.ceil(ex / 2) * 2;
                    else if(fmt === 'A6') ex = Math.ceil(ex / 4) * 4;
                }
            }
            
            const qteReelle = orig * ex; 
            
            // DÉTERMINATION DE LA CLÉ DE REGROUPEMENT
            // Si c'est A4, A5, A6 -> On regroupe sous la clé "A4"
            let groupKey = `${cat}|${type}`;
            let volumeEquivalent = qteReelle;

            if (['A4', 'A5', 'A6'].includes(fmt)) {
                groupKey += `|A4`; // On force la clé à A4 pour qu'ils partagent le même compteur
                volumeEquivalent = qteReelle / getCoefFormat(fmt); // On convertit la qté en équivalent A4
            } else {
                // Pour A3 ou autres, on garde leur format propre
                const isFormatUsed = !tr.querySelector('.service-format').disabled;
                if(fmt && isFormatUsed) groupKey += `|${fmt}`;
            }

            // On ajoute au compteur global
            if(!volumesParService[groupKey]) volumesParService[groupKey] = 0;
            volumesParService[groupKey] += volumeEquivalent;
            
            // On stocke les infos pour l'étape 2
            cacheLignes.push({ tr, groupKey, qteReelle, cat, type, fmt, isFixed });
        });
    });

    // --- ÉTAPE 2 : APPLIQUER LES PRIX ---
    document.querySelectorAll('.bloc').forEach(bloc => {
        let totalBloc = 0;
        const qtyExemplaires = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 0;

        bloc.querySelectorAll('tbody tr').forEach(tr => {
            // On retrouve les infos calculées à l'étape 1
            const data = cacheLignes.find(d => d.tr === tr);
            const totalCell = tr.querySelector('.total');
            const puInput = tr.querySelector('.pu-input');

            if(!data) {
                totalCell.textContent = '0.00';
                return;
            }

            // Récupération de la grille tarifaire
            let paliers = null;
            try {
                const root = window.services[data.cat][data.type];
                // Si on est sur un format standard (A5/A6), on va CHERCHER la grille du A4
                if (['A4', 'A5', 'A6'].includes(data.fmt)) {
                    paliers = root['A4']; 
                } else {
                    paliers = Array.isArray(root) ? root : root[data.fmt];
                }
            } catch(e) { /* Grille introuvable */ }

            let puBase = 0;
            let minTotal = 0;
            
            if(paliers) {
                if (data.isFixed) {
                   puBase = paliers[0].prix || 0;
                   minTotal = paliers[0].mint || 0;
                } else {
                   // C'est ICI que la magie opère :
                   // On utilise le volume TOTAL CUMULÉ (A4+A5+A6 convertis) pour trouver le palier
                   const totalVolumeGroupe = volumesParService[data.groupKey] || 0;
                   
                   // On trouve le prix unitaire pour du A4 correspondant à ce volume
                   const palierTrouve = [...paliers].reverse().find(p => (p.min||0) <= totalVolumeGroupe) || paliers[0];
                   
                   const prixRef = palierTrouve ? (palierTrouve.prix || 0) : 0;
                   minTotal = palierTrouve ? (palierTrouve.mint || 0) : 0;

                   // On divise le prix si c'est du A5 ou A6
                   puBase = prixRef / getCoefFormat(data.fmt);
                }
            }

            // Mise à jour de l'affichage
            puInput.placeholder = puBase.toFixed(4);
            
            const puManuel = parseFloat(puInput.value);
            // Si l'utilisateur a entré 0 ou rien, on prend le prix calculé
            const puFinal = (isNaN(puManuel) || puManuel === 0) ? puBase : puManuel;

            // Style visuel si prix manuel
            if(!isNaN(puManuel) && puManuel !== puBase && puManuel > 0) {
                 puInput.classList.add('custom');
            } else {
                puInput.classList.remove('custom');
                if(puManuel === 0) puInput.value = ''; 
            }

            let tot = data.qteReelle * puFinal;
            
            // Minimum de facturation (si applicable à la ligne)
            if(minTotal > 0 && data.qteReelle > 0 && tot < minTotal) tot = minTotal; 

            totalCell.textContent = tot.toFixed(2);
            totalBloc += tot;
        });
        
        // Totaux du bloc
        const totalElement = bloc.querySelector('.total-bloc-valeur');
        totalElement.textContent = totalBloc.toFixed(2);
        bloc.dataset.total = totalBloc.toFixed(2);
        bloc.dataset.qty = qtyExemplaires;

        totalGeneral += totalBloc;
    });

    document.getElementById('total-general').textContent = totalGeneral.toFixed(2) + ' €';
    saveData();
}
// --- SAUVEGARDE & CHARGEMENT ---

function saveData() {
    try {
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
    } catch(e) {
      console.error("Erreur sauvegarde locale:", e);
    }
}

function loadFromJSON(json) {
    const data = JSON.parse(json);
    document.getElementById('blocs').innerHTML = '';
    
    if (data.length === 0) {
        ajouterBloc(true, false);
        return;
    }

    data.forEach(d => {
        ajouterBloc(false, false); 
        const b = document.getElementById('blocs').lastElementChild;
        
        b.querySelector('.bloc-title').value = d.title || '';
        b.querySelector('.bloc-exemplaires').value = d.qty || '';
        
        const tbody = b.querySelector('tbody');
        tbody.innerHTML = ''; 
        
        d.lines.forEach(l => {
            ajouterLigne(b.querySelector('button[onclick^="ajouterLigne"]'));
            const tr = tbody.lastElementChild;
            
            tr.querySelector('.service-category').value = l.c;
            majTypeOptions(tr.querySelector('.service-category'));
            
            tr.querySelector('.service-type').value = l.t;
            majFormatOptions(tr.querySelector('.service-type'));
            
            tr.querySelector('.service-format').value = l.f;
            tr.querySelector('.ligne-originaux').value = l.o;
            tr.querySelector('.ligne-exemplaire').value = l.e;
            tr.querySelector('.pu-input').value = l.p;
        });

        if (d.lines.length === 0) {
            if (tbody.children.length > 0) tbody.innerHTML = '';
        }
    });
    recalculer(); 
}

// --- UTILITAIRES UI ---

function checkEmptyState() {
    const isEmpty = document.querySelectorAll('.bloc').length === 0;
    document.getElementById('empty-state').style.display = isEmpty ? 'block' : 'none';
}

function dupliquerBloc(bloc) {
    try {
        saveData(); 
        const data = JSON.parse(localStorage.getItem('devisData'));
        
        let index = Array.from(bloc.parentNode.children).indexOf(bloc);

        if(index > -1 && data.length > index) {
            const duplicatedData = JSON.parse(JSON.stringify(data[index]));
            duplicatedData.title += " (Copie)"; 
            data.splice(index + 1, 0, duplicatedData);
            loadFromJSON(JSON.stringify(data));
            
            const newBloc = document.getElementById('blocs').children[index + 1];
            if (newBloc) {
                 newBloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            showToast("Bloc dupliqué !");
        } else {
            showToast("Erreur duplication.", 'red');
        }
    } catch(e) {
         console.error("Erreur duplication", e);
         showToast("Erreur duplication.", 'red');
    }
}

function toggleAccordion(btn) {
    const bloc = btn.closest('.bloc');
    const content = bloc.querySelector('.bloc-content');
    const icon = btn.querySelector('span');

    if(content.classList.contains('hidden-content')) {
         content.classList.remove('hidden-content');
         icon.classList.remove('icon-chevron-right');
         icon.classList.add('icon-chevron-down');
         setTimeout(() => {
            content.style.paddingTop = '15px';
            content.style.paddingBottom = '20px';
         }, 300); 
    } else {
         content.style.paddingTop = '0';
         content.style.paddingBottom = '0';
         content.classList.add('hidden-content');
         icon.classList.remove('icon-chevron-down');
         icon.classList.add('icon-chevron-right');
    }
}

// --- COPIE PRESSE-PAPIERS ---

function copierDevis() {
    generateTextReport(false);
}

function copierDevisDetaille() {
    generateTextReport(true);
}

/**
 * Génère le rapport texte (Résumé ou Détaillé) pour le client.
 * VERSION AMÉLIORÉE : Visuel plus propre et professionnel pour Email/WhatsApp.
 */
function generateTextReport(detailed) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    
    // En-tête du devis
    let text = `📄 DEVIS\n`;
    text += `📅 Date : ${dateStr}\n`;
    text += `================================\n`;

    let totalG = 0;

    document.querySelectorAll('.bloc').forEach((b, i) => {
        // Récupération des données
        const title = b.querySelector('.bloc-title').value || `Lot n°${i+1}`;
        const totalB = parseFloat(b.dataset.total) || 0;
        const qtyExemplaires = parseFloat(b.dataset.qty) || 0;

        totalG += totalB;
        
        // --- MODE RÉSUMÉ (Simple et efficace) ---
        if (!detailed) {
            // Calcul du PU moyen pour l'affichage global
            const puMoyen = qtyExemplaires > 0 ? totalB / qtyExemplaires : 0;
            
            // Formatage propre
            // Ex: ▪️ Flyers A5 : 1000 ex. × 0.050€ = 50.00 €
            text += `▪️ ${title}\n`;
            text += `   ${qtyExemplaires} ex. × ${puMoyen.toFixed(4)} € = ${totalB.toFixed(2)} €\n`;
            text += `--------------------------------\n`;
        } 
        
        // --- MODE DÉTAILLÉ (Complet pour validation technique) ---
        else {
            text += `📦 ${title.toUpperCase()}\n`;
            text += `   Quantité globale : ${qtyExemplaires} exemplaires\n`;

            b.querySelectorAll('tbody tr').forEach((tr) => {
                const cat = tr.querySelector('.service-category').value;
                if(!cat) return;
                
                const type = tr.querySelector('.service-type').value;
                const fmt = tr.querySelector('.service-format').value;
                
                // Calculs de ligne
                const orig = parseFloat(tr.querySelector('.ligne-originaux').value)||0;
                const ex = parseFloat(tr.querySelector('.ligne-exemplaire').value)||0;
                const qte = orig * ex; 

                // Prix
                const puInput = tr.querySelector('.pu-input');
                const puBase = parseFloat(puInput.placeholder) || 0; 
                const puManuel = parseFloat(puInput.value);
                const puFinal = isNaN(puManuel) || puManuel === 0 ? puBase : puManuel;

                const totalCell = tr.querySelector('.total');
                const tot = parseFloat(totalCell ? totalCell.textContent : 0) || 0;
                
                // Construction du nom de la ligne
                let lineName = cat;
                if(type) lineName += ` ${type}`;
                const isFormatUsed = !tr.querySelector('.service-format').disabled;
                if(fmt && isFormatUsed) lineName += ` ${fmt}`;
                
                // Ligne de détail
                // Ex: ▫️ Impression Couleur A4 (1000) : 0.050€/u -> 50.00€
                text += `   ▫️ ${lineName} (Qté: ${qte}) `;
                text += `       P.U.: ${puFinal.toFixed(4)} €  >>>  ${tot.toFixed(2)} €\n`;
            });

            text += `   ----------------------------\n`;
            text += `   👉 SOUS-TOTAL : ${totalB.toFixed(2)} €\n\n`;
        }
    });
    
    // Pied de page global
    //if (!detailed) text += `\n`; // Petit saut de ligne si résumé
    text += `================================\n`;
    text += `💰 TOTAL TVAC : ${totalG.toFixed(2)} €\n`;
    text += `================================\n`;
    
    // Copie dans le presse-papiers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy'); 
    document.body.removeChild(el);
    
    showToast("Devis copié pour le client !");
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// =================================================================
// SYSTÈME PREFAB (MODÈLES)
// =================================================================

function saveBlocAsPrefab(bloc) {
    const title = bloc.querySelector('.bloc-title').value || "Prefab sans nom";
    
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

    const prefabData = {
        title: title,
        qty: bloc.querySelector('.bloc-exemplaires').value,
        lines: lines
    };

    try {
        const existing = localStorage.getItem('devisPrefabs');
        const prefabs = existing ? JSON.parse(existing) : [];
        prefabs.push(prefabData);
        localStorage.setItem('devisPrefabs', JSON.stringify(prefabs));
        showToast(`Prefab "${title}" sauvegardé !`);
    } catch(e) {
        console.error(e);
        showToast("Erreur sauvegarde prefab", 'red');
    }
}

function openPrefabModal() {
    const overlay = document.getElementById('prefab-overlay');
    const container = document.getElementById('prefab-list');
    overlay.classList.add('show');
    
    const existing = localStorage.getItem('devisPrefabs');
    const prefabs = existing ? JSON.parse(existing) : [];

    container.innerHTML = '';

    if(prefabs.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">Aucun prefab sauvegardé.</p>';
        return;
    }

    prefabs.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'prefab-item';
        item.innerHTML = `
            <div class="prefab-info">
                <strong>${p.title}</strong>
                <small>${p.lines.length} lignes | Qté Défaut: ${p.qty || 1}</small>
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
        ajouterLigne(bloc.querySelector('button[onclick^="ajouterLigne"]'));
        const tr = tbody.lastElementChild;

        tr.querySelector('.service-category').value = l.c;
        majTypeOptions(tr.querySelector('.service-category')); 

        tr.querySelector('.service-type').value = l.t;
        majFormatOptions(tr.querySelector('.service-type')); 

        tr.querySelector('.service-format').value = l.f;
        tr.querySelector('.ligne-originaux').value = l.o;
        tr.querySelector('.ligne-exemplaire').value = l.e;
        tr.querySelector('.pu-input').value = l.p;
    });

    closePrefabModal();
    recalculer();
    checkEmptyState();
    bloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast("Prefab chargé !");
}

// Exposer les fonctions globalement
window.saveBlocAsPrefab = saveBlocAsPrefab;
window.openPrefabModal = openPrefabModal;
window.closePrefabModal = closePrefabModal;
window.deletePrefab = deletePrefab;
window.loadPrefab = loadPrefab;
window.askResetApp = askResetApp;
window.askDeleteBloc = askDeleteBloc;
window.ajouterBloc = ajouterBloc;
window.ajouterLigne = ajouterLigne;
window.majTypeOptions = majTypeOptions;
window.majFormatOptions = majFormatOptions;
window.majExemplairesLignes = majExemplairesLignes;
window.recalculer = recalculer;
window.dupliquerBloc = dupliquerBloc;
window.toggleAccordion = toggleAccordion;
window.copierDevis = copierDevis;
window.copierDevisDetaille = copierDevisDetaille;
window.closeModal = closeModal;



