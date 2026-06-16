CREATE DATABASE urban_report;
USE urban_report;

-- =========================
-- USER
-- =========================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    photo_url VARCHAR(255),
    zone VARCHAR(255),

    cin_recto VARCHAR(255),
    cin_verso VARCHAR(255),
    cin_verifie BOOLEAN DEFAULT FALSE,
    cin_rejete BOOLEAN DEFAULT FALSE,

    created_at DATETIME
);

-- =========================
-- SIGNALMENT
-- =========================
CREATE TABLE signalement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255),
    description TEXT,
    latitude DOUBLE,
    longitude DOUBLE,
    image_url VARCHAR(255),
    status VARCHAR(50),

    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- AVIS (comments/feedback)
-- =========================
CREATE TABLE avis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message TEXT,
    created_at DATETIME,

    user_id BIGINT,
    signalement_id BIGINT,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (signalement_id) REFERENCES signalement(id)
);

-- =========================
-- VOTES (likes/dislikes optional)
-- =========================
CREATE TABLE signalement_vote (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20),

    user_id BIGINT,
    signalement_id BIGINT,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (signalement_id) REFERENCES signalement(id)
);

-- =========================
-- NOTIFICATION
-- =========================
CREATE TABLE notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME,

    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- INTERVENTION (admin actions)
-- =========================
CREATE TABLE intervention (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    status VARCHAR(50),
    created_at DATETIME,

    signalement_id BIGINT,
    FOREIGN KEY (signalement_id) REFERENCES signalement(id)
);