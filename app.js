// Firebase Setup - तेरी ID लगी हुई
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

let cartCount = 0;

// 3 Dot Menu Auto Toggle
window.toggleMenu = function(){
  document.getElementById('threeDotMenu').classList.toggle('menu-hidden');
  document.getElementById('threeDotMenu').classList.toggle('menu-show');
}

// बाहर Click = Auto Close
document.addEventListener('click', function(e){
  const menu = document.getElementById('threeDotMenu');
  const btn = document.querySelector('.menu-btn');
  if(menu && !menu.contains(e.target) && !btn.contains(e.target)){
    menu.classList.add('menu-hidden');
    menu.classList.remove('menu-show');
  }
});

// Category Filter - All Fixed
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
  const product = btn.closest('.product');
  console.log('Added:', product.dataset.name);
}

// Buy Now - Firebase में Order Save
window.buyNow = async function(btn){
  const product = btn.closest('.product');
  const currentProduct = product.dataset.name;
  const currentPrice = parseInt(product.dataset.price);
  const currentQty = 1;
  const currentMobile = "9258751739"; // तेरा नंबर डिफॉल्ट
  const total = currentPrice * currentQty;
  const orderId = 'ORD' + Date.now();
  
  // Firebase में Save - Admin Dashboard के लिए
  await set(ref(db, 'orders/' + orderId), {
    orderId: orderId,
    product: currentProduct,
    price: currentPrice,
    qty: currentQty,
    mobile: currentMobile,
    address: "COD Order - Greater Noida 203201",
    payment: "COD",
    status: "Order Placed",
    total: total,
    time: Date.now()
  });
  
  console.log('Order Saved:', orderId);
}

// Amazon जैसा Product Page Open
window.openProduct = function(img){
  const product = img.closest('.product');
  console.log('Open Product:', product.dataset.name);
}

// Empty Functions - Link के लिए
window.showLogin = () => {};
window.showMyAccount = () => {};
window.showOrders = () => {};
window.trackOrder = () => {};
window.showPrime = () => {};
window.showCart = () => {};
