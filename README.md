# SwiftQR 3D Studio

**SwiftQR 3D Studio** is a professional-grade, high-fidelity QR design workstation. Built with a "Studio-first" philosophy, it combines the tactile aesthetics of **3D Glassmorphism** with an advanced QR generation engine tailored for designers and developers.

---

## 💎 Features

- **3D Glassmorphism UI**: An immersive, dark-themed workstation featuring animated mesh backgrounds, backdrop blurs, and 3D inner-highlight effects.
- **Advanced QR Engine**: Powered by `qr-code-styling`, offering precise control over molecular patterns, eye styles, and multi-stop gradients.
- **3D Mockup Studio**: Instantly project your design onto a 3D-styled glass business card mockup with perspective-aware interactions.
- **Smart Identity Suite**:
  - **URL & WiFi**: Standard protocols with high-resolution generation.
  - **vCard Creator**: Full contact card integration (Name, Job, Org, Comms, Web) using the `vcard-creator` library.
  - **Density Monitor**: Real-time character counting with "High-Density" warnings for complex payloads.
- **Pro-Grade Export**:
  - **Ultra-Res PNG**: High-bitrate exports up to 4000px.
  - **Scalable SVG**: Vector-perfect assets for print and digital interfaces.
  - **Standalone .VCF**: Export raw contact data files independently.
- **Archive System**: Local history cache with visual thumbnails and instant configuration restoration.

---

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5 Semantic Structure.
- **Styling**: Tailwind CSS (Utility) + Custom Vanilla CSS (3D & Glass Effects).
- **Libraries**:
  - `qr-code-styling`: Core generation and render engine.
  - `vcard-creator`: Standardized contact card formatting.
  - `Lucide`: Premium, minimalist iconography suite.
- **SEO**: Structured **JSON-LD** (`SoftwareApplication`) and **Schema.org** Person metadata.

---

## 🚀 Performance Optimizations

- **Input Debouncing**: Logic-driven CPU throttling ensures smooth updates even with complex gradient/logo calculations.
- **Asset Deferral**: Non-critical libraries are deferred to prioritize the Initial Viewport Paint (IVP).
- **Glass-Utility Architecture**: Consolidate styling tokens for reduced CSS footprint and GPU-accelerated backdrop filters.

---

## 🔧 Setup & Development

1. **Clone the project**:
   ```bash
   git clone [repository-url]
   ```
2. **Open `index.html`**:
   Simply serve the project via any local server (VS Code Live Server, Python HTTP, etc.).
   
3. **Important Note on Clipboard**:
   The **"Copy PNG"** feature requires a **Secure Context (HTTPS)** or `localhost` to function due to browser security protocols.

---

## 📜 License

Released under the **MIT License**. Created by **Hasan Rizvee**.
