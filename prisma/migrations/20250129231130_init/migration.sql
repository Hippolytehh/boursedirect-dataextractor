-- CreateTable
CREATE TABLE "administration.accounts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(250),
    "type" UUID,
    "owner" UUID,

    CONSTRAINT "administration.accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administration.users" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),

    CONSTRAINT "administration.users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boursedirect.products" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "boursedirect.products_pkey" PRIMARY KEY ("id")
);
