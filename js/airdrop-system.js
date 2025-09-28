// Airdrop System Management
class AirdropSystem {
    constructor() {
        this.tasks = [
            { id: 'task1', completed: false, reward: 0.1 },
            { id: 'task2', completed: false, reward: 0.5 },
            { id: 'task3', completed: false, reward: 1 },
            { id: 'task4', completed: false, reward: 3 }
        ];
        this.totalReward = 0;
        this.claimed = false;
        this.init();
    }

    init() {
        this.loadProgress();
        this.bindEvents();
        this.updateAirdropProgress();
    }

    bindEvents() {
        // Task completion events
        this.tasks.forEach(task => {
            const checkbox = document.getElementById(task.id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    task.completed = e.target.checked;
                    this.saveProgress();
                    this.updateAirdropProgress();
                });
            }
        });

        // Claim airdrop event
        document.getElementById('claimAirdrop').addEventListener('click', () => {
            this.claimAirdrop();
        });

        // Twitter follow task (mock)
        this.setupTwitterTask();

        // Discord join task (mock)
        this.setupDiscordTask();

        // Referral task (mock)
        this.setupReferralTask();
    }

    updateAirdropProgress() {
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const totalTasks = this.tasks.length;
        const progress = (completedTasks / totalTasks) * 100;

        // Update progress bar
        const progressFill = document.getElementById('airdropProgress');
        const progressText = document.getElementById('progressText');

        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% Complete`;

        // Calculate total reward
        this.totalReward = this.tasks
            .filter(task => task.completed)
            .reduce((sum, task) => sum + task.reward, 0);

        // Update claim button
        const claimButton = document.getElementById('claimAirdrop');
        if (completedTasks > 0 && !this.claimed) {
            claimButton.disabled = false;
            claimButton.textContent = `Claim ${this.totalReward} MONAD`;
        } else if (this.claimed) {
            claimButton.disabled = true;
            claimButton.textContent = 'Airdrop Claimed';
        } else {
            claimButton.disabled = true;
            claimButton.textContent = 'Complete Tasks to Claim';
        }
    }

    async claimAirdrop() {
        if (this.claimed) {
            this.showNotification('Airdrop already claimed!', 'error');
            return;
        }

        if (!walletManager.isConnected) {
            this.showNotification('Please connect your wallet first!', 'error');
            return;
        }

        try {
            // Show claiming animation
            const claimButton = document.getElementById('claimAirdrop');
            const originalText = claimButton.textContent;
            claimButton.disabled = true;
            claimButton.textContent = 'Claiming...';

            // Simulate airdrop claim process
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Mark as claimed
            this.claimed = true;
            this.saveProgress();

            // Update UI
            this.updateAirdropProgress();

            // Show success message
            this.showNotification(`Successfully claimed ${this.totalReward} MONAD!`, 'success');

            // If Monad integration is available, add to balance
            if (typeof monadIntegration !== 'undefined') {
                // In a real scenario, this would mint tokens or transfer from treasury
                console.log(`Airdrop of ${this.totalReward} MONAD claimed by ${walletManager.walletAddress}`);
            }

        } catch (error) {
            console.error('Error claiming airdrop:', error);
            this.showNotification('Failed to claim airdrop. Please try again.', 'error');

            // Reset button
            const claimButton = document.getElementById('claimAirdrop');
            claimButton.disabled = false;
            claimButton.textContent = `Claim ${this.totalReward} MONAD`;
        }
    }

    setupTwitterTask() {
        // Mock Twitter follow implementation
        const twitterTask = this.tasks.find(task => task.id === 'task2');
        const twitterCheckbox = document.getElementById('task2');

        if (twitterCheckbox) {
            // Check if already completed
            if (twitterTask.completed) {
                twitterCheckbox.checked = true;
            }

            // Add custom follow button
            const taskItem = twitterCheckbox.parentElement;
            const followButton = document.createElement('button');
            followButton.textContent = 'Visit Twitter';
            followButton.className = 'task-action-btn';
            followButton.style.marginLeft = '10px';
            followButton.style.padding = '5px 10px';
            followButton.style.background = 'var(--primary-color)';
            followButton.style.color = 'white';
            followButton.style.border = 'none';
            followButton.style.borderRadius = '4px';
            followButton.style.cursor = 'pointer';

            followButton.addEventListener('click', () => {
                // Open Twitter in new tab
                window.open('https://twitter.com/Monad_XYZ', '_blank');

                // Mark task as completed after a delay (simulating user action)
                setTimeout(() => {
                    twitterCheckbox.checked = true;
                    twitterTask.completed = true;
                    this.saveProgress();
                    this.updateAirdropProgress();
                    this.showNotification('Twitter visit task completed!', 'success');
                }, 2000);
            });

            taskItem.appendChild(followButton);
        }
    }

    setupDiscordTask() {
        // Mock Discord join implementation
        const discordTask = this.tasks.find(task => task.id === 'task3');
        const discordCheckbox = document.getElementById('task3');

        if (discordCheckbox) {
            if (discordTask.completed) {
                discordCheckbox.checked = true;
            }

            const taskItem = discordCheckbox.parentElement;
            const joinButton = document.createElement('button');
            joinButton.textContent = 'Visit Discord';
            joinButton.className = 'task-action-btn';
            joinButton.style.marginLeft = '10px';
            joinButton.style.padding = '5px 10px';
            joinButton.style.background = 'var(--secondary-color)';
            joinButton.style.color = 'white';
            joinButton.style.border = 'none';
            joinButton.style.borderRadius = '4px';
            joinButton.style.cursor = 'pointer';

            joinButton.addEventListener('click', () => {
                // Open Discord invite in new tab
                window.open('https://discord.gg/monad', '_blank');

                setTimeout(() => {
                    discordCheckbox.checked = true;
                    discordTask.completed = true;
                    this.saveProgress();
                    this.updateAirdropProgress();
                    this.showNotification('Discord visit task completed!', 'success');
                }, 2000);
            });

            taskItem.appendChild(joinButton);
        }
    }

    saveProgress() {
        const progress = {
            tasks: this.tasks.map(task => ({ id: task.id, completed: task.completed })),
            claimed: this.claimed
        };
        localStorage.setItem('airdropProgress', JSON.stringify(progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('airdropProgress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                this.tasks.forEach(task => {
                    const savedTask = progress.tasks.find(t => t.id === task.id);
                    if (savedTask) {
                        task.completed = savedTask.completed;
                        const checkbox = document.getElementById(task.id);
                        if (checkbox) {
                            checkbox.checked = task.completed;
                        }
                    }
                });
                this.claimed = progress.claimed;
            } catch (error) {
                console.error('Error loading airdrop progress:', error);
            }
        }
    }

    showNotification(message, type) {
        if (typeof walletManager !== 'undefined') {
            if (type === 'success') {
                walletManager.showSuccess(message);
            } else {
                walletManager.showError(message);
            }
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    resetAirdrop() {
        this.tasks.forEach(task => {
            task.completed = false;
            const checkbox = document.getElementById(task.id);
            if (checkbox) {
                checkbox.checked = false;
            }
        });
        this.claimed = false;
        this.saveProgress();
        this.updateAirdropProgress();
        this.showNotification('Airdrop progress reset', 'success');
    }
}

// Initialize Airdrop System
const airdropSystem = new AirdropSystem();

// Global function for other scripts to update progress
function updateAirdropProgress() {
    airdropSystem.updateAirdropProgress();
}

// For debugging purposes - add reset function to window
window.resetAirdrop = () => {
    airdropSystem.resetAirdrop();
};
