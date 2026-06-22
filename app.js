// ========== IMPORT हमेशा ऊपर ==========
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

// ========== PRODUCT DATA - ये Add किया ==========
const products = [
  {id: 1, name: "Bevon Multivitamin 200ml", price: 85, cat: "Medicines", img: "bevon.jpg"},
  {id: 2, name: "Olay Night Cream 50g", price: 310, cat: "Personal Care", img: "olay.jpg"}
];

// ========== PRODUCT SYSTEM - FIXED ==========
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
        <button class="btn-cart" onclick="window.location='product${p.id}.html'">Add to Cart</button>
        <button class="btn-buy" onclick="window.location='product${p.id}.html'">Buy Now</button>
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

// ========== सिर्फ 1 बार Search + Filter ==========
window.searchProducts = function(){
  const val = document.getElementById('searchInput').value.toLowerCase().trim();
  if(val === '') {
    document.querySelectorAll('.product').forEach(p => p.style.display = 'block');
    return;
  }
  document.querySelectorAll('.product').forEach(p => {
    p.style.display = p.dataset.name.toLowerCase().includes(val) ? 'block' : 'none';
  });
}

window.filterCategory = function(category){
  document.querySelectorAll('.product').forEach(p => {
    p.style.display = (category === 'All' || p.dataset.category === category) ? 'block' : 'none';
  });
  toggleMenu();
}

// ========== Amazon Style Product Page - 404 FIX ==========
window.openAmazonStyle = function(img){
  const product = img.closest('.product');
  const id = product.dataset.id;
  window.location.href = 'product' + id + '.html';
}

window.closePopup = function(){
  document.getElementById('productPopup').style.display = 'none';
}

// ========== बाकी तेरा Code वैसा ही ==========
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

window.shareProduct = function(btn){
  const product = btn.closest('.product');
  const url = window.location.href + '#' + product.dataset.id;
  if(navigator.share){
    navigator.share({title: product.dataset.name, text: 'Check: ' + product.dataset.name, url: url});
  } else {
    navigator.clipboard.writeText(url);
  }
}

window.likeProduct = function(btn){
  const count = btn.querySelector('.likeCount');
  count.innerText = parseInt(count.innerText) + 1;
}

window.addComment = function(input){
  const product = input.closest('.product');
  const id = product.dataset.id;
  const text = input.value;
  if(text.trim() === '') return;
  push(ref(db, 'comments/' + id), {text: text, time: Date.now()});
  input.value = '';
}

document.querySelectorAll('.product').forEach(p => {
  const id = p.dataset.id;
  onValue(ref(db, 'comments/' + id), (snapshot) => {
    const div = document.getElementById('comments-' + id);
    if(div) {
      div.innerHTML = '';
      snapshot.forEach(child => {
        div.innerHTML += '<div>• ' + child.val().text + '</div>';
      });
    }
  });
});

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
