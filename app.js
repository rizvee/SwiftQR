document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════
       PWA — Register Service Worker
       ═══════════════════════════════════════════════ */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    /* ═══════════════════════════════════════════════
       Utilities
       ═══════════════════════════════════════════════ */
    function debounce(fn, wait) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    const createIcons = () => { if (window.lucide) lucide.createIcons(); };
    createIcons();

    /* ═══════════════════════════════════════════════
       DOM References
       ═══════════════════════════════════════════════ */
    // Tabs
    const tabButtons       = document.querySelectorAll('.tab-btn');
    const tabContents      = document.querySelectorAll('.tab-content');

    // QR Preview
    const qrPreviewContainer = document.getElementById('qr-preview');
    const eccDisplay         = document.getElementById('ecc-display');
    const exportQualitySlider= document.getElementById('export-quality');
    const qualityValDisplay  = document.getElementById('quality-val');

    // Export Buttons
    const downloadPngBtn   = document.getElementById('download-png');
    const downloadSvgBtn   = document.getElementById('download-svg');
    const downloadVcfBtn   = document.getElementById('download-vcf');
    const copyClipboardBtn = document.getElementById('copy-clipboard');
    const resetBtn         = document.getElementById('reset-btn');

    // History
    const historyContainer = document.getElementById('history-container');
    const noHistoryMsg     = document.getElementById('no-history');
    const clearHistoryBtn  = document.getElementById('clear-history');

    // View toggles
    const toggleMockupBtn  = document.getElementById('toggle-mockup');
    const standardView     = document.getElementById('standard-view');
    const mockupView       = document.getElementById('mockup-view');
    const mockupQrImg      = document.getElementById('mockup-qr-img');
    const vcardBadge       = document.getElementById('vcard-badge');

    // vCard density
    const vcardCounter     = document.getElementById('vcard-counter');
    const vcardWarning     = document.getElementById('vcard-density-warning');
    const highDensityAlert = document.getElementById('high-density-alert');

    // URL input
    const inputUrl         = document.getElementById('input-url');

    // WiFi inputs
    const wifiSsid         = document.getElementById('wifi-ssid');
    const wifiPass         = document.getElementById('wifi-pass');
    const wifiEnc          = document.getElementById('wifi-enc');

    // vCard core inputs
    const vcardFn          = document.getElementById('vcard-fn');
    const vcardLn          = document.getElementById('vcard-ln');
    const vcardJob         = document.getElementById('vcard-job');
    const vcardPhone       = document.getElementById('vcard-phone');
    const vcardEmail       = document.getElementById('vcard-email');
    const vcardCompany     = document.getElementById('vcard-company');
    const vcardWebsite     = document.getElementById('vcard-website');

    // vCard social inputs (NEW)
    const vcardLinkedIn    = document.getElementById('vcard-linkedin');
    const vcardInstagram   = document.getElementById('vcard-instagram');
    const vcardWaSocial    = document.getElementById('vcard-wa-social');

    // Profile photo (NEW)
    const profilePhotoUpload    = document.getElementById('profile-photo-upload');
    const profileAvatarWrap     = document.getElementById('profile-avatar-wrap');
    const profileAvatarImg      = document.getElementById('profile-avatar-img');
    const profileAvatarPlaceholder = document.getElementById('profile-avatar-placeholder');
    const clearProfilePhotoBtn  = document.getElementById('clear-profile-photo');

    // WhatsApp
    const waPhone          = document.getElementById('wa-phone');
    const waMsg            = document.getElementById('wa-msg');

    // Accordion
    const accordionToggle  = document.getElementById('accordion-toggle');
    const accordionContent = document.getElementById('accordion-content');
    const accordionIcon    = document.querySelector('.accordion-icon');

    // Styling controls
    const dotStyle             = document.getElementById('dot-style');
    const cornerSquareType     = document.getElementById('corner-square-type');
    const cornerDotType        = document.getElementById('corner-dot-type');
    const eyeFrameColor        = document.getElementById('eye-frame-color');
    const eyeDotColor          = document.getElementById('eye-dot-color');
    const logoUpload           = document.getElementById('logo-upload');
    const clearLogoBtn         = document.getElementById('clear-logo');
    const logoBgToggle         = document.getElementById('logo-bg-toggle');
    const logoMargin           = document.getElementById('logo-margin');
    const logoMarginVal        = document.getElementById('logo-margin-val');
    const magicWandBtn         = document.getElementById('magic-wand-btn');

    // Color mode
    const colorModeBtns        = document.querySelectorAll('.color-mode-btn');
    const qrColor1             = document.getElementById('qr-color-1');
    const qrColor2             = document.getElementById('qr-color-2');
    const qrRotation           = document.getElementById('qr-rotation');
    const qrRotationVal        = document.getElementById('qr-rotation-val');
    const gradientTypeSelect   = document.getElementById('gradient-type');
    const qrGradientControls   = document.getElementById('qr-gradient-controls');
    const qrRotationControl    = document.getElementById('qr-rotation-control');

    // Masking buttons (NEW)
    const maskBtns             = document.querySelectorAll('.mask-btn');

    // Contact preview modal (NEW)
    const contactPreviewBtn    = document.getElementById('contact-preview-btn');
    const contactPreviewModal  = document.getElementById('contact-preview-modal');
    const closePreviewModal    = document.getElementById('close-preview-modal');

    // Theme toggle (NEW)
    const themeToggle          = document.getElementById('theme-toggle');

    /* ═══════════════════════════════════════════════
       App State
       ═══════════════════════════════════════════════ */
    let activeTab         = 'url';
    let uploadedLogo      = null;
    let profilePhotoBase64 = null;   // base64 data URL for profile photo
    let isLogoBgActive    = false;
    let isMockupActive    = false;
    let maskMode          = 'overlay'; // 'overlay' | 'circle' | 'square'
    let isLightMode       = false;

    const modes = { qr: 'solid' };

    /* ═══════════════════════════════════════════════
       Theme Initialization
       ═══════════════════════════════════════════════ */
    function applyTheme(light) {
        isLightMode = light;
        if (light) {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            themeToggle.classList.add('light-active');
            themeToggle.querySelector('.theme-dot').textContent = '☀️';
        } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            themeToggle.classList.remove('light-active');
            themeToggle.querySelector('.theme-dot').textContent = '🌙';
        }
        localStorage.setItem('swiftqr_theme', light ? 'light' : 'dark');
    }

    // Load persisted theme
    const savedTheme = localStorage.getItem('swiftqr_theme');
    applyTheme(savedTheme === 'light');

    themeToggle.addEventListener('click', () => applyTheme(!isLightMode));

    /* ═══════════════════════════════════════════════
       QR Code Styling Initialization
       ═══════════════════════════════════════════════ */
    const qrCode = new QRCodeStyling({
        width: 600, height: 600, type: 'svg',
        data: 'https://swiftqr.app',
        qrOptions: { errorCorrectionLevel: 'M' },
        dotsOptions: { color: '#0f172a', type: 'square' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { crossOrigin: 'anonymous', margin: 10, imageSize: 0.4 },
        cornersSquareOptions: { type: 'square', color: '#0f172a' },
        cornersDotOptions: { type: 'dot', color: '#0f172a' }
    });
    qrCode.append(qrPreviewContainer);

    /* ═══════════════════════════════════════════════
       vCard String Builder
       ═══════════════════════════════════════════════ */
    function buildVCardString() {
        const fn = (vcardFn.value || '').trim();
        const ln = (vcardLn.value || '').trim();
        const fullName = [fn, ln].filter(Boolean).join(' ') || 'Contact';

        let str = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
        str += `N:${ln};${fn};;;\r\n`;
        str += `FN:${fullName}\r\n`;

        if (vcardJob.value.trim())     str += `TITLE:${vcardJob.value.trim()}\r\n`;
        if (vcardCompany.value.trim()) str += `ORG:${vcardCompany.value.trim()}\r\n`;
        if (vcardPhone.value.trim())   str += `TEL;TYPE=CELL:${vcardPhone.value.trim()}\r\n`;
        if (vcardEmail.value.trim())   str += `EMAIL:${vcardEmail.value.trim()}\r\n`;
        if (vcardWebsite.value.trim()) str += `URL:${vcardWebsite.value.trim()}\r\n`;

        // Social Profiles
        if (vcardLinkedIn.value.trim())  str += `X-SOCIALPROFILE;type=linkedin:${vcardLinkedIn.value.trim()}\r\n`;
        if (vcardInstagram.value.trim()) str += `X-SOCIALPROFILE;type=instagram:${vcardInstagram.value.trim()}\r\n`;
        if (vcardWaSocial.value.trim())  str += `X-SOCIALPROFILE;type=whatsapp:${vcardWaSocial.value.trim()}\r\n`;

        // Profile Photo (base64 JPEG)
        if (profilePhotoBase64) {
            const b64 = profilePhotoBase64.split(',')[1];
            str += `PHOTO;ENCODING=b;TYPE=JPEG:${b64}\r\n`;
        }

        str += 'END:VCARD';
        return str;
    }

    /* ═══════════════════════════════════════════════
       Profile Photo Handling
       ═══════════════════════════════════════════════ */
    async function compressImageToJpeg(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const MAX = 120;
                    const scale = Math.min(MAX / img.width, MAX / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width  = Math.round(img.width  * scale);
                    canvas.height = Math.round(img.height * scale);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.55));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    profilePhotoUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        profilePhotoBase64 = await compressImageToJpeg(file);
        // Show in mini preview
        profileAvatarImg.src = profilePhotoBase64;
        profileAvatarImg.classList.remove('hidden');
        profileAvatarPlaceholder.classList.add('hidden');
        clearProfilePhotoBtn.classList.remove('hidden');
        debouncedUpdate();
    });

    clearProfilePhotoBtn.addEventListener('click', () => {
        profilePhotoBase64 = null;
        profilePhotoUpload.value = '';
        profileAvatarImg.classList.add('hidden');
        profileAvatarImg.src = '';
        profileAvatarPlaceholder.classList.remove('hidden');
        clearProfilePhotoBtn.classList.add('hidden');
        debouncedUpdate();
    });

    /* ═══════════════════════════════════════════════
       Color Palette Extraction (Magic Wand)
       ═══════════════════════════════════════════════ */
    async function extractPalette(imgSrc) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const SIZE = 80;
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, SIZE, SIZE);
                const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

                const freq = {};
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] < 100) continue;         // skip transparent
                    const r = Math.round(data[i]   / 32) * 32;
                    const g = Math.round(data[i+1] / 32) * 32;
                    const b = Math.round(data[i+2] / 32) * 32;
                    if (r > 220 && g > 220 && b > 220) continue; // skip white
                    if (r < 25  && g < 25  && b < 25)  continue; // skip black
                    const key = `${r},${g},${b}`;
                    freq[key] = (freq[key] || 0) + 1;
                }

                const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                if (sorted.length === 0) { resolve({ primary: '#1a1a2e', secondary: '#16213e' }); return; }

                const toHex = (rgb) => {
                    const [r, g, b] = rgb.split(',').map(Number);
                    return '#' + [r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
                };

                const primary = toHex(sorted[0][0]);
                let secondary = primary;
                const [r1, g1, b1] = sorted[0][0].split(',').map(Number);
                for (const [key] of sorted.slice(1)) {
                    const [r2, g2, b2] = key.split(',').map(Number);
                    if (Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2) > 60) {
                        secondary = toHex(key); break;
                    }
                }
                resolve({ primary, secondary });
            };
            img.onerror = () => resolve({ primary: '#1a1a2e', secondary: '#16213e' });
            img.src = imgSrc;
        });
    }

    magicWandBtn.addEventListener('click', async () => {
        if (!uploadedLogo) return;
        magicWandBtn.classList.add('extracting');
        const { primary, secondary } = await extractPalette(uploadedLogo);
        magicWandBtn.classList.remove('extracting');

        qrColor1.value = primary;
        qrColor2.value = secondary;
        eyeFrameColor.value = primary;
        eyeDotColor.value = secondary;

        // Enable gradient mode to showcase both colors
        modes.qr = 'gradient';
        updateColorModeUI('qr', 'gradient');
        updateQRCode();

        // Flash button to give success feedback
        magicWandBtn.style.background = 'rgba(99,102,241,0.35)';
        setTimeout(() => { magicWandBtn.style.background = ''; }, 800);
    });

    /* ═══════════════════════════════════════════════
       Logo Masking
       ═══════════════════════════════════════════════ */
    maskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            maskMode = btn.getAttribute('data-mask');
            maskBtns.forEach(b => b.classList.remove('active-mask'));
            btn.classList.add('active-mask');
            updateQRCode();
        });
    });

    /* ═══════════════════════════════════════════════
       Logo Upload / Clear
       ═══════════════════════════════════════════════ */
    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedLogo = ev.target.result;
            clearLogoBtn.classList.remove('hidden');
            magicWandBtn.classList.remove('hidden');
            updateQRCode();
        };
        reader.readAsDataURL(file);
    });

    clearLogoBtn.addEventListener('click', () => {
        uploadedLogo = null;
        logoUpload.value = '';
        clearLogoBtn.classList.add('hidden');
        magicWandBtn.classList.add('hidden');
        updateQRCode();
    });

    /* ═══════════════════════════════════════════════
       Core QR Update
       ═══════════════════════════════════════════════ */
    function escapeWiFi(s) {
        return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,').replace(/"/g, '\\"');
    }

    function updateQRCode() {
        let content = '';

        switch (activeTab) {
            case 'url':
                content = inputUrl.value || 'https://swiftqr.app';
                break;
            case 'wifi':
                content = `WIFI:S:${escapeWiFi(wifiSsid.value)||'SSID'};T:${wifiEnc.value||'WPA'};P:${escapeWiFi(wifiPass.value)};;`;
                break;
            case 'vcard':
                content = buildVCardString();
                break;
            case 'whatsapp':
                const num = waPhone.value.replace(/\D/g, '');
                const msg = encodeURIComponent(waMsg.value);
                content = num ? `https://wa.me/${num}${msg ? '?text=' + msg : ''}` : 'https://wa.me/';
                break;
        }

        // Dot colour / gradient
        const dotsOptions = { type: dotStyle.value || 'square' };
        if (modes.qr === 'solid') {
            dotsOptions.color    = qrColor1.value;
            dotsOptions.gradient = null;
        } else {
            dotsOptions.gradient = {
                type: gradientTypeSelect.value,
                rotation: (parseInt(qrRotation.value) * Math.PI) / 180,
                colorStops: [{ offset: 0, color: qrColor1.value }, { offset: 1, color: qrColor2.value }]
            };
        }

        // Error correction — bump to H when profile photo is embedded
        let eccLevel;
        if (activeTab === 'vcard' && profilePhotoBase64) {
            eccLevel = 'H';
        } else if (activeTab === 'vcard') {
            eccLevel = 'Q';
        } else if (uploadedLogo) {
            eccLevel = 'H';
        } else {
            eccLevel = 'M';
        }

        // Logo masking — circle/square forces hideBackgroundDots on and adjusts margin
        const hideBackDots = isLogoBgActive || maskMode !== 'overlay';
        const marginForMask = maskMode !== 'overlay' ? 6 : parseInt(logoMargin.value);

        qrCode.update({
            data: content,
            image: uploadedLogo || null,
            qrOptions: { errorCorrectionLevel: eccLevel },
            dotsOptions,
            backgroundOptions: { color: '#ffffff' },
            imageOptions: {
                hideBackgroundDots: hideBackDots,
                margin: marginForMask,
                imageSize: maskMode !== 'overlay' ? 0.35 : 0.4
            },
            cornersSquareOptions: { type: cornerSquareType.value, color: eyeFrameColor.value },
            cornersDotOptions:    { type: cornerDotType.value,   color: eyeDotColor.value }
        });

        // ECC label
        const eccLabels = { H: 'HIGH', Q: 'QUARTILE', M: 'MEDIUM', L: 'LOW' };
        eccDisplay.textContent = eccLabels[eccLevel] || eccLevel;

        // vCard-specific UI updates
        if (activeTab === 'vcard') {
            vcardBadge.classList.remove('hidden');
            vcardCounter.textContent = `${content.length}_CHAR`;
            vcardWarning.classList.toggle('hidden', content.length <= 300);
            highDensityAlert.classList.toggle('hidden', !profilePhotoBase64);
        } else {
            vcardBadge.classList.add('hidden');
            vcardWarning.classList.add('hidden');
            highDensityAlert.classList.add('hidden');
        }

        if (isMockupActive) updateMockupImage();
    }

    const debouncedUpdate = debounce(updateQRCode, 150);

    /* ═══════════════════════════════════════════════
       Color Mode UI
       ═══════════════════════════════════════════════ */
    function updateColorModeUI(target, type) {
        document.querySelectorAll(`[data-target="${target}"]`).forEach(btn => {
            const isActive = btn.getAttribute('data-type') === type;
            btn.classList.toggle('active-glass', isActive);
            btn.classList.toggle('text-white/40', !isActive);
            btn.classList.toggle('hover:bg-white/5', !isActive);
        });
        if (target === 'qr') {
            qrGradientControls.classList.toggle('hidden', type === 'solid');
            qrRotationControl.classList.toggle('hidden', type === 'solid');
        }
    }

    colorModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type   = btn.getAttribute('data-type');
            const target = btn.getAttribute('data-target');
            modes[target] = type;
            updateColorModeUI(target, type);
            if (accordionContent.style.maxHeight !== '0px') {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            }
            updateQRCode();
        });
    });

    /* ═══════════════════════════════════════════════
       Accordion
       ═══════════════════════════════════════════════ */
    accordionToggle.addEventListener('click', () => {
        const isOpen = accordionContent.style.maxHeight && accordionContent.style.maxHeight !== '0px';
        if (isOpen) {
            accordionContent.style.maxHeight = '0px';
            accordionIcon.style.transform = 'rotate(0deg)';
        } else {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            accordionIcon.style.transform = 'rotate(180deg)';
        }
    });

    /* ═══════════════════════════════════════════════
       Sidebar Tab Navigation
       ═══════════════════════════════════════════════ */
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            activeTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`${activeTab}-content`).classList.remove('hidden');
            updateQRCode();
        });
    });

    /* ═══════════════════════════════════════════════
       Toggle Controls
       ═══════════════════════════════════════════════ */
    // Logo background toggle
    logoBgToggle.addEventListener('click', () => {
        isLogoBgActive = !isLogoBgActive;
        logoBgToggle.classList.toggle('active', isLogoBgActive);
        updateQRCode();
    });

    // Mockup toggle
    toggleMockupBtn.addEventListener('click', () => {
        isMockupActive = !isMockupActive;
        toggleMockupBtn.classList.toggle('active', isMockupActive);
        standardView.classList.toggle('hidden', isMockupActive);
        mockupView.classList.toggle('hidden', !isMockupActive);
        if (isMockupActive) updateMockupImage();
    });

    async function updateMockupImage() {
        if (!isMockupActive) return;
        const blob = await qrCode.getRawData('png');
        mockupQrImg.src = URL.createObjectURL(blob);
    }

    /* ═══════════════════════════════════════════════
       Range Inputs
       ═══════════════════════════════════════════════ */
    logoMargin.addEventListener('input', () => {
        logoMarginVal.textContent = `${logoMargin.value}px`;
        debouncedUpdate();
    });
    qrRotation.addEventListener('input', () => {
        qrRotationVal.textContent = `${qrRotation.value}°`;
        debouncedUpdate();
    });
    exportQualitySlider.addEventListener('input', () => {
        qualityValDisplay.textContent = exportQualitySlider.value;
    });

    /* ═══════════════════════════════════════════════
       Contact Preview Modal
       ═══════════════════════════════════════════════ */
    function buildInfoCard(rows) {
        // rows = [{label, value, plain?}]
        const section = document.getElementById('preview-info-section');
        section.innerHTML = '';
        if (!rows.length) return;
        const card = document.createElement('div');
        card.className = 'ios-info-card';
        rows.forEach(r => {
            const row = document.createElement('div');
            row.className = 'ios-info-row';
            row.innerHTML = `<div class="ios-info-label">${r.label}</div><div class="ios-info-value${r.plain ? ' plain' : ''}">${r.value}</div>`;
            card.appendChild(row);
        });
        section.appendChild(card);
    }

    function buildSocialCard(socials) {
        const section = document.getElementById('preview-social-section');
        const card    = document.getElementById('preview-social-card');
        card.innerHTML = '';
        if (!socials.length) { section.style.display = 'none'; return; }
        section.style.display = '';
        socials.forEach(s => {
            const row = document.createElement('div');
            row.className = 'ios-social-row';
            row.innerHTML = `<div class="ios-social-badge">${s.icon}</div><div class="ios-social-name">${s.value}</div>`;
            card.appendChild(row);
        });
    }

    function openContactPreview() {
        const fn = (vcardFn.value || '').trim();
        const ln = (vcardLn.value || '').trim();
        const fullName = [fn, ln].filter(Boolean).join(' ') || 'No Name';
        const initials = [fn[0], ln[0]].filter(Boolean).join('').toUpperCase() || '?';

        document.getElementById('preview-name').textContent = fullName;
        document.getElementById('preview-initials').textContent = initials;

        const jobParts = [vcardJob.value.trim(), vcardCompany.value.trim()].filter(Boolean);
        document.getElementById('preview-job-company').textContent = jobParts.join(' · ') || '';

        // Avatar
        const avatarWrap = document.getElementById('preview-avatar-wrap');
        const existingImg = avatarWrap.querySelector('img');
        if (existingImg) existingImg.remove();

        if (profilePhotoBase64) {
            const img = document.createElement('img');
            img.src = profilePhotoBase64;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
            document.getElementById('preview-initials').style.display = 'none';
            avatarWrap.appendChild(img);
        } else {
            document.getElementById('preview-initials').style.display = '';
        }

        // Info rows
        const rows = [];
        if (vcardPhone.value.trim()) rows.push({ label: 'mobile', value: vcardPhone.value.trim() });
        if (vcardEmail.value.trim()) rows.push({ label: 'email',  value: vcardEmail.value.trim() });
        if (vcardWebsite.value.trim()) rows.push({ label: 'url',  value: vcardWebsite.value.trim() });
        buildInfoCard(rows);

        // Social rows
        const socials = [];
        if (vcardLinkedIn.value.trim())  socials.push({ icon: '💼', value: vcardLinkedIn.value.trim() });
        if (vcardInstagram.value.trim()) socials.push({ icon: '📸', value: vcardInstagram.value.trim() });
        if (vcardWaSocial.value.trim())  socials.push({ icon: '💬', value: vcardWaSocial.value.trim() });
        buildSocialCard(socials);

        contactPreviewModal.classList.remove('hidden');
        createIcons();
    }

    contactPreviewBtn.addEventListener('click', openContactPreview);
    closePreviewModal.addEventListener('click', () => contactPreviewModal.classList.add('hidden'));
    contactPreviewModal.addEventListener('click', (e) => {
        if (e.target === contactPreviewModal) contactPreviewModal.classList.add('hidden');
    });

    /* ═══════════════════════════════════════════════
       Clipboard — Copy Raw PNG
       ═══════════════════════════════════════════════ */
    copyClipboardBtn.addEventListener('click', async () => {
        try {
            const blob = await qrCode.getRawData('png');
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            const icon = copyClipboardBtn.innerHTML;
            copyClipboardBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => { copyClipboardBtn.innerHTML = icon; createIcons(); }, 2000);
        } catch {
            alert('Clipboard access requires HTTPS or localhost.');
        }
    });

    /* ═══════════════════════════════════════════════
       Downloads
       ═══════════════════════════════════════════════ */
    downloadPngBtn.addEventListener('click', () => {
        saveToHistory();
        const q = parseInt(exportQualitySlider.value);
        qrCode.download({ name: 'swiftqr', extension: 'png', width: q, height: q });
    });

    downloadSvgBtn.addEventListener('click', () => {
        saveToHistory();
        qrCode.download({ name: 'swiftqr', extension: 'svg' });
    });

    downloadVcfBtn.addEventListener('click', () => {
        saveToHistory();
        if (activeTab !== 'vcard') { alert('Switch to the vCard tab first.'); return; }
        const vcfContent = buildVCardString();
        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `swiftqr_${vcardFn.value || 'contact'}.vcf`;
        a.click();
        URL.revokeObjectURL(url);
    });

    /* ═══════════════════════════════════════════════
       History
       ═══════════════════════════════════════════════ */
    async function saveToHistory() {
        const history = JSON.parse(localStorage.getItem('swiftqr_history_glass_v3') || '[]');
        const thumbBlob = await qrCode.getRawData('png');
        const reader    = new FileReader();
        reader.onloadend = () => {
            const config = {
                id: Date.now(), tab: activeTab, thumbnail: reader.result,
                values: {
                    url: inputUrl.value,
                    wifi: { ssid: wifiSsid.value, pass: wifiPass.value, enc: wifiEnc.value },
                    vcard: {
                        fn: vcardFn.value, ln: vcardLn.value, job: vcardJob.value,
                        ph: vcardPhone.value, em: vcardEmail.value, org: vcardCompany.value,
                        web: vcardWebsite.value, linkedin: vcardLinkedIn.value,
                        instagram: vcardInstagram.value, wa: vcardWaSocial.value
                    },
                    wa: { phone: waPhone.value, msg: waMsg.value }
                },
                style: {
                    modes: { ...modes }, maskMode,
                    qr: { c1: qrColor1.value, c2: qrColor2.value, rot: qrRotation.value, gradType: gradientTypeSelect.value },
                    dot: dotStyle.value, cornerSq: cornerSquareType.value, cornerDot: cornerDotType.value,
                    eyeFrame: eyeFrameColor.value, eyeDot: eyeDotColor.value,
                    logo: uploadedLogo, logoBg: isLogoBgActive, logoMargin: logoMargin.value
                }
            };
            history.unshift(config);
            localStorage.setItem('swiftqr_history_glass_v3', JSON.stringify(history.slice(0, 12)));
            renderHistory();
        };
        reader.readAsDataURL(thumbBlob);
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('swiftqr_history_glass_v3') || '[]');
        historyContainer.innerHTML = '';
        if (!history.length) { historyContainer.appendChild(noHistoryMsg); noHistoryMsg.classList.remove('hidden'); return; }
        noHistoryMsg.classList.add('hidden');
        history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-item p-6 rounded-[2.5rem] cursor-pointer flex items-center gap-6 group';
            card.innerHTML = `
                <div class="history-thumbnail shrink-0 bg-white p-1 rounded-2xl shadow-xl transition-transform group-hover:scale-110">
                    <img src="${item.thumbnail}" class="w-full h-full object-contain" alt="QR Thumb">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[8px] font-black text-white/20 tracking-[0.2em] uppercase">${item.tab}</span>
                        <span class="text-[8px] text-white/20 font-mono">${new Date(item.id).toLocaleDateString()}</span>
                    </div>
                    <h4 class="text-[10px] font-bold text-white/60 truncate uppercase tracking-widest">${getHistoryLabel(item)}</h4>
                </div>`;
            card.onclick = () => applyHistory(item);
            historyContainer.appendChild(card);
        });
        createIcons();
    }

    function getHistoryLabel(item) {
        if (item.tab === 'url')       return item.values.url || 'URI_BLOCK';
        if (item.tab === 'wifi')      return item.values.wifi.ssid || 'SSID_NODE';
        if (item.tab === 'vcard')     return `${item.values.vcard.fn} ${item.values.vcard.ln}`.trim() || 'VCARD_STUB';
        if (item.tab === 'whatsapp')  return item.values.wa.phone || 'COMMS_WA';
        return 'UNKNOWN';
    }

    function applyHistory(item) {
        inputUrl.value         = item.values.url || '';
        wifiSsid.value         = item.values.wifi.ssid || '';
        wifiPass.value         = item.values.wifi.pass || '';
        wifiEnc.value          = item.values.wifi.enc  || 'WPA';
        vcardFn.value          = item.values.vcard.fn  || '';
        vcardLn.value          = item.values.vcard.ln  || '';
        vcardJob.value         = item.values.vcard.job || '';
        vcardPhone.value       = item.values.vcard.ph  || '';
        vcardEmail.value       = item.values.vcard.em  || '';
        vcardCompany.value     = item.values.vcard.org || '';
        vcardWebsite.value     = item.values.vcard.web || '';
        vcardLinkedIn.value    = item.values.vcard.linkedin  || '';
        vcardInstagram.value   = item.values.vcard.instagram || '';
        vcardWaSocial.value    = item.values.vcard.wa        || '';
        waPhone.value          = item.values.wa.phone || '';
        waMsg.value            = item.values.wa.msg   || '';
        modes.qr               = item.style.modes.qr  || 'solid';
        qrColor1.value         = item.style.qr.c1;
        qrColor2.value         = item.style.qr.c2;
        qrRotation.value       = item.style.qr.rot;
        dotStyle.value         = item.style.dot;
        cornerSquareType.value = item.style.cornerSq    || 'square';
        cornerDotType.value    = item.style.cornerDot   || 'dot';
        eyeFrameColor.value    = item.style.eyeFrame    || '#0f172a';
        eyeDotColor.value      = item.style.eyeDot      || '#0f172a';
        uploadedLogo           = item.style.logo        || null;
        isLogoBgActive         = item.style.logoBg      || false;
        logoMargin.value       = item.style.logoMargin  || 10;
        maskMode               = item.style.maskMode    || 'overlay';
        gradientTypeSelect.value = item.style.qr.gradType || 'linear';

        updateColorModeUI('qr', modes.qr);
        logoBgToggle.classList.toggle('active', isLogoBgActive);
        clearLogoBtn.classList.toggle('hidden', !uploadedLogo);
        magicWandBtn.classList.toggle('hidden', !uploadedLogo);
        maskBtns.forEach(b => { b.classList.toggle('active-mask', b.getAttribute('data-mask') === maskMode); });

        const targetTab = document.querySelector(`[data-tab="${item.tab}"]`);
        if (targetTab) targetTab.click();
        updateQRCode();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('PURGE_ALL_ARCHIVE_DATA?')) {
            localStorage.removeItem('swiftqr_history_glass_v3');
            renderHistory();
        }
    });

    /* ═══════════════════════════════════════════════
       Reset
       ═══════════════════════════════════════════════ */
    resetBtn.addEventListener('click', () => {
        if (!confirm('TERMINATE_ALL_DATA_BUFFERS?')) return;
        [inputUrl, wifiSsid, wifiPass, vcardFn, vcardLn, vcardJob, vcardPhone, vcardEmail,
         vcardCompany, vcardWebsite, vcardLinkedIn, vcardInstagram, vcardWaSocial, waPhone, waMsg
        ].forEach(el => el.value = '');
        wifiEnc.value  = 'WPA';
        qrColor1.value = '#0f172a'; qrColor2.value = '#312e81'; qrRotation.value = '0';
        eyeFrameColor.value = '#0f172a'; eyeDotColor.value = '#0f172a';
        dotStyle.value = 'square'; maskMode = 'overlay';
        modes.qr = 'solid'; uploadedLogo = null; isLogoBgActive = false;
        profilePhotoBase64 = null;
        logoUpload.value = ''; profilePhotoUpload.value = '';
        clearLogoBtn.classList.add('hidden'); magicWandBtn.classList.add('hidden');
        clearProfilePhotoBtn.classList.add('hidden');
        profileAvatarImg.classList.add('hidden'); profileAvatarImg.src = '';
        profileAvatarPlaceholder.classList.remove('hidden');
        maskBtns.forEach(b => b.classList.toggle('active-mask', b.getAttribute('data-mask') === 'overlay'));
        updateColorModeUI('qr', 'solid');
        logoBgToggle.classList.remove('active');
        vcardCounter.textContent = '0_CHAR';
        vcardWarning.classList.add('hidden');
        highDensityAlert.classList.add('hidden');
        document.querySelector('.tab-btn')?.click();
        updateQRCode();
    });

    /* ═══════════════════════════════════════════════
       Input Listeners
       ═══════════════════════════════════════════════ */
    [
        inputUrl, wifiSsid, wifiPass, wifiEnc,
        vcardFn, vcardLn, vcardJob, vcardPhone, vcardEmail, vcardCompany, vcardWebsite,
        vcardLinkedIn, vcardInstagram, vcardWaSocial,
        waPhone, waMsg, qrColor1, qrColor2, dotStyle,
        cornerSquareType, cornerDotType, eyeFrameColor, eyeDotColor, logoMargin
    ].forEach(el => el.addEventListener('input', debouncedUpdate));

    /* ═══════════════════════════════════════════════
       Initial Render
       ═══════════════════════════════════════════════ */
    renderHistory();
    updateQRCode();
});
