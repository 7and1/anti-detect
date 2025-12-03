-- Anti-detect.com Seed Data
-- Version: 1.0.0
-- This file seeds the database with initial fingerprint data

-- ================================================
-- SEED FINGERPRINTS - Windows Chrome
-- ================================================
INSERT OR IGNORE INTO fingerprints (
    hash, os, os_version, browser, browser_version, user_agent, platform,
    screen_width, screen_height, device_pixel_ratio,
    hardware_concurrency, device_memory, max_touch_points,
    webgl_vendor, webgl_renderer, webgl_version,
    timezone, timezone_offset, languages, fonts,
    canvas_hash, audio_hash, webgl_hash,
    quality_score, source, collected_at
) VALUES
-- Windows 11 + Chrome 120
(
    'fp_win11_chrome120_001',
    'Windows', '10.0', 'Chrome', '120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Win32',
    1920, 1080, 1.0,
    8, 16, 0,
    'Google Inc. (NVIDIA)', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'WebGL 1.0',
    'America/New_York', -300, '["en-US","en"]',
    '["Arial","Arial Black","Calibri","Cambria","Comic Sans MS","Consolas","Courier New","Georgia","Impact","Segoe UI","Tahoma","Times New Roman","Trebuchet MS","Verdana"]',
    'a1b2c3d4e5f6g7h8i9j0', 'k1l2m3n4o5p6q7r8s9t0', 'u1v2w3x4y5z6a7b8c9d0',
    95, 'verified', '2024-01-15T10:30:00Z'
),
-- Windows 10 + Chrome 119
(
    'fp_win10_chrome119_001',
    'Windows', '10.0', 'Chrome', '119.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Win32',
    2560, 1440, 1.25,
    16, 32, 0,
    'Google Inc. (AMD)', 'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'WebGL 1.0',
    'America/Los_Angeles', -480, '["en-US"]',
    '["Arial","Arial Black","Calibri","Cambria","Comic Sans MS","Consolas","Courier New","Georgia","Impact","Lucida Console","Segoe UI","Tahoma","Times New Roman","Trebuchet MS","Verdana"]',
    'b2c3d4e5f6g7h8i9j0k1', 'l2m3n4o5p6q7r8s9t0u1', 'v2w3x4y5z6a7b8c9d0e1',
    92, 'verified', '2024-01-14T14:20:00Z'
),
-- Windows 10 + Chrome 120 (1080p)
(
    'fp_win10_chrome120_002',
    'Windows', '10.0', 'Chrome', '120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Win32',
    1920, 1080, 1.0,
    4, 8, 0,
    'Google Inc. (NVIDIA)', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'WebGL 1.0',
    'America/Chicago', -360, '["en-US","en"]',
    '["Arial","Calibri","Cambria","Comic Sans MS","Consolas","Courier New","Georgia","Impact","Segoe UI","Tahoma","Times New Roman","Trebuchet MS","Verdana"]',
    'c3d4e5f6g7h8i9j0k1l2', 'm3n4o5p6q7r8s9t0u1v2', 'w3x4y5z6a7b8c9d0e1f2',
    88, 'collected', '2024-01-13T09:15:00Z'
);

-- ================================================
-- SEED FINGERPRINTS - macOS Safari/Chrome
-- ================================================
INSERT OR IGNORE INTO fingerprints (
    hash, os, os_version, browser, browser_version, user_agent, platform,
    screen_width, screen_height, device_pixel_ratio,
    hardware_concurrency, device_memory, max_touch_points,
    webgl_vendor, webgl_renderer, webgl_version,
    timezone, timezone_offset, languages, fonts,
    canvas_hash, audio_hash, webgl_hash,
    quality_score, source, collected_at
) VALUES
-- macOS Sonoma + Safari 17
(
    'fp_macos14_safari17_001',
    'macOS', '14.2', 'Safari', '17.2',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'MacIntel',
    2560, 1600, 2.0,
    10, 16, 0,
    'Apple Inc.', 'Apple M2 Pro', 'WebGL 2.0',
    'America/New_York', -300, '["en-US","en"]',
    '["Helvetica","Helvetica Neue","Arial","Times New Roman","Georgia","Courier New","Monaco","Menlo","Avenir","Avenir Next","San Francisco","SF Pro","Apple Color Emoji"]',
    'd4e5f6g7h8i9j0k1l2m3', 'n4o5p6q7r8s9t0u1v2w3', 'x4y5z6a7b8c9d0e1f2g3',
    96, 'verified', '2024-01-15T11:00:00Z'
),
-- macOS Ventura + Chrome 120
(
    'fp_macos13_chrome120_001',
    'macOS', '13.6', 'Chrome', '120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'MacIntel',
    1440, 900, 2.0,
    8, 8, 0,
    'Google Inc. (Apple)', 'ANGLE (Apple, Apple M1, OpenGL 4.1)', 'WebGL 1.0',
    'America/Los_Angeles', -480, '["en-US"]',
    '["Helvetica","Helvetica Neue","Arial","Times New Roman","Georgia","Courier New","Monaco","Menlo","Avenir","San Francisco"]',
    'e5f6g7h8i9j0k1l2m3n4', 'o5p6q7r8s9t0u1v2w3x4', 'y5z6a7b8c9d0e1f2g3h4',
    91, 'verified', '2024-01-14T08:30:00Z'
);

-- ================================================
-- SEED FINGERPRINTS - Linux
-- ================================================
INSERT OR IGNORE INTO fingerprints (
    hash, os, os_version, browser, browser_version, user_agent, platform,
    screen_width, screen_height, device_pixel_ratio,
    hardware_concurrency, device_memory, max_touch_points,
    webgl_vendor, webgl_renderer, webgl_version,
    timezone, timezone_offset, languages, fonts,
    canvas_hash, audio_hash, webgl_hash,
    quality_score, source, collected_at
) VALUES
-- Ubuntu + Firefox
(
    'fp_linux_firefox121_001',
    'Linux', '5.15.0', 'Firefox', '121.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Linux x86_64',
    1920, 1080, 1.0,
    8, 16, 0,
    'Intel', 'Mesa Intel(R) UHD Graphics 630', 'WebGL 1.0',
    'Europe/Berlin', -60, '["en-US","de"]',
    '["DejaVu Sans","DejaVu Serif","DejaVu Sans Mono","Liberation Sans","Liberation Serif","Liberation Mono","Ubuntu","Ubuntu Mono","Noto Sans","Noto Serif"]',
    'f6g7h8i9j0k1l2m3n4o5', 'p6q7r8s9t0u1v2w3x4y5', 'z6a7b8c9d0e1f2g3h4i5',
    87, 'collected', '2024-01-12T16:45:00Z'
),
-- Linux + Chrome
(
    'fp_linux_chrome120_001',
    'Linux', '5.15.0', 'Chrome', '120.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Linux x86_64',
    2560, 1440, 1.0,
    12, 32, 0,
    'Google Inc. (NVIDIA)', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070, OpenGL 4.6)', 'WebGL 1.0',
    'Europe/London', 0, '["en-GB","en"]',
    '["DejaVu Sans","DejaVu Serif","DejaVu Sans Mono","Liberation Sans","Liberation Serif","Liberation Mono","Ubuntu","Noto Sans"]',
    'g7h8i9j0k1l2m3n4o5p6', 'q7r8s9t0u1v2w3x4y5z6', 'a7b8c9d0e1f2g3h4i5j6',
    85, 'collected', '2024-01-11T12:00:00Z'
);

-- ================================================
-- SEED FINGERPRINTS - Mobile (Android)
-- ================================================
INSERT OR IGNORE INTO fingerprints (
    hash, os, os_version, browser, browser_version, user_agent, platform,
    screen_width, screen_height, device_pixel_ratio,
    hardware_concurrency, device_memory, max_touch_points,
    webgl_vendor, webgl_renderer, webgl_version,
    timezone, timezone_offset, languages, fonts,
    canvas_hash, audio_hash, webgl_hash,
    quality_score, source, collected_at
) VALUES
-- Android 14 + Chrome Mobile
(
    'fp_android14_chrome120_001',
    'Android', '14', 'Chrome', '120.0.0.0',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Linux armv8l',
    412, 915, 2.625,
    8, 8, 5,
    'Qualcomm', 'Adreno (TM) 740', 'WebGL 1.0',
    'America/New_York', -300, '["en-US"]',
    '["Roboto","Droid Sans","Droid Sans Mono","Noto Sans","Noto Color Emoji"]',
    'h8i9j0k1l2m3n4o5p6q7', 'r8s9t0u1v2w3x4y5z6a7', 'b8c9d0e1f2g3h4i5j6k7',
    90, 'verified', '2024-01-14T18:00:00Z'
),
-- Android 13 + Chrome Mobile
(
    'fp_android13_chrome119_001',
    'Android', '13', 'Chrome', '119.0.0.0',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    'Linux armv8l',
    360, 780, 3.0,
    8, 8, 10,
    'Qualcomm', 'Adreno (TM) 730', 'WebGL 1.0',
    'Europe/Paris', -60, '["fr-FR","en"]',
    '["Roboto","Droid Sans","Noto Sans","Noto Color Emoji"]',
    'i9j0k1l2m3n4o5p6q7r8', 's9t0u1v2w3x4y5z6a7b8', 'c9d0e1f2g3h4i5j6k7l8',
    88, 'collected', '2024-01-13T20:30:00Z'
);

-- ================================================
-- SEED FINGERPRINTS - iOS
-- ================================================
INSERT OR IGNORE INTO fingerprints (
    hash, os, os_version, browser, browser_version, user_agent, platform,
    screen_width, screen_height, device_pixel_ratio,
    hardware_concurrency, device_memory, max_touch_points,
    webgl_vendor, webgl_renderer, webgl_version,
    timezone, timezone_offset, languages, fonts,
    canvas_hash, audio_hash, webgl_hash,
    quality_score, source, collected_at
) VALUES
-- iOS 17 + Safari
(
    'fp_ios17_safari17_001',
    'iOS', '17.2', 'Safari', '17.2',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'iPhone',
    390, 844, 3.0,
    6, 6, 5,
    'Apple Inc.', 'Apple GPU', 'WebGL 1.0',
    'America/New_York', -300, '["en-US"]',
    '["Helvetica","Helvetica Neue","Arial","Times New Roman","Georgia","Courier New","San Francisco","Apple Color Emoji"]',
    'j0k1l2m3n4o5p6q7r8s9', 't0u1v2w3x4y5z6a7b8c9', 'd0e1f2g3h4i5j6k7l8m9',
    94, 'verified', '2024-01-15T09:00:00Z'
);

-- ================================================
-- SEED JA3 DATABASE
-- ================================================
INSERT OR IGNORE INTO ja3_database (ja3_hash, browser, browser_version, os, is_automation, is_headless, tool_name, confidence, source) VALUES
-- Real Chrome
('cd08e31494f9531f560d64c695473da9', 'Chrome', '120', 'Windows', 0, 0, NULL, 0.95, 'verified'),
('e7d705a3286e19ea42f587b344ee6865', 'Chrome', '119', 'Windows', 0, 0, NULL, 0.95, 'verified'),
('b32309a26951912be7dba376398abc3b', 'Chrome', '120', 'macOS', 0, 0, NULL, 0.95, 'verified'),

-- Real Firefox
('1d095d08ec73d3cacd365a0dc5ea89a8', 'Firefox', '121', 'Windows', 0, 0, NULL, 0.93, 'verified'),
('ae4edc6faf64d08308082ad26be60767', 'Firefox', '121', 'Linux', 0, 0, NULL, 0.93, 'verified'),

-- Real Safari
('773906b0efdefa24a7f2b8eb6985bf37', 'Safari', '17', 'macOS', 0, 0, NULL, 0.95, 'verified'),
('f8d23ece29f0f99c1e7e98c7ac25926a', 'Safari', '17', 'iOS', 0, 0, NULL, 0.95, 'verified'),

-- Automation Tools
('a0d9e6fb2e63b9a5e6c9c3d7c8e3e8e5', NULL, NULL, NULL, 1, 1, 'Puppeteer', 0.99, 'verified'),
('b1c8d7e6f5g4h3i2j1k0l9m8n7o6p5q4', NULL, NULL, NULL, 1, 1, 'Playwright', 0.99, 'verified'),
('c2d9e8f7g6h5i4j3k2l1m0n9o8p7q6r5', NULL, NULL, NULL, 1, 0, 'Selenium', 0.97, 'verified'),
('d3e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6', NULL, NULL, NULL, 1, 1, 'PhantomJS', 0.99, 'verified');

-- ================================================
-- SEED INITIAL STATISTICS
-- ================================================
INSERT OR IGNORE INTO fingerprint_stats (stat_key, stat_value) VALUES
('total_fingerprints', '127543'),
('last_scan_count', '45892'),
('average_trust_score', '72.4'),
('automation_detection_rate', '94.2'),
('database_version', '1.0.0');
