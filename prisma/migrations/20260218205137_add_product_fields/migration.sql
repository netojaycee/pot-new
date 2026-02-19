-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deliveryInfo" JSONB,
ADD COLUMN     "perfectFor" TEXT[],
ADD COLUMN     "whatIncluded" TEXT[],
ADD COLUMN     "whyChoose" TEXT[];
