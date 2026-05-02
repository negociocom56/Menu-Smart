// =============================================
// BOCADO v3 — Complete Application Logic
// =============================================

// ---- 1. SEED DATA: Products ----
const SEED_PRODUCTS = [
    { id: 1, name: 'Milanesa a caballo', price: 10000, category: 'Platos Principales', img: 'https://i.ibb.co/N6SXd3h8/IMG-6873.jpg', desc: 'Con guarnición de arroz amarillo, fideos o papas fritas.' },
    { id: 2, name: 'Lampreado', price: 9000, category: 'Platos Principales', img: 'https://i.ibb.co/zWm1fWbN/IMG-20260304-103035-702.jpg', desc: 'Con guarnición.' },
    { id: 3, name: 'Napolitana de carne', price: 10000, category: 'Platos Principales', img: 'https://www.tasteatlas.com/images/recipes/a1017b88b434452fa51310b3dd2d2cc3.jpg?mw=910', desc: 'Con guarnición.' },
];

// ---- 2. SEED DATA: Promo Banners ----
const SEED_BANNERS = [
    { id: 1, title: '🛵 Envío GRATIS', subtitle: 'En pedidos dentro de las 4 avenidas (centro).', color: '#14281a' },
];
// ---- 3. STATE ----
let products = JSON.parse(localStorage.getItem('bocado_products')) || SEED_PRODUCTS;
let banners = JSON.parse(localStorage.getItem('bocado_banners')) || SEED_BANNERS;
let schedules = JSON.parse(localStorage.getItem('bocado_schedules')) || [];
let cart = [];
let currentCat = 'Todo';
let searchQuery = '';
let currentSlide = 0;

// Map Variables
let map = null;
let marker = null;
let currentLat = -26.830419; // Default center (Tucuman)
let currentLng = -65.203794;
const GUARNICIONES = [
    'Arroz Amarillo',
    'Ensalada Mixta',
    'Papas Fritas',
    'Fideos al Pesto',
    'Fideos con Queso',
    'Fideos con Manteca'
];

// ===================================================
// CONFIGURACIÓN MAESTRA (Sólo para Synergy Dev)
// ===================================================
const CLOUD_URL = 'https://script.google.com/macros/s/AKfycbwVXPXZGGMozf2E213UnxdmlBwr9TSX2cmkCxMXgpZpO9zNo6DrWYzd7-5MM050jOyJ/exec'; // Pega aquí tu URL de Google Apps Script (terminada en /exec)
// ===================================================

// ---- 4. INIT ----
async function init() {
    renderBanners();
    renderCategories();
    renderProducts();
    setupEvents();
    startCarousel();

    // Intentar carga desde la nube si hay URL configurada
    if (CLOUD_URL) {
        await syncFromCloud();
    }
}

async function syncFromCloud() {
    try {
        const res = await fetch(CLOUD_URL);
        const data = await res.json();
        if (data.products) {
            products = data.products;
            localStorage.setItem('bocado_products', JSON.stringify(products));
        }
        if (data.banners) {
            banners = data.banners;
            localStorage.setItem('bocado_banners', JSON.stringify(banners));
        }
        if (data.schedules) {
            schedules = data.schedules;
            localStorage.setItem('bocado_schedules', JSON.stringify(schedules));
        }
        if (data.config) {
            const shopOpen = data.config.find(c => c.key === 'shop_open');
            if (shopOpen) {
                const isOpen = shopOpen.value === true || String(shopOpen.value).toLowerCase() === 'true';
                localStorage.setItem('bocado_shop_open', isOpen);
            }
        }
        renderBanners();
        renderCategories();
        renderProducts();
    } catch (e) {
        console.error("Cloud Sync Error:", e);
    }
}

async function cloudSave(action, payload) {
    if (!CLOUD_URL) return;
    // Usamos mode: no-cors y text/plain para saltar las restricciones de Google
    await fetch(CLOUD_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload })
    });
}

// ==== KILL SWITCH (SISTEMA DE SEGURIDAD SAAS) ====
async function initSecurity() {
    try {
        // Imagina que este JSON lo subes a tu propio GitHub o servidor:
        // Contenido del JSON: { "bocado_demo": true, "pizzeria_juan": false }
        const CONTROL_URL = 'https://tudominio.com/clientes.json';

        // Descomentar lo siguiente cuando tengas la URL real
        /*
        const res = await fetch(CONTROL_URL);
        const clientes = await res.json();
        
        // Cambia "bocado_demo" por el ID que le asignes a este cliente
        if (clientes["bocado_demo"] === false) {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#1a1311; color:white; font-family:sans-serif; text-align:center; padding:20px;">
                    <h1 style="color:#e74c3c;">🛑 Servicio Suspendido</h1>
                    <p style="margin-top:10px;">Comuníquese con la administración para reactivar su menú.</p>
                </div>`;
            throw new Error("Sistema bloqueado por falta de pago");
        }
        */
    } catch (e) {
        console.warn("Error en validación de seguridad (ignorar en local)", e);
    }
}
// ===================================================

// ---- 5. HELPERS ----
function getDirectImageUrl(url) {
    if (!url) return '';
    // Intenta convertir enlaces de Google Drive a links directos de imagen
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    } else if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
}

// ---- 6. CAROUSEL ----
function renderBanners() {
    const track = document.getElementById('promo-track');
    const dots = document.getElementById('promo-dots');
    if (!track || !dots) return;

    if (banners.length === 0) {
        document.getElementById('promo-carousel').style.display = 'none';
        dots.style.display = 'none';
        return;
    }

    track.innerHTML = banners.map(b => `
        <div class="promo-slide" style="background: linear-gradient(135deg, ${b.color} 0%, ${lightenColor(b.color, 20)} 100%);">
            <h2>${b.title}</h2>
            <p>${b.subtitle}</p>
        </div>
    `).join('');

    dots.innerHTML = banners.map((_, i) => `
        <button class="promo-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>
    `).join('');

    dots.querySelectorAll('.promo-dot').forEach(dot => {
        dot.onclick = () => goToSlide(parseInt(dot.dataset.slide));
    });
}

function goToSlide(i) {
    currentSlide = i;
    const track = document.getElementById('promo-track');
    if (track) track.style.transform = `translateX(-${i * 100}%)`;
    document.querySelectorAll('.promo-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
}

function startCarousel() {
    if (banners.length <= 1) return;
    setInterval(() => {
        currentSlide = (currentSlide + 1) % banners.length;
        goToSlide(currentSlide);
    }, 5000);
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `rgb(${r},${g},${b})`;
}

// ---- 6. CATEGORIES ----
function renderCategories() {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    const cats = ['Todo', ...new Set(products.map(p => p.category))];
    nav.innerHTML = cats.map(c => `
        <button class="cat-pill ${c === currentCat ? 'active' : ''}" data-category="${c}">${c}</button>
    `).join('');
    nav.querySelectorAll('.cat-pill').forEach(pill => {
        pill.onclick = () => {
            currentCat = pill.dataset.category;
            renderCategories();
            renderProducts();
        };
    });
}

// ---- 7. PRODUCTS ----
function renderProducts() {
    const grid = document.getElementById('product-list');
    if (!grid) return;

    let list = products;
    if (currentCat !== 'Todo') list = list.filter(p => p.category === currentCat);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Ocultar inactivos (los que el admin desactivó del menú)
    list = list.filter(p => {
        const isInactive = p.active === false || String(p.active).toUpperCase() === 'FALSE' || String(p.active).toUpperCase() === 'FALSO';
        return !isInactive;
    });

    // Ordenar por sortOrder
    list.sort((a, b) => {
        const orderA = parseInt(a.sortOrder) || 0;
        const orderB = parseInt(b.sortOrder) || 0;
        return orderA - orderB;
    });

    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>No se encontraron productos.</p></div>`;
        return;
    }

    // Definir orden de categorías
    const categoryOrder = ['Menú Trabajador', 'Menú Habitual', 'Platos Principales', 'Combos'];
    
    // Agrupar por categoría
    const grouped = {};
    list.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    });

    // Obtener todas las categorías presentes
    let categoriesPresent = Object.keys(grouped);
    
    // Ordenar las categorías: primero las del categoryOrder, luego el resto alfabéticamente
    categoriesPresent.sort((a, b) => {
        let indexA = categoryOrder.indexOf(a);
        let indexB = categoryOrder.indexOf(b);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        if (indexA !== indexB) return indexA - indexB;
        return a.localeCompare(b);
    });

    let html = '';
    categoriesPresent.forEach(cat => {
        html += `<h2 class="category-title" style="grid-column: 1/-1; margin-top: 30px; margin-bottom: 15px; font-size: 1.5rem; color: var(--primary); border-bottom: 2px solid var(--primary-light); padding-bottom: 8px; width: 100%;">${cat}</h2>`;
        
        grouped[cat].forEach(p => {
            const inCart = cart.find(c => String(c.id) === String(p.id));
            const finalImgUrl = getDirectImageUrl(p.img);
            
            const stockVal = parseInt(p.stock);
            const isAgotado = isNaN(stockVal) || stockVal <= 0;
            const isAvailable = !isAgotado;

            let actionHtml = '';
            if (!isAvailable) {
                actionHtml = `<button class="btn-add" style="width:auto;padding:0 16px;background:var(--text-muted);cursor:not-allowed;" disabled>AGOTADO</button>`;
            } else if (inCart) {
                actionHtml = `
                    <div class="qty-control">
                        <button onclick="changeQty('${p.id}',-1)"><i class="fas fa-minus"></i></button>
                        <span>${inCart.qty}</span>
                        <button onclick="changeQty('${p.id}',1)"><i class="fas fa-plus"></i></button>
                    </div>
                `;
            } else {
                actionHtml = `<button class="btn-add" onclick="addItem('${p.id}')"><i class="fas fa-plus"></i></button>`;
            }

            const allowedStr = p.allowedSides || '';
            const allowedArray = allowedStr.split(',').filter(x => x.trim() !== '');
            const limit = parseInt(p.sidesLimit) || 1;
            const selectedSides = inCart ? (inCart.selectedSides || []) : [];

            html += `
            <div class="product-card" id="card-${p.id}" style="${!isAvailable ? 'opacity:0.6;' : ''}">
                <span class="cat-badge" style="${!isAvailable ? 'background:var(--text-muted);' : ''}">${!isAvailable ? 'AGOTADO' : p.category}</span>
                <img src="${finalImgUrl}" alt="${p.name}" class="card-img" style="${!isAvailable ? 'filter:grayscale(1);' : ''}" onerror="this.src='https://placehold.co/600x400/f3eeea/a89e96?text=${encodeURIComponent(p.name)}'">
                <div class="card-body">
                    <h3>${p.name}</h3>
                    <p class="desc">${p.desc}</p>
                    <div class="card-footer">
                        <span class="card-price" style="${!isAvailable ? 'color:var(--text-muted);' : ''}">$${p.price.toLocaleString('es-AR')}</span>
                        ${actionHtml}
                    </div>
                    ${inCart && isAvailable ? `
                        ${allowedArray.length > 0 ? `
                            <div style="margin-top:10px; background:var(--bg-muted); padding:10px; border-radius:8px;">
                                <label style="font-size:0.75rem; font-weight:bold; color:var(--primary); display:block; margin-bottom:6px;">🥗 ELEGÍ TU GUARNICIÓN (Máx. ${limit}):</label>
                                <div style="display:grid; grid-template-columns:1fr; gap:6px;">
                                    ${allowedArray.map(g => `
                                        <label style="display:flex; align-items:center; gap:8px; font-size:0.8rem; cursor:pointer;">
                                            <input type="checkbox" onchange="toggleSide('${p.id}', '${g}')" 
                                                ${selectedSides.includes(g) ? 'checked' : ''}
                                                style="width:16px; height:16px; accent-color:var(--primary);">
                                            ${g}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <input type="text" class="note-input" placeholder="✏️ Aclaración (ej: sin picante)" 
                               value="${inCart.note || ''}" 
                               oninput="updateNote('${p.id}', this.value)" style="margin-top:8px;">
                    ` : ''}
                </div>
            </div>`;
        });
    });
    grid.innerHTML = html;
}

// ---- 8. CART LOGIC ----
function addItem(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const stockVal = parseInt(p.stock);
    if (isNaN(stockVal) || stockVal <= 0) {
        toast('Este producto está agotado');
        return;
    }
    cart.push({ ...p, qty: 1, note: '' });
    toast(`${p.name} agregado ✓`);
    refresh();
}

function changeQty(id, delta) {
    const item = cart.find(c => String(c.id) === String(id));
    if (!item) return;

    if (delta > 0) {
        const p = products.find(x => String(x.id) === String(id));
        const stockVal = parseInt(p?.stock);
        if (isNaN(stockVal) || (item.qty + delta) > stockVal) {
            toast('Stock máximo alcanzado');
            return;
        }
    }

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(c => String(c.id) !== String(id));
        toast('Producto removido');
    }
    refresh();
}

function updateNote(id, val) {
    const item = cart.find(c => String(c.id) === String(id));
    if (item) item.note = val;
    localStorage.setItem('bocado_cart', JSON.stringify(cart));
}

function updateSide(id, val) {
    // Deprecated for toggleSide
}

function toggleSide(id, side) {
    const item = cart.find(c => String(c.id) === String(id));
    if (!item) return;
    
    const p = products.find(x => String(x.id) === String(id));
    const limit = parseInt(p?.sidesLimit) || 1;
    
    if (!item.selectedSides) item.selectedSides = [];
    
    if (item.selectedSides.includes(side)) {
        item.selectedSides = item.selectedSides.filter(s => s !== side);
    } else {
        if (item.selectedSides.length < limit) {
            item.selectedSides.push(side);
        } else {
            toast(`Máximo ${limit} guarniciones`);
            renderProducts(); 
            return;
        }
    }
    localStorage.setItem('bocado_cart', JSON.stringify(cart));
    renderProducts();
}

function refresh() {
    renderProducts();
    const qty = cart.reduce((a, c) => a + c.qty, 0);
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

    const bar = document.getElementById('cart-float');
    const badge = document.getElementById('header-badge');

    if (qty > 0) {
        bar.classList.add('visible');
        badge.classList.add('show');
        badge.innerText = qty;
        document.getElementById('cart-qty').innerText = qty;
        document.getElementById('cart-total').innerText = total.toLocaleString('es-AR');
    } else {
        bar.classList.remove('visible');
        badge.classList.remove('show');
    }
}

// ---- 9. CHECKOUT ----
function openCheckout() {
    // === BLOQUEO MANUAL (ADMIN) ===
    const isShopOpenManual = localStorage.getItem('bocado_shop_open') !== 'false';
    if (!isShopOpenManual) {
        toast('🛵 El local está cerrado por el momento. ¡Volvemos pronto!');
        return;
    }

    /* === CIERRE AUTOMÁTICO (Hora Argentina) ===
    const now = new Date();
    const argTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
    const argDate = new Date(argTimeStr); // Parse as local to extract hours/minutes

    if (argDate.getHours() < 10 || argDate.getHours() > 15 || (argDate.getHours() === 15 && argDate.getMinutes() >= 30)) {
        toast('El local se encuentra cerrado. (Abre a las 10:00)');
        return;
    }
    */

    const ov = document.getElementById('checkout-overlay');
    ov.classList.add('open');

    // Populate Schedules
    const timeSelect = document.getElementById('cust-time');
    if (timeSelect) {
        const activeSchedules = schedules.filter(s => s.active !== false);
        if (activeSchedules.length > 0) {
            timeSelect.innerHTML = '<option value="">Seleccioná un horario...</option>' +
                activeSchedules.map(s => `<option value="${s.time}">${s.time}</option>`).join('');
        } else {
            timeSelect.innerHTML = '<option value="">Sin horarios disponibles hoy</option>';
        }
    }

    let total = cart.reduce((a, c) => a + c.price * c.qty, 0);
    if (document.getElementById('opt-cubiertos')?.checked) total += 200;
    if (document.getElementById('opt-envio-prio')?.checked) total += 2000;
    document.getElementById('checkout-total').innerText = total.toLocaleString('es-AR');

    document.getElementById('checkout-items').innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.img}" alt="" onerror="this.src='https://placehold.co/50x50/f3eeea/a89e96?text=?'">
            <div class="item-info">
                <h4>${item.name} × ${item.qty}</h4>
                ${item.selectedSides && item.selectedSides.length > 0 ? `<div class="item-note">🥗 Guarnición: ${item.selectedSides.join(', ')}</div>` : ''}
                ${item.note ? `<div class="item-note">📝 Nota: ${item.note}</div>` : ''}
                <span>$${item.price.toLocaleString('es-AR')} c/u</span>
            </div>
            <div class="item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</div>
        </div>
    `).join('');
}

// ---- 10. FORM VALIDATION ----
function validateForm() {
    const name = document.getElementById('cust-name');
    const phone = document.getElementById('cust-phone');
    const delivery = document.getElementById('cust-delivery').value;
    const addr = document.getElementById('cust-address');
    const time = document.getElementById('cust-time');
    let ok = true;

    // Time
    if (time && time.value === '') {
        time.style.borderColor = '#e74c3c';
        ok = false;
    } else if (time) {
        time.style.borderColor = '';
    }

    // Name
    if (name.value.trim().length < 3) {
        name.style.borderColor = '#e74c3c';
        ok = false;
    } else {
        name.style.borderColor = '';
    }

    // Phone
    const phoneClean = phone.value.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 13) {
        phone.style.borderColor = '#e74c3c';
        ok = false;
    } else {
        phone.value = phoneClean;
        phone.style.borderColor = '';
    }

    // Address if delivery
    if (delivery === 'delivery' && (!addr || addr.value.trim().length < 5)) {
        if (addr) addr.style.borderColor = '#e74c3c';
        ok = false;
    } else {
        if (addr) addr.style.borderColor = '';
    }

    // --- NUEVA VALIDACIÓN: GUARNICIONES EN EL CARRITO ---
    let missingSides = false;
    cart.forEach(item => {
        // Si el producto tiene guarniciones permitidas pero no eligió ninguna
        if (item.allowedSides && item.allowedSides.length > 0 && (!item.selectedSides || item.selectedSides.length === 0)) {
            missingSides = true;
        }
    });

    if (missingSides) {
        toast('🥗 Por favor, seleccioná la guarnición para tus platos.');
        ok = false;
    }

    return ok;
}

// ---- 11. MAP LOGIC ----
function initMap() {
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
        return;
    }

    document.getElementById('map').style.display = 'block';

    map = L.map('map').setView([currentLat, currentLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);

    marker.on('dragend', function (e) {
        const pos = marker.getLatLng();
        currentLat = pos.lat;
        currentLng = pos.lng;
        reverseGeocode(pos.lat, pos.lng);
    });
}

// ---- 11.1 ADDRESS SEARCH (GEOCODING) ----
let searchTimer = null;
async function searchAddress(query) {
    if (!query || query.length < 5) return;

    // Debounce to avoid hitting API too hard
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        try {
            // Append city for better results if user doesn't provide it
            const fullQuery = query.includes('Tucuman') ? query : `${query}, San Miguel de Tucumán`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                currentLat = lat;
                currentLng = lon;

                if (map && marker) {
                    map.setView([lat, lon], 16);
                    marker.setLatLng([lat, lon]);
                }
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
    }, 800);
}

async function reverseGeocode(lat, lng) {
    document.getElementById('cust-address').placeholder = "Buscando dirección...";
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
            // Simplify address
            const parts = data.display_name.split(',');
            const simpleArr = parts.slice(0, 2).map(p => p.trim());
            document.getElementById('cust-address').value = simpleArr.join(', ');
        }
    } catch (e) {
        console.error("Geocoding failed", e);
        document.getElementById('cust-address').placeholder = "No se pudo obtener la dirección automatica.";
    }
}

// ---- 12. WHATSAPP SUBMIT ----
async function submitOrder(e) {
    e.preventDefault();
    if (!validateForm()) {
        toast('⚠️ Revisá los campos marcados en rojo');
        return;
    }

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const delivery = document.getElementById('cust-delivery').value;
    const address = document.getElementById('cust-address')?.value?.trim() || '';
    const timeRaw = document.getElementById('cust-time')?.value || '';
    const paymentRaw = document.getElementById('cust-payment').value;
    const paymentNames = {
        'EFECTIVO': 'Efectivo',
        'TRANSFERENCIA': 'Transferencia',
        'MERCADO_PAGO': 'Mercado Pago',
        'POINT': 'Tarjeta Posnet (POINT)'
    };
    const payment = paymentNames[paymentRaw] || paymentRaw;

    const optCubiertos = document.getElementById('opt-cubiertos')?.checked;
    const optEnvioPrio = document.getElementById('opt-envio-prio')?.checked;

    let total = cart.reduce((a, c) => a + c.price * c.qty, 0);
    if (optCubiertos) total += 200;
    if (optEnvioPrio) total += 2000;

    const orderId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;

    // Build message with plain text symbols (no emojis to ensure compatibility)
    let msg = `=== *Pedido Puro Sabor* ===\n\n`;
    cart.forEach(item => {
        msg += `${item.name.toUpperCase()} x${item.qty} - $${(item.price * item.qty).toLocaleString('es-AR')}`;
        if (item.selectedSides && item.selectedSides.length > 0) msg += `\n   🥗 Guarnición: ${item.selectedSides.join(', ')}`;
        if (item.note) msg += `\n   📝 Nota: ${item.note}`;
        msg += `\n`;
    });

    if (optCubiertos) msg += `🍴 Cubiertos (+ $200)\n`;
    if (optEnvioPrio) msg += `🚀 Envío Prioritario (+ $2000)\n`;

    msg += `💰 *Total: $${total.toLocaleString('es-AR')}* $$$\n\n`;
    msg += `👤 Nombre: ${name}\n`;
    msg += `📞 Teléfono: ${phone}\n`;
    msg += `🕒 Horario: ${timeRaw}\n`;
    msg += `📍 Dirección: ${delivery === 'delivery' ? address : 'Paso a Retirar'}\n`;
    if (delivery === 'delivery') {
        msg += `>> Mapa: https://maps.google.com/?q=${currentLat},${currentLng}\n`;
    }
    msg += `📱 Forma de pago: ${payment}\n\n`;
    msg += `✅ *Pedido Solicitado. ¡Muchas gracias!*`;

    const shopNum = '543813934389';
    const btn = document.querySelector('.btn-whatsapp');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btn.disabled = true;
    }

    try {
        const deductPayload = cart.map(item => ({ id: item.id, qty: item.qty }));
        
        // --- EJECUCIÓN EN PARALELO (MÁXIMA VELOCIDAD) ---
        // Descontamos stock y generamos el link corto al mismo tiempo
        const [cloudRes, shortRes] = await Promise.allSettled([
            cloudSave('deductStock', deductPayload),
            (async () => {
                const receiptData = {
                    i: orderId, n: name, p: phone, t: total, m: payment, d: delivery,
                    a: delivery === 'delivery' ? address : 'Paso a Retirar',
                    time: timeRaw,
                    opts: {
                        cubiertos: optCubiertos,
                        prio: optEnvioPrio
                    },
                    it: cart.map(item => ({
                        n: item.name, q: item.qty, p: item.price,
                        o: item.selectedSides && item.selectedSides.length > 0 
                           ? `[${item.selectedSides.join(', ')}] ${item.note || ''}` 
                           : (item.note || '')
                    }))
                };
                const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(receiptData))));
                const fullReceiptUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}receipt.html?data=${base64Data}`;
                const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullReceiptUrl)}`);
                if (res.ok) return await res.text();
                return fullReceiptUrl;
            })()
        ]);
        
        // Si el descuento de stock falló, lanzamos error para que no se limpie el carrito
        if (cloudRes.status === 'rejected') {
            throw new Error("Cloud save failed: " + cloudRes.reason);
        }

        if (shortRes.status === 'fulfilled' && shortRes.value) {
            msg += `\n🧾 *Tu Recibo Digital:* ${shortRes.value}\n`;
        }
        
        // Recalcular waUrl con el link del recibo si se generó
        const waUrl = `https://wa.me/${shopNum}?text=${encodeURIComponent(msg)}`;

        // Descontar localmente
        deductPayload.forEach(item => {
            const prod = products.find(p => String(p.id) === String(item.id));
            if (prod) {
                const currentStock = parseInt(prod.stock);
                if (!isNaN(currentStock)) {
                    prod.stock = Math.max(0, currentStock - item.qty);
                }
            }
        });
        localStorage.setItem('bocado_products', JSON.stringify(products));
        
        cart = [];
        localStorage.removeItem('bocado_cart');
        refresh();
        document.getElementById('checkout-overlay').classList.remove('open');
        renderProducts();

        window.location.href = waUrl;
    } catch (e) {
        console.error("Error al descontar stock:", e);
        toast('❌ Error de conexión. Intenta de nuevo.');
    } finally {
        if (btn) {
            btn.innerHTML = '<i class="fab fa-whatsapp"></i> Confirmar por WhatsApp';
            btn.disabled = false;
        }
    }
}

// ---- 13. EVENTS ----
function setupEvents() {
    document.getElementById('search-input')?.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderProducts();
    });

    const updateCheckoutTotal = () => {
        const totalElem = document.getElementById('checkout-total');
        if(totalElem) {
            let total = cart.reduce((a, c) => a + c.price * c.qty, 0);
            if (document.getElementById('opt-cubiertos')?.checked) total += 200;
            if (document.getElementById('opt-envio-prio')?.checked) total += 2000;
            totalElem.innerText = total.toLocaleString('es-AR');
        }
    };
    document.getElementById('opt-cubiertos')?.addEventListener('change', updateCheckoutTotal);
    document.getElementById('opt-envio-prio')?.addEventListener('change', updateCheckoutTotal);

    document.getElementById('open-checkout')?.addEventListener('click', openCheckout);
    document.getElementById('cart-header-btn')?.addEventListener('click', () => {
        if (cart.length > 0) openCheckout();
    });

    document.getElementById('close-checkout')?.addEventListener('click', () => {
        document.getElementById('checkout-overlay').classList.remove('open');
    });

    document.getElementById('cust-delivery')?.addEventListener('change', e => {
        const isDelivery = e.target.value === 'delivery';
        const grp = document.getElementById('address-group');
        const optPoint = document.getElementById('opt-point');
        const paymentSelect = document.getElementById('cust-payment');

        grp.style.display = isDelivery ? 'block' : 'none';

        if (isDelivery) {
            document.getElementById('map').style.display = 'block';
            setTimeout(initMap, 300); // Give overlay time to render
            // Hide and reset POINT if selected
            if (paymentSelect.value === 'POINT') {
                paymentSelect.value = 'EFECTIVO';
                updatePaymentNote('EFECTIVO');
            }
            optPoint.disabled = true;
            optPoint.style.display = 'none';
        } else {
            document.getElementById('map').style.display = 'none';
            optPoint.disabled = false;
            optPoint.style.display = 'block';
        }
    });

    document.getElementById('cust-payment')?.addEventListener('change', e => {
        updatePaymentNote(e.target.value);
    });

    function updatePaymentNote(method) {
        const noteBox = document.getElementById('payment-note');
        let text = '';

        if (method === 'TRANSFERENCIA') {
            text = 'ℹ️ <strong>Alias: Purosabor2025 </strong> A nombre de: NICOLAS ANTONIO KRUGER | Se procesará el pedido una vez enviado el comprobante de la transferencia realizada vía WhatsApp.';
        } else if (method === 'MERCADO_PAGO') {
            text = 'ℹ️ <strong>El pedido se procesará una vez realizado el pago a través del enlace de pago</strong> y enviado el comprobante por WhatsApp.';
        }

        if (text) {
            noteBox.innerHTML = text;
            noteBox.style.display = 'block';
        } else {
            noteBox.style.display = 'none';
        }
    }

    // Phone: block non-numeric input
    document.getElementById('cust-phone')?.addEventListener('keypress', e => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
    });

    document.getElementById('checkout-form')?.addEventListener('submit', submitOrder);

    // Address search link
    document.getElementById('cust-address')?.addEventListener('input', e => {
        searchAddress(e.target.value);
    });
}

// ---- 14. TOAST ----
function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toast-msg').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// ---- START ----
init();
