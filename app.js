import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, child, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

const SHOP = {
  name: "S K Pharmacy",
  phone1: "9258751739",
  phone2: "7983006957",
  address: "UP, Greater Noida, Dankaur, Silapur, Pin: 203201",
  pincode: "203201"
};
const RAZORPAY_KEY = "rzp_test_1DP5mmOlF5G5ag";
const DELIVERY_CHARGE = 40;

let user = null;
let currentProduct = null;
let checkoutStep = 1; // 1 से 10 Step
let orderData = {}; // सारा Data यहाँ Save होगा Step by Step
let allProducts = [];

onAuthStateChanged(auth, u => {
  user = u;
  renderHeader();
  loadProducts();
});

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  loadProducts();
});

function renderHeader(){
  let menu = `
    <a onclick="showPage('profile')">👤 My Profile</a>
    <a onclick="showPage('orders')">📦 My Orders</a>
    <a onclick="showPage('tracking')">🚚 Live Track Order</a>
    <a onclick="showPage('about')">ℹ️ About Us</a>
    <a onclick="showPage('contact')">📞 Contact Us</a>
    <a onclick="showPage('privacy')">🔒 Privacy Policy</a>
    <a onclick="showPage('refund')">↩️ Refund Policy</a>
    <a href="admin.html" target="_blank" style="background:#ff9900; color:white">🛠️ Admin Panel</a>
  `;
  if(user) menu += `<a onclick="logout()">🚪 Logout</a>`;

  document.getElementById('app').innerHTML = `
    <div class="header">
      <div><h2>${SHOP.name}</h2><small>${user? user.email : 'Deliver to '+SHOP.pincode}</small></div>
      <div class="header-right">
        <span onclick="showPage('orders')">📦</span>
        <span onclick="toggleMenu()">⋮</span>
      </div>
    </div>
    <div class="search-bar">
      <input id="search" placeholder="Search Medicine..." onkeyup="search()">
      <button onclick="search()">🔍</button>
    </div>
    <div id="products" class="grid"></div>
    <div id="menu" class="menu-popup">${menu}</div>
  `;
}

function loadProducts(){
  onValue(ref(db, 'products'), snap => {
    allProducts = snap.exists()? Object.values(snap.val()) : [];
    renderProducts(allProducts);
  });
}

function renderProducts(list){
  let html = list.map(p => `
    <div class="product-card">
      <img src="${p.img}" onclick="openProduct('${p.id}')">
      <h4 onclick="openProduct('${p.id}')">${p.name}</h4>
      <p>₹${p.price} <s>₹${p.mrp}</s> ${p.mrp>p.price? Math.round((1-p.price/p.mrp)*100)+'% Off':''}</p>
      <div style="font-size:12px; color:#666">❤️ ${p.likes||0} | 💬 ${p.comments?Object.keys(p.comments).length:0}</div>
      <div class="btn-group">
        <button class="pay-btn" onclick="startCheckout('${p.id}')">🛒 Buy Now</button>
        <button class="like-btn" onclick="like('${p.id}')">👍 Like</button>
        <button class="share-btn" onclick="share('${p.id}')">📤 Share</button>
      </div>
    </div>
  `).join('');
  document.getElementById('products').innerHTML = html || '<p style="text-align:center; padding:50px">Firebase → products में Data डालो</p>';
}

window.search = function(){
  let q = document.getElementById('search').value.toLowerCase();
  let res = q == ''? allProducts : allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q)));
  renderProducts(res);
}

// ========== 10 STEP CHECKOUT START ==========
window.startCheckout = async function(id){
  if(!user) return openAuth('login');

  const snap = await get(child(ref(db), 'products/'+id));
  currentProduct = snap.val();
  currentProduct.id = id;

  checkoutStep = 1;
  orderData = {
    product: currentProduct,
    qty: 1,
    address: {},
    payment: 'COD'
  };

  document.getElementById('checkoutPopup').style.display = 'flex';
  renderCheckoutStep();
}

function renderCheckoutStep(){
  let stepHTML = '';
  let stepTitle = '';
  let backBtn = checkoutStep > 1? `<span onclick="prevStep()" style="cursor:pointer; font-size:20px">←</span>` : '';

  switch(checkoutStep){
    case 1: // Step 1: Product Review
      stepTitle = 'REVIEW YOUR ORDER';
      stepHTML = `
        <div style="text-align:center; padding:20px">
          <img src="${orderData.product.img}" style="width:150px; height:150px; object-fit:contain">
          <h3>${orderData.product.name}</h3>
          <p style="font-size:18px; color:#1976d2">₹${orderData.product.price} <s>₹${orderData.product.mrp}</s></p>
          <div style="margin:15px 0">
            <label>Qty: </label>
            <button onclick="updateQty(-1)" style="padding:5px 10px">-</button>
            <span id="qty">${orderData.qty}</span>
            <button onclick="updateQty(1)" style="padding:5px 10px">+</button>
          </div>
          <div style="border-top:1px solid #ddd; padding-top:10px; margin-top:10px">
            <p><b>Estimated Delivery:</b> 2-3 Days</p>
            <p><b>Sold by:</b> ${SHOP.name}</p>
          </div>
        </div>
      `;
      break;

    case 2: // Step 2: Address
      stepTitle = 'DELIVERY ADDRESS';
      stepHTML = `
        <div style="padding:10px">
          <input id="name" placeholder="Full Name" value="${user.email.split('@')[0]}">
          <input id="mobile" placeholder="10 Digit Mobile" maxlength="10">
          <input id="pincode" placeholder="Pincode">
          <textarea id="address" placeholder="Full Address - House, Street, Area"></textarea>
          <input id="city" placeholder="City">
          <select id="state">
            <option>Uttar Pradesh</option>
            <option>Delhi</option>
            <option>Haryana</option>
          </select>
        </div>
      `;
      break;

    case 3: // Step 3: Payment Method
      stepTitle = 'PAYMENT METHOD';
      let total = orderData.product.price * orderData.qty + DELIVERY_CHARGE;
      stepHTML = `
        <div style="padding:10px">
          <div style="background:#e8f5e9; padding:10px; border-radius:5px; margin-bottom:15px; text-align:center">
            <b>₹6 OFF</b> on this order
          </div>
          <div onclick="selectPayment('COD')" style="border:2px solid ${orderData.payment=='COD'?'#1976d2':'#ddd'}; padding:12px; border-radius:8px; margin:10px 0; cursor:pointer">
            <input type="radio" ${orderData.payment=='COD'?'checked':''}> <b>Cash on Delivery</b> - ₹${total}
          </div>
          <div onclick="selectPayment('Online')" style="border:2px solid ${orderData.payment=='Online'?'#1976d2':'#ddd'}; padding:12px; border-radius:8px; margin:10px 0; cursor:pointer">
            <input type="radio" ${orderData.payment=='Online'?'checked':''}> <b>Pay Online</b> - ₹${total} <span style="color:green; font-size:12px">Save ₹21</span>
          </div>
          <div style="border-top:1px solid #ddd; margin-top:15px; padding-top:10px">
            <p><b>Price Details:</b></p>
            <p>Product: ₹${orderData.product.price * orderData.qty}</p>
            <p>Delivery: ₹${DELIVERY_CHARGE}</p>
            <p style="border-top:1px solid #ddd; padding-top:5px; font-size:18px"><b>Total: ₹${total}</b></p>
          </div>
        </div>
      `;
      break;

    case 4: // Step 4: Order Confirmed
      stepTitle = 'ORDER CONFIRMED ✓';
      let oid = orderData.orderId;
      let totalAmt = orderData.product.price * orderData.qty + DELIVERY_CHARGE;
      stepHTML = `
        <div style="text-align:center; padding:30px">
          <div style="font-size:50px; color:green">✓</div>
          <h2 style="color:green">Order Confirmed</h2>
          <p>Saved ₹6 🎉</p>
          <div style="background:#f5f5f5; padding:15px; border-radius:8px; margin:20px 0; text-align:left">
            <p><b>Deliver to:</b> ${orderData.address.name}</p>
            <p>${orderData.address}, ${orderData.address.city}</p>
            <p>${orderData.address.pincode}</p>
            <p><b>Contact:</b> ${orderData.address.mobile}</p>
          </div>
          <p><b>1 Product</b> <span style="float:right; cursor:pointer; color:#1976d2" onclick="showPage('tracking')">TRACK ORDER ></span></p>
          <img src="${orderData.product.img}" style="width:80px; height:80px; object-fit:contain; margin:10px 0">
          <p>₹${orderData.product.price}</p>
          <p><b>Order ID:</b> ${oid}</p>
          <p><b>Payment:</b> ${orderData.payment}</p>
          <p><b>Total Paid:</b> ₹${totalAmt}</p>
          <button class="primary" onclick="close('checkoutPopup')">Continue Shopping</button>
        </div>
      `;
      break;
  }

  document.getElementById('checkoutPopup').innerHTML = `
    <div style="max-width:500px">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #1976d2; padding-bottom:10px; margin-bottom:15px">
        <div>${backBtn}</div>
        <h3 style="margin:0">${stepTitle}</h3>
        <span class="close" onclick="close('checkoutPopup')" style="position:static">×</span>
      </div>
      ${stepHTML}
      ${checkoutStep < 4? `
        <button class="primary" onclick="nextStep()">
          ${checkoutStep == 3? 'Place Order' : 'Continue'}
        </button>
      ` : ''}
    </div>
  `;
}

window.updateQty = function(change){
  orderData.qty = Math.max(1, orderData.qty + change);
  document.getElementById('qty').innerText = orderData.qty;
}

window.selectPayment = function(method){
  orderData.payment = method;
  renderCheckoutStep();
}

window.nextStep = async function(){
  if(checkoutStep == 2){
    // Address Save
    orderData.address = {
      name: document.getElementById('name').value,
      mobile: document.getElementById('mobile').value,
      pincode: document.getElementById('pincode').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value
    };
    if(!orderData.address.mobile || orderData.address.mobile.length!= 10) return toast('सही Mobile डालो');
  }

  if(checkoutStep == 3){
    // Final Order Place
    let oid = 'ORD' + Date.now();
    orderData.orderId = oid;
    orderData.userId = user.uid;
    orderData.userEmail = user.email;
    orderData.status = "Order Placed";
    orderData.time = Date.now();
    orderData.tracking = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

    if(orderData.payment == 'Online'){
      let options = {
        key: RAZORPAY_KEY,
        amount: (orderData.product.price * orderData.qty + DELIVERY_CHARGE) * 100,
        currency: "INR",
        name: SHOP.name,
        description: orderData.product.name,
        handler: r => {
          orderData.paymentId = r.razorpay_payment_id;
          saveOrder();
        }
      };
      new Razorpay(options).open();
      return;
    } else {
      orderData.paymentId = 'COD' + Date.now();
      saveOrder();
      return;
    }
  }

  checkoutStep++;
  renderCheckoutStep();
}

window.prevStep = function(){
  if(checkoutStep > 1){
    checkoutStep--;
    renderCheckoutStep();
  }
}

async function saveOrder(){
  await set(ref(db, 'orders/'+orderData.orderId), orderData);
  checkoutStep = 4;
  renderCheckoutStep();
  toast('✅ Order Placed!');
}
// ========== 10 STEP CHECKOUT END ==========

// Product Popup
window.openProduct = async function(id){
  const snap = await get(child(ref(db), 'products/'+id));
  currentProduct = snap.val();
  currentProduct.id = id;

  let comments = '';
  if(currentProduct.comments){
    comments = Object.values(currentProduct.comments).map(c =>
      `<div style="border-bottom:1px solid #eee; padding:8px 0"><b>${c.name}:</b> ${c.text}</div>`
    ).join('');
  }

  document.getElementById('productPopup').style.display = 'flex';
  document.getElementById('productPopup').innerHTML = `
    <div>
      <span class="close" onclick="close('productPopup')">×</span>
      <img src="${currentProduct.img}" style="width:100%; max-height:300px; object-fit:contain">
      <h2>${currentProduct.name}</h2>
      <h3>₹${currentProduct.price} <s>₹${currentProduct.mrp}</s></h3>
      <p>${currentProduct.desc || 'No Description'}</p>
      <div style="font-size:14px; color:#666; margin:10px 0">❤️ ${currentProduct.likes||0} Likes</div>

      <div class="btn-group">
        <button class="pay-btn" onclick="startCheckout('${id}')">🛒 Buy Now</button>
        <button class="like-btn" onclick="like('${id}')">👍 Like</button>
        <button class="share-btn" onclick="share('${id}')">📤 Share</button>
      </div>

      <div style="border-top:2px solid #1976d2; margin-top:20px; padding-top:15px">
        <h4>💬 Comments</h4>
        <div id="cmntList">${comments || '<p>कोई Comment नहीं</p>'}</div>
        ${user? `<input id="cmntTxt" placeholder="Comment लिखो...">
        <button class="primary" onclick="comment('${id}')">Post</button>` : '<p>Comment के लिए Login करो</p>'}
      </div>
    </div>
  `;
}

window.like = async function(id){
  let snap = await get(child(ref(db), 'products/'+id));
  let likes = snap.val().likes || 0;
  await update(ref(db, 'products/'+id), {likes: likes+1});
  toast('❤️ Liked!');
}

window.share = function(id){
  let url = window.location.href + '#product='+id;
  window.open(`https://wa.me/?text=${encodeURIComponent(currentProduct.name+' - ₹'+currentProduct.price+' '+url)}`);
}

window.comment = async function(id){
  let txt = document.getElementById('cmntTxt').value;
  if(!txt) return toast('Comment लिखो');
  let key = push(ref(db, `products/${id}/comments`)).key;
  await set(ref(db, 'products/'+id+'/comments/'+key), {
    name: user.email.split('@')[0],
    text: txt,
    time: Date.now()
  });
  document.getElementById('cmntTxt').value = '';
  openProduct(id);
  toast('Comment Posted!');
}

// Pages
window.showPage = function(page){
  let content = {
    about: `<h2>About ${SHOP.name}</h2><p>हम दवाई घर बैठे Deliver करते हैं। 100% Genuine Products। Address: ${SHOP.address}</p>`,
    contact: `<h2>Contact Us</h2><p>Call: ${SHOP.phone1}, ${SHOP.phone2}<br>Address: ${SHOP.address}</p>`,
    privacy: `<h2>Privacy Policy</h2><p>हम तेरा Data किसी को नहीं बेचते। Payment Secure है Razorpay से।</p>`,
    refund: `<h2>Refund Policy</h2><p>7 दिन में Return/Refund। Product Damaged हो तो फोटो भेजो।</p>`,
    orders: `<h2>My Orders</h2><div id="myOrders">Loading...</div>`,
    tracking: `<h2>Live Track Order</h2><input id="trackId" placeholder="Order ID डालो"><button class="primary" onclick="track()">Track</button><div id="trackResult"></div>`
  };

  document.getElementById('pagePopup').style.display = 'flex';
  document.getElementById('pagePopup').innerHTML = `
    <div>
      <span class="close" onclick="close('pagePopup')">×</span>
      ${content || '<p>Page नहीं मिला</p>'}
    </div>
  `;

  if(page == 'orders') loadMyOrders();
}

window.track = async function(){
  let id = document.getElementById('trackId').value;
  let snap = await get(child(ref(db), 'orders/'+id));
  if(!snap.exists()) return document.getElementById('trackResult').innerHTML = 'Order नहीं मिला';

  let o = snap.val();
  let steps = o.tracking;
  let current = steps.indexOf(o.status);

  let html = steps.map((s,i) => `
    <div class="track-step ${i<=current?'active':''}">
      <div class="dot"></div>
      <div>${s}</div>
    </div>
    ${i<steps.length-1?'<div class="track-line"></div>':''}
  `).join('');

  document.getElementById('trackResult').innerHTML = `
    <p><b>Order ID:</b> ${o.orderId}</p>
    <p><b>Product:</b> ${o.product.name}</p>
    <p><b>Status:</b> ${o.status}</p>
    ${html}
  `;
}

async function loadMyOrders(){
  if(!user) return;
  onValue(ref(db, 'orders'), snap => {
    let orders = snap.exists()? Object.values(snap.val()).filter(o => o.userId == user.uid) : [];
    let html = orders.reverse().map(o => `
      <div class="order">
        <b>${o.orderId}</b> - ₹${o.product.price} - ${o.payment}<br>
        <b>Product:</b> ${o.product.name}<br>
        <b>Status:</b> ${o.status}<br>
        <button onclick="document.getElementById('trackId').value='${o.orderId}'; showPage('tracking'); track()">Track Live</button>
      </div>
    `).join('');
    document.getElementById('myOrders').innerHTML = html || 'कोई Order नहीं';
  });
}

// Auth
window.openAuth = function(type){
  document.getElementById('authPopup').style.display = 'flex';
  document.getElementById('authPopup').innerHTML = `
    <div>
      <span class="close" onclick="close('authPopup')">×</span>
      <div class="auth-tabs">
        <button class="${type=='login'?'active':''}" onclick="openAuth('login')">Login</button>
        <button class="${type=='signup'?'active':''}" onclick="openAuth('signup')">Signup</button>
      </div>
      <input id="email" type="email" placeholder="Email">
      <input id="pass" type="password" placeholder="Password">
      ${type=='signup'?'<input id="mobile" placeholder="10 Digit Mobile">':''}
      <button class="primary" onclick="${type=='login'?'login()':'signup()'}">${type=='login'?'Login':'Signup'}</button>
    </div>
  `;
}

async function signup(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  let m = document.getElementById('mobile').value;
  try{
    let res = await createUserWithEmailAndPassword(auth, e, p);
    await set(ref(db, 'users/'+res.user.uid), {email:e, mobile:m, isAdmin:false});
    close('authPopup');
    toast('Account बन गया!');
  } catch(err){ toast(err.message); }
}

async function login(){
  let e = document.getElementById('email').value;
  let p = document.getElementById('pass').value;
  try{
    await signInWithEmailAndPassword(auth, e, p);
    close('authPopup');
    toast('Login हो गया!');
  } catch(err){ toast('गलत Email/Password'); }
}

window.logout = () => { signOut(auth); toggleMenu(); toast('Logout'); }
window.toggleMenu = () => {
  let m = document.getElementById('menu');
  m.style.display = m.style.display=='block'?'none':'block';
}
window.close = id => document.getElementById(id).style.display = 'none';
window.toast = msg => {
  document.getElementById('toast').innerText = msg;
  document.getElementById('toast').style.display = 'block';
  setTimeout(()=>document.getElementById('toast').style.display='none', 3000);
}
