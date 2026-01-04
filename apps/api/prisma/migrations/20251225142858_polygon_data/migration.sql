/*
  Warnings:

  - You are about to drop the `Exam` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Exam";

-- CreateTable
CREATE TABLE "admin_area_sido" (
    "adm_cd" INTEGER NOT NULL,
    "adm_nm" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "polygons" JSONB NOT NULL,

    CONSTRAINT "admin_area_sido_pkey" PRIMARY KEY ("adm_cd")
);

-- CreateTable
CREATE TABLE "admin_area_gu" (
    "adm_cd" INTEGER NOT NULL,
    "adm_nm" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "polygons" JSONB NOT NULL,

    CONSTRAINT "admin_area_gu_pkey" PRIMARY KEY ("adm_cd")
);

-- CreateTable
CREATE TABLE "admin_area_dong" (
    "adm_cd" INTEGER NOT NULL,
    "adm_nm" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "polygons" JSONB NOT NULL,

    CONSTRAINT "admin_area_dong_pkey" PRIMARY KEY ("adm_cd")
);
