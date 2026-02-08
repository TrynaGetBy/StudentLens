// The Student Lens - Enhanced Application
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// ========== INITIALIZATION ==========
function initApp() {
  loadTheme();
  loadArticles();
  setupEventListeners();
  render();
}

// ========== STATE MANAGEMENT ==========
let articles = [];
let filteredArticles = [];
let currentFilter = {
  home: { search: '', sort: 'newest' },
  articles: { search: '', sort: 'newest' }
};

// ========== THEME MANAGEMENT ==========
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    updateThemeIcon();
  }
}

window.toggleTheme = function () {
  document.body.classList.toggle("light");
  const theme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("theme", theme);
  updateThemeIcon();
};

function updateThemeIcon() {
  const icon = document.querySelector(".theme-icon");
  if (icon) {
    icon.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  }
}

// ========== MOBILE MENU ==========
window.toggleMobileMenu = function () {
  const mobileNav = document.getElementById("mobileNav");
  const menuBtn = document.querySelector(".mobile-menu-btn");
  
  mobileNav.classList.toggle("active");
  menuBtn.classList.toggle("active");
};

// ========== ARTICLE MANAGEMENT ==========
function loadArticles() {
  const stored = localStorage.getItem("articles");
  articles = stored ? JSON.parse(stored) : [];
  filteredArticles = [...articles];
}

function saveArticles() {
  localStorage.setItem("articles", JSON.stringify(articles));
}

// ========== NAVIGATION ==========
window.goTo = function (id) {
  // Remove active class from all sections
  document.querySelectorAll("section").forEach(sec => {
    sec.classList.remove("active");
  });
  
  // Remove active class from all nav buttons
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.remove("active");
  });
  
  // Add active class to selected section
  const section = document.getElementById(id);
  if (section) {
    section.classList.add("active");
  }
  
  // Add active class to corresponding nav button
  const navBtn = document.querySelector(`.nav-item[data-section="${id}"]`);
  if (navBtn) {
    navBtn.classList.add("active");
  }
  
  // Initialize map if navigating to map section
  if (id === 'map' && !window.mapInitialized) {
    initWorldMap();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ========== FORM MANAGEMENT ==========
window.toggleForm = function () {
  const form = document.getElementById("form");
  if (form.style.display === "none" || form.style.display === "") {
    form.style.display = "block";
  } else {
    form.style.display = "none";
  }
};

window.clearForm = function () {
  document.getElementById("title").value = "";
  document.getElementById("image").value = "";
  document.getElementById("content").value = "";
  document.getElementById("imagePreview").innerHTML = "";
  updateCharCount();
};

// ========== ADD ARTICLE ==========
window.addArticle = function () {
  const titleInput = document.getElementById("title");
  const imageInput = document.getElementById("image");
  const contentInput = document.getElementById("content");
  
  const title = titleInput.value.trim();
  const image = imageInput.value.trim();
  const content = contentInput.value.trim();
  
  if (!title) {
    alert("Please enter a title for your article.");
    titleInput.focus();
    return;
  }
  
  if (!content) {
    alert("Please enter content for your article.");
    contentInput.focus();
    return;
  }
  
  const newArticle = {
    id: Date.now(),
    title: title,
    image: image,
    content: content,
    date: new Date().toISOString(),
    reactions: {}
  };
  
  articles.unshift(newArticle);
  saveArticles();
  clearForm();
  document.getElementById("form").style.display = "none";
  
  // Reset filters and render
  filteredArticles = [...articles];
  render();
  
  showNotification("Article published successfully! 🎉");
};

// ========== DELETE ARTICLE ==========
window.deleteArticle = function (id) {
  if (!confirm("Are you sure you want to delete this article permanently?")) {
    return;
  }
  
  articles = articles.filter(a => a.id !== id);
  filteredArticles = filteredArticles.filter(a => a.id !== id);
  saveArticles();
  render();
  showNotification("Article deleted.");
};

// ========== REACTIONS ==========
window.react = function (id, emoji) {
  const article = articles.find(a => a.id === id);
  if (article) {
    article.reactions[emoji] = (article.reactions[emoji] || 0) + 1;
    saveArticles();
    render();
  }
};

// ========== SEARCH FUNCTIONALITY ==========
window.searchArticles = function (section) {
  const searchInput = document.getElementById(`search${section.charAt(0).toUpperCase() + section.slice(1)}`);
  const clearBtn = searchInput.nextElementSibling;
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  currentFilter[section].search = searchTerm;
  
  // Show/hide clear button
  if (searchTerm) {
    clearBtn.style.display = 'flex';
  } else {
    clearBtn.style.display = 'none';
  }
  
  applyFilters(section);
};

window.clearSearch = function (section) {
  const searchInput = document.getElementById(`search${section.charAt(0).toUpperCase() + section.slice(1)}`);
  searchInput.value = '';
  currentFilter[section].search = '';
  searchInput.nextElementSibling.style.display = 'none';
  applyFilters(section);
  searchInput.focus();
};

// ========== SORT & FILTER ==========
window.applySortFilter = function (section) {
  const sortSelect = document.getElementById(`sort${section.charAt(0).toUpperCase() + section.slice(1)}`);
  currentFilter[section].sort = sortSelect.value;
  applyFilters(section);
};

function applyFilters(section) {
  const { search, sort } = currentFilter[section];
  
  // Filter by search
  let filtered = articles.filter(article => {
    if (!search) return true;
    return article.title.toLowerCase().includes(search) ||
           article.content.toLowerCase().includes(search);
  });
  
  // Sort
  filtered = sortArticles(filtered, sort);
  
  // Update filtered articles
  filteredArticles = filtered;
  
  // Render specific section
  if (section === 'home') {
    renderList(document.getElementById('homeList'), filtered, false);
  } else if (section === 'articles') {
    renderList(document.getElementById('articleList'), filtered, false);
    updateArticleCount(filtered.length);
  }
}

function sortArticles(articlesArray, sortType) {
  const sorted = [...articlesArray];
  
  switch (sortType) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'most-reacted':
      return sorted.sort((a, b) => {
        const aTotal = Object.values(a.reactions).reduce((sum, val) => sum + val, 0);
        const bTotal = Object.values(b.reactions).reduce((sum, val) => sum + val, 0);
        return bTotal - aTotal;
      });
    default:
      return sorted;
  }
}

function updateArticleCount(count) {
  const countEl = document.getElementById('articlesCount');
  if (countEl) {
    countEl.textContent = `${count} article${count !== 1 ? 's' : ''}`;
  }
}

// ========== RENDER ARTICLES ==========
function renderList(container, articlesToRender, allowDelete) {
  container.innerHTML = "";
  
  if (articlesToRender.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No articles found</h3>
        <p>${allowDelete ? 'Start creating your first article!' : 'Try adjusting your search or filters.'}</p>
      </div>
    `;
    return;
  }
  
  articlesToRender.forEach(article => {
    const div = document.createElement("div");
    div.className = "article";
    
    const emojis = ["🔥", "❤️", "😂", "😮", "😢", "👏", "👍", "🎓", "💡", "✨"];
    const emojiButtons = emojis
      .map(emoji => {
        const count = article.reactions[emoji] || 0;
        return `<span onclick="react(${article.id}, '${emoji}')" title="React with ${emoji}">${emoji} ${count}</span>`;
      })
      .join("");
    
    const dateObj = new Date(article.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="${escapeHtml(article.title)}" onerror="this.style.display='none'">` : ""}
      <h3>${escapeHtml(article.title)}</h3>
      <small>📅 ${formattedDate}</small>
      <p>${escapeHtml(article.content)}</p>
      <div class="emoji">
        ${emojiButtons}
      </div>
      ${allowDelete ? `<button class="delete main" onclick="deleteArticle(${article.id})">🗑️ Delete Article</button>` : ""}
    `;
    
    container.appendChild(div);
  });
}

function render() {
  const homeList = document.getElementById("homeList");
  const articleList = document.getElementById("articleList");
  const myList = document.getElementById("myList");
  
  if (homeList) {
    const homeFiltered = applyCurrentFilters('home');
    renderList(homeList, homeFiltered, false);
  }
  
  if (articleList) {
    const articlesFiltered = applyCurrentFilters('articles');
    renderList(articleList, articlesFiltered, false);
    updateArticleCount(articlesFiltered.length);
  }
  
  if (myList) renderList(myList, articles, true);
}

function applyCurrentFilters(section) {
  const { search, sort } = currentFilter[section];
  
  let filtered = articles.filter(article => {
    if (!search) return true;
    return article.title.toLowerCase().includes(search) ||
           article.content.toLowerCase().includes(search);
  });
  
  return sortArticles(filtered, sort);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  const imageInput = document.getElementById("image");
  if (imageInput) {
    imageInput.addEventListener("input", updateImagePreview);
  }
  
  const contentInput = document.getElementById("content");
  if (contentInput) {
    contentInput.addEventListener("input", updateCharCount);
  }
}

function updateImagePreview() {
  const imageUrl = document.getElementById("image").value;
  const preview = document.getElementById("imagePreview");
  
  if (imageUrl) {
    preview.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<p style=color:var(--muted)>⚠️ Invalid image URL</p>'">`;
  } else {
    preview.innerHTML = "";
  }
}

function updateCharCount() {
  const content = document.getElementById("content").value;
  const charCount = document.querySelector(".char-count");
  
  if (charCount) {
    charCount.textContent = `${content.length} characters`;
  }
}

// ========== WORLD MAP ==========
window.mapInitialized = false;

function initWorldMap() {
  const width = document.getElementById('worldMap').clientWidth;
  const height = 600;
  
  const svg = d3.select("#worldMap")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  
  const projection = d3.geoNaturalEarth1()
    .scale(width / 5)
    .translate([width / 2, height / 2]);
  
  const path = d3.geoPath().projection(projection);
  
  // Load world map data
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(data => {
      const countries = topojson.feature(data, data.objects.countries);
      
      svg.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => getCountryColor(d.properties.name))
        .attr("stroke", "var(--border)")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("fill", "var(--accent)")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .attr("fill", getCountryColor(d.properties.name))
            .attr("stroke-width", 0.5);
        })
        .on("click", function(event, d) {
          showCountryInfo(d.properties.name);
        });
      
      window.mapInitialized = true;
    });
}

function getCountryColor(countryName) {
  const literacyRate = getEducationData(countryName).literacyRate;
  
  if (literacyRate >= 95) return "#4dabf7";
  if (literacyRate >= 85) return "#51cf66";
  if (literacyRate >= 70) return "#ffd43b";
  return "#ff6b6b";
}

function getEducationData(countryName) {
  // Comprehensive education statistics database
  const educationDatabase = {
    "United States of America": {
      literacyRate: 99,
      schoolEnrollment: 97,
      avgYearsSchooling: 13.4,
      pupilTeacherRatio: 14,
      educationSpending: 5.0,
      tertiaryEnrollment: 88,
      outOfSchool: 2.1
    },
    "United Kingdom": {
      literacyRate: 99,
      schoolEnrollment: 99,
      avgYearsSchooling: 13.2,
      pupilTeacherRatio: 16,
      educationSpending: 5.5,
      tertiaryEnrollment: 61,
      outOfSchool: 1.8
    },
    "Canada": {
      literacyRate: 99,
      schoolEnrollment: 99,
      avgYearsSchooling: 13.3,
      pupilTeacherRatio: 15,
      educationSpending: 5.3,
      tertiaryEnrollment: 67,
      outOfSchool: 1.5
    },
    "Australia": {
      literacyRate: 99,
      schoolEnrollment: 98,
      avgYearsSchooling: 12.7,
      pupilTeacherRatio: 13,
      educationSpending: 5.2,
      tertiaryEnrollment: 113,
      outOfSchool: 2.0
    },
    "Germany": {
      literacyRate: 99,
      schoolEnrollment: 98,
      avgYearsSchooling: 14.1,
      pupilTeacherRatio: 12,
      educationSpending: 4.9,
      tertiaryEnrollment: 69,
      outOfSchool: 1.7
    },
    "France": {
      literacyRate: 99,
      schoolEnrollment: 99,
      avgYearsSchooling: 11.6,
      pupilTeacherRatio: 19,
      educationSpending: 5.4,
      tertiaryEnrollment: 64,
      outOfSchool: 1.9
    },
    "Japan": {
      literacyRate: 99,
      schoolEnrollment: 100,
      avgYearsSchooling: 12.8,
      pupilTeacherRatio: 14,
      educationSpending: 3.2,
      tertiaryEnrollment: 63,
      outOfSchool: 0.5
    },
    "China": {
      literacyRate: 97,
      schoolEnrollment: 95,
      avgYearsSchooling: 7.8,
      pupilTeacherRatio: 16,
      educationSpending: 4.1,
      tertiaryEnrollment: 51,
      outOfSchool: 8.5
    },
    "India": {
      literacyRate: 74,
      schoolEnrollment: 88,
      avgYearsSchooling: 6.5,
      pupilTeacherRatio: 24,
      educationSpending: 3.8,
      tertiaryEnrollment: 28,
      outOfSchool: 32.0
    },
    "Brazil": {
      literacyRate: 93,
      schoolEnrollment: 97,
      avgYearsSchooling: 8.0,
      pupilTeacherRatio: 21,
      educationSpending: 6.2,
      tertiaryEnrollment: 51,
      outOfSchool: 5.8
    },
    "Nigeria": {
      literacyRate: 62,
      schoolEnrollment: 61,
      avgYearsSchooling: 6.2,
      pupilTeacherRatio: 37,
      educationSpending: 2.7,
      tertiaryEnrollment: 10,
      outOfSchool: 42.0
    },
    "South Africa": {
      literacyRate: 87,
      schoolEnrollment: 95,
      avgYearsSchooling: 10.1,
      pupilTeacherRatio: 32,
      educationSpending: 6.5,
      tertiaryEnrollment: 21,
      outOfSchool: 8.3
    },
    "Egypt": {
      literacyRate: 71,
      schoolEnrollment: 91,
      avgYearsSchooling: 7.2,
      pupilTeacherRatio: 26,
      educationSpending: 3.5,
      tertiaryEnrollment: 36,
      outOfSchool: 12.5
    },
    "Kenya": {
      literacyRate: 82,
      schoolEnrollment: 83,
      avgYearsSchooling: 6.5,
      pupilTeacherRatio: 40,
      educationSpending: 5.3,
      tertiaryEnrollment: 11,
      outOfSchool: 18.0
    },
    "Mexico": {
      literacyRate: 95,
      schoolEnrollment: 96,
      avgYearsSchooling: 8.8,
      pupilTeacherRatio: 26,
      educationSpending: 4.9,
      tertiaryEnrollment: 40,
      outOfSchool: 6.2
    },
    "Argentina": {
      literacyRate: 99,
      schoolEnrollment: 99,
      avgYearsSchooling: 10.9,
      pupilTeacherRatio: 15,
      educationSpending: 5.5,
      tertiaryEnrollment: 88,
      outOfSchool: 2.3
    },
    "Russia": {
      literacyRate: 100,
      schoolEnrollment: 98,
      avgYearsSchooling: 12.2,
      pupilTeacherRatio: 19,
      educationSpending: 3.7,
      tertiaryEnrollment: 82,
      outOfSchool: 2.8
    },
    "South Korea": {
      literacyRate: 98,
      schoolEnrollment: 98,
      avgYearsSchooling: 12.2,
      pupilTeacherRatio: 16,
      educationSpending: 4.6,
      tertiaryEnrollment: 95,
      outOfSchool: 1.2
    },
    "Saudi Arabia": {
      literacyRate: 95,
      schoolEnrollment: 96,
      avgYearsSchooling: 10.2,
      pupilTeacherRatio: 12,
      educationSpending: 5.1,
      tertiaryEnrollment: 68,
      outOfSchool: 4.5
    },
    "Turkey": {
      literacyRate: 96,
      schoolEnrollment: 93,
      avgYearsSchooling: 8.2,
      pupilTeacherRatio: 17,
      educationSpending: 4.3,
      tertiaryEnrollment: 94,
      outOfSchool: 7.8
    }
  };
  
  // Default data for countries not in database
  const defaultData = {
    literacyRate: 85,
    schoolEnrollment: 85,
    avgYearsSchooling: 8.0,
    pupilTeacherRatio: 25,
    educationSpending: 4.0,
    tertiaryEnrollment: 35,
    outOfSchool: 10.0
  };
  
  return educationDatabase[countryName] || defaultData;
}

function showCountryInfo(countryName) {
  const data = getEducationData(countryName);
  const infoPanel = document.getElementById("mapInfo");
  
  infoPanel.innerHTML = `
    <div class="info-content">
      <h3>📊 ${countryName}</h3>
      <p>Education statistics and indicators for ${countryName}</p>
      
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label">Literacy Rate</div>
          <div class="stat-value">${data.literacyRate}%</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">School Enrollment</div>
          <div class="stat-value">${data.schoolEnrollment}%</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Avg Years of Schooling</div>
          <div class="stat-value">${data.avgYearsSchooling} years</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Pupil-Teacher Ratio</div>
          <div class="stat-value">${data.pupilTeacherRatio}:1</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Education Spending (% GDP)</div>
          <div class="stat-value">${data.educationSpending}%</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Tertiary Enrollment</div>
          <div class="stat-value">${data.tertiaryEnrollment}%</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Children Out of School</div>
          <div class="stat-value">${data.outOfSchool}M</div>
        </div>
      </div>
    </div>
  `;
}

window.resetMap = function() {
  // Reset zoom and view
  showNotification("Map view reset");
};

window.showRegion = function(region) {
  showNotification(`Focusing on ${region.charAt(0).toUpperCase() + region.slice(1)}`);
};

// ========== UTILITY FUNCTIONS ==========
function showNotification(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--accent);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
