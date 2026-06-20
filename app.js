// 1. Product की List - यहां से Auto बनेंगे सब
const products = [
  {id: "p1", name: "Paracetamol 500mg Tablet 15 Strips", price: 15, mrp: 200, img: "https://via.placeholder.com/200x160/ff4444/fff?text=Paracetamol", cat: "Medicines"},
  {id: "p2", name: "Vitamin C 500mg Immunity Booster", price: 120, mrp: 250, img: "https://via.placeholder.com/200x160/44ff44/fff?text=Vitamin+C", cat: "Wellness"},
  {id: "p3", name: "Dettol Handwash 200ml", price: 99, mrp: 120, img: "https://via.placeholder.com/200x160/4444ff/fff?text=Dettol", cat: "Personal Care"},
  {id: "p4", name: "Johnson Baby Powder", price: 180, mrp: 220, img: "https://via.placeholder.com/200x160/ffaa44/fff?text=Johnson", cat: "Baby Care"}
];

// 2. Page Load होते ही Auto Product बन जाएंगे
window.onload = function(){
  loadProducts();
}

function loadProducts(){
  const list = document.getElementById('productList');
  if(!list) return;
  list.innerHTML = '';
  
  products.forEach(p => {
    list.innerHTML += `
    <div class="product" data-category="${p.cat}" data-name="${p.name}" data-price="${p.price}" data-id="${p.id}">
      <img src="${p.img}" alt="${p.name}" onclick="openAmazonStyle(this)">
      <h4>${p.name}</h4>
      <div class="price">₹${p.price}</div>
      <div class="btns">
        <button class="btn-cart" onclick="addToCart(this)">Add to Cart</button>
        <button class="btn-buy" onclick="buyNow(this)">Buy Now</button>
        <button class="btn-share" onclick="shareProduct(this)"><i class="fa fa-share"></i></button>
        <button class="btn-like" onclick="likeProduct(this)"><i class="fa fa-heart"></i> <span class="likeCount">0</span></button>
      </div>
      <div class="comment-box">
        <input type="text" placeholder="Comment लिखो..." onkeypress="if(event.key==='Enter') addComment(this)">
        <div class="comment-list" id="comments-${p.id}"></div>
      </div>
    </div>`;
  });
}

// 3. सारे Button का काम
function addToCart(btn){
  let count = document.getElementById('cartCount');
  count.innerText = parseInt(count.innerText) + 1;
  alert('Cart में Add हो गया!');
}

function buyNow(btn){
  alert('Buy Now - Payment Page पर ले जा रहा हूं');
}

function shareProduct(btn){
  const product = btn.closest('.product');
  const name = product.dataset.name;
  if(navigator.share){
    navigator.share({title: name, text: 'Check this: '+name, url: window.location.href});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link Copy हो गया');
  }
}

function likeProduct(btn){
  let count = btn.querySelector('.likeCount');
  count.innerText = parseInt(count.innerText) + 1;
}

function addComment(input){
  if(input.value.trim() == '') return;
  const id = input.closest('.product').dataset.id;
  document.getElementById('comments-'+id).innerHTML += '<div style="font-size:12px;margin-top:5px;border-top:1px solid #eee;padding-top:3px;">'+input.value+'</div>';
  input.value = '';
}

function searchProducts(){
  let txt = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.product').forEach(p => {
    if(p.dataset.name.toLowerCase().includes(txt)) p.style.display = 'block';
    else p.style.display = 'none';
  });
}

function filterCategory(cat){
  document.querySelectorAll('.product').forEach(p => {
    if(cat == 'All' || p.dataset.category == cat) p.style.display = 'block';
    else p.style.display = 'none';
  });
  toggleMenu();
}

// 4. Amazon Style Popup
function openAmazonStyle(img){
  const product = img.closest('.product');
  const name = product.dataset.name;
  const price = product.dataset.price;
  const imgSrc = img.src;
  
  document.getElementById('popupImg').src = imgSrc;
  document.getElementById('popupName').innerText = name;
  document.getElementById('popupPrice').innerText = '₹' + price;
  
  document.getElementById('popupCart').onclick = () => addToCart(product.querySelector('.btn-cart'));
  document.getElementById('popupBuy').onclick = () => buyNow(product.querySelector('.btn-buy'));
  
  document.getElementById('productPopup').style.display = 'flex';
}

function closePopup(){
  document.getElementById('productPopup').style.display = 'none';
}

// 5. 3 Dot Menu - Mobile Fix
function toggleMenu(){
  document.getElementById('threeDotMenu').classList.toggle('menu-show');
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2EOywrcF8vJUXnsmF5PA3t3inW79UX8Y",
  authDomain: "grnoida-store.firebaseapp.com",
  databaseURL: "https://grnoida-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "grnoida-store",
  storageBucket: "grnoida-store.firebasestorage.app",
  messagingSenderId: "665639961400",
  appId: "1:665639961400:web:cb704b0209b910fc6a77cd"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let cartCount = 0;
let confirmationResult;

// 3 Dot Menu Auto
window.toggleMenu = function(){
  const menu = document.getElementById('threeDotMenu');
  menu.classList.toggle('menu-hidden');
  menu.classList.toggle('menu-show');
}
document.addEventListener('click', function(e){
  const menu = document.getElementById('threeDotMenu');
  const btn = document.querySelector('.menu-btn');
  if(menu && !menu.contains(e.target) && !btn.contains(e.target)){
    menu.classList.add('menu-hidden');
    menu.classList.remove('menu-show');
  }
});

// All + Category Filter
window.filterCategory = function(category){
  document.querySelectorAll('.product').forEach(p => {
    p.style.display = (category === 'All' || p.dataset.category === category) ? 'block' : 'none';
  });
  toggleMenu();
}

// Search
window.searchProducts = function(){
  const val = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.product').forEach(p => {
    p.style.display = p.dataset.name.toLowerCase().includes(val) ? 'block' : 'none';
  });
}

// Add to Cart
window.addToCart = function(btn){
  cartCount++;
  document.getElementById('cartCount').innerText = cartCount;
}

// Buy Now - Firebase Auto Save
window.buyNow = async function(btn){
  const product = btn.closest('.product');
  const orderId = 'ORD' + Date.now();
  await set(ref(db, 'orders/' + orderId), {
    orderId: orderId,
    product: product.dataset.name,
    price: parseInt(product.dataset.price),
    qty: 1,
    mobile: "9258751739",
    address: "COD Order - Greater Noida 203201",
    status: "Order Placed",
    time: Date.now()
  });
  console.log('Order Saved:', orderId);
}

// Share Button
window.shareProduct = function(btn){
  const product = btn.closest('.product');
  const url = window.location.href + '#' + product.dataset.id;
  if(navigator.share){
    navigator.share({title: product.dataset.name, text: 'Check: ' + product.dataset.name, url: url});
  } else {
    navigator.clipboard.writeText(url);
  }
}

// Like Button
window.likeProduct = function(btn){
  const count = btn.querySelector('.likeCount');
  count.innerText = parseInt(count.innerText) + 1;
}

// Comment Box
window.addComment = function(input){
  const product = input.closest('.product');
  const id = product.dataset.id;
  const text = input.value;
  if(text.trim() === '') return;
  push(ref(db, 'comments/' + id), {text: text, time: Date.now()});
  input.value = '';
}

// Load Comments Live
document.querySelectorAll('.product').forEach(p => {
  const id = p.dataset.id;
  onValue(ref(db, 'comments/' + id), (snapshot) => {
    const div = document.getElementById('comments-' + id);
    div.innerHTML = '';
    snapshot.forEach(child => {
      div.innerHTML += '<div>• ' + child.val().text + '</div>';
    });
  });
});

// Amazon Style Product Page
window.openAmazonStyle = function(img){
  const product = img.closest('.product');
  window.location.href = 'product.html?id=' + product.dataset.id; // तेरे पास product.html है तो खुलेगा
}

// OTP System
window.showLoginPopup = function(){
  document.getElementById('loginPopup').style.display = 'flex';
  if(!window.recaptchaVerifier){
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {size: 'invisible'});
  }
}
window.closeLoginPopup = function(){
  document.getElementById('loginPopup').style.display = 'none';
}
window.sendOTP = function(){
  let phone = document.getElementById('phoneNumber').value;
  if(!phone.startsWith('+91')) phone = '+91' + phone;
  signInWithPhoneNumber(auth, phone, window.recaptchaVerifier).then((result) => {
    confirmationResult = result;
    document.getElementById('phoneDiv').style.display = 'none';
    document.getElementById('otpDiv').style.display = 'block';
  });
}
window.verifyOTP = function(){
  const code = document.getElementById('otpCode').value;
  confirmationResult.confirm(code).then((result) => {
    document.getElementById('loginText').innerText = 'Logout';
    closeLoginPopup();
  });
}
onAuthStateChanged(auth, (user) => {
  document.getElementById('loginText').innerText = user ? 'Logout' : 'Login';
});

// Admin Panel - Live Orders
window.showOrdersPanel = function(){
  document.getElementById('adminPanel').style.display = 'flex';
  onValue(ref(db, 'orders'), (snapshot) => {
    let html = '<table style="width:100%; font-size:12px;"><tr><th>Order ID</th><th>Product</th><th>Price</th><th>Status</th></tr>';
    snapshot.forEach(child => {
      const o = child.val();
      html += `<tr><td>${o.orderId}</td><td>${o.product}</td><td>₹${o.price}</td><td>${o.status}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('ordersList').innerHTML = html;
  });
}
window.closeAdminPanel = function(){
  document.getElementById('adminPanel').style.display = 'none';
}

window.showCart = () => {};
