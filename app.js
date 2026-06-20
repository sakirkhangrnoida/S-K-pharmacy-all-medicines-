alert('JS चालू है');
document.getElementById('productGrid').innerHTML = '<h2>Test Product - Paracetamol ₹10</h2>';
document.getElementById('toast').innerText = 'Toast काम कर रहा';
document.getElementById('toast').style.display = 'block';
// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;
let allProducts = [];
let csvUrl = ""; // FIX 1: "https:// बंद कर दिया

// Page Load होते ही
window.onload = function() {
  loadProducts();
  setupLinks();
  if(typeof auth!== 'undefined'){ // FIX: Firebase check
    auth.onAuthStateChanged(user => {
      currentUser = user;
      updateCartCount();
    });
  }
};

// AUTO Category
function autoCategory(name, desc=""){
  let text = (name + " + desc).toLowerCase();
  if(text.includes('tablet') || text.includes('syrup') || text.includes('capsule') || text.includes('paracetamol') || text.includes('dolo') || text.includes('crocin') || text.includes('medicine')) return "Medicines";
  if(text.includes('facewash') || text.includes('cream') || text.includes('gel') || text.includes('lotion') || text.includes('soap') || text.includes('shampoo') || text.includes('skin')) return "Skin Care";
  if(text.includes('baby') || text.includes('diaper') || text.includes('powder') || text.includes('oil') || text.includes('wipes')) return "Baby Care";
  if(text.includes('health') || text.includes('vitamin') || text.includes('protein') || text.includes('supplement')) return "Health Care";
  return "General";
}

// Toast
function toast(msg){
  let t = document.getElementById('toast');
  if(!t) return;
  t.innerText = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// 3 Dot Menu Toggle
function toggleMenu(){
  let menu = document.getElementById('threeDotMenu');
  if(!menu) return;
  menu.style.display = menu.style.display === 'block'? 'none' : 'block';
}

// AUTO Filter
function filterCategory(cat){
  let title = document.getElementById('categoryTitle');
  if(title) title.innerText = cat === 'All'? 'All Products' : cat;

  let filtered = cat === 'All'? allProducts : allProducts.filter(p => {
    let autoCat = p.category || autoCategory(p.name, p.desc);
    return autoCat === cat;
  });

  showProducts(filtered);
  toggleMenu();
}

// Links Setup
function setupLinks(){
  document.querySelectorAll('#threeDotMenu a').forEach(link => {
    link.addEventListener('click', function(e){
      let href = this.getAttribute('href');
      if(href && href.endsWith('.html')){
        e.preventDefault();
        openPage(href);
        toggleMenu();
      }
    });
  });

  document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', function(e){
      let href = this.getAttribute('href');
      if(href && href.endsWith('.html')){
        e.preventDefault();
        openPage(href);
      }
    });
  });
}

// Page Open
function openPage(page){
  window.location.href = page;
  toast(page.replace('.html','') + ' Page खुल रहा है...');
}

// Read More Toggle
function toggleRead(n){
  let d = document.getElementById('more'+n);
  let s = d.previousElementSibling;
  if(d.style.display === 'block'){
    d.style.display = 'none';
    s.innerHTML = 'Read More ↓';
  } else {
    d.style.display = 'block';
    s.innerHTML = 'Read Less ↑';
  }
}

// Products Show
function showProducts(products){
  let grid = document.getElementById('productGrid');
  if(!grid) return;
  if(products.length == 0){
    grid.innerHTML = '<p style="text-align:center;padding:50px">कोई Product नहीं मिला</p>';
    return;
  }

  grid.innerHTML = products.map(p => {
    let cat = p.category || autoCategory(p.name, p.desc);
    let off = p.mrp? Math.round((p.mrp - p.price) / p.mrp * 100) : 0;

    return `
    <div class="product" data-category="${cat}" onclick="openProductPage('${p.id}')">
      <div class="prod-menu" onclick="event.stopPropagation(); toggleProdMenu('${p.id}')">⋮</div>
      <div class="prod-dropdown" id="prodMenu${p.id}">
        <a href="#" onclick="event.stopPropagation(); shareProd('${p.id}')">📤 Share</a>
        <a href="#" onclick="event.stopPropagation(); wishlist('${p.id}')">❤️ Wishlist</a>
      </div>

      <img src="${p.image || 'joy.jpg'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="price">₹${p.price} <span class="mrp">₹${p.mrp || p.price}</span> <span class="off">${off}% Off</span></div>

      <div class="prod-actions" onclick="event.stopPropagation()">
        <button class="btn-cart" onclick="addToCart('${p.id}')">Add to Cart</button>
        <button class="btn-buy" onclick="buyNow('${p.id}')">Buy Now</button>
      </div>

      <div class="prod-social" onclick="event.stopPropagation()">
        <span onclick="likeProd('${p.id}')" id="like${p.id}">❤️ Like <b id="likeCount${p.id}">${p.likes || 0}</b></span>
        <span onclick="shareProd('${p.id}')">📤 Share</span>
      </div>
    </div>
  `}).join('');
}

// Product 3 Dot Menu
function toggleProdMenu(id){
  let menu = document.getElementById('prodMenu' + id);
  if(menu) menu.style.display = menu.style.display === 'block'? 'none' : 'block';
}

// Search
function searchProducts(){
  let query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
  document.getElementById('categoryTitle').innerText = query? `Search: ${query}` : 'All Products';
  showProducts(filtered);
}

function startVoiceSearch(){
  if(!('webkitSpeechRecognition' in window)){
    toast('Chrome Browser इस्तेमाल करो');
    return;
  }
  let recognition = new webkitSpeechRecognition();
  recognition.lang = 'hi-IN';
  let voiceBtn = document.getElementById('voiceBtn');
  voiceBtn.innerHTML = '🔴';
  recognition.onresult = function(event){
    let transcript = event.results[0][0].transcript;
    document.getElementById('searchInput').value = transcript;
    searchProducts();
    voiceBtn.innerHTML = '🎤';
  };
  recognition.onend = function(){ voiceBtn.innerHTML = '🎤'; };
  recognition.start();
  toast('बोलो... 🎤');
}

// Cart System
function addToCart(id){
  let p = allProducts.find(x => x.id == id);
  if(!p) return;
  let exist = cart.find(x => x.id == id);
  if(exist) exist.qty++; else cart.push({...p, qty:1});
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  toast(p.name + ' Cart में जुड़ गया');
}

function updateCartCount(){
  let el = document.getElementById('cartCount');
  if(el) el.innerText = cart.reduce((a,b) => a + b.qty, 0);
}

function showCart(){
  let html = '<h2>Your Cart</h2>';
  if(cart.length == 0) html += '<p>Cart खाली है</p>';
  else {
    cart.forEach(item => {
      html += `<div style="display:flex;gap:10px;margin:15px 0;border-bottom:1px solid #eee;padding-bottom:10px">
        <img src="${item.image}" style="width:60px;height:60px">
        <div>${item.name}<br>₹${item.price} x ${item.qty}</div>
      </div>`;
    });
    html += `<h3>Total: ₹${cart.reduce((a,b) => a + b.price * b.qty, 0)}</h3>`;
    html += `<button onclick="checkout()" style="width:100%;padding:12px;background:#ffa41c;color:white;border:none;border-radius:8px;margin-top:15px">Proceed to Buy</button>`;
  }
  document.getElementById('settingsPopup').innerHTML = html + '<button onclick="closePopup(\'settingsPopup\')" style="width:100%;padding:12px;background:#999;color:white;border:none;border-radius:8px;margin-top:10px">Close</button>';
  document.getElementById('settingsPopup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function checkout(){
  if(!currentUser){ toast('पहले Login करो'); showAuthBox(); return; }
  toast('Order Place हो गया! COD');
  cart = []; localStorage.removeItem('cart'); updateCartCount(); closePopup('settingsPopup');
}

function buyNow(id){ addToCart(id); showCart(); }

// Like Share
function likeProd(id){
  let btn = document.getElementById('like' + id);
  let count = document.getElementById('likeCount' + id);
  btn.classList.toggle('liked');
  count.innerText = parseInt(count.innerText) + (btn.classList.contains('liked')? 1 : -1);
  toast(btn.classList.contains('liked')? 'Like किया' : 'Like हटाया');
}

function shareProd(id){
  let url = window.location.origin + '?product=' + id;
  navigator.clipboard.writeText(url);
  toast('Link Copy हो गया');
}

// Auth
function showAuthBox(){
  document.getElementById('authBox').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function closePopup(id){
  document.getElementById(id).style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function signup(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  if(typeof auth === 'undefined'){ toast('Firebase नहीं लगा'); return; }
  auth.createUserWithEmailAndPassword(e,p).then(() => {
    toast('Account बन गया'); closePopup('authBox');
  }).catch(err => toast(err.message));
}

function login(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  if(typeof auth === 'undefined'){ toast('Firebase नहीं लगा'); return; }
  auth.signInWithEmailAndPassword(e,p).then(() => {
    toast('Login हो गया'); closePopup('authBox');
  }).catch(err => toast(err.message));
}

function logout(){
  if(typeof auth!== 'undefined') auth.signOut();
  toast('Logout हो गया');
}

// Orders
function showOrders(){
  let html = '<h2>Live Order Track</h2><div style="display:flex;justify-content:space-between;margin:30px 0"><span>📦 Ordered</span><span>🚚 Shipped</span><span>✅ Delivered</span></div><p>Status: Processing</p>';
  document.getElementById('settingsPopup').innerHTML = html + '<button onclick="closePopup(\'settingsPopup\')" style="width:100%;padding:12px;background:#999;color:white;border:none;border-radius:8px;margin-top:15px">Close</button>';
  document.getElementById('settingsPopup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

// Enter से Search
document.addEventListener('DOMContentLoaded', () => {
  let searchInput = document.getElementById('searchInput');
  if(searchInput){
    searchInput.addEventListener('keypress', e => {
      if(e.key === 'Enter') searchProducts();
    });
  }
});

// बाहर Click = Menu बंद
window.onclick = function(e){
  if(!e.target.closest('[onclick*="toggleMenu"]') &&!e.target.closest('.prod-menu') &&!e.target.closest('#threeDotMenu')){
    let menu = document.getElementById('threeDotMenu');
    if(menu) menu.style.display = 'none';
  }
}

// FIX 2: CSV Load में Test Data डाल दिया
function loadProducts(){
  allProducts = [
    {id:1, name:"Paracetamol 500mg Tablet", price:10, mrp:20, image:"joy.jpg", desc:"Fever pain", likes:12},
    {id:2, name:"Himalaya Neem Facewash", price:150, mrp:200, image:"joy.jpg", desc:"Skin care", likes:8},
    {id:3, name:"Johnson Baby Powder", price:120, mrp:150, image:"joy.jpg", desc:"Baby care", likes:15},
    {id:4, name:"Vitamin D3 Capsule", price:250, mrp:300, image:"joy.jpg", desc:"Health supplement", likes:5}
  ];
  showProducts(allProducts);
  toast("4 Test Products Load हो गए");
}

// FIX 3: गायब Function Add कर दिए
function openProductPage(id){
  toast('Product ' + id + ' - Detail Page बाद में');
}

function wishlist(id){
  let p = allProducts.find(x => x.id == id);
  toast(p.name + ' Wishlist में Add हो गया ❤️');
  toggleProdMenu(id);
}
