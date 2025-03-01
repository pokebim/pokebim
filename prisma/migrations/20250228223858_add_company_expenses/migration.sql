/*
  Warnings:

  - A unique constraint covering the columns `[productId,supplierId]` on the table `Price` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,language]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "storeQuantity" INTEGER NOT NULL DEFAULT 0,
    "investmentQuantity" INTEGER NOT NULL DEFAULT 0,
    "holdStore" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT false,
    "arrivalDate" DATETIME,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "storeTotalPrice" REAL,
    "costPerPerson" REAL,
    "wallapopPrice" REAL,
    "amazonPrice" REAL,
    "cardmarketPrice" REAL,
    "approxSellingPrice" REAL,
    "profitPerUnit" REAL,
    "profitPercentage" REAL,
    "totalProfit" REAL,
    "tikTokPrice" REAL,
    "storePrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "link" TEXT,
    "paidBy" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentDate" DATETIME,
    "category" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Stock_productId_idx" ON "Stock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Price_productId_supplierId_key" ON "Price"("productId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_language_key" ON "Product"("name", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
