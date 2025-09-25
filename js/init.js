// Advanced Initialization Script
class AppInitializer {
    constructor() {
        this.version = '1.0.0';
        this.features = {
            wallet: true,
            airdrop: true,
            monad: true,
            analytics: false // Future feature
        };
    }

    async initialize() {
        console.log(`🚀 Omnichain Nexus v${this.version} Initializing...`);

        // Check browser compatibility
        if (!this.checkCompatibility()) {
            this.showCompatibilityWarning();
            return;
        }

        // Initialize service worker for PWA (future)
        this.initializeServiceWorker();

        // Load external dependencies
        await this.loadDependencies();

        // Initialize all modules
        this.initializeModules();

        console.log('✅ Omnichain Nexus initialized successfully!');
    }

    checkCompatibility() {
        return (
            'Promise' in window &&
            'fetch' in window &&
            'localStorage' in window
        );
    }

    showCompatibilityWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%;
          background: #ff6b6b; color: white; padding: 10px;
          text-align: center; z-index: 10000;
      `;
        warning.innerHTML = `
          ⚠️ Your browser may not support all features.
          Please update to the latest version for best experience.
      `;
        document.body.appendChild(warning);
    }

    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Future PWA implementation
        }
    }

    async loadDependencies() {
        // Load external libraries if needed
        return Promise.resolve();
    }

    initializeModules() {
        // Module initialization order
        const modules = [
            () => typeof app !== 'undefined',
            () => typeof walletManager !== 'undefined',
            () => typeof blockchain !== 'undefined',
            () => typeof monadIntegration !== 'undefined',
            () => typeof airdropSystem !== 'undefined'
        ];

        modules.forEach((check, index) => {
            if (!check()) {
                console.warn(`Module ${index} not properly initialized`);
            }
        });
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const initializer = new AppInitializer();
    initializer.initialize();
});