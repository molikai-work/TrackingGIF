DROP TABLE IF EXISTS tracking;
CREATE TABLE IF NOT EXISTS tracking (
    `id` INTEGER PRIMARY KEY NOT NULL,
    `trackingId` TEXT NOT NULL,
    `createdAt` TEXT NOT NULL,
    `visited` TEXT NOT NULL,
    `visitCount` INTEGER NOT NULL,
    `initialPingUrl` TEXT
);
DROP TABLE IF EXISTS logs;
CREATE TABLE IF NOT EXISTS logs (
    `id` INTEGER PRIMARY KEY NOT NULL,
    `trackingId` TEXT NOT NULL,
    `time` TEXT NOT NULL,
    `ip` TEXT NOT NULL,
    `country` TEXT NOT NULL,
    `userAgent` TEXT
);

CREATE UNIQUE INDEX tracking_index ON tracking(trackingId);
CREATE INDEX logs_index ON logs(trackingId);
