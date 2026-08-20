-- ============================================================
--  MIGRATION 002: Evolucao do Schema - Maquete Industrial
--  Adiciona tabelas normalizadas, FKs adicionais, RLS
-- ============================================================

-- ============================================================
-- 1. TABELA ROLES (normalizar papéis)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,       -- admin, operator, viewer, maintenance
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
    ('admin', 'Acesso total ao sistema'),
    ('operator', 'Operacao dos dispositivos e visualizacao'),
    ('viewer', 'Somente visualizacao'),
    ('maintenance', 'Manutencao e diagnostico dos dispositivos')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. TABELA PERMISSIONS (controle de acesso granular)
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(50) NOT NULL,          -- ferrovia, trucks, port, reports, alerts, admin
    action VARCHAR(30) NOT NULL,            -- read, write, command, delete, manage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, resource, action)
);

INSERT INTO permissions (role_id, resource, action) VALUES
    -- admin: tudo
    ((SELECT id FROM roles WHERE name = 'admin'), 'ferrovia', 'command'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'ferrovia', 'read'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'trucks', 'command'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'trucks', 'read'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'port', 'read'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'reports', 'read'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'reports', 'write'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'alerts', 'manage'),
    ((SELECT id FROM roles WHERE name = 'admin'), 'admin', 'manage'),
    -- operator: leitura + comandos
    ((SELECT id FROM roles WHERE name = 'operator'), 'ferrovia', 'command'),
    ((SELECT id FROM roles WHERE name = 'operator'), 'ferrovia', 'read'),
    ((SELECT id FROM roles WHERE name = 'operator'), 'trucks', 'command'),
    ((SELECT id FROM roles WHERE name = 'operator'), 'trucks', 'read'),
    ((SELECT id FROM roles WHERE name = 'operator'), 'port', 'read'),
    ((SELECT id FROM roles WHERE name = 'operator'), 'reports', 'read'),
    ((SELECT id FROM roles WHERE name = 'operator'), 'alerts', 'read'),
    -- viewer: somente leitura
    ((SELECT id FROM roles WHERE name = 'viewer'), 'ferrovia', 'read'),
    ((SELECT id FROM roles WHERE name = 'viewer'), 'trucks', 'read'),
    ((SELECT id FROM roles WHERE name = 'viewer'), 'port', 'read'),
    ((SELECT id FROM roles WHERE name = 'viewer'), 'reports', 'read'),
    ((SELECT id FROM roles WHERE name = 'viewer'), 'alerts', 'read'),
    -- maintenance: leitura + manutencao
    ((SELECT id FROM roles WHERE name = 'maintenance'), 'ferrovia', 'read'),
    ((SELECT id FROM roles WHERE name = 'maintenance'), 'ferrovia', 'command'),
    ((SELECT id FROM roles WHERE name = 'maintenance'), 'trucks', 'read'),
    ((SELECT id FROM roles WHERE name = 'maintenance'), 'trucks', 'command'),
    ((SELECT id FROM roles WHERE name = 'maintenance'), 'alerts', 'read')
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- ============================================================
-- 3. TABELA DEVICES (dispositivos registrados)
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,              -- gateway, arduino, sensor, rfid
    mac_address VARCHAR(20),
    serial_port VARCHAR(20),
    firmware_version VARCHAR(20),
    status VARCHAR(20) DEFAULT 'offline',   -- online, offline, maintenance
    last_seen_at TIMESTAMP,
    gateway_id VARCHAR(50),                 -- qual gateway esta conectado
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. TABELA GATEWAYS (instancias de gateway)
-- ============================================================
CREATE TABLE IF NOT EXISTS gateways (
    id VARCHAR(50) PRIMARY KEY,             -- gateway-rpi-01
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'offline',   -- online, offline, maintenance
    ip_address VARCHAR(45),
    firmware_version VARCHAR(20),
    last_heartbeat_at TIMESTAMP,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. TABELA AUDIT_LOGS (trilha de auditoria completa)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,            -- login, logout, command, create, update, delete
    resource VARCHAR(50) NOT NULL,          -- user, switch, truck, ship, report
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. TABELA MAINTENANCE (registros de manutencao)
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_type VARCHAR(30) NOT NULL,       -- switch, truck, ship, gateway
    device_id VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info',    -- info, warning, critical
    status VARCHAR(20) DEFAULT 'open',      -- open, in_progress, resolved, cancelled
    assigned_to UUID REFERENCES users(id),
    reported_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. TABELA MAINTENANCE_HISTORY (historico de manutencao)
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_id UUID REFERENCES maintenance(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL,            -- created, assigned, updated, resolved, cancelled
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. TABELA COMMAND_HISTORY (historico detalhado de comandos)
-- ============================================================
CREATE TABLE IF NOT EXISTS command_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(20) NOT NULL,            -- dashboard, app, api, gateway, schedule
    target_type VARCHAR(20) NOT NULL,       -- switch, truck, locomotive
    target_id VARCHAR(50) NOT NULL,
    command VARCHAR(30) NOT NULL,
    parameters JSONB DEFAULT '{}',
    issued_by UUID REFERENCES users(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',   -- pending, executing, success, failed, timeout
    response TEXT,
    latency_ms INTEGER,
    error_message TEXT
);

-- ============================================================
-- 9. TABELA SENSOR_DATA (dados genericos de sensores)
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id),
    sensor_type VARCHAR(30) NOT NULL,       -- temperature, humidity, vibration, current, voltage
    value FLOAT NOT NULL,
    unit VARCHAR(10),                       -- celsius, %, Hz, A, V
    location VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. FKs ADICIONAIS
-- ============================================================

-- users.role agora referencia roles.name (compatibilidade)
-- Nota: mantemos a coluna role VARCHAR no users para compatibilidade,
-- mas criamos uma view para consultas normalizadas

-- FK para truck_telemetry -> trucks (ja existe, garantir)
DO $$ BEGIN
    ALTER TABLE truck_telemetry ADD CONSTRAINT fk_telemetry_truck
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK para truck_commands -> trucks (ja existe, garantir)
DO $$ BEGIN
    ALTER TABLE truck_commands ADD CONSTRAINT fk_truck_cmd_truck
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK para commands -> users (ja existe, garantir)
DO $$ BEGIN
    ALTER TABLE commands ADD CONSTRAINT fk_cmd_user
        FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 11. INDEXES ADICIONAIS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type, status);
CREATE INDEX IF NOT EXISTS idx_devices_gateway ON devices(gateway_id);
CREATE INDEX IF NOT EXISTS idx_gateways_status ON gateways(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status, severity);
CREATE INDEX IF NOT EXISTS idx_maintenance_device ON maintenance(device_type, device_id);
CREATE INDEX IF NOT EXISTS idx_command_history_target ON command_history(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_command_history_status ON command_history(status, issued_at);
CREATE INDEX IF NOT EXISTS idx_sensor_data_device ON sensor_data(device_id, sensor_type, recorded_at);
CREATE INDEX IF NOT EXISTS idx_sensor_data_time ON sensor_data(recorded_at);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(generated_by, created_at);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);

-- ============================================================
-- 12. RLS (Row Level Security) - Supabase (OPCIONAL)
-- ============================================================
-- NOTA: RLS e especifico do Supabase. Para PostgreSQL padrao (Render),
-- desabilitamos o RLS pois a autenticacao ja e feita via JWT no backend.

-- Desabilitar RLS (para PostgreSQL padrao)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE switches DISABLE ROW LEVEL SECURITY;
ALTER TABLE trucks DISABLE ROW LEVEL SECURITY;
ALTER TABLE commands DISABLE ROW LEVEL SECURITY;
ALTER TABLE truck_telemetry DISABLE ROW LEVEL SECURITY;
ALTER TABLE truck_commands DISABLE ROW LEVEL SECURITY;
ALTER TABLE locomotive_position DISABLE ROW LEVEL SECURITY;
ALTER TABLE ships DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Politicas removidas - autenticacao via JWT no backend

-- ============================================================
-- 13. VIEWS UTEIS
-- ============================================================

-- View: usuarios com suas roles normalizadas
CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT
    u.id,
    u.username,
    u.email,
    u.role,
    r.description AS role_description,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN roles r ON r.name = u.role;

-- View: resumo de dispositivos por status
CREATE OR REPLACE VIEW v_devices_summary AS
SELECT
    type,
    status,
    COUNT(*) AS count
FROM devices
GROUP BY type, status;

-- View: comandos recentes com detalhes
CREATE OR REPLACE VIEW v_recent_commands AS
SELECT
    ch.id,
    ch.source,
    ch.target_type,
    ch.target_id,
    ch.command,
    ch.status,
    ch.issued_at,
    ch.executed_at,
    ch.latency_ms,
    u.username AS issued_by_name
FROM command_history ch
LEFT JOIN users u ON u.id = ch.issued_by
ORDER BY ch.issued_at DESC
LIMIT 100;

-- View: alertas ativos
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    a.id,
    a.severity,
    a.module,
    a.message,
    a.details,
    a.created_at,
    u.username AS acknowledged_by_name
FROM alerts a
LEFT JOIN users u ON u.id = a.acknowledged_by
WHERE a.acknowledged_at IS NULL
ORDER BY
    CASE a.severity
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        WHEN 'info' THEN 3
    END,
    a.created_at DESC;
