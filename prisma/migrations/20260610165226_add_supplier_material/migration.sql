-- CreateTable
CREATE TABLE "SupplierMaterial" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SupplierMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierMaterial_supplierId_rawMaterialId_key" ON "SupplierMaterial"("supplierId", "rawMaterialId");

-- AddForeignKey
ALTER TABLE "SupplierMaterial" ADD CONSTRAINT "SupplierMaterial_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaterial" ADD CONSTRAINT "SupplierMaterial_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
