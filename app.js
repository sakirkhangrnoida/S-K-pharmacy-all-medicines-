console.log('✅ app.js लोड हो गया! अब Function Check कर रहा हूं...');

// Function Checker - हर Function बना है या नहीं
window.onload = function() {
  console.log('=== FUNCTION CHECK REPORT ===');

  let functions = ['toggleMenu', 'showCart', 'showAuthBox', 'loadProducts', 'showProducts', 'addToCart', 'searchProducts', 'toast'];

  functions.forEach(fn => {
    if(typeof window[fn] === 'function'){
      console.log('✅', fn, '= OK');
    } else {
      console.error('❌', fn, '= MISSING! app.js में ये function नहीं मिला');
      console.log('FIX: app.js में डाल दे -> function', fn, '(){ }');
    }
  });

  // HTML Element Checker
  console.log('=== HTML ELEMENT CHECK REPORT ===');
  let elements = ['threeDotMenu', 'toast', 'cartCount', 'productGrid', 'searchInput'];

  elements.forEach(id => {
    if(document.getElementById(id)){
      console.log('✅ #', id, '= मिला');
    } else {
      console.error('❌ #', id, '= नहीं मिला! index.html में ये ID वाला div बना');
      console.log('FIX: <div id="', id, '"></div>');
    }
  });

  console.log('=== CHECK खत्म ===');
  console.log('अब ⋮ पे क्लिक कर और Console देख। चोर खुद बता देगा कहां है।');
};
// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;
let allProducts = [];
let csvUrl = ""; // FIX: अधूरी लाइन हटा दी

// Firebase Safe
let auth = null;
if(typeof firebase!== 'undefined' && firebase.auth){
  auth = firebase.auth();
}

// Page Load होते ही
window.onload = function() {
  loadProducts();
  setupLinks();
  updateCartCount();

  if(auth){
    auth.onAuthStateChanged(user => {
      currentUser = user;
      updateCartCount();
    });
  }
};

// AUTO Category - तेरा पूरा वाला वही
function autoCategory(name, desc=""){
  let text = (name + " + desc).toLowerCase(); // FIX: + desc था, " + desc कर दिया
  if(text.includes('tablet') || text.includes('syrup') || text.includes('capsule') || text.includes('paracetamol') || text.includes('dolo') || text.includes('crocin') || text.includes('medicine')) return "Medicines";
  if(text.includes('facewash') || text.includes('cream') || text.includes('gel') || text.includes('lotion') || text.includes('soap') || text.includes('shampoo') || text.includes('skin')) return "Skin Care";
  if(text.includes('baby') || text.includes('diaper') || text.includes('powder') || text.includes('oil') || text.includes('wipes')) return "Baby Care";
  if(text.includes('health') || text.includes('vitamin') || text.includes('protein') || text.includes('supplement')) return "Health Care";
  return "General";
}

// Toast - Alert की जगह
function toast(msg){
  let t = document.getElementById('toast');
  if(!t) return;
  t.innerText = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// 3 Dot Menu Toggle - FIXED: सिर्फ 1 बार रहेगा अब
function toggleMenu(){
  let menu = document.getElementById('threeDotMenu');
  if(!menu) return;
  menu.style.display = menu.style.display === 'block'? 'none' : 'block';
}

// AUTO Filter - All + Category नया जोड़ा
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

// सब Link एक ही JS से Open - 20 Page का काम
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

// Page Open Function - एक ही Link सबके लिए
function openPage(page){
  window.location.href = page;
  toast(page.replace('.html','') + ' Page खुल रहा है...');
}

// Read More Toggle - 20 Page में काम आएगा
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

// Products Show - Auto Category लगा दिया - तेरा पूरा वाला
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

      <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
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

// Search + Voice Search
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

// Cart System - तेरा पुराना वही
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

function wishlist(id){
  toast('Wishlist में Add हो गया');
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
  if(auth) auth.createUserWithEmailAndPassword(e,p).then(() => {
    toast('Account बन गया'); closePopup('authBox');
  }).catch(err => toast(err.message));
}

function login(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  if(auth) auth.signInWithEmailAndPassword(e,p).then(() => {
    toast('Login हो गया'); closePopup('authBox');
  }).catch(err => toast(err.message));
}

function logout(){
  if(auth) auth.signOut();
  toast('Logout हो गया');
}

// Orders
function showOrders(){
  let html = '<h2>Live Order Track</h2><div style="display:flex;justify-content:space-between;margin:30px 0"><span>📦 Ordered</span><span>🚚 Shipped</span><span>✅ Delivered</span></div><p>Status: Processing</p>';
  document.getElementById('settingsPopup').innerHTML = html + '<button onclick="closePopup(\'settingsPopup\')" style="width:100%;padding:12px;background:#999;color:white;border:none;border-radius:8px;margin-top:15px">Close</button>';
  document.getElementById('settingsPopup').style.display = 'block';
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
  if(!e.target.closest('[onclick*="toggleMenu"]') &&!e.target.closest('.prod-menu')){
    let menu = document.getElementById('threeDotMenu');
    if(menu) menu.style.display = 'none';
  }
}

// CSV Load - तेरा पुराना कोड + Test Data
function loadProducts(){
  // अभी Test के लिए Data - बाद में CSV लगा देंगे
  allProducts = [
    {id:1, name:"Dolo 650 Tablet", price:25, mrp:30, image:"https://via.placeholder.com/150", desc:"Fever Pain Headache", likes:5},
    {id:2, name:"Himalaya Neem Facewash", price:150, mrp:200, image:"https://via.placeholder.com/150", desc:"Oil Control Skin", likes:8},
    {id:3, name:"Johnson Baby Powder", price:120, mrp:150, image:"https://via.placeholder.com/150", desc:"Baby Care Soft", likes:12}
  ];
  showProducts(allProducts);
}

// Product Page Open - तेरा वाला
function openProductPage(id){
  toast('Product ' + id + ' Page खुलेगा');
}
