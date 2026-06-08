-- Vytvořil: Matěj Kopecký matysek.kopecky@seznam.cz
-- database.sql
-- Kompletní založení databáze OD NULY (tabulky users a games).
-- POZOR: skript nejprve zahodí existující tabulky users a games (smaže jejich data)
-- a založí je znovu v aktuální podobě. Spouští se buď ručně, nebo přes install.php.

CREATE DATABASE IF NOT EXISTS sudoku_db CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci;
USE sudoku_db;

-- Nejprve zahodíme tabulky (games má cizí klíč na users, proto se ruší jako první).
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

-- Tabulka hráčů.
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;

-- Tabulka dohraných her.
CREATE TABLE games (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  difficulty ENUM('easy','medium','hard','expert') NOT NULL,
  elapsed_seconds INT UNSIGNED NOT NULL,
  moves_count INT UNSIGNED NOT NULL DEFAULT 0,
  hints_used INT UNSIGNED NOT NULL DEFAULT 0,
  mistakes_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_daily TINYINT(1) NOT NULL DEFAULT 0,
  finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_top (difficulty, elapsed_seconds),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;
