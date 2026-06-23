// Products Auto Generate
const sampleProducts = [
  {id:1,name:'Razer Huntsman Keyboard',price:23652,img:'https://via.placeholder.com/200',rating:'4.5'},
  {id:2,name:'Pulsar Gaming Mouse',price:1270,img:'https://via.placeholder.com/200',rating:'4.2'},
  {id:3,name:'Allenware Mouse',price:3783,img:'https://via.placeholder.com/200',rating:'4.3'},
  {id:4,name:'TONOR Microphone',price:2999,img:'https://via.placeholder.com/200',rating:'4.5'}
];

function loadProducts(){
  const grid = document.getElementById('productList');
  sampleProducts.forEach(p => {
    grid.innerHTML += `
      <div class="product" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
        <img src="${p.img}" alt="${p.name}">
        <p>${p.name}</p>
        <p>⭐ ${p.rating} | 100+ bought</p>
        <h3>₹${p.price.toLocaleString()}</h3>
        <button onclick="addToCart(this)">Add to cart</button>
      </div>
    `;
  });
}

window.onload = function(){
  loadProducts();
  loadAutoFeatures();
  updateNewsTicker();
  updateWallet();
  showToast('S K Pharmacy Amazon Clone Ready ✅');
}

// All Menu Toggle
window.toggleAllMenu = function(){
  document.getElementById('allMenu').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}
window.closeAllMenu = function(){
  document.getElementById('allMenu').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}
