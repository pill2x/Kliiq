// Sample applications data
const applications = [
    {
        id: 1,
        name: "Visual Studio Code",
        icon: "fab fa-vscode",
        category: "dev",
        status: "installed",
        version: "1.85.0",
        lastUpdated: "2024-01-15"
    },
    {
        id: 2,
        name: "Google Chrome",
        icon: "fab fa-chrome",
        category: "browser",
        status: "installed",
        version: "120.0.6099.109",
        lastUpdated: "2024-01-10"
    },
    {
        id: 3,
        name: "Slack",
        icon: "fab fa-slack",
        category: "communication",
        status: "update",
        version: "4.35.126",
        lastUpdated: "2024-01-05"
    },
    {
        id: 4,
        name: "Figma",
        icon: "fab fa-figma",
        category: "design",
        status: "installed",
        version: "116.15.0",
        lastUpdated: "2024-01-12"
    },
    {
        id: 5,
        name: "Git",
        icon: "fab fa-git-alt",
        category: "dev",
        status: "installed",
        version: "2.43.0",
        lastUpdated: "2024-01-08"
    },
    {
        id: 6,
        name: "Node.js",
        icon: "fab fa-node-js",
        category: "dev",
        status: "update",
        version: "20.10.0",
        lastUpdated: "2024-01-03"
    },
    {
        id: 7,
        name: "Docker",
        icon: "fab fa-docker",
        category: "dev",
        status: "broken",
        version: "24.0.7",
        lastUpdated: "2023-12-20"
    },
    {
        id: 8,
        name: "Discord",
        icon: "fas fa-headset",
        category: "communication",
        status: "installed",
        version: "1.0.9013",
        lastUpdated: "2024-01-14"
    },
    {
        id: 9,
        name: "Steam",
        icon: "fab fa-steam",
        category: "gaming",
        status: "installed",
        version: "1.0.0.78",
        lastUpdated: "2024-01-11"
    },
    {
        id: 10,
        name: "Photoshop",
        icon: "fab fa-adobe",
        category: "design",
        status: "update",
        version: "25.1.0",
        lastUpdated: "2023-12-28"
    }
];

// Pack configurations
const packs = {
    dev: {
        name: "Developer Pack",
        apps: [
            { name: "Visual Studio Code", icon: "fab fa-vscode" },
            { name: "Git", icon: "fab fa-git-alt" },
            { name: "Node.js", icon: "fab fa-node-js" },
            { name: "Docker", icon: "fab fa-docker" },
            { name: "PostgreSQL", icon: "fas fa-database" },
            { name: "Python", icon: "fab fa-python" }
        ]
    },
    designer: {
        name: "Designer Pack",
        apps: [
            { name: "Figma", icon: "fab fa-figma" },
            { name: "Photoshop", icon: "fab fa-adobe" },
            { name: "Illustrator", icon: "fab fa-adobe" },
            { name: "After Effects", icon: "fas fa-video" },
            { name: "Blender", icon: "fas fa-cube" },
            { name: "Sketch", icon: "fas fa-paint-brush" }
        ]
    },
    gamer: {
        name: "Gamer Pack",
        apps: [
            { name: "Steam", icon: "fab fa-steam" },
            { name: "Discord", icon: "fas fa-headset" },
            { name: "OBS Studio", icon: "fas fa-microphone" },
            { name: "MSI Afterburner", icon: "fas fa-chart-line" },
            { name: "Razer Synapse", icon: "fas fa-keyboard" },
            { name: "Epic Games", icon: "fas fa-trophy" }
        ]
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    populateDashboard();
    initializeSearch();
    initializeFilters();
    initializeModal();
});

// Navigation functionality
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Scroll to section function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Populate dashboard with applications
function populateDashboard(filter = 'all') {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;
    
    let filteredApps = applications;
    
    if (filter !== 'all') {
        filteredApps = applications.filter(app => app.status === filter);
    }
    
    appsGrid.innerHTML = filteredApps.map(app => `
        <div class="app-card-dashboard">
            <div class="app-header">
                <div class="app-icon">
                    <i class="${app.icon}"></i>
                </div>
                <div class="app-info">
                    <h4>${app.name}</h4>
                    <p>Version ${app.version}</p>
                </div>
            </div>
            <div class="app-status">
                <span class="status-indicator status-${app.status}">
                    ${getStatusText(app.status)}
                </span>
                <div class="app-actions">
                    ${getActionButtons(app.status)}
                </div>
            </div>
        </div>
    `).join('');
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'installed': return 'Installed';
        case 'update': return 'Update Available';
        case 'broken': return 'Needs Repair';
        default: return 'Unknown';
    }
}

// Get action buttons based on status
function getActionButtons(status) {
    switch (status) {
        case 'installed':
            return `
                <button class="action-btn" onclick="uninstallApp(this)">
                    <i class="fas fa-trash"></i> Uninstall
                </button>
            `;
        case 'update':
            return `
                <button class="action-btn primary" onclick="updateApp(this)">
                    <i class="fas fa-sync"></i> Update
                </button>
            `;
        case 'broken':
            return `
                <button class="action-btn primary" onclick="repairApp(this)">
                    <i class="fas fa-tools"></i> Repair
                </button>
            `;
        default:
            return '';
    }
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('appSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const appCards = document.querySelectorAll('.app-card-dashboard');
            
            appCards.forEach(card => {
                const appName = card.querySelector('h4').textContent.toLowerCase();
                if (appName.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Initialize filter buttons
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value and populate dashboard
            const filter = this.getAttribute('data-filter');
            populateDashboard(filter);
        });
    });
}

// Initialize modal
function initializeModal() {
    const modal = document.getElementById('installModal');
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeInstallModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeInstallModal();
            }
        });
    }
}

// Install pack function
function installPack(packType) {
    const pack = packs[packType];
    if (!pack) return;
    
    const modal = document.getElementById('installModal');
    const currentApp = document.getElementById('currentApp');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const installList = document.getElementById('installList');
    
    if (!modal || !currentApp || !progressText || !progressBar || !installList) return;
    
    // Show modal
    modal.style.display = 'block';
    
    // Populate install list
    installList.innerHTML = pack.apps.map(app => `
        <div class="install-item" data-app="${app.name}">
            <i class="${app.icon}"></i>
            <span>${app.name}</span>
            <span class="install-status">Waiting...</span>
        </div>
    `).join('');
    
    // Start installation simulation
    simulateInstallation(pack.apps, currentApp, progressText, progressBar);
}

// Simulate installation process
function simulateInstallation(apps, currentAppEl, progressTextEl, progressBarEl) {
    let currentIndex = 0;
    let currentProgress = 0;
    
    function updateProgress() {
        if (currentIndex >= apps.length) {
            // Installation complete
            currentAppEl.textContent = 'Installation Complete!';
            progressTextEl.textContent = '100%';
            progressBarEl.style.width = '100%';
            
            // Update all items to completed
            document.querySelectorAll('.install-item').forEach(item => {
                item.classList.add('completed');
                item.querySelector('.install-status').textContent = 'Completed';
            });
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeInstallModal();
                showNotification('Pack installed successfully!', 'success');
            }, 2000);
            
            return;
        }
        
        const app = apps[currentIndex];
        const appItem = document.querySelector(`[data-app="${app.name}"]`);
        
        // Update current app
        currentAppEl.textContent = `Installing ${app.name}...`;
        
        // Mark current app as installing
        if (appItem) {
            appItem.classList.add('installing');
            appItem.querySelector('.install-status').textContent = 'Installing...';
        }
        
        // Simulate progress for current app
        const progressInterval = setInterval(() => {
            currentProgress += Math.random() * 15 + 5; // Random progress between 5-20%
            
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(progressInterval);
                
                // Mark as completed
                if (appItem) {
                    appItem.classList.remove('installing');
                    appItem.classList.add('completed');
                    appItem.querySelector('.install-status').textContent = 'Completed';
                }
                
                // Move to next app
                currentIndex++;
                currentProgress = 0;
                
                // Update overall progress
                const overallProgress = Math.round((currentIndex / apps.length) * 100);
                progressTextEl.textContent = `${overallProgress}%`;
                progressBarEl.style.width = `${overallProgress}%`;
                
                // Continue with next app
                setTimeout(updateProgress, 500);
            } else {
                // Update progress
                const overallProgress = Math.round(((currentIndex + currentProgress / 100) / apps.length) * 100);
                progressTextEl.textContent = `${overallProgress}%`;
                progressBarEl.style.width = `${overallProgress}%`;
            }
        }, 200);
    }
    
    // Start the installation
    updateProgress();
}

// Close install modal
function closeInstallModal() {
    const modal = document.getElementById('installModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// App management functions
function uninstallApp(button) {
    const appCard = button.closest('.app-card-dashboard');
    const appName = appCard.querySelector('h4').textContent;
    
    if (confirm(`Are you sure you want to uninstall ${appName}?`)) {
        // Simulate uninstallation
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uninstalling...';
        button.disabled = true;
        
        setTimeout(() => {
            appCard.style.opacity = '0.5';
            button.innerHTML = '<i class="fas fa-check"></i> Uninstalled';
            showNotification(`${appName} has been uninstalled`, 'success');
        }, 2000);
    }
}

function updateApp(button) {
    const appCard = button.closest('.app-card-dashboard');
    const appName = appCard.querySelector('h4').textContent;
    
    // Simulate update
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Updated';
        showNotification(`${appName} has been updated`, 'success');
        
        // Update status indicator
        const statusIndicator = appCard.querySelector('.status-indicator');
        statusIndicator.className = 'status-indicator status-installed';
        statusIndicator.textContent = 'Installed';
    }, 3000);
}

function repairApp(button) {
    const appCard = button.closest('.app-card-dashboard');
    const appName = appCard.querySelector('h4').textContent;
    
    // Simulate repair
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Repairing...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Repaired';
        showNotification(`${appName} has been repaired`, 'success');
        
        // Update status indicator
        const statusIndicator = appCard.querySelector('.status-indicator');
        statusIndicator.className = 'status-indicator status-installed';
        statusIndicator.textContent = 'Installed';
    }, 2500);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some interactive animations
document.addEventListener('DOMContentLoaded', function() {
    // Animate feature cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card, .pack-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Add hover effects to pack cards
    document.querySelectorAll('.pack-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});
