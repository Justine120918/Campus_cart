let users = JSON.parse(localStorage.getItem("users")) || [];
let products = JSON.parse(localStorage.getItem("products")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

let cart = [];
let tab = "shop";

render();

function getCartKey(){
    return "cart_" + currentUser.email;
}

function loadCart(){
    cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
}

function saveCart(){
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

/* RENDER */
function render(){
    fade(() => {
        currentUser ? (loadCart(), appPage()) : loginPage();
    });
}

function fade(cb){
    let app = document.getElementById("app");
    if(!app) return;

    app.style.opacity = "0";

    setTimeout(() => {
        cb();
        app.style.opacity = "1";
        app.style.transition = "0.4s ease";
    }, 120);
}

/* LOGIN */
function loginPage(){
    document.getElementById("app").innerHTML=`
    <div class="center">
        <div class="card">
            <h2>Campus-Cart Login</h2>

            <input id="email" placeholder="Email">
            <input id="pass" type="password" placeholder="Password">

            <button onclick="login()">Login</button>

            <p onclick="registerPage()" style="cursor:pointer;color:#4f46e5;margin-top:10px;">
                Create account
            </p>
        </div>
    </div>`;
}

/* REGISTER */
function registerPage(){
    document.getElementById("app").innerHTML=`
    <div class="center">
        <div class="card">
            <h2>Create Account</h2>

            <input id="name" placeholder="Full Name">
            <input id="email" placeholder="Email">
            <input id="pass" type="password" placeholder="Password">

            <button onclick="register()">Register</button>

            <p onclick="loginPage()" style="cursor:pointer;color:#4f46e5;margin-top:10px;">
                Back
            </p>
        </div>
    </div>`;
}

/* APP */
function appPage(){
    document.getElementById("app").innerHTML=`
    <div class="header">
        <div class="brand">Campus-Cart</div>

        <div style="display:flex;gap:10px;">
            <button onclick="switchTab('shop')">Shop</button>
            <button onclick="switchTab('add')">Add</button>
            <button onclick="switchTab('cart')">Cart (${cart.length})</button>
            <button onclick="logout()">Logout</button>
        </div>
    </div>

    <div class="hero">
        <h1>Campus Marketplace</h1>
        <p>Buy, Sell, and Order inside your school</p>
    </div>

    <div id="content"></div>`;

    renderTab();
}

function switchTab(t){
    tab = t;
    renderTab();
}

/* TAB */
function renderTab(){
    let content = document.getElementById("content");

    if(tab === "shop"){
        content.innerHTML = `<div class="grid" id="list"></div>`;
        showProducts();
    }

    if(tab === "add"){
        content.innerHTML = `
        <div class="center">
            <div class="card">
                <h3>Add Product</h3>

                <input id="pname" placeholder="Product Name">
                <input id="price" placeholder="Price">
                <input id="stock" placeholder="Stock">
                <input type="file" id="img">

                <button onclick="addProduct()">Add Product</button>

                <button onclick="switchTab('shop')" style="margin-top:10px;background:#ddd;color:#333;">
                    ← Back
                </button>
            </div>
        </div>`;
    }

    if(tab === "cart"){
        showCart();
    }
}

/* REGISTER */
function register(){
    let name=document.getElementById("name").value.trim();
    let email=document.getElementById("email").value.trim();
    let pass=document.getElementById("pass").value.trim();

    if(!name||!email||!pass){
        toast("Fill all fields");
        return;
    }

    users.push({name,email,pass});
    localStorage.setItem("users",JSON.stringify(users));

    toast("Account created");
    setTimeout(loginPage,500);
}

/* LOGIN */
function login(){
    let email=document.getElementById("email").value.trim();
    let pass=document.getElementById("pass").value.trim();

    let user = users.find(u=>u.email===email && u.pass===pass);

    if(!user){
        toast("Invalid login");
        return;
    }

    currentUser = user;
    localStorage.setItem("currentUser",JSON.stringify(user));

    render();
}

/* LOGOUT */
function logout(){
    currentUser=null;
    localStorage.removeItem("currentUser");
    render();
}

/* ADD PRODUCT */
function addProduct(){
    let name=document.getElementById("pname").value.trim();
    let price=document.getElementById("price").value.trim();
    let stock=document.getElementById("stock").value.trim();
    let file=document.getElementById("img").files[0];

    if(!name||!price||!stock||!file){
        toast("Complete all fields");
        return;
    }

    let reader=new FileReader();

    reader.onload=()=>{
        products.unshift({
            id: Date.now(),
            name,
            price,
            stock:Number(stock),
            image:reader.result,
            seller:currentUser.name
        });

        localStorage.setItem("products",JSON.stringify(products));

        toast("Product added");
        switchTab("shop");
    };

    reader.readAsDataURL(file);
}

/* SHOW PRODUCTS (AUTO REMOVE IF 0 STOCK) */
function showProducts(){
    let list=document.getElementById("list");
    list.innerHTML="";

    products = products.filter(p => p.stock > 0);
    localStorage.setItem("products",JSON.stringify(products));

    if(products.length===0){
        list.innerHTML=`<p style="color:white;text-align:center;">No products yet</p>`;
        return;
    }

    products.forEach(p=>{
        list.innerHTML+=`
        <div class="product">
            <img src="${p.image}">

            <h3>${p.name}</h3>
            <p>PHP ${p.price}</p>

            <small>Stock: ${p.stock}</small>
            <small>Seller: ${p.seller}</small>

            <button onclick="addToCart(${p.id})">
                Add to Cart
            </button>
        </div>`;
    });
}

/* ADD TO CART + STOCK REDUCE */
function addToCart(id){

    let product = products.find(p=>p.id===id);

    if(!product || product.stock <= 0){
        toast("Out of stock");
        return;
    }

    product.stock--;

    if(product.stock === 0){
        products = products.filter(p=>p.stock > 0);
    }

    cart.push(product);

    saveCart();
    localStorage.setItem("products",JSON.stringify(products));

    toast("Added to cart");
    render();
}

/* CART */
function showCart(){
    let content=document.getElementById("content");

    if(cart.length===0){
        content.innerHTML=`
        <div class="center">
            <div class="card">
                <h3>Your cart is empty</h3>
                <button onclick="switchTab('shop')">← Back</button>
            </div>
        </div>`;
        return;
    }

    let total = cart.reduce((a,b)=>a+Number(b.price),0);

    content.innerHTML=`
    <div class="center">
        <div class="card">

            <h3>Your Cart</h3>

            ${cart.map(c=>`
                <div style="display:flex;gap:10px;align-items:center;margin:10px 0;">
                    <img src="${c.image}" style="width:50px;height:50px;border-radius:8px;">
                    <div>${c.name} - PHP ${c.price}</div>
                </div>
            `).join("")}

            <hr>

            <h3>Total: PHP ${total}</h3>

            <input id="cname" placeholder="Full Name">
            <input id="caddress" placeholder="Address">
            <input id="cphone" placeholder="Phone">

            <button onclick="checkout()">Buy Now</button>

            <button onclick="switchTab('shop')" style="margin-top:10px;background:#ddd;color:#333;">
                ← Back
            </button>

        </div>
    </div>`;
}

/* CHECKOUT */
function checkout(){
    let name=document.getElementById("cname").value.trim();
    let address=document.getElementById("caddress").value.trim();
    let phone=document.getElementById("cphone").value.trim();

    if(!name||!address||!phone){
        toast("Fill all info");
        return;
    }

    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders.push({
        buyer:name,
        address,
        phone,
        items:cart,
        total:cart.reduce((a,b)=>a+Number(b.price),0),
        date:new Date().toLocaleString()
    });

    localStorage.setItem("orders",JSON.stringify(orders));

    cart=[];
    saveCart();

    toast("Order placed!");
    render();
}

/* TOAST */
function toast(msg){
    let old=document.querySelector(".toast");
    if(old) old.remove();

    let div=document.createElement("div");
    div.className="toast";
    div.innerText=msg;

    document.body.appendChild(div);

    setTimeout(()=>div.style.opacity="0",1400);
    setTimeout(()=>div.remove(),2000);
}