document.addEventListener('DOMContentLoaded', () => {
    // Initialize Icons
    const createIcons = () => { if (window.lucide) lucide.createIcons(); };
    createIcons();

    // Debounce Utility for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    // UI Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const qrPreviewContainer = document.getElementById('qr-preview');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadSvgBtn = document.getElementById('download-svg');
    const downloadVcfBtn = document.getElementById('download-vcf');
    const copyClipboardBtn = document.getElementById('copy-clipboard');
    const resetBtn = document.getElementById('reset-btn');
    const historyContainer = document.getElementById('history-container');
    const noHistoryMsg = document.getElementById('no-history');
    const clearHistoryBtn = document.getElementById('clear-history');
    const eccDisplay = document.getElementById('ecc-display');
    const exportQualitySlider = document.getElementById('export-quality');
    const qualityValDisplay = document.getElementById('quality-val');

    // View Toggles
    const toggleMockupBtn = document.getElementById('toggle-mockup');
    const standardView = document.getElementById('standard-view');
    const mockupView = document.getElementById('mockup-view');
    const mockupQrImg = document.getElementById('mockup-qr-img');
    const vcardBadge = document.getElementById('vcard-badge');
    const vcardCounter = document.getElementById('vcard-counter');
    const vcardWarning = document.getElementById('vcard-density-warning');
    let isMockupActive = false;

    // Input Elements
    const inputUrl = document.getElementById('input-url');
    const wifiSsid = document.getElementById('wifi-ssid');
    const wifiPass = document.getElementById('wifi-pass');
    const wifiEnc = document.getElementById('wifi-enc');
    const vcardFn = document.getElementById('vcard-fn');
    const vcardLn = document.getElementById('vcard-ln');
    const vcardJob = document.getElementById('vcard-job');
    const vcardPhone = document.getElementById('vcard-phone');
    const vcardEmail = document.getElementById('vcard-email');
    const vcardCompany = document.getElementById('vcard-company');
    const vcardWebsite = document.getElementById('vcard-website');
    const waPhone = document.getElementById('wa-phone');
    const waMsg = document.getElementById('wa-msg');

    // Accordion Elements
    const accordionToggle = document.getElementById('accordion-toggle');
    const accordionContent = document.getElementById('accordion-content');
    const accordionIcon = document.querySelector('.accordion-icon');

    // Appearance/Customization Elements
    const dotStyle = document.getElementById('dot-style');
    const cornerSquareType = document.getElementById('corner-square-type');
    const cornerDotType = document.getElementById('corner-dot-type');
    const logoUpload = document.getElementById('logo-upload');
    const clearLogoBtn = document.getElementById('clear-logo');
    const logoBgToggle = document.getElementById('logo-bg-toggle');
    const logoMargin = document.getElementById('logo-margin');
    const logoMarginVal = document.getElementById('logo-margin-val');
    let isLogoBgActive = false;
    
    // Color Mode Logic
    const colorModeBtns = document.querySelectorAll('.color-mode-btn');
    const modes = {
        qr: 'solid',
        bg: 'solid'
    };

    const qrColor1 = document.getElementById('qr-color-1');
    const qrColor2 = document.getElementById('qr-color-2');
    const qrRotation = document.getElementById('qr-rotation');
    const qrRotationVal = document.getElementById('qr-rotation-val');
    const gradientTypeSelect = document.getElementById('gradient-type');
    const qrGradientControls = document.getElementById('qr-gradient-controls');
    const qrRotationControl = document.getElementById('qr-rotation-control');

    let activeTab = 'url';
    let uploadedLogo = null;

    // Initialize QR Code Styling with 3D Glass Defaults
    const qrCode = new QRCodeStyling({
        width: 600,
        height: 600,
        type: "svg",
        data: "https://swiftqr.app",
        qrOptions: {
            errorCorrectionLevel: 'M'
        },
        dotsOptions: {
            color: "#0f172a",
            type: "square"
        },
        backgroundOptions: {
            color: "#ffffff",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 10,
            imageSize: 0.4
        },
        cornersSquareOptions: {
            type: "square",
            color: "#0f172a"
        },
        cornersDotOptions: {
            type: "square",
            color: "#0f172a"
        }
    });

    qrCode.append(qrPreviewContainer);

    // Initial History Load
    renderHistory();

    // Reset Functionality
    resetBtn.addEventListener('click', () => {
        if (confirm('TERMINATE_ALL_DATA_BUFFERS?')) {
            resetApp();
        }
    });

    function resetApp() {
        [inputUrl, wifiSsid, wifiPass, vcardFn, vcardLn, vcardJob, vcardPhone, vcardEmail, vcardCompany, vcardWebsite, waPhone, waMsg].forEach(i => i.value = "");
        wifiEnc.value = "WPA";
        qrColor1.value = "#0f172a";
        qrColor2.value = "#312e81";
        qrRotation.value = "0";
        dotStyle.value = "square";
        modes.qr = 'solid';
        modes.bg = 'solid';
        uploadedLogo = null;
        logoUpload.value = "";
        clearLogoBtn.classList.add('hidden');
        updateColorModeUI('qr', 'solid');
        
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) firstTab.click();
        vcardCounter.textContent = "0_CHAR";
        vcardWarning.classList.add('hidden');
        updateQRCode();
    }

    function updateColorModeUI(target, type) {
        const btns = document.querySelectorAll(`[data-target="${target}"]`);
        btns.forEach(btn => {
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active-glass');
                btn.classList.remove('text-white/40', 'hover:bg-white/5');
            } else {
                btn.classList.remove('active-glass');
                btn.classList.add('text-white/40', 'hover:bg-white/5');
            }
        });
        if (target === 'qr') {
            qrGradientControls.classList.toggle('hidden', type === 'solid');
            qrRotationControl.classList.toggle('hidden', type === 'solid');
        }
    }

    // Color Mode Switching
    colorModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            const target = btn.getAttribute('data-target');
            modes[target] = type;
            updateColorModeUI(target, type);
            if (accordionContent.style.maxHeight !== '0px') {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            }
            updateQRCode();
        });
    });

    // History Logic
    async function saveToHistory() {
        const history = JSON.parse(localStorage.getItem('swiftqr_history_glass_v2') || '[]');
        
        // Generate a small thumbnail for history
        const thumbBlob = await qrCode.getRawData('png');
        const reader = new FileReader();
        
        reader.onloadend = () => {
            const thumbData = reader.result;
            const config = {
                id: Date.now(),
                tab: activeTab,
                thumbnail: thumbData,
                values: {
                    url: inputUrl.value,
                    wifi: { ssid: wifiSsid.value, pass: wifiPass.value, enc: wifiEnc.value },
                    vcard: { 
                        fn: vcardFn.value, 
                        ln: vcardLn.value, 
                        job: vcardJob.value,
                        ph: vcardPhone.value, 
                        em: vcardEmail.value, 
                        org: vcardCompany.value,
                        web: vcardWebsite.value
                    },
                    wa: { phone: waPhone.value, msg: waMsg.value }
                },
                style: {
                    modes: { ...modes },
                    qr: { c1: qrColor1.value, c2: qrColor2.value, rot: qrRotation.value, gradType: gradientTypeSelect.value },
                    dot: dotStyle.value,
                    cornerSq: cornerSquareType.value,
                    cornerDot: cornerDotType.value,
                    logo: uploadedLogo,
                    logoBg: isLogoBgActive,
                    logoMargin: logoMargin.value
                }
            };
            history.unshift(config);
            localStorage.setItem('swiftqr_history_glass_v2', JSON.stringify(history.slice(0, 12)));
            renderHistory();
        };
        reader.readAsDataURL(thumbBlob);
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('swiftqr_history_glass_v2') || '[]');
        historyContainer.innerHTML = '';
        if (history.length === 0) {
            historyContainer.appendChild(noHistoryMsg);
            noHistoryMsg.classList.remove('hidden');
            return;
        }
        noHistoryMsg.classList.add('hidden');
        history.forEach(item => {
            const card = document.createElement('div');
            card.className = "history-item p-6 rounded-[2.5rem] cursor-pointer flex items-center gap-6 group";
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
                </div>
            `;
            card.onclick = () => applyHistory(item);
            historyContainer.appendChild(card);
        });
        if (window.lucide) lucide.createIcons();
    }

    function getHistoryLabel(item) {
        if (item.tab === 'url') return item.values.url || 'URI_BLOCK';
        if (item.tab === 'wifi') return item.values.wifi.ssid || 'SSID_NODE';
        if (item.tab === 'vcard') return `${item.values.vcard.fn} ${item.values.vcard.ln}`.trim() || 'VCARD_STUB';
        if (item.tab === 'whatsapp') return item.values.wa.phone || 'COMMS_WA';
        return 'UNKNOWN_OBJECT';
    }

    function applyHistory(item) {
        inputUrl.value = item.values.url;
        wifiSsid.value = item.values.wifi.ssid;
        wifiPass.value = item.values.wifi.pass;
        wifiEnc.value = item.values.wifi.enc;
        vcardFn.value = item.values.vcard.fn;
        vcardLn.value = item.values.vcard.ln;
        vcardJob.value = item.values.vcard.job || '';
        vcardPhone.value = item.values.vcard.ph;
        vcardEmail.value = item.values.vcard.em;
        vcardCompany.value = item.values.vcard.org;
        vcardWebsite.value = item.values.vcard.web || '';
        waPhone.value = item.values.wa.phone;
        waMsg.value = item.values.wa.msg;
        modes.qr = item.style.modes.qr;
        qrColor1.value = item.style.qr.c1;
        qrColor2.value = item.style.qr.c2;
        qrRotation.value = item.style.qr.rot;
        dotStyle.value = item.style.dot;
        cornerSquareType.value = item.style.cornerSq || 'square';
        cornerDotType.value = item.style.cornerDot || 'dot';
        uploadedLogo = item.style.logo;
        isLogoBgActive = item.style.logoBg || false;
        logoMargin.value = item.style.logoMargin || 10;
        gradientTypeSelect.value = item.style.qr.gradType || 'linear';

        updateColorModeUI('qr', modes.qr);
        if (uploadedLogo) clearLogoBtn.classList.remove('hidden');
        else clearLogoBtn.classList.add('hidden');
        
        if (isLogoBgActive) logoBgToggle.classList.add('active');
        else logoBgToggle.classList.remove('active');

        const targetTab = document.querySelector(`[data-tab="${item.tab}"]`);
        if (targetTab) targetTab.click();
        updateQRCode();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('PURGE_ALL_ARCHIVE_DATA?')) {
            localStorage.removeItem('swiftqr_history_glass_v2');
            renderHistory();
        }
    });

    // View Toggle Logic
    toggleMockupBtn.addEventListener('click', () => {
        isMockupActive = !isMockupActive;
        toggleMockupBtn.classList.toggle('active');
        standardView.classList.toggle('hidden');
        mockupView.classList.toggle('hidden');
        if (isMockupActive) updateMockupImage();
    });

    async function updateMockupImage() {
        if (!isMockupActive) return;
        const blob = await qrCode.getRawData('png');
        const url = URL.createObjectURL(blob);
        mockupQrImg.src = url;
    }

    // Accordion Logic
    accordionToggle.addEventListener('click', () => {
        const isOpen = accordionContent.style.maxHeight !== '0px' && accordionContent.style.maxHeight !== '';
        if (isOpen) {
            accordionContent.style.maxHeight = '0px';
            accordionIcon.style.transform = 'rotate(0deg)';
        } else {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            accordionIcon.style.transform = 'rotate(180deg)';
        }
    });

    // Sidebar Navigation Logic
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            activeTab = tab;
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`${tab}-content`).classList.remove('hidden');
            updateQRCode();
        });
    });

    // Logo Logic
    logoBgToggle.addEventListener('click', () => {
        isLogoBgActive = !isLogoBgActive;
        logoBgToggle.classList.toggle('active');
        updateQRCode();
    });

    logoMargin.addEventListener('input', () => {
        logoMarginVal.textContent = `${logoMargin.value}px`;
        updateQRCode();
    });

    qrRotation.addEventListener('input', () => {
        qrRotationVal.textContent = `${qrRotation.value}°`;
        updateQRCode();
    });

    exportQualitySlider.addEventListener('input', () => {
        qualityValDisplay.textContent = exportQualitySlider.value;
    });

    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedLogo = event.target.result;
                clearLogoBtn.classList.remove('hidden');
                updateQRCode();
            };
            reader.readAsDataURL(file);
        }
    });

    clearLogoBtn.addEventListener('click', () => {
        uploadedLogo = null;
        logoUpload.value = "";
        clearLogoBtn.classList.add('hidden');
        updateQRCode();
    });

    function escapeWiFi(str) {
        if (!str) return "";
        return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,").replace(/"/g, '\\"');
    }

    // QR Update Core
    function updateQRCode() {
        let content = "";
        switch (activeTab) {
            case 'url': content = inputUrl.value || "https://swiftqr.app"; break;
            case 'wifi':
                const ssid = escapeWiFi(wifiSsid.value) || "SSID";
                const pass = escapeWiFi(wifiPass.value) || "";
                const enc = wifiEnc.value || "WPA";
                content = `WIFI:S:${ssid};T:${enc};P:${pass};;`;
                break;
            case 'vcard':
                try {
                    // Try to use the library if available
                    const VCard = (window.vcardcreator && window.vcardcreator.default) || window.VCard;
                    if (VCard) {
                        const myVCard = new VCard();
                        myVCard
                            .addName(vcardLn.value || 'Last', vcardFn.value || 'First')
                            .addJobtitle(vcardJob.value || '')
                            .addCompany(vcardCompany.value || '')
                            .addEmail(vcardEmail.value || '')
                            .addPhoneNumber(vcardPhone.value || '')
                            .addURL(vcardWebsite.value || '');
                        content = myVCard.toString();
                    } else {
                        // Fallback to manual if library fails to load
                        content = `BEGIN:VCARD\nVERSION:3.0\nN:${vcardLn.value || 'Last'};${vcardFn.value || 'First'};;;\nFN:${vcardFn.value} ${vcardLn.value}\nORG:${vcardCompany.value}\nTEL:${vcardPhone.value}\nEMAIL:${vcardEmail.value}\nEND:VCARD`;
                    }
                } catch (err) {
                    console.error("VCARD_GEN_ERROR:", err);
                    content = "VCARD_ERROR";
                }
                break;
            case 'whatsapp':
                const num = waPhone.value.replace(/\D/g, '');
                const msg = encodeURIComponent(waMsg.value);
                content = num ? `https://wa.me/${num}${msg ? '?text=' + msg : ''}` : "https://wa.me/";
                break;
        }

        const dotsOptions = { type: dotStyle.value || 'square' };
        if (modes.qr === 'solid') {
            dotsOptions.color = qrColor1.value;
            dotsOptions.gradient = null;
        } else {
            dotsOptions.gradient = {
                type: gradientTypeSelect.value,
                rotation: (parseInt(qrRotation.value) * Math.PI) / 180,
                colorStops: [{ offset: 0, color: qrColor1.value }, { offset: 1, color: qrColor2.value }]
            };
        }

        const eccLevel = activeTab === 'vcard' ? 'Q' : (uploadedLogo ? 'H' : 'M');
        
        qrCode.update({
            data: content,
            image: uploadedLogo,
            qrOptions: { errorCorrectionLevel: eccLevel },
            dotsOptions: dotsOptions,
            backgroundOptions: { color: "#ffffff" },
            imageOptions: {
                hideBackgroundDots: isLogoBgActive,
                margin: parseInt(logoMargin.value)
            },
            cornersSquareOptions: { 
                type: cornerSquareType.value, 
                color: qrColor1.value 
            },
            cornersDotOptions: { 
                type: cornerDotType.value, 
                color: qrColor1.value 
            }
        });

        const eccLabel = eccLevel === 'H' ? 'HIGH' : (eccLevel === 'Q' ? 'QUARTILE' : 'MEDIUM');
        eccDisplay.textContent = eccLabel;
        
        if (activeTab === 'vcard') {
            vcardBadge.classList.remove('hidden');
            vcardCounter.textContent = `${content.length}_CHAR`;
            if (content.length > 300) {
                vcardWarning.classList.remove('hidden');
            } else {
                vcardWarning.classList.add('hidden');
            }
        } else {
            vcardBadge.classList.add('hidden');
            vcardWarning.classList.add('hidden');
        }
        if (isMockupActive) updateMockupImage();
    }

    const debouncedUpdate = debounce(updateQRCode, 100);

    // Clipboard Logic
    copyClipboardBtn.addEventListener('click', async () => {
        try {
            const blob = await qrCode.getRawData('png');
            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);
            
            // Visual Feedback
            const originalIcon = copyClipboardBtn.innerHTML;
            copyClipboardBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => {
                copyClipboardBtn.innerHTML = originalIcon;
            }, 2000);
        } catch (err) {
            console.error('FAILED_TO_COPY_ASSET:', err);
            alert('Clipboard access denied. Ensure you are on a secure connection (HTTPS).');
        }
    });

    // Input Listeners
    const inputs = [
        inputUrl, wifiSsid, wifiPass, wifiEnc, 
        vcardFn, vcardLn, vcardJob, vcardPhone, vcardEmail, vcardCompany, vcardWebsite,
        waPhone, waMsg, qrColor1, qrColor2, qrRotation, dotStyle,
        cornerSquareType, cornerDotType, logoMargin
    ];
    inputs.forEach(input => input.addEventListener('input', debouncedUpdate));

    // Downloads
    downloadPngBtn.addEventListener('click', () => { 
        saveToHistory(); 
        const q = parseInt(exportQualitySlider.value);
        qrCode.download({ name: "swiftqr", extension: "png", width: q, height: q }); 
    });
    downloadSvgBtn.addEventListener('click', () => { 
        saveToHistory(); 
        qrCode.download({ name: "swiftqr", extension: "svg" }); 
    });
    downloadVcfBtn.addEventListener('click', () => {
        saveToHistory();
        // Generate current vCard string
        const VCard = (window.vcardcreator && window.vcardcreator.default) || window.VCard;
        if (!VCard) return;
        
        const myVCard = new VCard();
        myVCard
            .addName(vcardLn.value || 'Last', vcardFn.value || 'First')
            .addJobtitle(vcardJob.value || '')
            .addCompany(vcardCompany.value || '')
            .addEmail(vcardEmail.value || '')
            .addPhoneNumber(vcardPhone.value || '')
            .addURL(vcardWebsite.value || '');
            
        const vcfContent = myVCard.toString();
        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `swiftqr_${vcardFn.value || 'contact'}.vcf`;
        a.click();
        URL.revokeObjectURL(url);
    });
});
