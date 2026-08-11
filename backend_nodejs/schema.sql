-- ============================================================
--  SCHEMA PostgreSQL - Maquete Industrial
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para coordenadas geoespaciais (opcional)

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'operator', -- admin, operator, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Switches (Ferrovia)
CREATE TABLE IF NOT EXISTS switches (
    id SERIAL PRIMARY KEY,
    switch_id INTEGER UNIQUE NOT NULL CHECK (switch_id BETWEEN 1 AND 3),
    name VARCHAR(50) NOT NULL,
    current_angle INTEGER DEFAULT 90,
    current_state VARCHAR(20) DEFAULT 'CENTER', -- LEFT, RIGHT, CENTER, TRANSITION
    target_angle INTEGER DEFAULT 90,
    is_moving BOOLEAN DEFAULT FALSE,
    last_command_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Comandos (Auditoria)
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    switch_id INTEGER REFERENCES switches(switch_id),
    command_type VARCHAR(20) NOT NULL, -- SET, ANGLE, RESET
    action VARCHAR(20), -- LEFT, RIGHT, CENTER
    angle INTEGER,
    issued_by UUID REFERENCES users(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, executed, failed, timeout
    response TEXT,
    latency_ms INTEGER
);

-- Tabela de Caminhões
CREATE TABLE IF NOT EXISTS trucks (
    id VARCHAR(10) PRIMARY KEY, -- T01, T02, etc
    name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, offline
    origin_x FLOAT DEFAULT 0,
    origin_y FLOAT DEFAULT 0,
    current_x FLOAT DEFAULT 0,
    current_y FLOAT DEFAULT 0,
    current_load FLOAT DEFAULT 0,
    max_load FLOAT DEFAULT 5000,
    battery_level FLOAT DEFAULT 100,
    last_telemetry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Telemetria dos Caminhões
CREATE TABLE IF NOT EXISTS truck_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id VARCHAR(10) REFERENCES trucks(id),
    delta_x FLOAT,
    delta_y FLOAT,
    speed FLOAT,
    load_amount FLOAT,
    battery_level FLOAT,
    heading FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Posição da Locomotiva
-- Tabela de Comandos dos Caminhoes
CREATE TABLE IF NOT EXISTS truck_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id VARCHAR(10) REFERENCES trucks(id),
    command VARCHAR(20) NOT NULL, -- F, B, S, L, R, C, U, D, X
    issued_by UUID REFERENCES users(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, executed, failed, timeout
    response TEXT
);

CREATE TABLE IF NOT EXISTS locomotive_position (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    locomotive_id VARCHAR(20) DEFAULT 'LOC-001',
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    speed FLOAT DEFAULT 0,
    heading FLOAT DEFAULT 0,
    track_segment VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Navios (Porto)
CREATE TABLE IF NOT EXISTS ships (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'docked', -- docked, loading, unloading, departed, arriving
    cargo_type VARCHAR(50),
    cargo_weight FLOAT DEFAULT 0,
    eta TIMESTAMP,
    etd TIMESTAMP,
    dock_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Aviões (Aeroporto)
CREATE TABLE IF NOT EXISTS airplanes (
    id VARCHAR(20) PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'landed', -- landed, boarding, departing, in_air, arriving
    cargo_type VARCHAR(50),
    cargo_weight FLOAT DEFAULT 0,
    eta TIMESTAMP,
    etd TIMESTAMP,
    gate VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Alertas
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity VARCHAR(20) NOT NULL, -- info, warning, critical
    module VARCHAR(30) NOT NULL, -- ferrovia, mina, porto, aeroporto
    message TEXT NOT NULL,
    details JSONB,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relatórios
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL, -- switches, trucks, port, airport, full
    format VARCHAR(10) NOT NULL, -- csv, xlsx, pdf
    filters JSONB,
    generated_by UUID REFERENCES users(id),
    file_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'generating', -- generating, ready, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_commands_switch ON commands(switch_id, issued_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_truck ON truck_telemetry(truck_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_truck_commands ON truck_commands(truck_id, issued_at);
CREATE INDEX IF NOT EXISTS idx_truck_commands_status ON truck_commands(status, issued_at);
CREATE INDEX IF NOT EXISTS idx_locomotive_time ON locomotive_position(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_module ON alerts(module, severity, created_at);

-- Dados iniciais
INSERT INTO switches (switch_id, name, current_angle, current_state) VALUES
(1, 'Desvio Norte', 90, 'CENTER'),
(2, 'Desvio Leste', 90, 'CENTER'),
(3, 'Desvio Sul', 90, 'CENTER')
ON CONFLICT (switch_id) DO NOTHING;

INSERT INTO trucks (id, name, origin_x, origin_y, max_load) VALUES
('T01', 'Caminhão Basculante 01', 0, 0, 5000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ships (id, name, cargo_type, cargo_weight, eta, dock_number) VALUES
('SHIP-001', 'Navio Cargueiro Alpha', 'Minério de Ferro', 15000, NOW() + INTERVAL '2 hours', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO airplanes (id, flight_number, cargo_type, cargo_weight, eta, gate) VALUES
('FL-001', 'CARGO-2024', 'Equipamentos', 5000, NOW() + INTERVAL '4 hours', 'G3')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  Tabelas de Química
-- ============================================================

CREATE TABLE IF NOT EXISTS chemistry_equipment (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- tanque, reator, misturador, resfriador, forno, bomba
    status VARCHAR(20) DEFAULT 'online', -- online, warning, offline, maintenance
    temperature FLOAT DEFAULT 25,
    humidity FLOAT DEFAULT 50,
    level FLOAT DEFAULT 50,
    pressure FLOAT DEFAULT 1.0,
    ph FLOAT DEFAULT 7.0,
    min_temperature FLOAT DEFAULT 10,
    max_temperature FLOAT DEFAULT 50,
    min_humidity FLOAT DEFAULT 20,
    max_humidity FLOAT DEFAULT 80,
    min_level FLOAT DEFAULT 10,
    max_level FLOAT DEFAULT 95,
    last_calibration TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chemistry_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id VARCHAR(20) REFERENCES chemistry_equipment(id) ON DELETE CASCADE,
    temperature FLOAT,
    humidity FLOAT,
    level FLOAT,
    pressure FLOAT,
    ph FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chem_readings_equip ON chemistry_readings(equipment_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_chem_equipment_status ON chemistry_equipment(status);

-- Dados iniciais de química
INSERT INTO chemistry_equipment (id, name, type, status, temperature, humidity, level, pressure, ph, min_temperature, max_temperature, last_calibration) VALUES
('CHEM-001', 'Tanque Alpha', 'tanque', 'online', 25.4, 45, 78, 1.0, 7.0, 10, 50, NOW() - INTERVAL '15 days'),
('CHEM-002', 'Reator Beta', 'reator', 'online', 42.1, 38, 62, 2.5, 6.8, 20, 60, NOW() - INTERVAL '10 days'),
('CHEM-003', 'Misturador Gamma', 'misturador', 'warning', 31.8, 52, 91, 1.2, 7.2, 15, 45, NOW() - INTERVAL '5 days'),
('CHEM-004', 'Resfriador Delta', 'resfriador', 'online', 8.2, 85, 45, 1.0, 7.0, 2, 20, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;
