
// Global Variables
let cart = [];
let currentUser = null;
let csvUrl = "https://

// Page Load होते ही
window.onload = function() {
  loadProducts();
  setupLinks();
  auth.onAuthStateChanged(user => {
    currentUser = user;
    updateCartCount();
  });
};

// Toast - Alert की जगह
function toast(msg){
  let t = document.getElementById('toast');
  if(!t) return;
  t.innerText = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// 3 Dot Menu Toggle - FIXED
function toggleMenu(){
  let menu = document.getElementById('threeDotMenu');
  menu.style.display = menu.style.display === 'block'? 'none' : 'block';
}

// सब Link एक ही JS से Open - 20 Page का काम
function setupLinks(){
  // 3 Dot Menu के सारे Link
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

  // Footer के सारे Link
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
  // GitHub Pages पे सीधा redirect
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


// Products Show
function showProducts(products){
  let grid = document.getElementById('productGrid');
  if(products.length == 0){
    grid.innerHTML = '<p style="text-align:center;padding:50px">कोई Product नहीं मिला</p>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product" onclick="openProductPage('${p.id}')">
      <div class="prod-menu" onclick="event.stopPropagation(); toggleProdMenu('${p.id}')">⋮</div>
      <div class="prod-dropdown" id="prodMenu${p.id}">
        <a href="#" onclick="event.stopPropagation(); shareProd('${p.id}')">📤 Share</a>
        <a href="#" onclick="event.stopPropagation(); wishlist('${p.id}')">❤️ Wishlist</a>
      </div>

      <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="product.price">₹${p.price} <span class="product.mrp">₹${p.mrp || p.price}</span> <span class="product.off">${p.off || '10%'} Off</span></div>

      <div class="prod-actions" onclick="event.stopPropagation()">
        <button class="btn-cart" onclick="addToCart('${p.id}')">Add to Cart</button>
        <button class="btn-buy" onclick="buyNow('${p.id}')">Buy Now</button>
      </div>

      <div class="prod-social" onclick="event.stopPropagation()">
        <span onclick="likeProd('${p.id}')" id="like${p.id}">❤️ Like <b id="likeCount${p.id}">${p.likes || 0}</b></span>
        <span onclick="shareProd('${p.id}')">📤 Share</span>
      </div>
    </div>
  `).join('');
}

// Product 3 Dot Menu
function toggleProdMenu(id){
  let menu = document.getElementById('prodMenu' + id);
  menu.style.display = menu.style.display === 'block'? 'none' : 'block';
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

// Cart System
function addToCart(id){
  let p = allProducts.find(x => x.id == id);
  let exist = cart.find(x => x.id == id);
  if(exist) exist.qty++; else cart.push({...p, qty:1});
  updateCartCount();
  toast(p.name + ' Cart में जुड़ गया');
}

function updateCartCount(){
  document.getElementById('cartCount').innerText = cart.reduce((a,b) => a + b.qty, 0);
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
  cart = []; updateCartCount(); closePopup('settingsPopup');
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
  auth.createUserWithEmailAndPassword(e,p).then(() => {
    toast('Account बन गया'); closePopup('authBox');
  }).catch(err => toast(err.message));
}

function login(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  auth.signInWithEmailAndPassword(e,p).then(() => {
    toast('Login हो गया'); closePopup('authBox');
  }).catch(err => toast(err.message));
}

function logout(){
  auth.signOut();
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

function toggleMenu(){
  let menu = document.getElementById('toggleMenu');
  if(!menu) return;
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}
