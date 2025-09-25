// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

function initApp() {
    // Initialize components
    initScrollReveal();
    initParticles();
    initSmoothScroll();
    initAirdropSystem();

    // Add event listeners
    document.getElementById('exploreBtn').addEventListener('click', function() {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('startAirdrop').addEventListener('click', function() {
        document.getElementById('airdrop').scrollIntoView({ behavior: 'smooth' });
    });

    // Check if wallet is already connected
    checkWalletConnection();
}

// Scroll Reveal Animation
function initScrollReveal() {
    const scrollElements = document.querySelectorAll('.scroll-reveal');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('revealed');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            }
        });
    };

    // Set initial state
    scrollElements.forEach(el => {
        el.classList.add('scroll-reveal');
    });

    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });

    // Trigger once on load
    handleScrollAnimation();
}

// Particles.js Background
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#6C63FF'
                },
                shape: {
                    type: 'circle',
                    stroke: {
                        width: 0,
                        color: '#000000'
                    }
                },
                opacity: {
                    value: 0.5,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 2,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#6C63FF',
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'grab'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 200,
                        line_linked: {
                            opacity: 0.3
                        }
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
    }
}

// Smooth Scroll for Navigation
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Check if wallet is already connected (from localStorage)
function checkWalletConnection() {
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedBalance = localStorage.getItem('walletBalance');

    if (savedWallet) {
        document.getElementById('connectWallet').classList.add('hidden');
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent =
            `${savedWallet.substring(0, 6)}...${savedWallet.substring(savedWallet.length - 4)}`;

        if (savedBalance) {
            document.getElementById('walletBalance').textContent = `${savedBalance} MONAD`;
        }

        // Mark first task as completed
        document.getElementById('task1').checked = true;
        updateAirdropProgress();
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

function initApp() {
    // Initialize components
    initScrollReveal();
    initParticles();
    initSmoothScroll();
    initAirdropSystem();

    if (localStorage.getItem('connectedWallet')) {
        setTimeout(() => {
            if (typeof walletManager !== 'undefined' && walletManager.provider) {
                walletManager.loadAccounts();
            }
        }, 1000);
    }

    // Add event listeners
    document.getElementById('exploreBtn').addEventListener('click', function() {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('startAirdrop').addEventListener('click', function() {
        document.getElementById('airdrop').scrollIntoView({ behavior: 'smooth' });
    });

    // Check if wallet is already connected
    checkWalletConnection();
}