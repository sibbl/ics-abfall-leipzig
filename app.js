/**
 * Leipzig Abfallkalender - WebApp Script
 * GitHub Pages Compatible - Bundled Leipzig Street Data (Zero CORS issues)
 */

(function () {
    'use strict';

    const API_ICAL_URL = 'https://stadtreinigung-leipzig.de/wir-kommen-zu-ihnen/abfallkalender/ical.ics';

    // State Variables
    let streetsData = [];
    let selectedStreet = null;
    let selectedHouseNum = null;
    let activeAutocompleteIndex = -1;

    // DOM Elements
    const streetInput = document.getElementById('street-input');
    const clearStreetBtn = document.getElementById('clear-street-btn');
    const autocompleteList = document.getElementById('autocomplete-list');
    const houseSelect = document.getElementById('house-select');
    const addressBadge = document.getElementById('address-badge');
    const badgeAddressText = document.getElementById('badge-address-text');
    const badgeMetaText = document.getElementById('badge-meta-text');
    const configCard = document.getElementById('config-card');
    const exportCard = document.getElementById('export-card');
    const timeModeSelect = document.getElementById('time-mode');
    const reminderSelect = document.getElementById('reminder-select');

    // Buttons
    const btnGoogle = document.getElementById('btn-google');
    const btnApple = document.getElementById('btn-apple');
    const btnOutlookLive = document.getElementById('btn-outlook-live');
    const btnOutlook365 = document.getElementById('btn-outlook-365');
    const btnDownloadIcs = document.getElementById('btn-download-ics');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const toast = document.getElementById('toast');

    // Favorites
    const favoritesSection = document.getElementById('favorites-section');
    const favoritesList = document.getElementById('favorites-list');
    const clearFavsBtn = document.getElementById('clear-favs-btn');

    // Init App
    document.addEventListener('DOMContentLoaded', () => {
        loadStreetsData();
        setupEventListeners();
        loadFavorites();
    });

    /**
     * Load bundled streets.json data
     */
    async function loadStreetsData() {
        try {
            const response = await fetch('streets.json');
            if (!response.ok) throw new Error('Could not load streets.json');
            streetsData = await response.json();
            console.log(`Loaded ${streetsData.length} streets from local dataset.`);
            checkUrlParams();
        } catch (err) {
            console.error('Error loading streets dataset:', err);
        }
    }

    /**
     * Set up all UI event listeners
     */
    function setupEventListeners() {
        streetInput.addEventListener('input', handleStreetInput);
        streetInput.addEventListener('keydown', handleStreetKeydown);
        streetInput.addEventListener('focus', handleStreetInput);

        clearStreetBtn.addEventListener('click', clearStreetSelection);

        // Click outside closes autocomplete dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.street-group')) {
                hideAutocomplete();
            }
        });

        // House select
        houseSelect.addEventListener('change', handleHouseSelect);

        // Config changes update calendar links
        timeModeSelect.addEventListener('change', updateCalendarLinks);
        reminderSelect.addEventListener('change', updateCalendarLinks);

        // Copy button
        btnCopyLink.addEventListener('click', handleCopyLink);

        // Clear favorites
        if (clearFavsBtn) {
            clearFavsBtn.addEventListener('click', clearFavorites);
        }
    }

    /**
     * Autocomplete Input Handler
     */
    function handleStreetInput() {
        const query = streetInput.value.trim().toLowerCase();
        activeAutocompleteIndex = -1;

        if (query.length > 0) {
            clearStreetBtn.classList.remove('hidden');
        } else {
            clearStreetBtn.classList.add('hidden');
        }

        if (query.length < 1) {
            hideAutocomplete();
            return;
        }

        if (!streetsData || streetsData.length === 0) {
            autocompleteList.innerHTML = '<div class="autocomplete-empty">Datenbank wird geladen...</div>';
            autocompleteList.classList.remove('hidden');
            return;
        }

        // Filter streets matching query
        const matches = streetsData.filter(s => {
            const name = s.n.toLowerCase();
            return name.includes(query) || normalizeGerman(name).includes(normalizeGerman(query));
        }).slice(0, 30);

        renderAutocomplete(matches, query);
    }

    function normalizeGerman(str) {
        return str
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/str\./g, 'strasse');
    }

    /**
     * Render Autocomplete Dropdown
     */
    function renderAutocomplete(matches, query) {
        autocompleteList.innerHTML = '';

        if (matches.length === 0) {
            autocompleteList.innerHTML = `<div class="autocomplete-empty">Keine Straße in Leipzig für "${escapeHtml(query)}" gefunden.</div>`;
            autocompleteList.classList.remove('hidden');
            return;
        }

        matches.forEach((street, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.dataset.index = index;

            const postalStr = street.p ? `PLZ ${street.p}` : '';
            const districtStr = street.d ? street.d : '';
            const meta = [postalStr, districtStr].filter(Boolean).join(' • ');

            div.innerHTML = `
                <strong>${highlightMatch(street.n, query)}</strong>
                ${meta ? `<span>${escapeHtml(meta)}</span>` : ''}
            `;

            div.addEventListener('click', () => selectStreet(street));
            autocompleteList.appendChild(div);
        });

        autocompleteList.classList.remove('hidden');
    }

    function highlightMatch(text, query) {
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return escapeHtml(text);
        const before = text.substring(0, idx);
        const match = text.substring(idx, idx + query.length);
        const after = text.substring(idx + query.length);
        return `${escapeHtml(before)}<mark style="background:#e2e8f0;color:#0f172a;border-radius:2px;padding:0 2px;">${escapeHtml(match)}</mark>${escapeHtml(after)}`;
    }

    function handleStreetKeydown(e) {
        const items = autocompleteList.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeAutocompleteIndex = (activeAutocompleteIndex + 1) % items.length;
            updateActiveAutocomplete(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeAutocompleteIndex = (activeAutocompleteIndex - 1 + items.length) % items.length;
            updateActiveAutocomplete(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeAutocompleteIndex >= 0 && activeAutocompleteIndex < items.length) {
                items[activeAutocompleteIndex].click();
            }
        } else if (e.key === 'Escape') {
            hideAutocomplete();
        }
    }

    function updateActiveAutocomplete(items) {
        items.forEach((item, idx) => {
            if (idx === activeAutocompleteIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    function hideAutocomplete() {
        autocompleteList.classList.add('hidden');
        activeAutocompleteIndex = -1;
    }

    /**
     * Select Street
     */
    function selectStreet(street) {
        selectedStreet = street;
        streetInput.value = street.n;
        hideAutocomplete();

        // Populate house numbers: street.h = { "1": ["1234"], "2": ["5678"] }
        const houseNumbers = Object.keys(street.h || {}).sort(naturalCompare);
        houseSelect.innerHTML = '<option value="">Hausnummer wählen...</option>';

        houseNumbers.forEach(num => {
            const opt = document.createElement('option');
            opt.value = num;
            opt.textContent = num;
            houseSelect.appendChild(opt);
        });

        houseSelect.disabled = false;
        clearStreetBtn.classList.remove('hidden');

        // Reset previous house selection
        selectedHouseNum = null;
        disableSteps();

        // If only 1 house number, auto-select it!
        if (houseNumbers.length === 1) {
            houseSelect.value = houseNumbers[0];
            handleHouseSelect();
        } else {
            houseSelect.focus();
        }
    }

    function naturalCompare(a, b) {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }

    function clearStreetSelection() {
        streetInput.value = '';
        selectedStreet = null;
        selectedHouseNum = null;
        houseSelect.innerHTML = '<option value="">Zuerst Straße wählen...</option>';
        houseSelect.disabled = true;
        clearStreetBtn.classList.add('hidden');
        hideAutocomplete();
        addressBadge.classList.add('hidden');
        disableSteps();
    }

    /**
     * Handle House Number Selection
     */
    function handleHouseSelect() {
        const val = houseSelect.value;
        if (!val || !selectedStreet) {
            disableSteps();
            return;
        }

        selectedHouseNum = val;
        const posNos = selectedStreet.h[val] || [];

        // Show Address Info Badge
        const metaInfo = [selectedStreet.p ? `PLZ ${selectedStreet.p}` : '', selectedStreet.d ? selectedStreet.d : ''].filter(Boolean).join(' • ');
        badgeAddressText.textContent = `${selectedStreet.n} ${selectedHouseNum}`;
        badgeMetaText.textContent = `${metaInfo} (ID: ${posNos.join(', ')})`;
        addressBadge.classList.remove('hidden');

        // Enable Steps & Update Links
        enableSteps();
        updateCalendarLinks();

        // Save to favorites
        saveToFavorites(selectedStreet.n, selectedHouseNum);
    }

    function enableSteps() {
        configCard.classList.remove('disabled-section');
        exportCard.classList.remove('disabled-section');
        [btnGoogle, btnApple, btnOutlookLive, btnOutlook365, btnDownloadIcs, btnCopyLink].forEach(btn => {
            btn.classList.remove('disabled-btn');
        });
    }

    function disableSteps() {
        configCard.classList.add('disabled-section');
        exportCard.classList.add('disabled-section');
        [btnGoogle, btnApple, btnOutlookLive, btnOutlook365, btnDownloadIcs, btnCopyLink].forEach(btn => {
            btn.classList.add('disabled-btn');
            if (btn.tagName === 'A') {
                btn.removeAttribute('href');
            }
        });
    }

    /**
     * Generate iCal URL & Provider Links
     */
    function getCalendarUrls() {
        if (!selectedStreet || !selectedHouseNum) return null;

        const posNos = selectedStreet.h[selectedHouseNum] || [];
        if (posNos.length === 0) return null;

        const addressName = `${selectedStreet.n} ${selectedHouseNum}`;
        const timeAllday = timeModeSelect.value;
        const reminder = reminderSelect.value;

        const params = new URLSearchParams({
            position_nos: posNos.join(','),
            name: addressName,
            time_allday: timeAllday,
            reminder: reminder,
            mode: 'download'
        });

        const icalUrl = `${API_ICAL_URL}?${params.toString()}`;
        const webcalUrl = icalUrl.replace(/^https?:/, 'webcal:');

        return {
            icalUrl,
            webcalUrl,
            addressName
        };
    }

    function updateCalendarLinks() {
        const urls = getCalendarUrls();
        if (!urls) return;

        const { icalUrl, webcalUrl, addressName } = urls;

        // 1. Google Calendar Subscribe URL
        const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`;
        btnGoogle.href = googleUrl;

        // 2. Apple Calendar (iPhone / Mac) -> webcal://
        btnApple.href = webcalUrl;

        // 3. Outlook Live / Personal
        const outlookLiveUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(icalUrl)}&name=${encodeURIComponent('Abfallkalender ' + addressName)}`;
        btnOutlookLive.href = outlookLiveUrl;

        // 4. Microsoft 365 / Office
        const outlook365Url = `https://outlook.office.com/calendar/0/addcalendar?url=${encodeURIComponent(icalUrl)}&name=${encodeURIComponent('Abfallkalender ' + addressName)}`;
        btnOutlook365.href = outlook365Url;

        // 5. Direct ICS Download
        btnDownloadIcs.href = icalUrl;
        btnDownloadIcs.setAttribute('download', `abfallkalender_${selectedStreet.n.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedHouseNum}.ics`);
    }

    /**
     * Copy iCal Link to Clipboard
     */
    async function handleCopyLink() {
        const urls = getCalendarUrls();
        if (!urls) return;

        try {
            await navigator.clipboard.writeText(urls.webcalUrl);
            showToast('📋 Webcal-Link in Zwischenablage kopiert!');
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = urls.webcalUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('📋 Link kopiert!');
        }
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * Favorites / Recent Searches
     */
    function saveToFavorites(streetName, houseNum) {
        let favs = getFavorites();
        favs = favs.filter(f => !(f.s === streetName && f.h === houseNum));
        favs.unshift({ s: streetName, h: houseNum });
        favs = favs.slice(0, 5);
        localStorage.setItem('srl_abfall_favs', JSON.stringify(favs));
        renderFavorites();
    }

    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('srl_abfall_favs') || '[]');
        } catch {
            return [];
        }
    }

    function loadFavorites() {
        renderFavorites();
    }

    function renderFavorites() {
        const favs = getFavorites();
        if (favs.length === 0) {
            favoritesSection.classList.add('hidden');
            return;
        }

        favoritesList.innerHTML = '';
        favs.forEach(fav => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'fav-chip';
            chip.innerHTML = `📍 ${escapeHtml(fav.s)} ${escapeHtml(fav.h)}`;
            chip.addEventListener('click', () => {
                const streetObj = streetsData.find(s => s.n === fav.s);
                if (streetObj) {
                    selectStreet(streetObj);
                    houseSelect.value = fav.h;
                    handleHouseSelect();
                }
            });
            favoritesList.appendChild(chip);
        });

        favoritesSection.classList.remove('hidden');
    }

    function clearFavorites() {
        localStorage.removeItem('srl_abfall_favs');
        renderFavorites();
    }

    /**
     * URL Deep Linking
     */
    function checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const streetParam = params.get('street');
        const numParam = params.get('number');

        if (streetParam && streetsData) {
            const found = streetsData.find(s => s.n.toLowerCase() === streetParam.toLowerCase());
            if (found) {
                selectStreet(found);
                if (numParam && found.h[numParam]) {
                    houseSelect.value = numParam;
                    handleHouseSelect();
                }
            }
        }
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, match => {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    }

})();
