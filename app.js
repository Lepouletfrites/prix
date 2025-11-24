// =================================================================
// APPLICATION LOGIC (Quote Generator)
// =================================================================
let blocId = 0;

/**
 * Initialization function executed once the DOM is fully loaded.
 * Loads saved data from localStorage or initializes a new block.
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const savedData = localStorage.getItem('devisData');
    const parsedData = savedData ? JSON.parse(savedData) : null;
    
    if (parsedData && parsedData.length > 0) {
        loadFromJSON(savedData);
    } else {
        // Add a clean, empty block if no data is found
        ajouterBloc(true, true); 
    }
  } catch (e) {
    // Fallback to adding a clean block if localStorage fails
    ajouterBloc(true, true);
  }
  checkEmptyState();
  recalculer();
});

// --- MODAL SYSTEM (Custom Confirmation) ---

/**
 * Opens the custom confirmation modal.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message displayed in the modal.
 * @param {function} onConfirm - Callback function to execute on confirmation.
 */
function openModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    const overlay = document.getElementById('modal-overlay');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    overlay.classList.add('show');

    // Replace button to ensure a single event listener
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.onclick = () => {
        if(onConfirm) onConfirm();
        closeModal();
    };
}

/**
 * Closes the custom confirmation modal.
 */
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

// --- MAIN ACTION FUNCTIONS ---

/**
 * Prompts for confirmation and resets the entire application state.
 */
function askResetApp() {
    openModal(
      'Reset Quote?', 
      'Are you sure you want to erase everything? This action is irreversible and will delete all blocks and lines.', 
      () => {
        document.getElementById('blocs').innerHTML = '';
        try { localStorage.removeItem('devisData'); } catch(e) {}
        // Add one clean block after reset
        ajouterBloc(true, true); 
        checkEmptyState();
        showToast("Quote reset!");
    });
}

/**
 * Prompts for confirmation and deletes a specific block.
 * @param {HTMLElement} bloc - The block element to delete.
 */
function askDeleteBloc(bloc) {
    openModal(
      'Delete this Block?', 
      'Do you want to delete this block from your quote?', 
      () => {
        bloc.style.opacity = '0';
        bloc.style.maxHeight = '0';
        bloc.style.marginBottom = '0';
        setTimeout(() => {
            bloc.remove();
            recalculer();
            checkEmptyState();
        }, 300);
        showToast("Block deleted.");
    });
}

/**
 * Adds a new block (card) to the quote.
 * @param {boolean} initialEmpty - True if the block must start with empty values (for first load or explicit New Block).
 * @param {boolean} doRecalc - True to force recalculation and state check immediately.
 */
function ajouterBloc(initialEmpty = false, doRecalc = true) {
  const blocsContainer = document.getElementById('blocs');
  const bloc = document.createElement('div');
  bloc.className = 'bloc';
  const id = 'bloc-' + blocId++;
  bloc.setAttribute('data-bloc-id', id);

  // Enforce empty values if initialEmpty is true
  const initialTitle = "";
  const initialQty = "";
  const placeholderTitle = "Block Name (e.g., A5 Flyers)";
  const placeholderQty = "Qty";


  bloc.innerHTML = `
    <div class="bloc-header">
        <button class="toggle-accordion" title="Toggle content visibility" onclick="toggleAccordion(this)">
            <span class="icon-chevron-down"></span>
        </button>
        <input type="text" placeholder="${placeholderTitle}" value="${initialTitle}" class="bloc-title" oninput="recalculer()">
        
        <label class="bloc-label">Copies Qty:</label>
        <input type="number" value="${initialQty}" min="0" placeholder="${placeholderQty}" class="bloc-exemplaires" oninput="majExemplairesLignes(this)">
        
        <div class="bloc-actions">
            <button onclick="dupliquerBloc(this.closest('.bloc'))" title="Duplicate block" class="btn-base btn-line icon-copy">Duplicate</button>
            <button onclick="askDeleteBloc(this.closest('.bloc'))" title="Delete block" class="btn-base delete-btn icon-trash"></button>
        </div>
    </div>

    <div class="bloc-content">
        <table>
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th style="text-align: center;">Originals</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price (€)</th>
                    <th style="text-align: right;">Total (€)</th>
                    <th style="width: 30px;"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div class="bloc-footer">
            <button onclick="ajouterLigne(this)" class="btn-base btn-line icon-plus">Add Line</button>
            <div>
                <span style="font-weight: 500;">Sub-Total:</span> 
                <span class="total-bloc-valeur">0.00</span> €
            </div>
        </div>
    </div>
  `;

  blocsContainer.appendChild(bloc);
  
  // Add a default line only if not intended to be an empty block
  if(!initialEmpty) {
      ajouterLigne(bloc.querySelector('button[onclick^="ajouterLigne"]'));
  }
  
  if(doRecalc) {
      recalculer();
      checkEmptyState();
      // Only scroll if it's an explicit action (not initial empty block)
      if(!initialEmpty) {
         bloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }
}

/**
 * Adds a new service line to a block's table.
 * @param {HTMLElement} btn - The button element that triggered the function (used to find the parent block).
 */
function ajouterLigne(btn) {
  const bloc = btn.closest('.bloc');
  const tbody = bloc.querySelector('tbody');
  // Use the value from the block's main Qty, defaulting to 1
  const exBloc = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 1;
  
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td><select class="service-category" onchange="majTypeOptions(this)"><option value="">- Select -</option></select></td>
    <td><select class="service-type" disabled onchange="majFormatOptions(this)"><option value="">- Type -</option></select></td>
    <td><select class="service-format" disabled onchange="recalculer()"><option value="">- Size -</option></select></td>
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

  // Fill Categories
  const selCat = tr.querySelector('.service-category');
  Object.keys(window.services).forEach(k => {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = k;
      selCat.appendChild(opt);
  });

  tbody.appendChild(tr);
}

// --- CALCULATIONS & CASCADES ---

/**
 * Updates the 'Type' dropdown options based on the selected 'Category'.
 * Disables 'Format' if the service is only 2-level (Category -> Type).
 * @param {HTMLSelectElement} selCat - The Category select element.
 */
function majTypeOptions(selCat) {
    const tr = selCat.closest('tr');
    const selType = tr.querySelector('.service-type');
    const selFmt = tr.querySelector('.service-format');
    const cat = selCat.value;

    selType.innerHTML = '<option value="">- Type -</option>';
    selFmt.innerHTML = '<option value="">- Size -</option>';
    
    if(cat && window.services[cat]) {
        selType.disabled = false;
        selType.style.backgroundColor = '#fff';
        
        const data = window.services[cat];
        // Check if the service is 3-level (Type is followed by a Format/Size level)
        const is3Lvl = Object.values(data).some(v => !Array.isArray(v));
        
        Object.keys(data).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = k;
            selType.appendChild(opt);
        });
        
        // Disable Format selector if 2-level
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

/**
 * Updates the 'Format' dropdown options based on the selected 'Type'.
 * @param {HTMLSelectElement} selType - The Type select element.
 */
function majFormatOptions(selType) {
    const tr = selType.closest('tr');
    const cat = tr.querySelector('.service-category').value;
    const type = selType.value;
    const selFmt = tr.querySelector('.service-format');
    
    selFmt.innerHTML = '<option value="">- Size -</option>';
    
    try {
        const data = window.services[cat][type];
        // Check if the next level is an object (3-level) or an array (2-level)
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

/**
 * Updates the 'Quantity' input for all lines within a block
 * when the main block quantity is changed.
 * @param {HTMLInputElement} input - The main block quantity input.
 */
function majExemplairesLignes(input) {
    const val = input.value;
    const bloc = input.closest('.bloc');
    // Update all line Qty inputs in the block
    bloc.querySelectorAll('.ligne-exemplaire').forEach(inp => inp.value = val);
    recalculer();
}

/**
 * Main calculation function.
 * 1. Collects all quantities to determine pricing tiers (degressivity).
 * 2. Applies the determined prices (or manual input) to each line.
 * 3. Updates all line, block, and grand totals.
 * 4. Saves the data to localStorage.
 */
/**
 * Main calculation function.
 * 1. Collects all quantities to determine pricing tiers, applying fixed price and rounding rules.
 * 2. Applies the determined prices (from data.js) to each line.
 * 3. Updates all line, block, and grand totals.
 * 4. Saves the data to localStorage.
 */
function recalculer() {
    let totalGeneral = 0;
    const lignesParService = {}; // Total quantity per service key for tier calculation
    const dataLignes = [];

    // 1. COLLECT QUANTITIES & APPLY FORMAT/FIXED-PRICE RULES
    document.querySelectorAll('.bloc').forEach(bloc => {
        bloc.querySelectorAll('tbody tr').forEach(tr => {
            const cat = tr.querySelector('.service-category').value;
            const type = tr.querySelector('.service-type').value;
            const fmt = tr.querySelector('.service-format').value;
            
            if(!cat || !type) return;

            // 1a. Build the unique service key (e.g., Printing|B/W|A4)
            let key = `${cat}|${type}`;
            const isFormatUsed = !tr.querySelector('.service-format').disabled;
            if(fmt && isFormatUsed) key += `|${fmt}`;
            
            const origInput = tr.querySelector('.ligne-originaux');
            const exInput = tr.querySelector('.ligne-exemplaire');
            const orig = parseFloat(origInput.value) || 0;
            let ex = parseFloat(exInput.value) || 0;

            // 1b. Check for fixed price status from data.js
            let paliersCheck = null;
            try {
                const root = window.services[cat][type];
                paliersCheck = Array.isArray(root) ? root : root[fmt];
            } catch(e) { /* Incomplete selection */ }

            const isFixed = paliersCheck && paliersCheck[0] && paliersCheck[0].fixed_price;

            // 1c. Apply rules based on fixed price or format
            if (isFixed) {
                // FIXED PRICE RULE: Force Qty to 1 and disable inputs
                ex = 1;
                origInput.value = 1;
                exInput.value = 1;
                origInput.disabled = true;
                exInput.disabled = true;
            } else {
                // STANDARD RULES: Re-enable inputs and apply A5/A6 rounding
                origInput.disabled = false;
                exInput.disabled = false;
                
                if(['Print'].includes(cat)) {
                    if(fmt === 'A5') {
                        // Arrondi au multiple supérieur de 2 (A5 -> 2/A4)
                        ex = Math.ceil(ex / 2) * 2;
                    } else if(fmt === 'A6') {
                        // Arrondi au multiple supérieur de 4 (A6 -> 4/A4)
                        ex = Math.ceil(ex / 4) * 4;
                    }
                }
            }
            
            const qte = orig * ex; // Total calculated quantity

            // Accumulate quantity for degressivity lookup (using the real key)
            if(!lignesParService[key]) lignesParService[key] = 0;
            lignesParService[key] += qte;
            
            dataLignes.push({ tr, key, qte, cat, type, fmt, isFixed });
        });
    });

    // 2. APPLY PRICES & UPDATE DISPLAY
    document.querySelectorAll('.bloc').forEach(bloc => {
        let totalBloc = 0;
        const qtyExemplaires = parseFloat(bloc.querySelector('.bloc-exemplaires').value) || 0;

        bloc.querySelectorAll('tbody tr').forEach(tr => {
            const data = dataLignes.find(d => d.tr === tr);
            const puInput = tr.querySelector('.pu-input');
            const totalCell = tr.querySelector('.total');

            if(!data) {
                totalCell.textContent = '0.00';
                return;
            }

            let paliers = null;
            try {
                const root = window.services[data.cat][data.type];
                paliers = Array.isArray(root) ? root : root[data.fmt];
            } catch(e) { /* Incomplete selection */ }

            let puBase = 0;
            let minTotal = 0;
            
            if(paliers) {
               const isFixed = paliers[0] && paliers[0].fixed_price;
               
               if (isFixed) {
                   // FIXED PRICE LOGIC: Take price from the first tier, ignore quantity
                   puBase = paliers[0].prix || 0;
                   minTotal = paliers[0].mint || 0;
               } else {
                   // STANDARD DEGRESSIVITY LOGIC
                   const totalQte = lignesParService[data.key] || 0;
                   const palierTrouve = [...paliers].reverse().find(p => (p.min||0) <= totalQte) || paliers[0];
                   puBase = palierTrouve ? (palierTrouve.prix || 0) : 0;
                   minTotal = palierTrouve ? (palierTrouve.mint || 0) : 0;
               }
            }

            // Update the placeholder of the Unit Price
            puInput.placeholder = puBase.toFixed(4);
            
            const puManuel = parseFloat(puInput.value);
            // Use manual price if valid and not 0, otherwise use base price
            const puFinal = isNaN(puManuel) || puManuel === 0 ? puBase : puManuel;

            // Style to indicate a manual UP
            if(!isNaN(puManuel) && puManuel !== puBase && puManuel > 0) {
                 puInput.classList.add('custom');
            } else {
                puInput.classList.remove('custom');
                if(puManuel === 0) puInput.value = ''; // Reset input if 0 is entered
            }

            // Line Total (using the corrected quantity from the first loop)
            let tot = data.qte * puFinal;
            if(minTotal > 0 && data.qte > 0 && tot < minTotal) tot = minTotal; 

            totalCell.textContent = tot.toFixed(2);
            totalBloc += tot;
        });
        
        const totalElement = bloc.querySelector('.total-bloc-valeur');
        totalElement.textContent = totalBloc.toFixed(2);
        bloc.dataset.total = totalBloc.toFixed(2);
        bloc.dataset.qty = qtyExemplaires;

        totalGeneral += totalBloc;
    });

    document.getElementById('total-general').textContent = totalGeneral.toFixed(2) + ' €';
    saveData();
}



// --- SAVE & LOAD ---

/**
 * Saves all quote data (blocks, lines, selections, inputs) to localStorage.
 */
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
      console.error("Local save error:", e);
    }
}

/**
 * Loads quote data from a JSON string and re-creates the blocks and lines.
 * @param {string} json - The JSON string containing the saved quote data.
 */
function loadFromJSON(json) {
    const data = JSON.parse(json);
    document.getElementById('blocs').innerHTML = '';
    
    if (data.length === 0) {
        // If saved data is an empty array, add one clean block
        ajouterBloc(true, false);
        return;
    }

    data.forEach(d => {
        // Pass 'false' for initialEmpty and doRecalc to handle loading lines manually
        ajouterBloc(false, false); 
        const b = document.getElementById('blocs').lastElementChild;
        
        // Set block title and quantity
        b.querySelector('.bloc-title').value = d.title || '';
        b.querySelector('.bloc-exemplaires').value = d.qty || '';
        
        const tbody = b.querySelector('tbody');
        tbody.innerHTML = ''; // Clear the default line added by ajouterBloc(false, false)
        
        d.lines.forEach(l => {
            // Add line and populate values in cascade
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

        // Clean up if the block was loaded with no lines
        if (d.lines.length === 0) {
            if (tbody.children.length > 0) tbody.innerHTML = '';
        }
    });
    recalculer(); // Final recalculation after all blocks are loaded
}

// --- UI UTILITIES ---

/**
 * Toggles the empty state message visibility based on the number of blocks.
 */
function checkEmptyState() {
    const isEmpty = document.querySelectorAll('.bloc').length === 0;
    document.getElementById('empty-state').style.display = isEmpty ? 'block' : 'none';
}

/**
 * Duplicates a block and inserts the copy immediately after the original.
 * @param {HTMLElement} bloc - The block element to duplicate.
 */
function dupliquerBloc(bloc) {
    try {
        saveData(); 
        const data = JSON.parse(localStorage.getItem('devisData'));
        
        // Find the index of the block to duplicate
        let index = Array.from(bloc.parentNode.children).indexOf(bloc);

        if(index > -1 && data.length > index) {
            const duplicatedData = JSON.parse(JSON.stringify(data[index]));
            // Modify the title to indicate it's a copy
            duplicatedData.title += " (Copy)"; 
            data.splice(index + 1, 0, duplicatedData);
            loadFromJSON(JSON.stringify(data));
            
            // Find the new block to scroll to
            const newBloc = document.getElementById('blocs').children[index + 1];
            if (newBloc) {
                 newBloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            showToast("Block duplicated!");
        } else {
            showToast("Duplication error.", 'red');
        }
    } catch(e) {
         console.error("Duplication error", e);
         showToast("Duplication error.", 'red');
    }
}

/**
 * Toggles the visibility of a block's content (accordion style).
 * @param {HTMLElement} btn - The toggle button element.
 */
function toggleAccordion(btn) {
    const bloc = btn.closest('.bloc');
    const content = bloc.querySelector('.bloc-content');
    const icon = btn.querySelector('span');

    if(content.classList.contains('hidden-content')) {
         content.classList.remove('hidden-content');
         icon.classList.remove('icon-chevron-right');
         icon.classList.add('icon-chevron-down');
         // Adjust padding after opening (timeout matches CSS transition)
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

// --- COPY TO CLIPBOARD ---

/**
 * Generates and copies a summary report to the clipboard.
 */
function copierDevis() {
    generateTextReport(false);
}

/**
 * Generates and copies a detailed report to the clipboard.
 */
function copierDevisDetaille() {
    generateTextReport(true);
}

/**
 * Generates the text report (summary or detailed) and copies it.
 * @param {boolean} detailed - If true, generates the detailed report.
 */
function generateTextReport(detailed) {
    let text = ""; 

    let totalG = 0;

    document.querySelectorAll('.bloc').forEach((b, i) => {
        // Get block info from inputs and data attributes
        const title = b.querySelector('.bloc-title').value || `Block ${i+1} (Untitled)`;
        const totalB = parseFloat(b.dataset.total) || 0;
        const qtyExemplaires = parseFloat(b.dataset.qty) || 0;

        totalG += totalB;
        
        // --- Summary Logic (detailed = false) ---
        if (!detailed) {
            // Calculate average UP for display (avoid division by zero)
            const puMoyen = qtyExemplaires > 0 ? totalB / qtyExemplaires : 0;

            // Format: Block Name 10 pc x 0.5000€ -> 5.00€
            const qtyFormatted = qtyExemplaires.toFixed(0);
            const puFormatted = puMoyen.toFixed(4).replace(/\.0000$/, '.00'); // Simplify .0000 to .00
            const totalFormatted = totalB.toFixed(2);
            
            text += `🟦 ${title} | ${qtyFormatted} pc x ${puFormatted}€ -> ${totalFormatted} €\n`;
        } 
        
        // --- Detailed Logic (detailed = true) ---
        else {
            text += `\n- - - - - - - - - - - - - - -\n`;
            text += `${title}\n`;
            text += `Total copies: ${qtyExemplaires}\n`;

            b.querySelectorAll('tbody tr').forEach((tr) => {
                const cat = tr.querySelector('.service-category').value;
                if(!cat) return;
                
                const type = tr.querySelector('.service-type').value;
                const fmt = tr.querySelector('.service-format').value;
                
                const orig = parseFloat(tr.querySelector('.ligne-originaux').value)||0;
                const ex = parseFloat(tr.querySelector('.ligne-exemplaire').value)||0;
                const qte = orig * ex; // Total quantity for the line

                const puInput = tr.querySelector('.pu-input');
                const puBase = parseFloat(puInput.placeholder) || 0; 
                const puManuel = parseFloat(puInput.value);
                const puFinal = isNaN(puManuel) || puManuel === 0 ? puBase : puManuel;

                const totalCell = tr.querySelector('.total');
                const tot = parseFloat(totalCell ? totalCell.textContent : 0) || 0;
                
                let lineName = cat;
                if(type) lineName += ` ${type}`;
                const isFormatUsed = !tr.querySelector('.service-format').disabled;
                if(fmt && isFormatUsed) lineName += ` ${fmt}`;
                
                const puAffiche = puFinal.toFixed(4); 
                const totalFormatted = tot.toFixed(2);
                text += `  - ${lineName} | Total Qty: ${qte} | UP: ${puAffiche} € | TOTAL: ${totalFormatted} €\n`;
            });

            // Display block sub-total in detailed mode
            text += `Sub-Total: ${totalB.toFixed(2)} €\n`;
        }
    });
    
    // Display grand total (in both modes)
    text += `\n================================\n`;
    text += `GRAND TOTAL: ${totalG.toFixed(2)} € Incl. VAT`;
    
    // Copy the generated text to clipboard using a temporary textarea
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy'); 
    document.body.removeChild(el);
    
    showToast("Copied to clipboard!");
}

/**
 * Displays a temporary toast notification at the bottom of the screen.
 * @param {string} msg - The message to display.
 */
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// Make functions globally accessible for inline HTML calls
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

