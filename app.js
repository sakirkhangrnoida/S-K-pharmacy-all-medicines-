// Global Variables
let cart = [];
let allProducts = [];
let currentUser = null;
let sheetId = "1seAdpx2vGTh5GX46HwbFXgfrVaLldgx9sjyRvvF-0o4"; // तेरी Google Sheet ID

// Page Load होते ही सब चालू
window.onload = function() {
  loadProducts();
  auth.onAuthStateChanged(user => {
    currentUser = user;
    updateCartCount();
    updateAuthUI();
  });
}

// Toast - Alert की जगह
function toast(msg){
  try {
    let text = '';
    if(msg == null) return;
    if(typeof msg === 'string') text = msg;
    else if(msg.message) text = msg.message;
    else text = JSON.stringify(msg);

    let t = document.getElementById('toast');
    if(!t) return;
    t.innerText = text;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
  } catch(e){}
}

// 3 Dot Menu Toggle
function toggleMenu(){
  document.getElementById('threeDotMenu').classList.toggle('show');
}
window.onclick = function(event) {
  if (!event.target.matches('.menu-btn') &&!event.target.matches('button[onclick="toggleMenu()"]')) {
    let dropdowns = document.getElementsByClassName("dropdown");
    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('show');
    }
    document.getElementById('threeDotMenu').classList.remove('show');
  }
}

// Voice Search - बोल के सर्च
function startVoiceSearch(){
  if(!('webkitSpeechRecognition' in window)){
    toast('तुम्हारा Browser Voice Search Support नहीं करता. Chrome इस्तेमाल करो');
    return;
  }

  let recognition = new webkitSpeechRecognition();
  recognition.lang = 'hi-IN';
  recognition.continuous = false;
  recognition.interimResults = false;

  let voiceBtn = document.getElementById('voiceBtn');
  voiceBtn.innerHTML = '🔴';
  voiceBtn.style.color = 'red';

  recognition.onstart = function(){
    toast('बोलो... मैं सुन रहा हूँ 🎤');
  };

  recognition.onresult = function(event){
    let transcript = event.results[0][0].transcript;
    document.getElementById('searchInput').value = transcript;
    toast('सर्च कर रहा: ' + transcript);
    searchProducts();
  };

  recognition.onerror = function(event){
    toast('Error: माइक Permission दो');
    voiceBtn.innerHTML = '🎤';
    voiceBtn.style.color = 'black';
  };

  recognition.onend = function(){
    voiceBtn.innerHTML = '🎤';
    voiceBtn.style.color = 'black';
  };

  recognition.start();
}

// Google Sheet से Product Load
async function loadProducts(){
  try {
    let url = `https://opensheet.elk.sh/${sheetId}/Sheet1`;
    let res = await fetch(url);
    allProducts = await res.json();
    showProducts(allProducts);
    toast('Products Load हो गए');
  } catch(e){
    document.getElementById('productGrid').innerHTML = '<p style="text-align:center;padding:50px">Products Load नहीं हुए. Sheet ID चेक करो</p>';
    toast('Error: Product Load Failed');
  }
}

// Product Show - हर Product में सब अपने आप
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
        <a href="#" onclick="event.stopPropagation(); reportProd('${p.id}')">⚠️ Report</a>
      </div>

      <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="product.rating">⭐ 4.2 | 1.2K Reviews</div>
      <div class="product.price">₹${p.price} <span class="product.mrp">₹${p.mrp || p.price}</span> <span class="product.off">${p.off || '10%'} Off</span></div>

      <div class="prod-actions" onclick="event.stopPropagation()">
        <button class="btn-cart" onclick="addToCart('${p.id}')">Add to Cart</button>
        <button class="btn-buy" onclick="buyNow('${p.id}')">Buy Now</button>
      </div>

      <div class="prod-social" onclick="event.stopPropagation()">
        <span onclick="likeProd('${p.id}')" id="like${p.id}">❤️ Like <b id="likeCount${p.id}">${p.likes || 0}</b></span>
        <span onclick="commentProd('${p.id}')">💬 Comment</span>
        <span onclick="shareProd('${p.id}')">📤 Share</span>
      </div>
    </div>
  `).join('');
}

// Product 3 Dot Menu Toggle
function toggleProdMenu(id){
  let menu = document.getElementById('prodMenu' + id);
  menu.classList.toggle('show');
}

// Search Product
function searchProducts(){
  let query = document.getElementById('searchInput').value.toLowerCase();
  let category = document.getElementById('searchCategory').value;

  let filtered = allProducts.filter(p => {
    let matchName = p.name.toLowerCase().includes(query);
    let matchCat = category === 'All' || p.category === category;
    return matchName && matchCat;
  });

  document.getElementById('categoryTitle').innerText = query? `Search: ${query}` : 'All Products';
  showProducts(filtered);
  if(query) toast(`${filtered.length} Product मिले`);
}

// Category Filter
function filterCategory(cat){
  document.getElementById('searchCategory').value = cat;
  searchProducts();
  toggleMenu();
}

// Product Page Open - Amazon जैसा
function openProductPage(id){
  let p = allProducts.find(x => x.id == id);
  if(!p) return;

  document.getElementById('sidebar').classList.add('active');
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('sidebarTitle').innerText = p.name;

  document.getElementById('sidebarContent').innerHTML = `
    <img src="${p.image}" style="width:100%;height:250px;object-fit:contain;margin-bottom:15px">
    <h2 style="font-size:20px;margin:10px 0">${p.name}</h2>
    <div style="color:#ff9900;margin:10px 0">⭐ 4.2 | 1,234 Ratings</div>
    <div style="font-size:28px;color:#b12704;font-weight:bold;margin:10px 0">₹${p.price}</div>
    <div style="color:#565959;text-decoration:line-through">MRP: ₹${p.mrp || p.price}</div>
    <p style="margin:15px 0;color:#555">${p.description || 'No description available'}</p>

    <button onclick="addToCart('${id}'); closeSidebar()" style="width:100%;padding:12px;background:#ffd814;border:none;border-radius:8px;margin:8px 0;font-weight:bold;cursor:pointer">Add to Cart</button>
    <button onclick="buyNow('${id}'); closeSidebar()" style="width:100%;padding:12px;background:#ffa41c;color:white;border:none;border-radius:8px;margin:8px 0;font-weight:bold;cursor:pointer">Buy Now</button>

    <div style="margin-top:20px;border-top:1px solid #ddd;padding-top:15px">
      <h4>Product Details</h4>
      <p>Category: ${p.category}</p>
      <p>Brand: ${p.brand || 'S K Pharmacy'}</p>
      <p>Delivery: Free in Dankaur 203201</p>
    </div>
  `;
}

function closeSidebar(){
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('overlay').style.display = 'none';
}

// Cart System
function addToCart(id){
  let p = allProducts.find(x => x.id == id);
  if(!p) return;

  let exist = cart.find(x => x.id == id);
  if(exist) exist.qty++;
  else cart.push({...p, qty:1});

  updateCartCount();
  toast(p.name + ' Cart में जुड़ गया');
}

function updateCartCount(){
  document.getElementById('cartCount').innerText = cart.reduce((a,b) => a + b.qty, 0);
}

function showCart(){
  let html = '<h2>Your Cart</h2>';
  if(cart.length == 0){
    html += '<p>Cart खाली है</p>';
  } else {
    cart.forEach(item => {
      html += `<div style="display:flex;gap:10px;margin:15px 0;padding:10px;border-bottom:1px solid #eee">
        <img src="${item.image}" style="width:60px;height:60px;object-fit:contain">
        <div style="flex:1">
          <div>${item.name}</div>
          <div>₹${item.price} x ${item.qty}</div>
        </div>
      </div>`;
    });
    html += `<h3>Total: ₹${cart.reduce((a,b) => a + b.price * b.qty, 0)}</h3>`;
    html += `<button onclick="checkout()" style="width:100%;padding:12px;background:#ffa41c;color:white;border:none;border-radius:8px;margin-top:15px;cursor:pointer">Proceed to Buy</button>`;
  }

  document.getElementById('settingsPopup').innerHTML = html + '<button onclick="closePopup(\'settingsPopup\')" style="width:100%;padding:12px;background:#999;color:white;border:none;border-radius:8px;margin-top:10px;cursor:pointer">Close</button>';
  document.getElementById('settingsPopup').style.display = 'block';
}

function checkout(){
  if(!currentUser){
    toast('पहले Login करो');
    showAuthBox();
    return;
  }
  toast('Order Place हो गया! Cash on Delivery');
  cart = [];
  updateCartCount();
  closePopup('settingsPopup');
}

function buyNow(id){
  addToCart(id);
  showCart();
}

// Like, Comment, Share
function likeProd(id){
  let btn = document.getElementById('like' + id);
  let count = document.getElementById('likeCount' + id);
  btn.classList.toggle('liked');
  count.innerText = parseInt(count.innerText) + (btn.classList.contains('liked')? 1 : -1);
  toast(btn.classList.contains('liked')? 'Like कर दिया' : 'Like हटा दिया');
}

function shareProd(id){
  let p = allProducts.find(x => x.id == id);
  let url = window.location.href + '?product=' + id;
  navigator.clipboard.writeText(url);
  toast('Link Copy हो गया: ' + url);
}

function commentProd(id){
  toast('Comment Feature जल्दी आएगा - Firebase से जुड़ेगा');
}

function wishlist(id){
  toast('Wishlist में Add हो गया');
}

function reportProd(id){
  toast('Report भेज दिया गया');
}

// Auth System
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
  if(!e ||!p) return toast('Email और Password डालो');

  auth.createUserWithEmailAndPassword(e,p)
 .then(() => {
    toast('Account बन गया');
    closePopup('authBox');
  })
 .catch(err => toast(err.message));
}

function login(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  if(!e ||!p) return toast('Email और Password डालो');

  auth.signInWithEmailAndPassword(e,p)
 .then(() => {
    toast('Login हो गया');
    closePopup('authBox');
  })
 .catch(err => toast(err.message));
}

function phoneLogin(){
  toast('Phone OTP Feature Firebase Phone Auth से जुड़ेगा');
}

function logout(){
  auth.signOut();
  toast('Logout हो गया');
  toggleMenu();
}

function updateAuthUI(){
  // Login/Logout text change कर सकते हैं यहाँ
}

// Orders & My Account
function showOrders(){
  let html = '<h2>Live Order Track</h2>';
  html += '<div style="display:flex;justify-content:space-between;margin:30px 0;position:relative">';
  html += '<div style="position:absolute;top:10px;left:50%;width:80%;height:2px;background:#ddd;transform:translateX(-50%)"></div>';
  html += '<div class="progress-step active">📦 Ordered</div>';
  html += '<div class="progress-step">🚚 Shipped</div>';
  html += '<div class="progress-step">✅ Delivered</div>';
  html += '</div>';
  html += '<p>Order ID: SK' + Math.floor(Math.random()*10000) + '</p>';
  html += '<p>Status: Processing</p>';

  document.getElementById('settingsPopup').innerHTML = html + '<button onclick="closePopup(\'settingsPopup\')" style="width:100%;padding:12px;background:#999;color:white;border:none;border-radius:8px;margin-top:15px;cursor:pointer">Close</button>';
  document.getElementById('settingsPopup').style.display = 'block';
  toggleMenu();
}

function showMyAccount(){
  if(!currentUser) return showAuthBox();
  toast('My Account Page - ' + currentUser.email);
  toggleMenu();
}

function showPrime(){
  toast('Prime Subscribe - ₹999/Year. Coming Soon');
  toggleMenu();
}

function showModal(type){
  toast(type + ' Page खुल रहा है');
}

// Enter दबाने पर Search
document.getElementById('searchInput').addEventListener('keypress', function(e){
  if(e.key === 'Enter') searchProducts();
});
