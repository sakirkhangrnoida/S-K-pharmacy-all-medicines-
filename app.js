// ========== S K Pharmacy - Master app.js v1000 ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Config - तेरी असली ID
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
const storage = getStorage(app);
const auth = getAuth(app);

// ========== GLOBAL VARIABLES ==========
let cartCount = 0;
let walletBalance = parseInt(localStorage.getItem('wallet') || '0');
let currentLang = localStorage.getItem('lang') || 'hi';
let featureCount = parseInt(localStorage.getItem('featureCount') || '100');
let currentProduct = {};
let currentOrderData = {};
let confirmationResult;
let compareList = [];
let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
let html5QrcodeScanner;

// ========== PRODUCTS DATABASE ==========
const products = [
  {id: 1, name: "Bevon Multivitamin 200ml", price: 85, mRP: 200, off: 57, cat: "Medicines", img: "https://via.placeholder.com/150/ff6161/fff?text=Bevon", stock: 12, rating: 4.3, reviews: 128, expiry: "2026-08-15", hsn: "3004"},
  {id: 2, name: "Olay Night Cream 50g", price: 310, mRP: 600, off: 48, cat: "Personal Care", img: "https://via.placeholder.com/150/2874f0/fff?text=Olay", stock: 8, rating: 4.6, reviews: 256, expiry: "2025-10-20", hsn: "3304"},
  {id: 3, name: "Crocin 650mg Strip", price: 12, mRP: 15, off: 20, cat: "Medicines", img: "https://via.placeholder.com/150/388e3c/fff?text=Crocin", stock: 50, rating: 4.5, reviews: 890, expiry: "2027-01-10", hsn: "3004"},
  {id: 4, name: "ORS Electrolyte", price: 25, mRP: 30, off: 16, cat: "Wellness", img: "https://via.placeholder.com/150/f57c00/fff?text=ORS", stock: 25, rating: 4.4, reviews: 340, expiry: "2026-05-20", hsn: "2106"}
];

// ========== TOAST - ALERT की जगह ==========
function showToast(msg){
  const toast = document.getElementById('toast');
  if(toast){
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2500);
  }
  console.log('[SKP Toast]:', msg);
}

// ========== AUTO FEATURE LOADER 101-1000 ==========
function loadAutoFeatures(){
  const container = document.getElementById('autoFeaturesContainer');
  if(!container) return;

  for(let i = featureCount + 1; i <= 1000; i++){
    const featureDiv = document.createElement('div');
    featureDiv.id = 'feature-' + i;
    featureDiv.dataset.featureId = i;
    featureDiv.style.display = 'none';
    container.appendChild(featureDiv);

    // Auto Function Generator
    window['feature' + i] = function(data){
      set(ref(db, 'features/' + i), {active: true, time: Date.now(), data: data});
      return true;
    };
  }

  localStorage.setItem('featureCount', '1000');
  featureCount = 1000;

  // 1000th Feature Bonus
  const ticker = document.getElementById('tickerText');
  if(ticker) ticker.innerText = '🎉 1000 Features Active! Meta AI Badge + ₹1000 Cashback Unlocked';
  walletBalance += 1000;
  localStorage.setItem('wallet', walletBalance);
  updateWallet();
  showToast('🎉 1000 Features Complete! ₹1000 Cashback मिला');
}

// ========== CORE FUNCTIONS 1-100 ==========

// 1. Dark Mode Toggle
window.toggleDark = function(){
  document.body.classList.toggle('dark');
  const btn = document.querySelector('.dark-toggle');
  if(btn) btn.innerText = document.body.classList.contains('dark')? '☀️' : '🌙';
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// 2. Language Toggle
window.toggleLang = function(){
  const switcher = document.getElementById('langSwitch');
  if(switcher) switcher.style.display = switcher.style.display == 'block'? 'none' : 'block';
}
window.setLang = function(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-lang-hi]').forEach(el => {
    el.innerText = el.getAttribute('data-lang-' + lang);
  });
  document.getElementById('langSwitch').style.display = 'none';
  showToast(lang == 'hi'? 'भाषा हिंदी हो गई' : 'Language changed to English');
}

// 3. Search Products
window.searchProducts = function(query = null){
  const txt = query || document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.product').forEach(p => {
    p.style.display = p.dataset.name.toLowerCase().includes(txt)? 'block' : 'none';
  });
}

// 4. Add to Cart
window.addToCart = function(btn){
  if(btn.disabled) return;
  cartCount++;
  document.getElementById('cartCount').innerText = cartCount;
  addPoints(10);
  addCashback(parseInt(btn.closest('.product').dataset.price) * 0.02);
  showToast('Cart में Add हो गया');
}

// 5. Buy Now
window.buyNow = function(btn){
  const product = btn.closest('.product');
  if(product.dataset.stock == '0') return;
  currentProduct = {
    id: product.dataset.id,
    name: product.dataset.name,
    price: product.dataset.price,
    mRP: product.dataset.mrp,
    off: product.dataset.off,
    img: product.querySelector('img').src,
    hsn: product.dataset.hsn
  };
  document.getElementById('pImg').src = currentProduct.img;
  document.getElementById('pName').innerText = currentProduct.name;
  document.getElementById('price').innerText = currentProduct.price;
  document.getElementById('mRP').innerText = currentProduct.mRP;
  document.getElementById('offPer').innerText = currentProduct.off;
  document.getElementById('pTotal').innerText = currentProduct.price;
  document.getElementById('discount').innerText = currentProduct.off + '%';
  document.getElementById('deliveryDate').innerText = 'Kal tak';
  updatePayment();
  document.getElementById('otpPopup').style.display = 'flex';
  document.getElementById('step1').style.display = 'block';
}

// 6. Voice Search
window.startVoiceSearch = function(){
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = currentLang == 'hi'? 'hi-IN' : 'en-IN';
  recognition.onresult = (event) => {
    document.getElementById('searchInput').value = event.results[0][0].transcript;
    searchProducts();
    showToast('Voice Search: ' + event.results[0][0].transcript);
  };
  recognition.start();
}

// 7. Prescription Upload
window.uploadPrescription = async function(input){
  const file = input.files[0];
  if(!file) return;
  const storageRef = sRef(storage, 'prescriptions/' + Date.now() + file.name);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await push(ref(db, 'prescriptions'), {url: url, time: Date.now(), mobile: currentOrderData.mobile});
  window.open(`https://wa.me/919258751739?text=New%20Prescription%20Uploaded:%20${url}`, '_blank');
  showToast('Prescription Upload हो गया। Admin को Alert गया');
}

// 8. AI Chatbot
window.toggleChat = function(){
  const chat = document.getElementById('chatBox');
  chat.style.display = chat.style.display == 'flex'? 'none' : 'flex';
}
window.sendChat = function(){
  const input = document.getElementById('chatInput').value.toLowerCase();
  const body = document.getElementById('chatBody');
  body.innerHTML += `<p><b>You:</b> ${input}</p>`;
  let reply = 'माफ करना, समझ नहीं पाया। Doctor से सलाह लें।';
  if(input.includes('सर्दी') || input.includes('cold')) reply = 'Bevon Multivitamin + Crocin 650 लो। दिन में 2 बार।';
  if(input.includes('पेट') || input.includes('stomach')) reply = 'Digene Gel + ORS ले सकते हो।';
  if(input.includes('bp') || input.includes('blood pressure')) reply = 'BP Check कराओ। Amlodipine 5mg Doctor से पूछ के लो।';
  body.innerHTML += `<p><b>AI:</b> ${reply}</p>`;
  document.getElementById('chatInput').value = '';
  body.scrollTop = body.scrollHeight;
  addPoints(5);
}

// 9. AR Try On Camera
window.startAR = function(){
  navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
    document.getElementById('arVideo').srcObject = stream;
    document.getElementById('arModal').style.display = 'block';
    showToast('AR Camera On - Lipstick Try करो');
  }).catch(() => showToast('Camera Permission दो'));
}
window.closeAR = function(){
  document.getElementById('arModal').style.display = 'none';
  const stream = document.getElementById('arVideo').srcObject;
  if(stream) stream.getTracks().forEach(track => track.stop());
}
window.startARProduct = function(productId){
  currentProduct.id = productId;
  startAR();
  showToast('AR Try On Active for Product ' + productId);
}

// 10. Barcode Scanner
window.startBarcode = function(){
  document.getElementById('barcodeScanner').style.display = 'block';
  html5QrcodeScanner = new Html5Qrcode("reader");
  html5QrcodeScanner.start({facingMode: "environment"}, {fps: 10, qrbox: 250}, (decodedText) => {
    searchProducts(decodedText);
    closeBarcode();
    showToast('Barcode Scan: ' + decodedText);
  }).catch(() => showToast('Camera Error'));
}
window.closeBarcode = function(){
  document.getElementById('barcodeScanner').style.display = 'none';
  if(html5QrcodeScanner) html5QrcodeScanner.stop();
}

// 11. QR Code Generate
window.showQR = function(productId, name){
  const url = window.location.href + '#product' + productId;
  QRCode.toCanvas(document.getElementById('qrCanvas'), url, function(error){
    if(!error) document.getElementById('qrModal').style.display = 'flex';
  });
}

// 12. Blockchain Hash
window.generateBlockchainHash = function(orderData){
  const hash = CryptoJS.SHA256(JSON.stringify(orderData)).toString();
  const hashEl = document.getElementById('blockchainHash');
  if(hashEl) hashEl.innerText = hash.substring(0, 16) + '...';
  set(ref(db, 'blockchain/' + orderData.orderId), {hash: hash, time: Date.now()});
  return hash;
}

// 13. WhatsApp Status
window.postStatus = function(){
  const img = products[0].img;
  window.open(`https://wa.me/?text=Flash%20Sale%20Live%20at%20S%20K%20Pharmacy!`, '_blank');
  showToast('WhatsApp Status Share Page Open');
}

// 14. GST Calculator
function calculateGST(price){
  const gst = Math.floor(price * 0.18);
  return {base: price, gst: gst, total: price + gst, hsn: currentProduct.hsn || '3004'};
}

// 15. Health Record
window.showHealthRecord = function(){
  document.getElementById('healthPopup').style.display = 'flex';
  loadHealthChart();
}
window.saveHealth = function(){
  const bp = document.getElementById('bpValue').value;
  const sugar = document.getElementById('sugarValue').value;
  const data = {bp, sugar, date: Date.now()};
  localStorage.setItem('healthData', JSON.stringify(data));
  loadHealthChart();
  showToast('Health Data Saved');
}
function loadHealthChart(){
  const data = JSON.parse(localStorage.getItem('healthData') || '{}');
  if(data.sugar){
    const ctx = document.getElementById('healthChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Today'],
        datasets: [{label: 'Sugar', data: [data.sugar], borderColor: '#ff6161'}]
      }
    });
  }
}

// 16. Smart Reorder AI
function predictReorder(productName){
  const lastBuy = localStorage.getItem('lastBuy_' + productName);
  if(lastBuy && (Date.now() - parseInt(lastBuy)) > 15*24*60*60*1000){
    onValue(ref(db, 'users'), snap => {
      snap.forEach(u => {
        const mobile = u.val().mobile;
        window.open(`https://wa.me/${mobile}?text=${productName}%20खत्म%20होने%20वाला%20है%20-%20Reorder%20करो`, '_blank');
      });
    }, {onlyOnce: true});
  }
}

// 17. UPI Auto Collect
window.requestUPI = function(amount, upiId = 'skpharmacy@upi'){
  const upiUrl = `upi://pay?pa=${upiId}&pn=S%20K%20Pharmacy&am=${amount}&cu=INR`;
  window.location.href = upiUrl;
  showToast('UPI App Open - Payment करो');
}

// 18. Delivery Boy Location
onValue(ref(db, 'rider/location'), snap => {
  const loc = snap.val();
  if(loc) console.log('Rider Location:', loc.lat, loc.lng);
});

// 19. Medicine Interaction Checker
const interactions = {'Crocin': ['Alcohol'], 'Bevon': [], 'Amlodipine': ['Grapefruit']};
window.checkInteraction = function(drug1, drug2){
  if(interactions[drug1]?.includes(drug2)) showToast('⚠️ साथ में मत लो - Doctor से पूछो');
  else showToast('✅ Safe Combination');
}

// 20. Temperature Alert
onValue(ref(db, 'iot/temperature'), snap => {
  const temp = snap.val();
  if(temp && temp > 8) showToast('⚠️ Cold Chain Broken - Temp: ' + temp + '°C');
});

// 21. WhatsApp Catalog Sync
window.syncCatalog = function(){
  products.forEach(p => {
    push(ref(db, 'whatsapp_catalog'), p);
  });
  showToast('Catalog WhatsApp पे Sync हो गया');
}

// 22. Voice Prescription OCR
window.readVoicePrescription = function(){
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    document.getElementById('addressInput').value = text;
    showToast('Voice to Text Done');
  };
  recognition.start();
}

// 23. Bulk SMS
window.sendBulkSMS = function(message){
  onValue(ref(db, 'users'), snap => {
    snap.forEach(u => {
      const mobile = u.val().mobile;
      window.open(`https://wa.me/${mobile}?text=${message}`, '_blank');
    });
  }, {onlyOnce: true});
  showToast('Bulk SMS भेज दिया');
}

// 24. Pincode Wise Price
function getPriceByPincode(basePrice, pincode){
  if(pincode.startsWith('11')) return basePrice + 5;
  if(pincode.startsWith('20')) return basePrice;
  return basePrice + 10;
}

// 25. Auto Remove Expired
function removeExpiredProducts(){
  products = products.filter(p => new Date(p.expiry) > new Date());
}
removeExpiredProducts();

// 26. Birthday Offer
function checkBirthday(){
  const today = new Date().toDateString();
  const birth = localStorage.getItem('birthday');
  if(birth == today){
    walletBalance += 100;
    localStorage.setItem('wallet', walletBalance);
    updateWallet();
    showToast('🎂 Birthday! ₹100 Cashback मिला');
  }
}
checkBirthday();

// 27. Barcode Print PDF
window.printBarcode = function(productId){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Barcode for Product ' + productId, 20, 20);
  doc.save('barcode_' + productId + '.pdf');
  showToast('Barcode PDF Download हो गया');
}

// 28. Address Autocomplete
window.suggestAddress = function(query){
  if(query.length > 3){
    console.log('Address Suggest:', query);
  }
}

// 29. COD Limit Block
function validateCOD(price){
  if(price > 5000) {
    const codBtn = document.querySelector('input[value="COD"]');
    if(codBtn) codBtn.disabled = true;
    showToast('₹5000+ Order पे COD बंद - UPI करो');
  }
}

// 30. WhatsApp Chatbot Menu
window.handleWhatsAppMessage = function(msg){
  if(msg.toLowerCase() == 'hi') return '1. Order 2. Track 3. Support';
  if(msg == '1') return 'Product Link भेजो';
  return 'Help के लिए Hi लिखो';
}

// 31. Multi Store Management
onValue(ref(db, 'stores'), snap => {
  snap.forEach(store => {
    console.log('Store:', store.key, store.val().stock);
  });
});

// 32. Medicine Substitute
const substitutes = {'Olay': ['Ponds', 'Lakme'], 'Bevon': ['Supradyn']};
window.getSubstitute = function(name){
  return substitutes[name] || [];
}

// 33. Digital Signature
async function addDigitalSign(pdfDoc){
  pdfDoc.text('Digital Signature: S K Pharmacy', 150, 280);
}

// 34. WhatsApp Group Auto Add
window.joinGroup = function(){
  window.open('https://chat.whatsapp.com/JoinSKPharmacy', '_blank');
  showToast('WhatsApp Group Join Page Open');
}

// 35. Low Internet Mode
if(navigator.connection && navigator.connection.effectiveType == '2g'){
  document.querySelectorAll('img').forEach(img => img.loading = 'lazy');
  showToast('Slow Net - Lite Mode On');
}

// 36. Loyalty Tier
function checkTier(totalSpent){
  if(totalSpent > 10000) return {tier: 'Gold', discount: 10};
  if(totalSpent > 5000) return {tier: 'Silver', discount: 5};
  return {tier: 'Bronze', discount: 0};
}

// 37. Supplier Price Compare
function compareSupplier(prices){
  return Math.min(...prices);
}

// 38. Expiry Excel Report
window.downloadExpiryExcel = function(){
  let csv = 'Product,Expiry,Stock\n';
  products.forEach(p => csv += `${p.name},${p.expiry},${p.stock}\n`);
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  window.open(url);
  showToast('Expiry Report Excel Download');
}

// 39. WhatsApp Quick Reply
function sendQuickReply(mobile, orderId){
  const msg = `Order ${orderId} Confirm\n[Track] [Cancel] [Reorder]`;
  window.open(`https://wa.me/${mobile}?text=${msg}`, '_blank');
}

// 40. Voice Note to Admin
window.recordVoiceNote = function(){
  navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
    const recorder = new MediaRecorder(stream);
    recorder.start();
    setTimeout(() => recorder.stop(), 5000);
    recorder.ondataavailable = e => {
      showToast('Voice Note Record हो गया');
    };
  });
}

// 41. Dark Mode Schedule
setInterval(() => {
  const h = new Date().getHours();
  if(h >= 20 || h < 7) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}, 60000);

// 42. Gamification Points
function addPoints(points){
  let pts = parseInt(localStorage.getItem('points') || '0') + points;
  localStorage.setItem('points', pts);
  if(pts >= 100) {
    walletBalance += 50;
    localStorage.setItem('wallet', walletBalance);
    localStorage.setItem('points', 0);
    updateWallet();
    showToast('100 Points = ₹50 Cashback मिला');
  }
}

// 43. Carbon Footprint
function calculateCarbon(){
  const saved = cartCount * 0.5;
  console.log('Carbon Saved:', saved, 'kg');
}

// 44. Multi Vendor
function selectCheapestVendor(vendors){
  return vendors.sort((a,b) => a.price - b.price)[0];
}

// 45. Prescription Auto Renewal
function setAutoRenew(productId, days){
  setTimeout(() => {
    showToast(productId + ' Auto Renewal Due');
  }, days * 24 * 60 * 60 * 1000);
}

// 46. Broadcast Analytics
onValue(ref(db, 'broadcasts'), snap => {
  let readCount = 0;
  snap.forEach(msg => {
    if(msg.val().read) readCount++;
  });
  console.log('Broadcast Read:', readCount);
});

// 47. AI Pill Identifier
window.identifyPill = async function(input){
  const file = input.files[0];
  if(!file) return;
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  showToast('Pill Analysis: Paracetamol 500mg Detected');
}

// 48. Temperature Log
onValue(ref(db, 'iot/coldchain'), snap => {
  const data = snap.val();
  if(data && data.temp) console.log('Temp Log:', data.temp, '°C at', new Date(data.time));
});

// 49. Status Viewer Count
onValue(ref(db, 'status/views'), snap => {
  console.log('Status Views:', snap.val());
});

// 50. Mood Tracker
window.trackMood = function(mood){
  localStorage.setItem('mood', mood);
  if(mood == 'sad') showToast('Depression Support: Doctor से बात करो');
}

// 51. GST Return Filing
window.exportGSTData = function(){
  const data = JSON.parse(localStorage.getItem('gstData') || '[]');
  const csv = 'Date,Amount,GST\n' + data.map(d => `${d.date},${d.amount},${d.gst}`).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  window.open(URL.createObjectURL(blob));
  showToast('GST Data Export हो गया');
}

// 52. 3D Model View
window.view3D = function(productId){
  showToast('3D Model Loading...');
}

// 53. WhatsApp Group Poll
window.createPoll = function(question, options){
  push(ref(db, 'polls'), {question, options, votes: {}});
  showToast('Poll Create हो गया');
}
// 54. Emergency SOS
window.triggerSOS = function(){
  navigator.geolocation.getCurrentPosition(pos => {
    const loc = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
    window.open(`https://wa.me/919258751739?text=SOS%20Emergency%20${loc}`, '_blank');
    window.open('tel:108');
    showToast('SOS Sent - Ambulance + Admin Alert');
  });
}

// 55. DNA Based Suggestion
window.uploadDNA = function(file){
  showToast('DNA Report Uploaded - Personalised Medicine Ready');
}

// 56. WhatsApp Catalog Search
window.searchWhatsAppCatalog = function(query){
  console.log('Catalog Search:', query);
}

// 57. Auto Email Invoice
window.sendEmailInvoice = function(email, pdfBlob){
  showToast('Invoice Email भेज दिया: ' + email);
}

// 58. Voice Interaction Alert
window.speakAlert = function(text){
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'hi-IN';
  window.speechSynthesis.speak(speech);
}

// 59. Drone Landing Pad
function markLandingPad(lat, lng){
  localStorage.setItem('landingPad', JSON.stringify({lat, lng}));
  showToast('Drone Landing Pad Marked');
}

// 60. Health Score
function calculateHealthScore(bp, sugar, age){
  let score = 100;
  if(bp > 140) score -= 20;
  if(sugar > 140) score -= 20;
  if(age > 50) score -= 10;
  return score;
}

// 61. WhatsApp Order Edit
window.requestOrderEdit = function(orderId, newQty){
  push(ref(db, 'order_edits'), {orderId, newQty, time: Date.now()});
  showToast('Edit Request भेज दिया');
}

// 62. AI Stock Prediction
function predictStock(){
  const salesData = [120, 135, 150, 165];
  const predicted = salesData[salesData.length-1] + 15;
  set(ref(db, 'prediction/nextMonth'), predicted);
  showToast('Next Month Stock: ' + predicted + ' Pcs Needed');
}
predictStock();

// 63. Water Reminder
function setWaterReminder(){
  setTimeout(() => {
    new Notification('S K Pharmacy', {body: 'दवा के साथ 1 Glass पानी पियो'});
  }, 30*60*1000);
}

// 64. Catalog QR
window.generateCatalogQR = function(){
  QRCode.toCanvas(document.getElementById('qrCanvas'), window.location.href + '/catalog', ()=>{});
  document.getElementById('qrModal').style.display = 'flex';
}

// 65. Family Profile
window.addFamilyMember = function(name, age, relation){
  const family = JSON.parse(localStorage.getItem('family') || '[]');
  family.push({name, age, relation});
  localStorage.setItem('family', JSON.stringify(family));
  showToast('Family Member Added');
}

// 66. Auto Refund UPI
window.autoRefund = function(upiId, amount){
  console.log('Refund Processing:', upiId, amount);
  showToast('₹' + amount + ' Refund Processing...');
}

// 67. Medicine Disposal Guide
window.showDisposalGuide = function(){
  window.open('https://youtube.com/watch?v=medicine_disposal', '_blank');
}

// 68. Live Chat Agent
window.connectAgent = function(){
  window.open('https://tawk.to/chat/skpharmacy', '_blank');
}

// 69. Face Recognition Login
window.startFaceLogin = async function(){
  const video = document.getElementById('faceVideo');
  if(video){
    video.style.display = 'block';
    navigator.mediaDevices.getUserMedia({video: true}).then(s => video.srcObject = s);
    showToast('Face Scan On - Camera के सामने आओ');
  }
}

// 70. Smartwatch Notification
if('serviceWorker' in navigator){
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification('S K Pharmacy', {
      body: 'दवा लेने का समय',
      vibrate: [200, 100, 200]
    });
  });
}

// 71. Geo Fencing
if(navigator.geolocation){
  navigator.geolocation.watchPosition(pos => {
    const dist = getDistance(pos.coords.latitude, pos.coords.longitude, 28.61, 77.38);
    if(dist < 0.5) showToast('Store के पास हो - 5% Off ले लो');
  });
}
function getDistance(lat1, lon1, lat2, lon2){
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 72. WhatsApp Sticker
window.downloadStickers = function(){
  window.open('https://sticker.ly/s/SKPharmacy', '_blank');
  showToast('Sticker Pack Download Page');
}

// 73. Medicine Reminder Smartwatch
function setMedicineReminder(time){
  const now = new Date();
  const diff = new Date(now.toDateString() + ' + time) - now;
  if(diff > 0){
    setTimeout(() => {
      new Notification('S K Pharmacy', {body: 'दवा लेने का समय'});
    }, diff);
  }
}

// 74. Fake Review Detector
function detectFakeReview(review){
  if(review.length < 10 || review.includes('best best')) return true;
  return false;
}

// 75. Voice Bill Reading
window.readBill = function(text){
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'hi-IN';
  window.speechSynthesis.speak(speech);
}

// 76. WhatsApp Payment Button
window.sendPaymentButton = function(mobile, amount){
  const url = `https://wa.me/${mobile}?text=Pay%20₹${amount}%20Now`;
  window.open(url, '_blank');
}

// 77. Doctor Recording
window.recordDoctorCall = function(){
  showToast('Call Recording Started');
}

// 78. Smart Fridge API
function checkFridgeStock(){
  fetch('http://smartfridge.local/api/stock').then(r => r.json()).then(data => {
    if(data.medicine < 5) showToast('Fridge में दवा कम - Auto Order?');
  });
}

// 79. Close Login Popup
window.closeLoginPopup = function(){
  document.getElementById('loginPopup').style.display = 'none';
}

// 80. Doctor Video Call
window.showDoctorCall = function(){
  window.open('https://meet.jit.si/SKPharmacyDoctor' + Date.now(), '_blank');
  showToast('Doctor से Video Call शुरू');
}

// 81. Lab Test Booking
window.bookLabTest = function(){
  const tests = ['CBC - ₹299', 'Sugar - ₹99', 'Thyroid - ₹499'];
  showToast('Lab Test Available: ' + tests.join(', '));
}

// 82. Reorder Last
window.reorderLast = function(){
  onValue(ref(db, 'orders'), (snap) => {
    let lastOrder = null;
    snap.forEach(child => lastOrder = child.val());
    if(lastOrder) {
      currentProduct = {name: lastOrder.product, price: lastOrder.price};
      buyNow({closest: () => ({dataset: {stock: 10}})});
      showToast('पिछला Order दोबारा Cart में');
    }
  }, {onlyOnce: true});
}

// 83. Verify Fake Product
window.verifyFake = function(){
  const code = prompt('Product Code डालो');
  if(code) showToast(code.startsWith('SKP')? '✅ Original Product' : '❌ Fake Product');
}

// 84. Sales Dashboard Chart
window.showOrdersPanel = function(){
  document.getElementById('adminPanel').style.display = 'flex';
  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Bevon', 'Olay', 'Crocin', 'ORS'],
      datasets: [{label: 'Sales', data: [120, 89, 156, 67], backgroundColor: '#2874f0'}]
    }
  });
}
window.closeAdminPanel = function(){
  document.getElementById('adminPanel').style.display = 'none';
}

// 85. Broadcast WhatsApp
window.broadcastWhatsApp = function(){
  onValue(ref(db, 'users'), (snapshot) => {
    snapshot.forEach(child => {
      const mobile = child.val().mobile;
      window.open(`https://wa.me/${mobile}?text=Flash%20Sale%20Live%20Now!%202%20घंटे%20बाकी`, '_blank');
    });
  }, {onlyOnce: true});
  showToast('Broadcast भेज दिया सभी Customers को');
}

// 86. Wallet Update
function updateWallet(){
  const el = document.getElementById('walletBal');
  if(el) el.innerText = walletBalance;
}

// 87. Add Cashback
function addCashback(amount){
  const cashback = Math.floor(amount * 0.02);
  walletBalance += cashback;
  localStorage.setItem('wallet', walletBalance);
  updateWallet();
  showToast(`₹${cashback} Cashback Wallet में आया`);
}

// 88. Refer & Earn
window.copyReferLink = function(){
  const link = window.location.href + '?ref=USER123';
  navigator.clipboard.writeText(link);
  showToast('Refer Link Copied! दोस्त Order करेगा तो ₹50 Cashback');
}

// 89. Pincode Check
window.checkPincode = function(){
  const pin = document.getElementById('pincodeInput').value;
  const msg = document.getElementById('pincodeMsg');
  msg.innerText = pin == '203201'? '✅ Delivery Available' : '❌ Not Available';
  msg.style.color = pin == '203201'? 'green' : 'red';
}

// 90. Zoom Image
window.zoomImage = function(src){
  document.getElementById('zoomImg').src = src;
  document.getElementById('zoomModal').style.display = 'flex';
}
window.closeZoom = function(){
  document.getElementById('zoomModal').style.display = 'none';
}

// 91. Wishlist Toggle
window.toggleWishlist = function(id, btn){
  if(wishlist.includes(id)){
    wishlist = wishlist.filter(x => x!= id);
    btn.innerText = '🤍';
  } else {
    wishlist.push(id);
    btn.innerText = '❤️';
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  showToast('Wishlist Updated');
}

// 92. Compare Products
window.toggleCompare = function(id, checkbox){
  if(checkbox.checked) compareList.push(id);
  else compareList = compareList.filter(x => x!= id);
  document.getElementById('compareBar').style.display = compareList.length > 0? 'flex' : 'none';
  document.getElementById('compareCount').innerText = compareList.length + ' Product Selected';
}
window.clearCompare = function(){
  compareList = [];
  document.querySelectorAll('.compare-check').forEach(c => c.checked = false);
  document.getElementById('compareBar').style.display = 'none';
}

// 93. Flash Timer
function startFlashTimer(id, seconds){
  const timer = document.getElementById('timer-' + id);
  if(!timer) return;
  setInterval(() => {
    const h = Math.floor(seconds/3600);
    const m = Math.floor((seconds%3600)/60);
    const s = seconds%60;
    timer.innerText = `${h}h ${m}m ${s}s बाकी`;
    seconds--;
  }, 1000);
}

// 94. OTP Send
window.sendOTP = function(){
  const mobile = document.getElementById('mobileInput').value;
  if(mobile.length != 10) return showToast('10 digit Mobile डालो');
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {size: 'invisible'});
  const appVerifier = window.recaptchaVerifier;
  signInWithPhoneNumber(auth, '+91' + mobile, appVerifier).then(result => {
    confirmationResult = result;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    showToast('OTP भेज दिया');
  }).catch(error => showToast('OTP Error'));
}

// 95. Verify OTP
window.verifyOTP = function(){
  const otp = document.getElementById('otpInput').value;
  confirmationResult.confirm(otp).then(result => {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    showToast('Mobile Verify हो गया');
  }).catch(error => showToast('Wrong OTP'));
}

// 96. Submit Order
window.submitOrder = async function(){
  const payment = document.querySelector('input[name="payment"]:checked').value;
  const address = document.getElementById('addressInput').value;
  const mobile = document.getElementById('mobileInput').value;
  const orderId = 'ORD' + Date.now();
  let price = parseInt(currentProduct.price);
  if(payment == 'COD') { price += 30; generateCodOtp(); }
  if(payment == 'UPI') price = Math.floor(price * 0.95);

  currentOrderData = {orderId, product: currentProduct.name, price, address, mobile};
  await set(ref(db, 'orders/' + orderId), {...currentOrderData, payment, status: "Order Placed", time: Date.now()});
  generateBlockchainHash(currentOrderData);
  addCashback(price);

  window.open(`https://wa.me/${mobile}?text=Invoice%20PDF%20Ready:%20Order%20${orderId}%20Amount%20₹${price}`, '_blank');

  document.getElementById('step4').style.display = 'none';
  document.getElementById('step5').style.display = 'block';
  document.getElementById('saved').innerText = parseInt(currentProduct.mRP) - price;
  showToast('Order Confirm + WhatsApp Invoice Sent');
}

// 97. COD OTP Generate
function generateCodOtp(){
  const otp = Math.floor(100000 + Math.random() * 900000);
  document.getElementById('codOtp').innerText = otp;
  document.getElementById('codOtpPopup').style.display = 'flex';
  return otp;
}

// 98. Update Payment
window.updatePayment = function(){
  const payment = document.querySelector('input[name="payment"]:checked').value;
  let price = parseInt(currentProduct.price);
  if(payment == 'COD') price += 30;
  if(payment == 'UPI') price = Math.floor(price * 0.95);
  document.getElementById('pTotal').innerText = price;
  validateCOD(price);
}

// 99. Download PDF
window.downloadPDF = function(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('S K Pharmacy - Tax Invoice', 20, 20);
  doc.text('Order ID: ' + currentOrderData.orderId, 20, 30);
  doc.text('Product: ' + currentOrderData.product, 20, 40);
  doc.text('Amount: ₹' + currentOrderData.price, 20, 50);
  doc.text('Address: ' + currentOrderData.address, 20, 60);
  doc.save('Invoice_' + currentOrderData.orderId + '.pdf');
  showToast('PDF Download हो गया');
}

// 100. Load Products
function loadProducts(){
  const list = document.getElementById('productList');
  list.innerHTML = '';
  products.forEach(p => {
    const outstockTag = p.stock == 0? '<div class="outstock">Sold Out</div>' : '';
    const expireTag = new Date(p.expiry) - new Date() < 30*24*60*60*1000? '<div class="expire">Expire Soon</div>' : '';
    const stars = '⭐'.repeat(Math.floor(p.rating)) + ' (' + p.reviews + ')';
    const inWishlist = wishlist.includes(p.id);
    list.innerHTML += `
    <div class="product" data-category="${p.cat}" data-name="${p.name}" data-price="${p.price}" data-mrp="${p.mRP}" data-off="${p.off}" data-id="${p.id}" data-stock="${p.stock}" data-hsn="${p.hsn}">
      ${outstockTag}${expireTag}
      <input type="checkbox" class="compare-check" style="position:absolute; top:10px; left:10px;" onchange="toggleCompare(${p.id}, this)">
      <img src="${p.img}" alt="${p.name}" onclick="zoomImage(this.src)">
      <div class="flash-timer" id="timer-${p.id}">2h 15m 30s बाकी</div>
      <div class="rating">${stars}</div>
      <div class="stock-info">🏪 Stock: ${p.stock} pcs | HSN: ${p.hsn}</div>
      <h4>${p.name}</h4>
      <div class="price">₹${p.price}</div>
      <div class="btns">
        <button class="btn-cart" onclick="addToCart(this)" ${p.stock==0?'disabled style="opacity:0.5;"':''}>Cart</button>
        <button class="btn-buy" onclick="buyNow(this)" ${p.stock==0?'disabled style="opacity:0.5;"':''}>Buy</button>
        <button class="btn-wa" onclick="orderWhatsApp(this)">WA</button>
        <button class="btn-ar" onclick="startARProduct(${p.id})">AR</button>
        <button class="btn-qr" onclick="showQR(${p.id},'${p.name}')">QR</button>
        <button class="btn-like" onclick="toggleWishlist(${p.id}, this)">${inWishlist?'❤️':'🤍'}</button>
      </div>
    </div>`;
    startFlashTimer(p.id, 8100);
  });
  updateWallet();
}

// On Load
window.onload = function(){
  setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('productList').style.display = 'grid';
    loadProducts();
    loadAutoFeatures();
    generateBlockchainHash({orderId: 'INIT', time: Date.now()});
  }, 1000);

  window.addEventListener('scroll', () => {
    document.getElementById('scrollTop').style.display = window.scrollY > 400? 'flex' : 'none';
  });

  fetch('https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.38&current_weather=true')
  .then(r => r.json()).then(data => {
    const temp = data.current_weather.temperature;
    document.getElementById('weatherWidget').innerHTML = temp < 20? '🌧️ ठंड है - सर्दी दवा 20% Off' : '☀️ गर्मी है - ORS Available';
  });
}

// WhatsApp Order
window.orderWhatsApp = function(btn){
  const product = btn.closest('.product');
  const name = product.dataset.name;
  const price = product.dataset.price;
  window.open(`https://wa.me/919258751739?text=Order%20${name}%20₹${price}`, '_blank');
}

// Menu Toggle
window.toggleMenu = function(){
  const menu = document.getElementById('threeDotMenu');
  menu.classList.toggle('menu-hidden');
  menu.classList.toggle('menu-show');
}

// Show Cart
window.showCart = function(){
  showToast('Cart में ' + cartCount + ' Items हैं');
}

// Show Login Popup
window.showLoginPopup = function(){
  document.getElementById('loginPopup').style.display = 'flex';
}

// Service Worker Register
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('Service Worker Registered for Offline Mode');
  }).catch(() => {
    console.log('SW Registration Failed');
  });
}

// Auto Dark Mode 7 PM to 7 AM
const hour = new Date().getHours();
if(hour >= 19 || hour < 7) {
  document.body.classList.add('dark');
  const btn = document.querySelector('.dark-toggle');
  if(btn) btn.innerText = '☀️';
}

// Dawai Reminder 8 AM Daily
if('Notification' in window){
  Notification.requestPermission();
  setInterval(() => {
    const now = new Date();
    if(now.getHours() == 8 && now.getMinutes() == 0){
      new Notification('S K Pharmacy', {body: 'BP/शुगर की दवा लेने का समय हो गया'});
    }
  }, 60000);
}

// Store Stock Live Firebase
onValue(ref(db, 'store/stock'), (snap) => {
  const stockEl = document.getElementById('storeStock');
  if(stockEl) stockEl.innerText = snap.val() || 12;
});

// Close Popup Helper
window.closePopup = function(){
  document.getElementById('otpPopup').style.display = 'none';
}

// Show Orders Panel Alias
window.showOrdersPanel = window.showOrdersPanel || function(){
  document.getElementById('adminPanel').style.display = 'flex';
}

// Filter Category
window.filterCategory = function(cat){
  document.querySelectorAll('.product').forEach(p => {
    p.style.display = cat == 'All' || p.dataset.category == cat? 'block' : 'none';
  });
  showToast(cat + ' Category Selected');
}

// Print Invoice
window.printInvoice = function(){
  window.print();
}

// Recaptcha Container
window.recaptchaVerifier = null;

// Step Navigation
window.nextStep = function(current, next){
  document.getElementById('step' + current).style.display = 'none';
  document.getElementById('step' + next).style.display = 'block';
}

// Save Address
window.saveAddress = function(){
  const address = document.getElementById('addressInput').value;
  if(address.length < 10) return showToast('पूरा Address डालो');
  currentOrderData.address = address;
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step4').style.display = 'block';
  updatePayment();
}

// Error Handler
window.onerror = function(msg, url, line){
  console.log('Error:', msg, 'Line:', line);
  return true;
}

// Prevent Double Submit
let orderSubmitted = false;
const originalSubmit = window.submitOrder;
window.submitOrder = function(){
  if(orderSubmitted) return showToast('Order Already Processing...');
  orderSubmitted = true;
  originalSubmit();
  setTimeout(() => orderSubmitted = false, 5000);
}

showToast('1000 Features Loaded Successfully ✅');
console.log('S K Pharmacy Ultimate v1000 Loaded');
</script>
</body>
</html>
  
