const contentDB = {
  home: `
    <div class="banner-slider" id="bannerSlider">
      <div class="banner-slide active"><img src="banner1.jpg" alt="SK Pharmacy"></div>
      <div class="banner-slide"><img src="banner2.jpg" alt="Home Delivery"></div>
      <div class="banner-slide"><img src="banner3.jpg" alt="All Medicines"></div>
    </div>
    <h2>Featured Products</h2>
    <div class="product-grid">
      <div class="product-card" data-page="product1">
        <img src="med1.jpg" alt="Medicine">
        <h4>All Medicines Available</h4>
        <p>24x7 Home Delivery</p>
      </div>
      <div class="product-card" data-page="product2">
        <img src="surgical.jpg" alt="Surgical">
        <h4>Surgical Items</h4>
        <p>Doctor Recommended</p>
      </div>
    </div>
  `,
  "customer-service": `
    <div class="content-layout">
      <div class="sidebar">
        <h3>Help Topics</h3>
        <a href="#" data-page="delivery">Home Delivery</a>
        <a href="#" data-page="timing">Store Timing</a>
        <a href="#" data-page="contact">Contact Us</a>
      </div>
      <div id="help-detail">
        <h2>Customer Service</h2>
        <p>बाएं से Topic चुनो, Detail यहां खुलेगा। Page Reload नहीं होगा।</p>
      </div>
    </div>
  `,
  delivery: `
    <h2>Home Delivery Available</h2>
    <p>सिलापुर गांव, दनकौर, ग्रेटर नोएडा, उत्तर प्रदेश में 2 घंटे में Delivery</p>
    <p>Call/WhatsApp: 92588751739, 7983006957</p>
  `,
  contact: `
    <h2>Contact S K Pharmacy</h2>
    <p>पता: सिलापुर गांव, दनकौर, ग्रेटर नोएडा, उत्तर प्रदेश</p>
    <p>WhatsApp: 92588751739 | 7983006957 | 7900836957</p>
  `,
  about: `<h2>About SK Pharmacy</h2><p>Medicines Health Care. Dr. Shakir Khan Presents.</p>`,
  team: `<h2>Our Team</h2><p>Experienced Pharmacists and Healthcare Staff</p>`,
  medicines: `<h2>All Medicines</h2><p>General Medicine, Pain Relief, Fever, Cough</p>`,
  surgical: `<h2>Surgical Items</h2><p>Baby Care, Cosmetics, Veterinary</p>`,
  offers: `<h2>Special Offers</h2><p>Prime Day जैसा Banner Auto Slide होगा ऊपर</p>`
};

const mainContent = document.getElementById('main-content');
const modalContainer = document.getElementById('modal-container');
let currentPage = 'home';

// SPA Load Function
function loadPage(pageId) {
  if(contentDB[pageId]) {
    mainContent.innerHTML = contentDB[pageId];
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
    currentPage = pageId;
    initPageScripts();
    window.scrollTo(0,0);
  }
}

// Click Events
document.addEventListener('click', e => {
  if(e.target.matches('[data-page]')) {
    e.preventDefault();
    loadPage(e.target.dataset.page);
  }
});

// Modal Function
function openModal(content) {
  modalContainer.innerHTML = `<div class="modal active"><div class="modal-content">${content}<button onclick="closeModal()">Close</button></div></div>`;
}
function closeModal() {
  modalContainer.innerHTML = '';
}

// Page Specific Scripts
function initPageScripts() {
  // Banner Auto Slide - Prime Day जैसा
  const slides = document.querySelectorAll('.banner-slide');
  if(slides.length > 0) {
    let index = 0;
    setInterval(() => {
      slides[index].classList.remove('active');
      index = (index + 1) % slides.length;
      slides[index].classList.add('active');
    }, 3000);
  }

  // Location Modal
  const locBtn = document.getElementById('locationBtn');
  if(locBtn) locBtn.onclick = () => openModal('<h3>Choose Location</h3><p>Khan Alampura, UP</p>');

  // Account Modal
  const accBtn = document.getElementById('accountBtn');
  if(accBtn) accBtn.onclick = () => openModal('<h3>Your Account</h3><p>Orders | Profile | Logout</p>');
}

// Initial Load
loadPage('home');
