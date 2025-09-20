// src/lib/products.js

const PRODUCTS_KEY = 'products:v1';

// Data produk default saat aplikasi dijalankan pertama kali
function seedDefaultProducts() {
  const defaults = [
    { id: 'prod-lpg-3kg', name: 'LPG 3kg', price: 16000 },
    // Tambahkan produk lain di sini jika ada
  ];
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaults));
  return defaults;
}

// Mengambil semua produk dari localStorage
export function getProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : seedDefaultProducts();
  } catch {
    return [];
  }
}

// Mengubah harga produk berdasarkan ID-nya
export function updateProductPrice(productId, newPrice) {
  if (typeof newPrice !== 'number' || newPrice < 0) {
    return { ok: false, error: 'Harga tidak valid' };
  }
  
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return { ok: false, error: 'Produk tidak ditemukan' };
  }

  products[productIndex].price = newPrice;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return { ok: true, data: products[productIndex] };
}