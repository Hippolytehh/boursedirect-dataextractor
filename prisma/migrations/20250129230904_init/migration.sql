-- CreateTable
CREATE TABLE "book.trades" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(255),
    "instrument" VARCHAR(255) NOT NULL,
    "operation" VARCHAR(10) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "commission" DECIMAL(65,30),
    "account" UUID NOT NULL,

    CONSTRAINT "book.trades_pkey" PRIMARY KEY ("id")
);
