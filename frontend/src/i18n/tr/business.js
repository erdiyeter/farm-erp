export const businessText = {
  Active: "Aktif",
  Actions: "İşlemler",
  adjustment: "düzeltme",
  Amount: "Tutar",
  "Are you sure you want to deactivate this inventory item?":
    "Bu ürünü pasifleştirmek istediğinize emin misiniz?",
  "Are you sure you want to delete this finance record?":
    "Bu finans kaydını silmek istediğinize emin misiniz?",
  "Active Items Stock Reference": "Aktif Ürün Stok Referansı",
  Back: "Geri",
  "Back to Inventory Item": "Ürüne Geri Dön",
  "Back to Inventory Items": "Ürünlere Geri Dön",
  Cancel: "İptal",
  Category: "Kategori",
  "Create and review income and expense records":
    "Gelir ve gider kayıtlarını oluştur ve incele",
  "Create and review inventory items":
    "Ürünleri oluştur ve incele",
  "Create and review stock movements":
    "Stok hareketlerini oluştur ve incele",
  "Create Finance Record": "Finans Kaydı Oluştur",
  "Create Inventory Item": "Ürün Oluştur",
  "Create Inventory Movement": "Stok Hareketi Oluştur",
  "Created At": "Oluşturulma Tarihi",
  "Current Quantity": "Güncel Miktar",
  Date: "Tarih",
  Deactivate: "Pasifleştir",
  "Deactivating...": "Pasifleştiriliyor...",
  Delete: "Sil",
  "Deleting...": "Siliniyor...",
  Description: "Açıklama",
  Edit: "Düzenle",
  "Edit Finance Record": "Finans Kaydını Düzenle",
  "Edit Inventory Item": "Ürünü Düzenle",
  "Error: Failed to load inventory item":
    "Hata: Ürün yüklenemedi",
  "Error: Failed to load inventory items":
    "Hata: Ürünler yüklenemedi",
  "Error: Failed to load inventory movements":
    "Hata: Stok hareketleri yüklenemedi",
  "Error: Failed to load inventory summary":
    "Hata: Stok özeti yüklenemedi",
  expense: "gider",
  "Failed to delete finance record.": "Finans kaydı silinemedi.",
  "Failed to load finance record.": "Finans kaydı yüklenemedi.",
  "Failed to update finance record.": "Finans kaydı güncellenemedi.",
  Finance: "Finans",
  "Finance record created successfully.": "Finans kaydı başarıyla oluşturuldu.",
  "Finance record updated successfully.": "Finans kaydı başarıyla güncellendi.",
  "Finance Record Detail": "Finans Kaydı Detayı",
  "Finance Records": "Finans Kayıtları",
  ID: "ID",
  in: "giriş",
  income: "gelir",
  "Inventory item created successfully.":
    "Ürün başarıyla oluşturuldu.",
  "Inventory item deactivated successfully.":
    "Ürün başarıyla pasifleştirildi.",
  "Inventory item updated successfully.":
    "Ürün başarıyla güncellendi.",
  "Inventory Item Detail": "Ürün Detayı",
  "Inventory Items": "Ürünler",
  "Inventory movement created successfully.":
    "Stok hareketi başarıyla oluşturuldu.",
  "Inventory Movements": "Stok Hareketleri",
  "Inventory summary and low stock overview":
    "Stok özeti ve düşük stok görünümü",
  Inventory: "Stok",
  "Is Active": "Aktif mi",
  Item: "Ürün",
  "Item ID": "Ürün ID",
  "Loading finance record...": "Finans kaydı yükleniyor...",
  "Loading finance records...": "Finans kayıtları yükleniyor...",
  "Loading inventory item...": "Ürün yükleniyor...",
  "Loading inventory items...": "Ürünler yükleniyor...",
  "Loading inventory movements...": "Stok hareketleri yükleniyor...",
  "Loading inventory summary...": "Stok özeti yükleniyor...",
  "Low Stock Items": "Düşük Stok Ürünleri",
  "Low stock": "Düşük stok",
  "Minimum Quantity": "Minimum Miktar",
  "Movement Date": "Hareket Tarihi",
  "Movement History": "Hareket Geçmişi",
  "Movement Type": "Hareket Tipi",
  Name: "Adı",
  No: "Hayır",
  "No active inventory items found.":
    "Aktif ürün bulunamadı.",
  "No finance records found.": "Finans kaydı bulunamadı.",
  "No inventory items found.": "Ürün bulunamadı.",
  "No inventory movements found.": "Stok hareketi bulunamadı.",
  "No low stock items.": "Düşük stok ürünü yok.",
  Notes: "Notlar",
  out: "çıkış",
  Quantity: "Miktar",
  "Return to Inventory Items": "Ürünlere Dön",
  Save: "Kaydet",
  "Saving...": "Kaydediliyor...",
  "Select item": "Ürün seç",
  "Stock Status": "Stok Durumu",
  "Total Active Items": "Toplam Aktif Ürün",
  "Total Stock Quantity": "Toplam Stok Miktarı",
  Type: "Tip",
  Unit: "Birim",
  "Unit Cost": "Birim Maliyet",
  "Updated At": "Güncellenme Tarihi",
  View: "Görüntüle",
  "View Inventory Items": "Ürünleri Görüntüle",
  "View Inventory Movements": "Stok Hareketlerini Görüntüle",
  Feed: "Yem",
  Medicine: "İlaç",
  Labor: "İşçilik",
  Other: "Diğer",
  Yes: "Evet",
};

export function tBusiness(key) {
  return businessText[key] || key;
}

export function tBusinessValue(value) {
  if (value === null || value === undefined || value === "") {
    return value;
  }
  return businessText[value] || value;
}
