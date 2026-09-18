INSERT INTO users (id, username, password_hash, role, supplier_id) VALUES (1, 'Sairaj Mote', '$2b$12$v5uVsvFx7gNpQZeStiJUNuAYugWqC9V9egoTzinanEuQGELhulfXy', 'admin', NULL);
INSERT INTO users (id, username, password_hash, role, supplier_id) VALUES (2, 'Om Mote', '$2b$12$XWAAXdJZeLbj9eb6X3tUgOklP5ufsUBBk.D19uV6zU503Y4UCDaYW', 'user', NULL);
INSERT INTO users (id, username, password_hash, role, supplier_id) VALUES (3, 'Saidaya Transport', '$2b$12$NaBWb2prwlnN7Yy7eKZTner22XRMXF8O1YEUNRoTVT6YaaY7ABpfi', 'supplier', 1);
INSERT INTO users (id, username, password_hash, role, supplier_id) VALUES (4, 'Soham Mote', '$2b$12$GmbiFnJrFe8EdChOxggGFOlVM47cZMy34Z60fbSnm7mcvwRlKFpoK', 'admin', NULL);
INSERT INTO users (id, username, password_hash, role, supplier_id) VALUES (5, 'Suraj Barate', '$2b$12$9rKlmn0ZCZR4YWF60.0GZOvbrAgw6Qa5xPRXtXAijuz/WiztUEHli', 'user', NULL);
-- Reset sequences after preserving the original IDs
SELECT setval(
    pg_get_serial_sequence('suppliers', 'id'),
    COALESCE((SELECT MAX(id) FROM suppliers), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    COALESCE((SELECT MAX(id) FROM users), 1),
    true
);