// CropDoctor AI - Frontend Single Page Application (SPA) Logic

// Global Application State
let currentUser = null;
let currentView = 'landing';
let currentScan = null; // Stores currently inspected scan for report view
let activeResultImgType = 'annotated'; // 'annotated' or 'original'
let parentScanId = null; // Stores parent scan ID for recovery follow-up

// Pagination state for Scan History
let historyState = {
  currentPage: 1,
  totalPages: 1,
  limit: 10,
  search: '',
  crop: ''
};

// Admin Chart Instances (to destroy and recreate)
let diseaseChart = null;
let scansChart = null;
let cropChart = null;

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// App Initialization
async function initApp() {
  // Bind Theme Toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  
  // Set default theme from localStorage
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light-mode');
    updateThemeIcon(true);
  } else {
    document.documentElement.classList.remove('light-mode');
    updateThemeIcon(false);
  }

  // Bind Navbar Toggle for Mobile
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Check user session/login state
  await checkSession();

  // Setup Drag and Drop listeners
  setupDragAndDrop();

  // Initial routing
  // Check if URL hash exists, otherwise default to landing
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    navigateTo(hash);
  } else {
    navigateTo('landing');
  }

  // Monitor hash changes for history routing
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '');
    if (newHash && newHash !== currentView) {
      navigateTo(newHash, false); // false to avoid pushState loop
    }
  });
}

// ----------------------------------------------------
// Toast Notification System
// ----------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-times-circle';
  if (type === 'warning') icon = 'fa-exclamation-circle';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slide-in 0.3s ease-out reverse';
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// ----------------------------------------------------
// Theme Management
// ----------------------------------------------------
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcon(isLight);
}

function updateThemeIcon(isLight) {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      if (isLight) {
        icon.className = 'fa-solid fa-sun';
      } else {
        icon.className = 'fa-solid fa-moon';
      }
    }
  }
}

// ----------------------------------------------------
// Navigation & Routing (SPA)
// ----------------------------------------------------
function navigateTo(viewId, updateHash = true) {
  // Navigation authorization check
  const restrictedViews = ['dashboard', 'analysis', 'history', 'report', 'settings', 'admin', 'assistant', 'recovery'];
  
  if (restrictedViews.includes(viewId) && !currentUser) {
    showToast('Please sign in to access this page', 'warning');
    navigateTo('auth', updateHash);
    return;
  }

  if (viewId === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
    showToast('Access Denied: Admin role required', 'error');
    navigateTo('dashboard', updateHash);
    return;
  }

  // Update navbar links active state
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const onclickAttr = link.getAttribute('onclick');
    if (onclickAttr && onclickAttr.includes(`'${viewId}'`)) {
      link.classList.add('active');
    }
  });

  // Switch section views
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(sec => {
    if (sec.id === `view-${viewId}`) {
      sec.classList.add('active');
      sec.classList.remove('hidden');
    } else {
      sec.classList.remove('active');
      sec.classList.add('hidden');
    }
  });

  // Update hash
  if (updateHash) {
    window.location.hash = viewId;
  }

  currentView = viewId;

  // Collapse mobile nav if expanded
  const navMenu = document.getElementById('nav-menu');
  if (navMenu) {
    navMenu.classList.remove('active');
  }

  // View-specific loading hooks
  onViewLoaded(viewId);
}

// Handler hooks when views are navigated to
function onViewLoaded(viewId) {
  if (viewId === 'dashboard') {
    loadDashboardData();
  } else if (viewId === 'history') {
    loadHistoryData();
  } else if (viewId === 'admin') {
    loadAdminData();
  } else if (viewId === 'analysis') {
    resetAnalysisPage();
  } else if (viewId === 'report') {
    loadReportData();
  } else if (viewId === 'settings') {
    loadProfileData();
  } else if (viewId === 'recovery') {
    loadRecoveryTimelineData();
  } else if (viewId === 'assistant') {
    loadAssistantContext();
  }
}

// Scroll to features on Landing Page
function scrollToFeatures() {
  const featuresSec = document.getElementById('features');
  if (featuresSec) {
    featuresSec.scrollIntoView({ behavior: 'smooth' });
  }
}

// Landing page CTA click handler
function handleStartAnalyzing() {
  if (currentUser) {
    navigateTo('analysis');
  } else {
    navigateTo('auth');
  }
}

// ----------------------------------------------------
// Authentication Manager
// ----------------------------------------------------
async function checkSession() {
  // Read local storage check (in case backend session is active but we refreshed)
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      updateAuthUI();
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
  }

  // Optional: ping dashboard to verify backend session is valid
  if (currentUser) {
    try {
      const res = await fetch('/api/dashboard');
      if (res.status === 401) {
        // Session expired on backend
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAuthUI();
      }
    } catch (err) {
      console.log('Error verifying session:', err);
    }
  }
}

function updateAuthUI() {
  const guestItems = document.querySelectorAll('.guest-only');
  const authItems = document.querySelectorAll('.auth-only');
  const adminItems = document.querySelectorAll('.admin-only');

  if (currentUser) {
    // Logged in
    guestItems.forEach(el => el.classList.add('hidden'));
    authItems.forEach(el => el.classList.remove('hidden'));
    
    // Admin checking
    if (currentUser.role === 'admin') {
      adminItems.forEach(el => el.style.display = 'block');
    } else {
      adminItems.forEach(el => el.style.display = 'none');
    }

    // Set welcome text
    const welcomeDisplay = document.getElementById('user-email-display');
    if (welcomeDisplay) {
      welcomeDisplay.textContent = currentUser.email.split('@')[0];
    }
  } else {
    // Logged out
    guestItems.forEach(el => el.classList.remove('hidden'));
    authItems.forEach(el => el.classList.add('hidden'));
    adminItems.forEach(el => el.style.display = 'none');
  }
}

function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
  }
}

function togglePasswordVisibility(inputId, iconEl) {
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === 'password') {
      input.type = 'text';
      iconEl.className = 'fa-solid fa-eye';
    } else {
      input.type = 'password';
      iconEl.className = 'fa-solid fa-eye-slash';
    }
  }
}

// Submit Sign In
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      if (remember) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      // Save state to local variable
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      showToast('Welcome back to CropDoctor AI!');
      updateAuthUI();
      navigateTo('dashboard');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Failed to connect to server', 'error');
  }
}

// Submit Registration
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const passwordConfirm = document.getElementById('register-password-confirm').value;
  
  const name = document.getElementById('register-name').value.trim();
  const location = document.getElementById('register-location').value.trim();
  const farm_size = document.getElementById('register-farmsize').value;
  const primary_crop = document.getElementById('register-primarycrop').value;

  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  if (password !== passwordConfirm) {
    showToast('Passwords do not match', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password,
        name,
        location,
        farm_size,
        primary_crop
      })
    });
    const data = await response.json();

    if (data.success) {
      showToast('Registration successful! Please login now.');
      switchAuthTab('login');
      // Autofill email
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').focus();
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Server connection failed', 'error');
  }
}

// Logout
async function logout() {
  try {
    const response = await fetch('/api/logout', { method: 'POST' });
    const data = await response.json();
    if (data.success) {
      currentUser = null;
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      updateAuthUI();
      showToast('Logged out successfully');
      navigateTo('landing');
    }
  } catch (err) {
    console.error('Logout error:', err);
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    navigateTo('landing');
  }
}

// ----------------------------------------------------
// Dashboard View Data Loader
// ----------------------------------------------------
async function loadDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      
      // Animate Stats counters
      animateValue('stat-total-scans', 0, stats.total_scans, 1000);
      animateValue('stat-diseased-scans', 0, stats.diseases_detected, 1000);
      animateValue('stat-accuracy', 0, stats.accuracy_rate, 1000, '%');
      
      // Handle Date formatting
      const dateEl = document.getElementById('stat-last-scan');
      if (dateEl) {
        if (stats.last_scan_date === 'No scans yet') {
          dateEl.textContent = 'Never';
        } else {
          // Format date string nicely
          try {
            const date = new Date(stats.last_scan_date);
            dateEl.textContent = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
          } catch(e) {
            dateEl.textContent = stats.last_scan_date;
          }
        }
      }

      // Load Recent Scans Table
      await loadRecentDashboardTable();
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
    showToast('Error loading dashboard statistics', 'error');
  }
}

async function loadRecentDashboardTable() {
  const tbody = document.getElementById('dashboard-recent-table-body');
  if (!tbody) return;

  try {
    const response = await fetch('/api/history?page=1&limit=5');
    const data = await response.json();

    if (data.success && data.scans && data.scans.length > 0) {
      tbody.innerHTML = '';
      data.scans.forEach(scan => {
        const tr = document.createElement('tr');
        const severityClass = scan.severity_level.toLowerCase();
        
        // Date formatting
        let dateStr = scan.date;
        try {
          const d = new Date(scan.date);
          dateStr = d.toLocaleDateString();
        } catch(e){}

        tr.innerHTML = `
          <td><img src="${scan.original_image}" class="table-thumb" alt="leaf thumb"></td>
          <td><strong>${scan.crop_name}</strong></td>
          <td><span class="badge-status ${severityClass}">${scan.disease_name}</span></td>
          <td><span class="conf-val">${scan.confidence}</span></td>
          <td>${dateStr}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="viewScanReport(${scan.id})">
              <i class="fa-solid fa-file-lines"></i> Report
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">No recent scans. Ready to analyze!</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Recent table load error:', error);
  }
}

// Counter Rolling Number Animation Helper
function animateValue(id, start, end, duration, suffix = '') {
  const obj = document.getElementById(id);
  if (!obj) return;
  
  if (start === end) {
    obj.innerHTML = end + suffix;
    return;
  }
  
  const range = end - start;
  let current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / (range || 1)));
  
  // Cap stepTime so it doesn't freeze the tab
  const finalStepTime = Math.max(5, stepTime);
  const steps = Math.min(200, Math.abs(range)); // Max 200 animation steps
  const stepSize = range / steps;
  let stepCount = 0;

  const timer = setInterval(() => {
    stepCount++;
    current = start + (stepSize * stepCount);
    
    if (stepCount >= steps) {
      clearInterval(timer);
      obj.innerHTML = (end % 1 === 0 ? end : end.toFixed(1)) + suffix;
    } else {
      obj.innerHTML = (current % 1 === 0 ? Math.floor(current) : current.toFixed(1)) + suffix;
    }
  }, duration / steps);
}

// ----------------------------------------------------
// Drag & Drop & Upload Handling
// ----------------------------------------------------
function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  
  if (!dropZone || !fileInput) return;

  // Click on dropzone triggers hidden file input click
  dropZone.addEventListener('click', (e) => {
    if (!e.target.classList.contains('browse-link') && e.target !== dropZone && !dropZone.contains(e.target)) return;
    fileInput.click();
  });
  
  // Browse link trigger
  const browseLink = dropZone.querySelector('.browse-link');
  if (browseLink) {
    browseLink.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // Drag events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleSelectedFile(files[0]);
    }
  });

  // Handle selected file from input
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleSelectedFile(fileInput.files[0]);
    }
  });
}

function handleSelectedFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (JPG, PNG)', 'warning');
    return;
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    showToast('Image size exceeds 10MB limit', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => {
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const dropZone = document.getElementById('drop-zone');
    const btnSubmit = document.getElementById('btn-submit-analysis');

    if (previewContainer && imagePreview && dropZone && btnSubmit) {
      imagePreview.src = reader.result;
      previewContainer.classList.remove('hidden');
      dropZone.classList.add('hidden');
      btnSubmit.removeAttribute('disabled');
    }
  };
}

function clearUploadPreview() {
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');
  const imagePreview = document.getElementById('image-preview');
  const dropZone = document.getElementById('drop-zone');
  const btnSubmit = document.getElementById('btn-submit-analysis');

  if (fileInput) fileInput.value = '';
  if (imagePreview) imagePreview.src = '#';
  if (previewContainer) previewContainer.classList.add('hidden');
  if (dropZone) dropZone.classList.remove('hidden');
  if (btnSubmit) btnSubmit.setAttribute('disabled', 'true');
}

function updateConfidenceLabel(val) {
  const valEl = document.getElementById('confidence-value');
  if (valEl) {
    valEl.textContent = `${val}%`;
  }
}

// Reset Analysis view to initial upload state
function resetAnalysisPage() {
  clearUploadPreview();
  
  const uploadPanel = document.getElementById('upload-panel');
  const scannerPanel = document.getElementById('scanner-panel');
  const resultsPanel = document.getElementById('results-panel');
  
  if (uploadPanel) uploadPanel.classList.remove('hidden');
  if (scannerPanel) scannerPanel.classList.add('hidden');
  if (resultsPanel) resultsPanel.classList.add('hidden');
}

// ----------------------------------------------------
// AI Scanning & Processing Animation Logic
// ----------------------------------------------------
async function handleAnalysis(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('file-input');
  if (!fileInput || fileInput.files.length === 0) {
    showToast('Please select a leaf image to scan', 'warning');
    return;
  }

  const confidenceThreshold = document.getElementById('confidence-range').value / 100;
  const imageFile = fileInput.files[0];
  
  // Show scanner overlay, hide upload form
  const uploadPanel = document.getElementById('upload-panel');
  const scannerPanel = document.getElementById('scanner-panel');
  const scannerPreviewImg = document.getElementById('scanner-preview-img');
  
  if (uploadPanel && scannerPanel && scannerPreviewImg) {
    // Show image preview in scanning circle
    scannerPreviewImg.src = document.getElementById('image-preview').src;
    uploadPanel.classList.add('hidden');
    scannerPanel.classList.remove('hidden');
  }

  // Trigger high-tech scan logs and progress bar update
  const scanDuration = 3000; // 3 seconds scan simulation
  const steps = [
    { percent: 15, text: 'Uploading leaf image...' },
    { percent: 35, text: 'Preprocessing color patterns & veins...' },
    { percent: 60, text: 'Running YOLO11 deep learning inference...' },
    { percent: 85, text: 'Calculating severity metrics & details...' },
    { percent: 100, text: 'Generating prevention & treatment plan...' }
  ];

  let currentStepIdx = 0;
  const startTime = Date.now();

  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(100, (elapsed / scanDuration) * 100);
    
    // Update progress bar fill and numbers
    const fillBar = document.getElementById('scanner-progress-fill');
    const percentTxt = document.getElementById('scanner-percent-text');
    const statusTxt = document.getElementById('scanner-status-text');

    if (fillBar) fillBar.style.width = `${progress}%`;
    if (percentTxt) percentTxt.textContent = `${Math.floor(progress)}%`;

    // Step logger text updates
    if (currentStepIdx < steps.length && progress >= steps[currentStepIdx].percent) {
      if (statusTxt) {
        statusTxt.textContent = steps[currentStepIdx].text;
      }
      currentStepIdx++;
    }

    if (progress >= 100) {
      clearInterval(progressInterval);
    }
  }, 50);

  // Perform backend prediction API request concurrently
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('confidence_threshold', confidenceThreshold);
  if (parentScanId) {
    formData.append('parent_scan_id', parentScanId);
  }

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      body: formData
    });
    
    // Wait until at least the minimum animation duration (3s) finishes to avoid UI flickers
    const timeRemaining = scanDuration - (Date.now() - startTime);
    if (timeRemaining > 0) {
      await new Promise(resolve => setTimeout(resolve, timeRemaining));
    }

    clearInterval(progressInterval);
    const data = await response.json();

    if (data.success) {
      currentScan = data.scan;
      displayAnalysisResults(data.scan);
      parentScanId = null; // Reset parent scan id
    } else {
      showToast(data.message || 'AI Diagnosis failed', 'error');
      resetAnalysisPage();
    }
  } catch (error) {
    console.error('Scan error:', error);
    clearInterval(progressInterval);
    showToast('Failed to connect to AI server', 'error');
    resetAnalysisPage();
  }
}

// Populate and display results cards
function displayAnalysisResults(scan) {
  // Hide scanner
  const scannerPanel = document.getElementById('scanner-panel');
  const resultsPanel = document.getElementById('results-panel');
  if (scannerPanel) scannerPanel.classList.add('hidden');
  if (resultsPanel) resultsPanel.classList.remove('hidden');

  // Diagnosis details
  document.getElementById('result-title').textContent = `${scan.crop_name} ${scan.disease_name}`;
  document.getElementById('result-conf-val').textContent = scan.confidence;
  
  // Progress bar fill for confidence
  const confValFloat = parseFloat(scan.confidence);
  document.getElementById('result-conf-bar').style.width = `${confValFloat}%`;

  // Reset feedback widget state
  const statusText = document.getElementById('feedback-status-text');
  const buttonsDiv = document.querySelector('.feedback-widget .feedback-buttons');
  if (statusText) statusText.classList.add('hidden');
  if (buttonsDiv) buttonsDiv.classList.remove('hidden');
  document.getElementById('btn-feedback-yes').classList.remove('active');
  document.getElementById('btn-feedback-no').classList.remove('active');

  // Image toggle Setup
  activeResultImgType = 'annotated';
  const btnAnnotated = document.getElementById('btn-img-annotated');
  const btnOriginal = document.getElementById('btn-img-original');
  if (btnAnnotated) btnAnnotated.className = 'toggle-btn active';
  if (btnOriginal) btnOriginal.className = 'toggle-btn';

  const imgDisplay = document.getElementById('result-image-display');
  if (imgDisplay) {
    imgDisplay.src = scan.annotated_image;
  }

  // Plant Health Score Progress Ring
  const healthRing = document.getElementById('health-ring');
  const healthText = document.getElementById('health-score-text');
  const healthDesc = document.getElementById('health-score-desc');
  
  if (healthRing && healthText && healthDesc) {
    const score = scan.health_score !== undefined ? scan.health_score : 100;
    
    // Animate the rolling text value
    animateValue('health-score-text', 0, score, 800);
    
    // Animate progress ring dashoffset
    // dasharray = 345.57
    const offset = 345.57 - (score / 100) * 345.57;
    healthRing.style.strokeDashoffset = offset;
    
    // Color of ring & description
    let ringColor = 'var(--success-color)';
    let descText = 'The plant is in excellent health condition.';
    if (score < 50) {
      ringColor = '#ef4444'; // red
      descText = 'Critical crop disease detected! Immediate treatment required.';
    } else if (score < 80) {
      ringColor = '#f59e0b'; // orange
      descText = 'Infection detected. Treatment recommended to prevent spread.';
    }
    healthRing.style.stroke = ringColor;
    healthDesc.textContent = descText;
  }

  // Severity Analysis
  const severityBadge = document.getElementById('severity-badge');
  const severityPercent = document.getElementById('severity-percent');
  const severityFillBar = document.getElementById('severity-fill-bar');

  if (severityBadge) {
    severityBadge.textContent = scan.severity_level;
    severityBadge.className = `badge-status ${scan.severity_level.toLowerCase()}`;
  }

  const sevPct = scan.severity_percentage !== undefined ? scan.severity_percentage : scan.severity_value;
  if (severityPercent) {
    severityPercent.textContent = `${sevPct}%`;
  }

  if (severityFillBar) {
    severityFillBar.style.width = `${sevPct}%`;
    let fillColor = '#10b981'; // green
    if (scan.severity_level === 'Medium') fillColor = '#f59e0b'; // yellow
    if (scan.severity_level === 'High') fillColor = '#ef4444'; // red
    if (scan.severity_level === 'Critical') fillColor = '#b91c1c'; // dark red
    severityFillBar.style.backgroundColor = fillColor;
  }

  // Meta Info
  const regionsCountEl = document.getElementById('result-regions-count');
  if (regionsCountEl) {
    regionsCountEl.textContent = scan.num_regions !== undefined ? scan.num_regions : 1;
  }
  const modelVerEl = document.getElementById('result-model-version');
  if (modelVerEl) {
    modelVerEl.textContent = scan.model_version || 'YOLO11_v1';
  }

  // Recovery Timeline View Button state
  const btnTimeline = document.getElementById('btn-view-timeline');
  if (btnTimeline) {
    if (scan.parent_scan_id || activeRecoveryBaseId) {
      btnTimeline.classList.remove('hidden');
      if (scan.parent_scan_id) {
        activeRecoveryBaseId = scan.parent_scan_id;
      }
    } else {
      btnTimeline.classList.add('hidden');
    }
  }

  // Disease Confidence Breakdown
  const breakdownList = document.getElementById('confidence-breakdown-list');
  if (breakdownList) {
    breakdownList.innerHTML = '';
    const breakdownData = scan.confidence_breakdown || [
      { class_name: `${scan.crop_name} ${scan.disease_name}`, confidence: scan.confidence }
    ];
    
    breakdownData.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'breakdown-item';
      
      const pctFloat = parseFloat(item.confidence);
      
      itemDiv.innerHTML = `
        <div class="breakdown-item-header">
          <span>${item.class_name}</span>
          <span>${item.confidence}</span>
        </div>
        <div class="breakdown-bar-container">
          <div class="breakdown-bar-fill" style="width: ${pctFloat}%;"></div>
        </div>
      `;
      breakdownList.appendChild(itemDiv);
    });
  }

  // Info Details
  document.getElementById('result-desc').textContent = scan.description;
  document.getElementById('result-symptoms').textContent = scan.symptoms;
  document.getElementById('result-causes').textContent = scan.causes;

  // Treatments
  const treatmentsContainer = document.getElementById('result-treatments');
  if (treatmentsContainer) {
    if (scan.treatments && scan.treatments.length > 0) {
      const ul = document.createElement('ul');
      scan.treatments.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      treatmentsContainer.innerHTML = '';
      treatmentsContainer.appendChild(ul);
    } else {
      treatmentsContainer.innerHTML = '<p class="text-success"><i class="fa-solid fa-circle-check"></i> No active disease spots detected. Keep monitoring regularly.</p>';
    }
  }

  // Preventions
  const preventionsContainer = document.getElementById('result-preventions');
  if (preventionsContainer) {
    if (scan.prevention && scan.prevention.length > 0) {
      const ul = document.createElement('ul');
      scan.prevention.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        ul.appendChild(li);
      });
      preventionsContainer.innerHTML = '';
      preventionsContainer.appendChild(ul);
    } else {
      preventionsContainer.innerHTML = '<p class="text-muted">No specific prevention tips required.</p>';
    }
  }
}

// Toggle Image viewing (Annotated vs Original)
function switchResultImage(type) {
  if (!currentScan) return;
  activeResultImgType = type;

  const btnAnnotated = document.getElementById('btn-img-annotated');
  const btnOriginal = document.getElementById('btn-img-original');
  const imgDisplay = document.getElementById('result-image-display');

  if (type === 'annotated') {
    btnAnnotated.classList.add('active');
    btnOriginal.classList.remove('active');
    imgDisplay.src = currentScan.annotated_image;
  } else {
    btnAnnotated.classList.remove('active');
    btnOriginal.classList.add('active');
    imgDisplay.src = currentScan.original_image;
  }
}

// View PDF Printable Report trigger
function viewDetailedReport() {
  if (currentScan) {
    navigateTo('report');
  }
}

// ----------------------------------------------------
// Scan History Logic (Search, Filter, Pagination)
// ----------------------------------------------------
async function loadHistoryData() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Loading scan history...</td></tr>`;

  try {
    const url = `/api/history?page=${historyState.currentPage}&limit=${historyState.limit}&search=${encodeURIComponent(historyState.search)}&crop=${encodeURIComponent(historyState.crop)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      historyState.totalPages = data.total_pages;
      
      // Populate unique crops filter dropdown if not populated
      populateHistoryFilters(data.crops);

      // Populate history items
      tbody.innerHTML = '';
      if (data.scans && data.scans.length > 0) {
        data.scans.forEach(scan => {
          const tr = document.createElement('tr');
          const severityClass = scan.severity_level.toLowerCase();
          
          // Date formatting
          let dateFormatted = scan.date;
          try {
            const date = new Date(scan.date);
            dateFormatted = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'});
          } catch(e){}

          tr.innerHTML = `
            <td><img src="${scan.original_image}" class="table-thumb" alt="leaf thumb" onclick="viewHistoryPreview('${scan.original_image}')"></td>
            <td><strong>${scan.crop_name}</strong></td>
            <td><span class="badge-status ${severityClass}">${scan.disease_name}</span></td>
            <td><span class="conf-val">${scan.confidence}</span></td>
            <td>${dateFormatted}</td>
            <td><span class="badge-status ${severityClass}">${scan.severity_level}</span></td>
            <td>
              <div class="results-header-actions">
                <button class="btn btn-outline btn-sm" onclick="viewScanReport(${scan.id})">
                  <i class="fa-solid fa-file-pdf"></i> Report
                </button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });

        // Update pagination numbers
        const startIdx = (data.page - 1) * data.limit + 1;
        const endIdx = Math.min(data.page * data.limit, data.total_records);
        document.getElementById('pagination-info').textContent = `Showing ${startIdx} to ${endIdx} of ${data.total_records} entries`;
        document.getElementById('current-page-num').textContent = data.page;

        // Toggle buttons state
        document.getElementById('btn-prev-page').disabled = data.page === 1;
        document.getElementById('btn-next-page').disabled = data.page === data.total_pages;
      } else {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No scan history logs match your search filters.</td></tr>`;
        document.getElementById('pagination-info').textContent = 'Showing 0 to 0 of 0 entries';
        document.getElementById('btn-prev-page').disabled = true;
        document.getElementById('btn-next-page').disabled = true;
      }
    }
  } catch (error) {
    console.error('History load error:', error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load history items.</td></tr>`;
  }
}

function populateHistoryFilters(crops) {
  const cropFilter = document.getElementById('history-crop-filter');
  if (!cropFilter) return;

  // Save current filter value
  const currentValue = cropFilter.value;
  
  // Re-build dropdown items
  cropFilter.innerHTML = '<option value="">All Crops</option>';
  if (crops && crops.length > 0) {
    crops.forEach(crop => {
      const opt = document.createElement('option');
      opt.value = crop;
      opt.textContent = crop;
      cropFilter.appendChild(opt);
    });
  }

  // Restore filter value
  cropFilter.value = currentValue;
}

let historySearchTimeout = null;
function triggerHistorySearch() {
  clearTimeout(historySearchTimeout);
  historySearchTimeout = setTimeout(() => {
    const searchVal = document.getElementById('history-search').value.trim();
    historyState.search = searchVal;
    historyState.currentPage = 1; // reset page on search
    loadHistoryData();
  }, 400); // 400ms debounce
}

function triggerHistoryFilter() {
  const cropVal = document.getElementById('history-crop-filter').value;
  historyState.crop = cropVal;
  historyState.currentPage = 1; // reset page on filter
  loadHistoryData();
}

function prevHistoryPage() {
  if (historyState.currentPage > 1) {
    historyState.currentPage--;
    loadHistoryData();
  }
}

function nextHistoryPage() {
  if (historyState.currentPage < historyState.totalPages) {
    historyState.currentPage++;
    loadHistoryData();
  }
}

function viewHistoryPreview(imgUrl) {
  // Simple quick visual overlay helper if clicked
  const viewer = document.createElement('div');
  viewer.className = 'modal-overlay';
  viewer.innerHTML = `
    <div style="position: relative; max-width: 90%; max-height: 90%;">
      <img src="${imgUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; border: 2px solid white;">
      <button class="btn btn-outline" style="position: absolute; top: -40px; right: 0; color: white;" onclick="this.parentNode.parentNode.remove()">Close</button>
    </div>
  `;
  document.body.appendChild(viewer);
  viewer.addEventListener('click', (e) => {
    if (e.target === viewer) viewer.remove();
  });
}

// Redirect and load report view for a specific ID
async function viewScanReport(scanId) {
  try {
    const response = await fetch(`/api/report/${scanId}`);
    const data = await response.json();
    if (data.success) {
      currentScan = data.report;
      navigateTo('report');
    } else {
      showToast(data.message || 'Report not found', 'error');
    }
  } catch (err) {
    console.error('Report view fetch error:', err);
    showToast('Failed to load report details', 'error');
  }
}

// ----------------------------------------------------
// PDF Report View Population
// ----------------------------------------------------
function loadReportData() {
  if (!currentScan) {
    navigateTo('history');
    return;
  }

  // Metadata
  document.getElementById('rep-id').textContent = `#CD-${currentScan.id.toString().padStart(5, '0')}`;
  
  let dateFormatted = currentScan.date;
  try {
    const date = new Date(currentScan.date);
    dateFormatted = date.toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'});
  } catch(e){}
  
  document.getElementById('rep-date').textContent = dateFormatted;
  document.getElementById('rep-user').textContent = currentScan.user_email || currentUser.email;

  // Diagnostics summary details
  document.getElementById('rep-crop').textContent = currentScan.crop_name;
  document.getElementById('rep-disease').textContent = currentScan.disease_name;
  document.getElementById('rep-confidence').textContent = currentScan.confidence;
  
  const sevLevelEl = document.getElementById('rep-severity-level');
  if (sevLevelEl) {
    sevLevelEl.textContent = currentScan.severity_level;
    let color = '#10b981'; // green
    if (currentScan.severity_level === 'Medium') color = '#d97706'; // orange/yellow
    if (currentScan.severity_level === 'High') color = '#dc2626'; // red
    if (currentScan.severity_level === 'Critical') color = '#b91c1c'; // dark red
    if (currentScan.disease_name === 'Healthy') color = '#10b981';
    sevLevelEl.style.color = color;
  }

  const sevPctEl = document.getElementById('rep-severity-percentage');
  if (sevPctEl) {
    const sevPct = currentScan.severity_percentage !== undefined ? currentScan.severity_percentage : currentScan.severity_value;
    sevPctEl.textContent = `${sevPct}%`;
  }

  const regionsEl = document.getElementById('rep-regions-count');
  if (regionsEl) {
    regionsEl.textContent = `${currentScan.num_regions !== undefined ? currentScan.num_regions : 0} spots`;
  }

  const healthScoreEl = document.getElementById('rep-health-score');
  if (healthScoreEl) {
    healthScoreEl.textContent = `${currentScan.health_score}/100`;
    let color = '#10b981';
    if (currentScan.health_score < 50) color = '#b91c1c';
    else if (currentScan.health_score < 75) color = '#d97706';
    else if (currentScan.health_score < 90) color = '#2563eb'; // blue
    healthScoreEl.style.color = color;
  }

  const repRecoveryRate = document.getElementById('rep-recovery-rate');
  if (repRecoveryRate) {
    repRecoveryRate.textContent = 'N/A (Baseline)';
    const timelineBaseId = currentScan.parent_scan_id || currentScan.id;
    fetch(`/api/recovery/timeline/${timelineBaseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.timeline.length > 1) {
          repRecoveryRate.textContent = `${data.recovery_rate} (vs scan #${timelineBaseId})`;
        }
      })
      .catch(err => {
        console.error('Error fetching recovery rate for report:', err);
      });
  }

  // Highlight colors based on severity
  const diseaseEl = document.getElementById('rep-disease');
  if (currentScan.disease_name === 'Healthy') {
    diseaseEl.className = 'diagnosis-highlight text-success';
    diseaseEl.style.color = '#10b981';
  } else {
    diseaseEl.className = 'diagnosis-highlight';
    diseaseEl.style.color = '#dc2626';
  }

  // Report Image
  const repImg = document.getElementById('rep-image');
  if (repImg) {
    repImg.src = currentScan.annotated_image;
  }

  // Condition details info
  document.getElementById('rep-desc').textContent = currentScan.description;
  document.getElementById('rep-symptoms').textContent = currentScan.symptoms;
  document.getElementById('rep-causes').textContent = currentScan.causes;

  // Report Treatments
  const repTreatments = document.getElementById('rep-treatments');
  if (repTreatments) {
    if (currentScan.treatments && currentScan.treatments.length > 0) {
      const ul = document.createElement('ul');
      currentScan.treatments.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      repTreatments.innerHTML = '';
      repTreatments.appendChild(ul);
    } else {
      repTreatments.innerHTML = '<p>No treatments needed. Keep monitoring the plant for leaf spots.</p>';
    }
  }

  // Report Preventions
  const repPreventions = document.getElementById('rep-preventions');
  if (repPreventions) {
    if (currentScan.prevention && currentScan.prevention.length > 0) {
      const ul = document.createElement('ul');
      currentScan.prevention.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        ul.appendChild(li);
      });
      repPreventions.innerHTML = '';
      repPreventions.appendChild(ul);
    } else {
      repPreventions.innerHTML = '<p>No specific prevention tips required.</p>';
    }
  }
}

// ----------------------------------------------------
// Settings View Form Handlers
// ----------------------------------------------------
async function handleChangePassword(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('settings-curr-password').value;
  const newPassword = document.getElementById('settings-new-password').value;
  const confirmPassword = document.getElementById('settings-confirm-password').value;

  if (newPassword.length < 6) {
    showToast('New password must be at least 6 characters long', 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    const data = await response.json();

    if (data.success) {
      showToast('Password changed successfully!');
      document.getElementById('form-change-password').reset();
    } else {
      showToast(data.message || 'Failed to change password', 'error');
    }
  } catch (error) {
    console.error('Password change error:', error);
    showToast('Failed to connect to security backend', 'error');
  }
}

function openDeleteAccountModal() {
  const modal = document.getElementById('delete-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('delete-confirm-password').focus();
  }
}

function closeDeleteAccountModal() {
  const modal = document.getElementById('delete-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('form-delete-account').reset();
  }
}

async function handleDeleteAccount(e) {
  e.preventDefault();
  const password = document.getElementById('delete-confirm-password').value;

  try {
    const response = await fetch('/api/user/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await response.json();

    if (data.success) {
      closeDeleteAccountModal();
      currentUser = null;
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      updateAuthUI();
      showToast('Your CropDoctor AI account and logs have been permanently deleted.', 'warning');
      navigateTo('landing');
    } else {
      showToast(data.message || 'Incorrect password', 'error');
    }
  } catch (error) {
    console.error('Account delete error:', error);
    showToast('Failed to process deletion request', 'error');
  }
}

// ----------------------------------------------------
// Admin Panel Analytics & Chart.js Integration
// ----------------------------------------------------
async function loadAdminData() {
  try {
    const response = await fetch('/api/admin/stats');
    if (!response.ok) throw new Error('Forbidden or error fetching admin data');
    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      
      // Update stats text
      document.getElementById('admin-total-users').textContent = stats.total_users;
      document.getElementById('admin-total-scans').textContent = stats.total_scans;
      document.getElementById('admin-common-disease').textContent = stats.common_disease;
      document.getElementById('admin-avg-confidence').textContent = stats.avg_confidence;
      
      const avgSevEl = document.getElementById('admin-avg-severity');
      if (avgSevEl) avgSevEl.textContent = stats.avg_severity;
      
      const feedAccEl = document.getElementById('admin-feedback-accuracy');
      if (feedAccEl) feedAccEl.textContent = stats.accuracy_feedback;

      // Populate User Activity logs
      const tbody = document.getElementById('admin-activity-table-body');
      if (tbody) {
        tbody.innerHTML = '';
        if (stats.recent_activity && stats.recent_activity.length > 0) {
          stats.recent_activity.forEach(act => {
            const tr = document.createElement('tr');
            
            let dateFormatted = act.date;
            try {
              const d = new Date(act.date);
              dateFormatted = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
            } catch(e){}

            tr.innerHTML = `
              <td>${act.email}</td>
              <td><strong>${act.crop_name}</strong></td>
              <td><span class="badge-status ${act.disease_name === 'Healthy' ? 'healthy' : 'high'}">${act.disease_name}</span></td>
              <td>${dateFormatted}</td>
            `;
            tbody.appendChild(tr);
          });
        } else {
          tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No global user activity recorded yet.</td></tr>`;
        }
      }

      // Draw Charts using Chart.js
      renderAdminCharts(stats.disease_dist, stats.crop_dist, stats.monthly_scans, stats.accuracy_trends);
    }
  } catch (error) {
    console.error('Admin panel load error:', error);
    showToast('Access denied or backend error. Redirecting...', 'error');
    navigateTo('dashboard');
  }
}

function renderAdminCharts(diseaseDist, cropDist, monthlyScans, accuracyTrends) {
  // Chart.js requires responsive settings to scale correctly inside flex containers
  const isLight = document.documentElement.classList.contains('light-mode');
  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  // Chart 1: Disease Incidence Distribution (Doughnut)
  const ctxDisease = document.getElementById('chart-disease-dist');
  if (ctxDisease) {
    // Destroy existing chart to prevent canvas overlaps
    if (diseaseChart) diseaseChart.destroy();

    const labels = Object.keys(diseaseDist);
    const data = Object.values(diseaseDist);

    if (labels.length === 0) {
      labels.push('No Data');
      data.push(1);
    }

    // Modern harmonious colors
    const colors = [
      '#10b981', // green
      '#3b82f6', // blue
      '#ef4444', // red
      '#f59e0b', // orange
      '#84cc16', // lime
      '#a855f7', // purple
      '#06b6d4', // cyan
      '#ec4899'  // pink
    ];

    diseaseChart = new Chart(ctxDisease, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: isLight ? '#ffffff' : '#1e293b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });
  }

  // Chart 2: Monthly Scans (Bar and line combination)
  const ctxScans = document.getElementById('chart-monthly-scans');
  if (ctxScans) {
    if (scansChart) scansChart.destroy();

    const months = Object.keys(monthlyScans);
    const scanCounts = Object.values(monthlyScans);

    scansChart = new Chart(ctxScans, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Total Scans',
            data: scanCounts,
            backgroundColor: 'rgba(34, 197, 94, 0.65)',
            borderColor: '#22c55e',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Scan Growth Trend',
            data: scanCounts,
            type: 'line',
            borderColor: '#84cc16',
            borderWidth: 2,
            pointBackgroundColor: '#84cc16',
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
          }
        },
        scales: {
          x: {
            grid: { color: 'transparent' },
            ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0, font: { family: 'Plus Jakarta Sans' } }
          }
        }
      }
    });
  }

  // Chart 3: Crop Distribution (Doughnut)
  const ctxCrop = document.getElementById('chart-crop-dist');
  if (ctxCrop) {
    if (cropChart) cropChart.destroy();

    const labels = Object.keys(cropDist);
    const data = Object.values(cropDist);

    if (labels.length === 0) {
      labels.push('No Data');
      data.push(1);
    }

    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // orange
      '#a855f7', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#ef4444', // red
      '#84cc16'  // lime
    ];

    cropChart = new Chart(ctxCrop, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: isLight ? '#ffffff' : '#1e293b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });
  }
}

// ----------------------------------------------------
// Farmer Profile Settings Handlers (Sprint 1)
// ----------------------------------------------------
async function loadProfileData() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();
    if (data.success) {
      const p = data.profile;
      document.getElementById('settings-name').value = p.name || '';
      document.getElementById('settings-location').value = p.location || '';
      document.getElementById('settings-farmsize').value = p.farm_size || '';
      document.getElementById('settings-primarycrop').value = p.primary_crop || 'Wheat';
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  const name = document.getElementById('settings-name').value.trim();
  const location = document.getElementById('settings-location').value.trim();
  const farm_size = document.getElementById('settings-farmsize').value;
  const primary_crop = document.getElementById('settings-primarycrop').value;

  try {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, farm_size, primary_crop })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Profile details updated successfully!');
      // Update local storage name display
      currentUser.name = name;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateAuthUI();
    } else {
      showToast(data.message || 'Profile update failed', 'error');
    }
  } catch (err) {
    console.error('Error saving profile:', err);
    showToast('Failed to save profile', 'error');
  }
}

// ----------------------------------------------------
// Diagnosis Feedback System (Sprint 3)
// ----------------------------------------------------
async function submitScanFeedback(isCorrect) {
  if (!currentScan) return;
  const feedbackValue = isCorrect ? 1 : 0;
  
  try {
    const res = await fetch('/api/scan/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: currentScan.id, feedback: feedbackValue })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Thank you for your feedback!');
      document.getElementById('btn-feedback-yes').classList.toggle('active', isCorrect);
      document.getElementById('btn-feedback-no').classList.toggle('active', !isCorrect);
      
      const statusText = document.getElementById('feedback-status-text');
      const buttonsDiv = document.querySelector('.feedback-widget .feedback-buttons');
      if (statusText && buttonsDiv) {
        statusText.classList.remove('hidden');
        buttonsDiv.classList.add('hidden');
      }
      
      // Update currentScan object locally
      currentScan.feedback = feedbackValue;
    }
  } catch (err) {
    console.error('Feedback submit error:', err);
    showToast('Failed to submit feedback', 'error');
  }
}

// ----------------------------------------------------
// Recovery Timeline Tracker (Sprint 2)
// ----------------------------------------------------
let activeRecoveryBaseId = null;

function startRecoveryFollowUp() {
  if (!currentScan) return;
  parentScanId = currentScan.id;
  activeRecoveryBaseId = currentScan.parent_scan_id || currentScan.id;
  showToast(`Follow-up scanning activated for this ${currentScan.crop_name} plot.`);
  navigateTo('analysis');
  
  const statusLabel = document.getElementById('confidence-value');
  if (statusLabel) {
    statusLabel.textContent = `25% (Follow-up to Scan #${currentScan.id})`;
  }
}

function startRecoveryFollowUpFromTracker() {
  if (activeRecoveryBaseId) {
    parentScanId = activeRecoveryBaseId;
    showToast(`Adding follow-up scan to this recovery timeline`);
    navigateTo('analysis');
  } else {
    navigateTo('analysis');
  }
}

async function viewRecoveryTimeline() {
  const scanId = currentScan ? (currentScan.parent_scan_id || currentScan.id) : activeRecoveryBaseId;
  if (!scanId) {
    showToast('No recovery base scan selected', 'warning');
    return;
  }
  activeRecoveryBaseId = scanId;
  navigateTo('recovery');
}

async function loadRecoveryTimelineData() {
  if (!activeRecoveryBaseId) {
    navigateTo('history');
    return;
  }
  
  const timelineContainer = document.getElementById('recovery-vertical-timeline');
  const progressBarsContainer = document.getElementById('recovery-progress-bars');
  
  if (!timelineContainer || !progressBarsContainer) return;
  
  timelineContainer.innerHTML = '<p class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Loading timeline logs...</p>';
  progressBarsContainer.innerHTML = '';
  
  try {
    const res = await fetch(`/api/recovery/timeline/${activeRecoveryBaseId}`);
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('recovery-title').textContent = `${data.timeline[0].crop_name} Recovery Tracker`;
      document.getElementById('recovery-rate-value').textContent = data.recovery_rate;
      
      const initSev = data.timeline[0].severity_percentage;
      const currSev = data.timeline[data.timeline.length - 1].severity_percentage;
      
      document.getElementById('recovery-initial-sev').textContent = `${initSev}%`;
      document.getElementById('recovery-current-sev').textContent = `${currSev}%`;
      
      const badge = document.getElementById('recovery-status-badge');
      if (badge) {
        const rate = parseFloat(data.recovery_rate);
        if (rate >= 90.0) {
          badge.textContent = 'Fully Recovered';
          badge.className = 'badge-status healthy';
        } else if (rate > 0.0) {
          badge.textContent = 'Recovering';
          badge.className = 'badge-status low';
        } else {
          badge.textContent = 'Active Infection';
          badge.className = 'badge-status critical';
        }
      }
      
      timelineContainer.innerHTML = '';
      data.timeline.forEach((point, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `timeline-item ${idx === data.timeline.length - 1 ? 'active' : ''}`;
        
        let dateFormatted = point.date;
        try {
          const d = new Date(point.date);
          dateFormatted = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
        } catch(e){}
        
        itemDiv.innerHTML = `
          <div class="timeline-badge"></div>
          <div class="timeline-card">
            <img src="${point.original_image}" class="timeline-img" alt="Leaf crop image">
            <div class="timeline-info">
              <span class="timeline-day">${point.day_label}</span>
              <span class="timeline-disease">${point.disease_name}</span>
              <span class="timeline-meta">Severity: ${point.severity_percentage}% | Health: ${point.health_score}/100 | ${dateFormatted}</span>
            </div>
            <button class="btn btn-outline btn-sm timeline-btn" onclick="viewScanReport(${point.id})">Details</button>
          </div>
        `;
        timelineContainer.appendChild(itemDiv);
        
        const barItem = document.createElement('div');
        barItem.className = 'breakdown-item';
        
        let barColor = 'var(--primary-color)';
        if (point.severity_percentage >= 60) barColor = '#ef4444';
        else if (point.severity_percentage >= 35) barColor = '#f59e0b';
        else if (point.severity_percentage >= 15) barColor = '#3b82f6';
        
        barItem.innerHTML = `
          <div class="breakdown-item-header">
            <span>${point.day_label} (${point.disease_name})</span>
            <span>Severity: ${point.severity_percentage}%</span>
          </div>
          <div class="breakdown-bar-container">
            <div class="breakdown-bar-fill" style="width: ${point.severity_percentage}%; background: ${barColor};"></div>
          </div>
        `;
        progressBarsContainer.appendChild(barItem);
      });
    } else {
      timelineContainer.innerHTML = `<p class="text-center text-danger py-4">${data.message || 'Timeline not found'}</p>`;
    }
  } catch (err) {
    console.error('Error fetching recovery timeline:', err);
    timelineContainer.innerHTML = '<p class="text-center text-danger py-4">Error loading recovery logs</p>';
  }
}

// ----------------------------------------------------
// AI Farming Assistant Panel (Sprint 3)
// ----------------------------------------------------
function loadAssistantContext() {
  const contextCard = document.getElementById('assistant-context-card');
  const contextCrop = document.getElementById('assistant-context-crop');
  const contextDisease = document.getElementById('assistant-context-disease');
  const contextSeverity = document.getElementById('assistant-context-severity');
  
  if (!contextCard) return;
  
  if (currentScan) {
    contextCard.classList.remove('hidden');
    contextCrop.textContent = `Crop: ${currentScan.crop_name}`;
    contextDisease.textContent = `Disease: ${currentScan.disease_name}`;
    
    const sevVal = currentScan.severity_percentage !== undefined ? currentScan.severity_percentage : currentScan.severity_value;
    contextSeverity.textContent = `Severity: ${sevVal}% (${currentScan.severity_level})`;
  } else {
    contextCard.classList.add('hidden');
  }
}

function sendQuickQuery(text) {
  const input = document.getElementById('chat-input-text');
  if (input) {
    input.value = text;
    const chatForm = document.getElementById('form-assistant-chat');
    if (chatForm) {
      chatForm.dispatchEvent(new Event('submit'));
    }
  }
}

async function handleAssistantSubmit(e) {
  e.preventDefault();
  
  const input = document.getElementById('chat-input-text');
  const container = document.getElementById('chat-messages-container');
  
  if (!input || !container) return;
  
  const message = input.value.trim();
  if (!message) return;
  
  input.value = '';
  
  appendChatMessage(message, 'user');
  appendTypingIndicator();
  
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (res.status === 401) {
      removeTypingIndicator();
      showToast('Your session has expired. Please sign in again.', 'warning');
      currentUser = null;
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      updateAuthUI();
      navigateTo('auth');
      return;
    }
    
    const data = await res.json();
    
    removeTypingIndicator();
    
    if (data.success) {
      appendChatMessage(data.reply, 'bot');
    } else {
      appendChatMessage('Sorry, I encountered an issue while processing your request. Please try again.', 'bot');
    }
  } catch (err) {
    console.error('Chat error:', err);
    removeTypingIndicator();
    appendChatMessage('Unable to connect to assistant service. Please check your internet connection.', 'bot');
  }
}

function appendChatMessage(text, sender) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}`;
  
  let cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\*\s(.*)$/gm, '• $1')
    .replace(/\n/g, '<br>');
    
  msgDiv.innerHTML = `
    <div class="msg-bubble">${cleanText}</div>
  `;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg typing';
  msgDiv.id = 'chat-typing-indicator';
  
  msgDiv.innerHTML = `
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('chat-typing-indicator');
  if (el) {
    el.remove();
  }
}
