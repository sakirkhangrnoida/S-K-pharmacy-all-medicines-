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
