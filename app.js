import * as lucide from 'lucide';
import './style.css';
import QRCodeStyling from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import JSZip from 'jszip';

document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════
       PWA — Register Service Worker
       ═══════════════════════════════════════════════ */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.debug('Service Worker registration failed:', err));
    }

    // Initialize Lucide Icons
    lucide.createIcons({ icons: lucide.icons });

    /* ═══════════════════════════════════════════════
       Utilities
       ═══════════════════════════════════════════════ */
    function debounce(fn, wait) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    const createIcons = () => { if (window.lucide) lucide.createIcons(); };
    createIcons();

    /* ─── Validation Helpers ─── */
    const isValidURL = (url) => {
        try { new URL(url); return true; } catch { return false; }
    };
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone) => /^[\d\s\+\-\(\)]{7,}$/.test(phone);

    /* ═══════════════════════════════════════════════
       DOM References (Grouped)
       ═══════════════════════════════════════════════ */
    const UI = {
        tabs: {
            buttons: document.querySelectorAll('.tab-btn'),
            contents: document.querySelectorAll('.tab-content')
        },
        qr: {
            preview: document.getElementById('qr-preview'),
            ecc: document.getElementById('ecc-display'),
            quality: document.getElementById('export-quality'),
            qualityVal: document.getElementById('quality-val')
        },
        export: {
            png: document.getElementById('download-png'),
            svg: document.getElementById('download-svg'),
            pdf: document.getElementById('download-pdf'),
            vcf: document.getElementById('download-vcf'),
            copy: document.getElementById('copy-clipboard'),
            reset: document.getElementById('reset-btn')
        },
        history: {
            container: document.getElementById('history-container'),
            empty: document.getElementById('no-history'),
            clear: document.getElementById('clear-history')
        },
        mockup: {
            toggle: document.getElementById('toggle-mockup'),
            standard: document.getElementById('standard-view'),
            view: document.getElementById('mockup-view'),
            image: document.getElementById('mockup-qr-img')
        },
        vcard: {
            badge: document.getElementById('vcard-badge'),
            counter: document.getElementById('vcard-counter'),
            warning: document.getElementById('vcard-density-warning'),
            alert: document.getElementById('high-density-alert'),
            fn: document.getElementById('vcard-fn'),
            ln: document.getElementById('vcard-ln'),
            job: document.getElementById('vcard-job'),
            phone: document.getElementById('vcard-phone'),
            email: document.getElementById('vcard-email'),
            org: document.getElementById('vcard-company'),
            web: document.getElementById('vcard-website'),
            linkedin: document.getElementById('vcard-linkedin'),
            instagram: document.getElementById('vcard-instagram'),
            whatsapp: document.getElementById('vcard-wa-social'),
            photoUpload: document.getElementById('profile-photo-upload'),
            avatarWrap: document.getElementById('profile-avatar-wrap'),
            avatarImg: document.getElementById('profile-avatar-img'),
            avatarPlaceholder: document.getElementById('profile-avatar-placeholder'),
            clearPhoto: document.getElementById('clear-profile-photo'),
            previewBtn: document.getElementById('contact-preview-btn'),
            previewModal: document.getElementById('contact-preview-modal'),
            closePreview: document.getElementById('close-preview-modal')
        },
        inputs: {
            url: document.getElementById('input-url'),
            wifi: {
                ssid: document.getElementById('wifi-ssid'),
                pass: document.getElementById('wifi-pass'),
                enc: document.getElementById('wifi-enc')
            },
            wa: {
                phone: document.getElementById('wa-phone'),
                msg: document.getElementById('wa-msg')
            }
        },
        preview: {
            name: document.getElementById('preview-name'),
            initials: document.getElementById('preview-initials'),
            jobInfo: document.getElementById('preview-job-info'),
            avatarWrap: document.getElementById('preview-avatar-wrap'),
            info: document.getElementById('preview-info-section'),
            socialSection: document.getElementById('preview-social-section'),
            socialCard: document.getElementById('preview-social-card')
        },
        controls: {
            accordion: {
                toggle: document.getElementById('accordion-toggle'),
                content: document.getElementById('accordion-content'),
                icon: document.querySelector('.accordion-icon')
            },
            styling: {
                dot: document.getElementById('dot-style'),
                cornerSq: document.getElementById('corner-square-type'),
                cornerDot: document.getElementById('corner-dot-type'),
                eyeFrame: document.getElementById('eye-frame-color'),
                eyeDot: document.getElementById('eye-dot-color'),
                logoUpload: document.getElementById('logo-upload'),
                clearLogo: document.getElementById('clear-logo'),
                logoBg: document.getElementById('logo-bg-toggle'),
                logoMargin: document.getElementById('logo-margin'),
                logoMarginVal: document.getElementById('logo-margin-val'),
                magicWand: document.getElementById('magic-wand-btn'),
                maskBtns: document.querySelectorAll('.mask-btn')
            },
            color: {
                modes: document.querySelectorAll('.color-mode-btn'),
                c1: document.getElementById('qr-color-1'),
                c2: document.getElementById('qr-color-2'),
                rotation: document.getElementById('qr-rotation'),
                rotationVal: document.getElementById('qr-rotation-val'),
                gradType: document.getElementById('gradient-type'),
                gradControls: document.getElementById('qr-gradient-controls'),
                rotControl: document.getElementById('qr-rotation-control')
            },
            theme: document.getElementById('theme-toggle')
        },
        batch: {
            upload: document.getElementById('batch-upload'),
            preview: document.getElementById('batch-preview'),
            count: document.getElementById('batch-count'),
            run: document.getElementById('run-batch'),
            list: document.getElementById('batch-list')
        }
    };

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
    let batchData         = []; // [{name, data}]

    const modes = { qr: 'solid' };

    // ─── Theme Management ───
    const applyTheme = (light) => {
        isLightMode = light;
        document.documentElement.classList.toggle('light', light);
        const dot = UI.controls.theme.querySelector('.theme-dot');
        if (dot) dot.textContent = light ? '☀️' : '🌙';
        UI.controls.theme.setAttribute('aria-label', light ? 'Switch to Dark Mode' : 'Switch to Light Mode');
        try { localStorage.setItem('swiftqr_theme', light ? 'light' : 'dark'); } catch {}
        updateQRCode();
    };

    const initTheme = () => {
        const savedTheme = localStorage.getItem('swiftqr_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const shouldBeLight = savedTheme === 'light' || (!savedTheme && !systemPrefersDark);
        applyTheme(shouldBeLight);
    };



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
    qrCode.append(UI.qr.preview);

    // Theme must init AFTER qrCode so applyTheme -> updateQRCode works
    initTheme();
    UI.controls.theme.addEventListener('click', () => applyTheme(!isLightMode));

    /* ═══════════════════════════════════════════════
       vCard String Builder
       ═══════════════════════════════════════════════ */
    function escapeVCard(s) {
        return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    let cachedVCard = '';
    function buildVCardString() {
        if (activeTab !== 'vcard') return '';
        const fn = (UI.vcard.fn.value || '').trim();
        const ln = (UI.vcard.ln.value || '').trim();
        const fullName = [fn, ln].filter(Boolean).join(' ') || 'Contact';

        let str = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
        str += `N:${escapeVCard(ln)};${escapeVCard(fn)};;;\r\n`;
        str += `FN:${escapeVCard(fullName)}\r\n`;

        const fields = [
            ['TITLE', UI.vcard.job], ['ORG', UI.vcard.org], 
            ['TEL;TYPE=CELL', UI.vcard.phone], ['EMAIL', UI.vcard.email], ['URL', UI.vcard.web]
        ];
        fields.forEach(([key, el]) => { if (el.value.trim()) str += `${key}:${escapeVCard(el.value.trim())}\r\n`; });

        // Social Profiles
        const socials = [['linkedin', UI.vcard.linkedin], ['instagram', UI.vcard.instagram], ['whatsapp', UI.vcard.whatsapp]];
        socials.forEach(([type, el]) => { if (el.value.trim()) str += `X-SOCIALPROFILE;type=${type}:${escapeVCard(el.value.trim())}\r\n`; });

        if (profilePhotoBase64) str += `PHOTO;ENCODING=b;TYPE=JPEG:${profilePhotoBase64.split(',')[1]}\r\n`;

        str += 'END:VCARD';
        cachedVCard = str;
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

    UI.vcard.photoUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        profilePhotoBase64 = await compressImageToJpeg(file);
        // Show in mini preview
        UI.vcard.avatarImg.src = profilePhotoBase64;
        UI.vcard.avatarImg.classList.remove('hidden');
        UI.vcard.avatarPlaceholder.classList.add('hidden');
        UI.vcard.clearPhoto.classList.remove('hidden');
        debouncedUpdate();
    });

    UI.vcard.clearPhoto.addEventListener('click', () => {
        profilePhotoBase64 = null;
        UI.vcard.photoUpload.value = '';
        UI.vcard.avatarImg.classList.add('hidden');
        UI.vcard.avatarImg.src = '';
        UI.vcard.avatarPlaceholder.classList.remove('hidden');
        UI.vcard.clearPhoto.classList.add('hidden');
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
                const SIZE = 40; // Smaller sample size for faster processing
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

    UI.controls.styling.magicWand.addEventListener('click', async () => {
        if (!uploadedLogo) return;
        UI.controls.styling.magicWand.classList.add('extracting');
        const { primary, secondary } = await extractPalette(uploadedLogo);
        UI.controls.styling.magicWand.classList.remove('extracting');

        UI.controls.color.c1.value = primary;
        UI.controls.color.c2.value = secondary;
        UI.controls.styling.eyeFrame.value = primary;
        UI.controls.styling.eyeDot.value = secondary;

        // Enable gradient mode to showcase both colors
        modes.qr = 'gradient';
        updateColorModeUI('qr', 'gradient');
        updateQRCode();

        // Flash button to give success feedback
        UI.controls.styling.magicWand.style.background = 'rgba(99,102,241,0.35)';
        setTimeout(() => { UI.controls.styling.magicWand.style.background = ''; }, 800);
    });

    /* ═══════════════════════════════════════════════
       Logo Masking
       ═══════════════════════════════════════════════ */
    UI.controls.styling.maskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            maskMode = btn.getAttribute('data-mask');
            UI.controls.styling.maskBtns.forEach(b => b.classList.remove('active-mask'));
            btn.classList.add('active-mask');
            updateQRCode();
        });
    });

    /* ═══════════════════════════════════════════════
       Logo Upload / Clear
       ═══════════════════════════════════════════════ */
    UI.controls.styling.logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedLogo = ev.target.result;
            UI.controls.styling.clearLogo.classList.remove('hidden');
            UI.controls.styling.magicWand.classList.remove('hidden');
            updateQRCode();
        };
        reader.readAsDataURL(file);
    });

    UI.controls.styling.clearLogo.addEventListener('click', () => {
        uploadedLogo = null;
        UI.controls.styling.logoUpload.value = '';
        UI.controls.styling.clearLogo.classList.add('hidden');
        UI.controls.styling.magicWand.classList.add('hidden');
        updateQRCode();
    });

    /* ═══════════════════════════════════════════════
       Core QR Update
       ═══════════════════════════════════════════════ */
    function escapeWiFi(s) {
        return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,').replace(/"/g, '\\"');
    }

    function updateQRCode() {
        // ─── Input Validation ───
        const urlVal = UI.inputs.url.value.trim();
        const urlValid = !urlVal || isValidURL(urlVal);
        UI.inputs.url.classList.toggle('border-red-500/50', activeTab === 'url' && !urlValid);

        const emailVal = UI.vcard.email.value.trim();
        const phoneVal = UI.vcard.phone.value.trim();
        const emailValid = !emailVal || isValidEmail(emailVal);
        const phoneValid = !phoneVal || isValidPhone(phoneVal);
        UI.vcard.email.classList.toggle('border-red-500/50', activeTab === 'vcard' && !emailValid);
        UI.vcard.phone.classList.toggle('border-red-500/50', activeTab === 'vcard' && !phoneValid);

        // Only block generation for URL tab with an invalid URL
        if (activeTab === 'url' && !urlValid) return;

        let content = '';

        switch (activeTab) {
            case 'url':
                content = UI.inputs.url.value || 'https://swiftqr.app';
                break;
            case 'wifi':
                content = `WIFI:S:${escapeWiFi(UI.inputs.wifi.ssid.value)||'SSID'};T:${UI.inputs.wifi.enc.value||'WPA'};P:${escapeWiFi(UI.inputs.wifi.pass.value)};;`;
                break;
            case 'vcard':
                content = buildVCardString();
                break;
            case 'whatsapp':
                const rawNum = UI.inputs.wa.phone.value || '';
                const num = rawNum.replace(/[^\d]/g, ''); // Extract only digits for wa.me URL
                const msg = encodeURIComponent(UI.inputs.wa.msg.value);
                content = num ? `https://wa.me/${num}${msg ? '?text=' + msg : ''}` : 'https://wa.me/';
                break;
        }

        // Dot colour / gradient
        const dotsOptions = { type: UI.controls.styling.dot.value || 'square' };
        if (modes.qr === 'solid') {
            dotsOptions.color    = UI.controls.color.c1.value;
            dotsOptions.gradient = null;
        } else {
            dotsOptions.gradient = {
                type: UI.controls.color.gradType.value,
                rotation: (parseInt(UI.controls.color.rotation.value) * Math.PI) / 180,
                colorStops: [{ offset: 0, color: UI.controls.color.c1.value }, { offset: 1, color: UI.controls.color.c2.value }]
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
        const marginForMask = maskMode !== 'overlay' ? 6 : parseInt(UI.controls.styling.logoMargin.value);

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
            cornersSquareOptions: { type: UI.controls.styling.cornerSq.value, color: UI.controls.styling.eyeFrame.value },
            cornersDotOptions:    { type: UI.controls.styling.cornerDot.value,   color: UI.controls.styling.eyeDot.value }
        });

        // ECC label
        const eccLabels = { H: 'HIGH', Q: 'QUARTILE', M: 'MEDIUM', L: 'LOW' };
        UI.qr.ecc.textContent = eccLabels[eccLevel] || eccLevel;

        // vCard-specific UI updates
        if (activeTab === 'vcard') {
            UI.vcard.badge.classList.remove('hidden');
            UI.vcard.counter.textContent = `${content.length}_CHAR`;
            UI.vcard.warning.classList.toggle('hidden', content.length <= 300);
            UI.vcard.alert.classList.toggle('hidden', !profilePhotoBase64);
        } else {
            UI.vcard.badge.classList.add('hidden');
            UI.vcard.warning.classList.add('hidden');
            UI.vcard.alert.classList.add('hidden');
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
            UI.controls.color.gradControls.classList.toggle('hidden', type === 'solid');
            UI.controls.color.rotControl.classList.toggle('hidden', type === 'solid');
        }
    }

    UI.controls.color.modes.forEach(btn => {
        btn.addEventListener('click', () => {
            const type   = btn.getAttribute('data-type');
            const target = btn.getAttribute('data-target');
            modes[target] = type;
            updateColorModeUI(target, type);
            if (UI.controls.accordion.content.style.maxHeight !== '0px') {
                UI.controls.accordion.content.style.maxHeight = UI.controls.accordion.content.scrollHeight + 'px';
            }
            updateQRCode();
        });
    });

    /* ═══════════════════════════════════════════════
       Accordion
       ═══════════════════════════════════════════════ */
    UI.controls.accordion.toggle.addEventListener('click', () => {
        const isOpen = UI.controls.accordion.content.style.maxHeight && UI.controls.accordion.content.style.maxHeight !== '0px';
        if (isOpen) {
            UI.controls.accordion.content.style.maxHeight = '0px';
            UI.controls.accordion.icon.style.transform = 'rotate(0deg)';
        } else {
            UI.controls.accordion.content.style.maxHeight = UI.controls.accordion.content.scrollHeight + 'px';
            UI.controls.accordion.icon.style.transform = 'rotate(180deg)';
        }
    });

    /* ═══════════════════════════════════════════════
       Sidebar Tab Navigation
       ═══════════════════════════════════════════════ */
    UI.tabs.buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const newTab = btn.getAttribute('data-tab');
            if (newTab === activeTab) return; // FIX: avoid redundant updates
            activeTab = newTab;
            UI.tabs.buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            UI.tabs.contents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`${activeTab}-content`).classList.remove('hidden');
            updateQRCode();
        });
    });

    /* ═══════════════════════════════════════════════
       Toggle Controls
       ═══════════════════════════════════════════════ */
    UI.controls.styling.logoBg.addEventListener('click', () => {
        isLogoBgActive = !isLogoBgActive;
        UI.controls.styling.logoBg.classList.toggle('active', isLogoBgActive);
        updateQRCode();
    });

    UI.mockup.toggle.addEventListener('click', () => {
        isMockupActive = !isMockupActive;
        UI.mockup.toggle.classList.toggle('active', isMockupActive);
        UI.mockup.standard.classList.toggle('hidden', isMockupActive);
        UI.mockup.view.classList.toggle('hidden', !isMockupActive);
        if (isMockupActive) updateMockupImage();
    });

    let currentMockupUrl = null;
    async function updateMockupImage() {
        if (!isMockupActive) return;
        if (currentMockupUrl) URL.revokeObjectURL(currentMockupUrl);
        const blob = await qrCode.getRawData('png');
        currentMockupUrl = URL.createObjectURL(blob);
        UI.mockup.image.src = currentMockupUrl;
    }

    /* ═══════════════════════════════════════════════
       Range Inputs
       ═══════════════════════════════════════════════ */
    UI.controls.styling.logoMargin.addEventListener('input', () => {
        UI.controls.styling.logoMarginVal.textContent = `${UI.controls.styling.logoMargin.value}px`;
        debouncedUpdate();
    });
    UI.controls.color.rotation.addEventListener('input', () => {
        UI.controls.color.rotationVal.textContent = `${UI.controls.color.rotation.value}°`;
        debouncedUpdate();
    });
    UI.qr.quality.addEventListener('input', () => {
        UI.qr.qualityVal.textContent = UI.qr.quality.value;
    });

    /* ═══════════════════════════════════════════════
       Contact Preview Modal
       ═══════════════════════════════════════════════ */
    function buildInfoCard(rows) {
        // rows = [{label, value, plain?}]
        const section = UI.preview.info;
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
        const section = UI.preview.socialSection;
        const card    = UI.preview.socialCard;
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
        const fn = (UI.vcard.fn.value || '').trim();
        const ln = (UI.vcard.ln.value || '').trim();
        const fullName = [fn, ln].filter(Boolean).join(' ') || 'No Name';
        const initials = [fn[0], ln[0]].filter(Boolean).join('').toUpperCase() || '?';

        UI.preview.name.textContent = fullName;
        UI.preview.initials.textContent = initials;

        const jobParts = [UI.vcard.job.value.trim(), UI.vcard.org.value.trim()].filter(Boolean);
        UI.preview.jobInfo.textContent = jobParts.join(' · ') || '';

        // Avatar
        const avatarWrap = UI.preview.avatarWrap;
        const existingImg = avatarWrap.querySelector('img');
        if (existingImg) existingImg.remove();

        if (profilePhotoBase64) {
            const img = document.createElement('img');
            img.src = profilePhotoBase64;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
            UI.preview.initials.style.display = 'none';
            avatarWrap.appendChild(img);
        } else {
            UI.preview.initials.style.display = '';
        }

        // Info rows
        const rows = [];
        if (UI.vcard.phone.value.trim()) rows.push({ label: 'mobile', value: UI.vcard.phone.value.trim() });
        if (UI.vcard.email.value.trim()) rows.push({ label: 'email',  value: UI.vcard.email.value.trim() });
        if (UI.vcard.web.value.trim())   rows.push({ label: 'url',    value: UI.vcard.web.value.trim() });
        buildInfoCard(rows);

        // Social rows
        const socials = [];
        if (UI.vcard.linkedin.value.trim())  socials.push({ icon: '💼', value: UI.vcard.linkedin.value.trim() });
        if (UI.vcard.instagram.value.trim()) socials.push({ icon: '📸', value: UI.vcard.instagram.value.trim() });
        if (UI.vcard.whatsapp.value.trim())  socials.push({ icon: '💬', value: UI.vcard.whatsapp.value.trim() });
        buildSocialCard(socials);

        UI.vcard.previewModal.classList.remove('hidden');
    }

    UI.vcard.previewBtn.addEventListener('click', openContactPreview);
    UI.vcard.closePreview.addEventListener('click', () => UI.vcard.previewModal.classList.add('hidden'));
    UI.vcard.previewModal.addEventListener('click', (e) => {
        if (e.target === UI.vcard.previewModal) UI.vcard.previewModal.classList.add('hidden');
    });

    /* ═══════════════════════════════════════════════
       Clipboard — Copy Raw PNG
       ═══════════════════════════════════════════════ */
    UI.export.copy.addEventListener('click', async () => {
        try {
            const blob = await qrCode.getRawData('png');
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            const icon = UI.export.copy.innerHTML;
            UI.export.copy.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => { UI.export.copy.innerHTML = icon; createIcons(); }, 2000);
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            alert('Clipboard access requires HTTPS or localhost.');
        }
    });

    /* ═══════════════════════════════════════════════
       Downloads
       ═══════════════════════════════════════════════ */
    UI.export.png.addEventListener('click', () => {
        saveToHistory();
        const q = parseInt(UI.qr.quality.value);
        qrCode.download({ name: 'swiftqr', extension: 'png', width: q, height: q });
    });

    UI.export.svg.addEventListener('click', () => {
        saveToHistory();
        qrCode.download({ name: 'swiftqr', extension: 'svg' });
    });

    UI.export.vcf.addEventListener('click', () => {
        saveToHistory();
        if (activeTab !== 'vcard') { alert('Switch to the vCard tab first.'); return; }
        const vcfContent = buildVCardString();
        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `swiftqr_${UI.vcard.fn.value || 'contact'}.vcf`;
        a.click();
        URL.revokeObjectURL(url);
    });

    UI.export.pdf.addEventListener('click', async () => {
        try {
            saveToHistory();
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const blob = await qrCode.getRawData('png');
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgData = e.target.result;
                const size = 120;
                const x = (210 - size) / 2;
                const y = (297 - size) / 2;
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 210, 297, 'F');
                doc.addImage(imgData, 'PNG', x, y, size, size);
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text('GENERATED BY SWIFTQR 3D STUDIO', 105, y + size + 20, { align: 'center' });
                doc.save('swiftqr_pro_export.pdf');
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    });

    /* ═══════════════════════════════════════════════
       Batch Processing Logic
       ═══════════════════════════════════════════════ */
    UI.batch.upload.addEventListener('change', (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            Papa.parse(file, {
                complete: (results) => {
                    batchData = results.data
                        .filter(row => row.length >= 2 && row[1].trim())
                        .map(row => ({ name: row[0].trim(), data: row[1].trim() }));
                    renderBatchPreview();
                },
                error: (err) => {
                    console.error('Batch parse error:', err);
                    alert('Failed to parse CSV batch file.');
                },
                header: false,
                skipEmptyLines: true
            });
        } catch (ex) {
            console.error('Batch upload exception:', ex);
            alert('An error occurred while processing the batch file.');
        }
    });

    function renderBatchPreview() {
        UI.batch.list.innerHTML = '';
        if (batchData.length === 0) {
            UI.batch.preview.classList.add('hidden');
            return;
        }
        
        UI.batch.preview.classList.remove('hidden');
        UI.batch.count.textContent = `${batchData.length} ROWS DETECTED`;
        
        batchData.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl';
            row.innerHTML = `
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-bold text-white truncate uppercase tracking-widest">${item.name || 'Untitled'}</p>
                    <p class="text-[9px] text-white/30 truncate">${item.data}</p>
                </div>
                <button class="delete-batch-row p-2 text-white/20 hover:text-red-400 transition-colors" data-index="${index}">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            `;
            UI.batch.list.appendChild(row);
        });
        createIcons();
        
        // Add delete listeners
        UI.batch.list.querySelectorAll('.delete-batch-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                batchData.splice(idx, 1);
                renderBatchPreview();
            });
        });
    }

    UI.batch.run.addEventListener('click', async () => {
        if (batchData.length === 0) return;
        const originalText = UI.batch.run.textContent;
        UI.batch.run.disabled = true;
        UI.batch.run.textContent = 'Processing...';
        try {
            const zip = new JSZip();
            const folder = zip.folder('swiftqr_batch');
            for (let i = 0; i < batchData.length; i++) {
                const item = batchData[i];
                UI.batch.run.textContent = `Processing (${i + 1}/${batchData.length})`;
                qrCode.update({ data: item.data });
                const blob = await qrCode.getRawData('png');
                folder.file(`${item.name || 'qr'}_${i}.png`, blob);
            }
            updateQRCode();
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'swiftqr_batch_export.zip';
            a.click();
        } catch (err) {
            console.error('Batch export failed:', err);
            alert('Batch export failed. Please try again.');
            updateQRCode();
        } finally {
            UI.batch.run.disabled = false;
            UI.batch.run.textContent = originalText;
        }
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
                    url: UI.inputs.url.value,
                    wifi: { ssid: UI.inputs.wifi.ssid.value, pass: UI.inputs.wifi.pass.value, enc: UI.inputs.wifi.enc.value },
                    vcard: {
                        fn: UI.vcard.fn.value, ln: UI.vcard.ln.value, job: UI.vcard.job.value,
                        ph: UI.vcard.phone.value, em: UI.vcard.email.value, org: UI.vcard.org.value,
                        web: UI.vcard.web.value, linkedin: UI.vcard.linkedin.value,
                        instagram: UI.vcard.instagram.value, wa: UI.vcard.whatsapp.value
                    },
                    wa: { phone: UI.inputs.wa.phone.value, msg: UI.inputs.wa.msg.value }
                },
                style: {
                    modes: { ...modes }, maskMode,
                    qr: { c1: UI.controls.color.c1.value, c2: UI.controls.color.c2.value, rot: UI.controls.color.rotation.value, gradType: UI.controls.color.gradType.value },
                    dot: UI.controls.styling.dot.value, cornerSq: UI.controls.styling.cornerSq.value, cornerDot: UI.controls.styling.cornerDot.value,
                    eyeFrame: UI.controls.styling.eyeFrame.value, eyeDot: UI.controls.styling.eyeDot.value,
                    logo: uploadedLogo, logoBg: isLogoBgActive, logoMargin: UI.controls.styling.logoMargin.value
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
        UI.history.container.innerHTML = '';
        if (!history.length) { 
            UI.history.empty.classList.remove('hidden'); 
            return; 
        }
        UI.history.empty.classList.add('hidden');
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
            UI.history.container.appendChild(card);
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
        UI.inputs.url.value         = item.values.url || '';
        UI.inputs.wifi.ssid.value   = item.values.wifi.ssid || '';
        UI.inputs.wifi.pass.value   = item.values.wifi.pass || '';
        UI.inputs.wifi.enc.value    = item.values.wifi.enc  || 'WPA';
        UI.vcard.fn.value          = item.values.vcard.fn  || '';
        UI.vcard.ln.value          = item.values.vcard.ln  || '';
        UI.vcard.job.value         = item.values.vcard.job || '';
        UI.vcard.phone.value       = item.values.vcard.ph  || '';
        UI.vcard.email.value       = item.values.vcard.em  || '';
        UI.vcard.org.value         = item.values.vcard.org || '';
        UI.vcard.web.value         = item.values.vcard.web || '';
        UI.vcard.linkedin.value    = item.values.vcard.linkedin  || '';
        UI.vcard.instagram.value   = item.values.vcard.instagram || '';
        UI.vcard.whatsapp.value    = item.values.vcard.wa        || '';
        UI.inputs.wa.phone.value   = item.values.wa.phone || '';
        UI.inputs.wa.msg.value     = item.values.wa.msg   || '';
        modes.qr                   = item.style.modes.qr  || 'solid';
        UI.controls.color.c1.value = item.style.qr.c1;
        UI.controls.color.c2.value = item.style.qr.c2;
        UI.controls.color.rotation.value = item.style.qr.rot;
        UI.controls.styling.dot.value = item.style.dot;
        UI.controls.styling.cornerSq.value = item.style.cornerSq    || 'square';
        UI.controls.styling.cornerDot.value = item.style.cornerDot   || 'dot';
        UI.controls.styling.eyeFrame.value = item.style.eyeFrame    || '#0f172a';
        UI.controls.styling.eyeDot.value = item.style.eyeDot      || '#0f172a';
        uploadedLogo               = item.style.logo        || null;
        isLogoBgActive             = item.style.logoBg      || false;
        UI.controls.styling.logoMargin.value = item.style.logoMargin  || 10;
        maskMode                   = item.style.maskMode    || 'overlay';
        UI.controls.color.gradType.value = item.style.qr.gradType || 'linear';

        updateColorModeUI('qr', modes.qr);
        UI.controls.styling.logoBg.classList.toggle('active', isLogoBgActive);
        UI.controls.styling.clearLogo.classList.toggle('hidden', !uploadedLogo);
        UI.controls.styling.magicWand.classList.toggle('hidden', !uploadedLogo);
        UI.controls.styling.maskBtns.forEach(b => { b.classList.toggle('active-mask', b.getAttribute('data-mask') === maskMode); });

        const targetTab = document.querySelector(`[data-tab="${item.tab}"]`);
        if (targetTab) targetTab.click();
        updateQRCode();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    UI.history.clear.addEventListener('click', () => {
        if (confirm('PURGE_ALL_ARCHIVE_DATA?')) {
            localStorage.removeItem('swiftqr_history_glass_v3');
            renderHistory();
        }
    });

    /* ═══════════════════════════════════════════════
       Reset
       ═══════════════════════════════════════════════ */
    UI.export.reset.addEventListener('click', () => {
        if (!confirm('TERMINATE_ALL_DATA_BUFFERS?')) return;
        [UI.inputs.url, UI.inputs.wifi.ssid, UI.inputs.wifi.pass, 
         UI.vcard.fn, UI.vcard.ln, UI.vcard.job, UI.vcard.phone, UI.vcard.email,
         UI.vcard.org, UI.vcard.web, UI.vcard.linkedin, UI.vcard.instagram, 
         UI.vcard.whatsapp, UI.inputs.wa.phone, UI.inputs.wa.msg
        ].forEach(el => el.value = '');
        
        UI.inputs.wifi.enc.value  = 'WPA';
        UI.controls.color.c1.value = '#0f172a'; 
        UI.controls.color.c2.value = '#312e81'; 
        UI.controls.color.rotation.value = '0';
        UI.controls.styling.eyeFrame.value = '#0f172a'; 
        UI.controls.styling.eyeDot.value = '#0f172a';
        UI.controls.styling.dot.value = 'square'; 
        maskMode = 'overlay';
        modes.qr = 'solid'; 
        uploadedLogo = null; 
        isLogoBgActive = false;
        profilePhotoBase64 = null;
        
        UI.controls.styling.logoUpload.value = ''; 
        UI.vcard.photoUpload.value = '';
        UI.controls.styling.clearLogo.classList.add('hidden'); 
        UI.controls.styling.magicWand.classList.add('hidden');
        UI.vcard.clearPhoto.classList.add('hidden');
        UI.vcard.avatarImg.classList.add('hidden'); 
        UI.vcard.avatarImg.src = '';
        UI.vcard.avatarPlaceholder.classList.remove('hidden');
        UI.controls.styling.maskBtns.forEach(b => b.classList.toggle('active-mask', b.getAttribute('data-mask') === 'overlay'));
        updateColorModeUI('qr', 'solid');
        UI.controls.styling.logoBg.classList.remove('active');
        UI.vcard.counter.textContent = '0_CHAR';
        UI.vcard.warning.classList.add('hidden');
        UI.vcard.alert.classList.add('hidden');
        document.querySelector('.tab-btn')?.click();
        updateQRCode();
    });

    /* ═══════════════════════════════════════════════
       Input Listeners
       ═══════════════════════════════════════════════ */
    [
        UI.inputs.url, UI.inputs.wifi.ssid, UI.inputs.wifi.pass, UI.inputs.wifi.enc,
        UI.vcard.fn, UI.vcard.ln, UI.vcard.job, UI.vcard.phone, UI.vcard.email, UI.vcard.org, UI.vcard.web,
        UI.vcard.linkedin, UI.vcard.instagram, UI.vcard.whatsapp,
        UI.inputs.wa.phone, UI.inputs.wa.msg, UI.controls.color.c1, UI.controls.color.c2, UI.controls.styling.dot,
        UI.controls.styling.cornerSq, UI.controls.styling.cornerDot, UI.controls.styling.eyeFrame, UI.controls.styling.eyeDot, UI.controls.styling.logoMargin
    ].forEach(el => el.addEventListener('input', debouncedUpdate));

    /* ═══════════════════════════════════════════════
       Global Error Handlers
       ═══════════════════════════════════════════════ */
    window.addEventListener('error', (e) => {
        console.error('[SwiftQR] Uncaught error:', e.error || e.message);
    });
    window.addEventListener('unhandledrejection', (e) => {
        console.error('[SwiftQR] Unhandled promise rejection:', e.reason);
    });

    /* ═══════════════════════════════════════════════
       Initial Render
       ═══════════════════════════════════════════════ */
    renderHistory();
    updateQRCode();
});
