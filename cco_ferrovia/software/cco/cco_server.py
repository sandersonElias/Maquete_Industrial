from __future__ import annotations

import argparse
import copy
import csv
import html
import io
import json
import mimetypes
import os
import queue
import socket
import sys
import threading
import time
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DATA = ROOT / "data"
CONFIG_PATH = ROOT / "config.json"


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


class CCOSystem:
    def __init__(self, config: dict, mock: bool = False):
        self.config = config
        self.mock = mock
        self.lock = threading.RLock()
        self.subscribers: list[queue.Queue] = []
        self.udp_socket: socket.socket | None = None
        self.serial_write: queue.Queue[str] = queue.Queue()
        self.stop_event = threading.Event()
        self.command_sequence = 0
        self.last_arduino_ping = 0.0
        self.last_loco_ping = 0.0
        self.last_serial_warning = 0.0
        self.last_unknown_loco_log = 0.0
        self.last_payload: str | None = None
        self.events: list[dict] = []
        self.state = self._initial_state()
        DATA.mkdir(parents=True, exist_ok=True)
        self.event_file = DATA / "events.jsonl"
        self._load_recent_events()
        self.calibration_path = Path(config.get("calibration_path", DATA / "calibration.json"))
        if self.calibration_path.exists():
            try:
                saved = load_json(self.calibration_path)
                self.state["calibration"]["profiles"] = saved.get("profiles", {})
                self.state["calibration"]["segments"] = saved.get("segments", {})
                self.state["calibration"]["route_times"] = saved.get("route_times", {})
            except (OSError, ValueError):
                pass

    def _initial_state(self) -> dict:
        sensors = {
            f"S{i:02d}": {
                "active": False,
                "health": "OK",
                "hits": 0,
                "misses": 0,
                "consecutive_misses": 0,
                "last_event": None,
                "description": description,
            }
            for i, description in enumerate(
                [
                    "Próximo à C2",
                    "Depois da Passagem de Nível",
                    "Antes da C3",
                    "Depois da C3 - linha plana",
                    "Depois da C3 - linha elevada",
                    "Antes da C1 - linha plana",
                    "Antes da C1 - linha elevada",
                ],
                start=1,
            )
        }
        locomotives = {}
        for loco_id in ("L01", "L02", "L03"):
            locomotives[loco_id] = {
                "label": loco_id.replace("L", "LC", 1),
                "size": "DUPLA" if loco_id == "L01" else "SIMPLES",
                "stop_reason": None,
                "segment_interrupted": True,
                "motion_generation": 0,
                "connected": bool(self.mock),
                "ip": "simulado" if self.mock else None,
                "motion": "STOP",
                "direction": None,
                "operational_state": "DISPONIVEL",
                "route": "PLANO_FRENTE",
                "route_index": -1,
                "last_sensor": None,
                "next_sensor": "S03",
                "confirmed_at": None,
                "expected_segment_ms": 6500,
                "confidence": "DESCONHECIDA",
                "battery_mv": 4100 if self.mock else None,
                "battery_pct": 92 if self.mock else None,
                "rssi": -48 if self.mock else None,
                "last_seen_monotonic": time.monotonic() if self.mock else 0.0,
                "last_seen": now_iso() if self.mock else None,
                "priority": "NORMAL",
                "fault": None,
                "firmware_version": "SIM" if self.mock else None,
                "mission": None,
                "office_stop_at": None,
                "stats": {
                    "movement_seconds": 0,
                    "waiting_seconds": 0,
                    "scheduled_seconds": 0,
                    "available_seconds": 0,
                    "battery_min_pct": 92 if self.mock else None,
                    "corrective_stops": 0,
                    "battery_swaps": 0,
                    "routes_completed": 0,
                    "communication_losses": 0,
                },
            }
        return {
            "version": "0.2.0",
            "operation": {"simple": "L02", "active_ids": ["L01", "L02"]},
            "calibration": {"active": False, "loco": None, "sensor": "S03", "samples": [],
                            "profiles": {}, "segments": {}, "route_times": {}, "pending_segments": {},
                            "message": "Selecione a locomotiva e faça pelo menos 3 passagens no mesmo sensor."},
            "started_at": now_iso(),
            "operator": None,
            "session": {"active": False, "started_at": None, "ended_at": None},
            "mode": "AUTOMATICO",
            "emergency": False,
            "arduino": {"connected": bool(self.mock), "port": "SIMULADO" if self.mock else None, "last_seen": None},
            "switches": {"C1": "NORMAL", "C2": "NORMAL", "C3": "NORMAL"},
            "signals": {
                "F1_EXTERNO": "RED",
                "F2_INTERNO": "RED",
            },
            "sensors": sensors,
            "locomotives": locomotives,
            "blocks": {},
            "alerts": [],
        }

    def _load_recent_events(self):
        if not self.event_file.exists():
            return
        try:
            lines = self.event_file.read_text(encoding="utf-8").splitlines()[-200:]
            self.events = [json.loads(line) for line in lines if line.strip()]
        except Exception:
            self.events = []

    def log(self, category: str, message: str, severity: str = "INFO", loco: str | None = None, data: dict | None = None):
        event = {
            "time": now_iso(),
            "operator": self.state.get("operator") or "SISTEMA",
            "category": category,
            "severity": severity,
            "locomotive": loco,
            "message": message,
            "data": data or {},
        }
        with self.lock:
            self.events.append(event)
            self.events = self.events[-1000:]
            with self.event_file.open("a", encoding="utf-8") as stream:
                stream.write(json.dumps(event, ensure_ascii=False) + "\n")
        target = f" [{loco}]" if loco else ""
        print(f"{event['time'][11:19]} {severity:<8} {category:<13}{target} {message}", flush=True)
        self.broadcast()

    def snapshot(self) -> dict:
        with self.lock:
            state = copy.deepcopy(self.state)
            now = time.monotonic()
            for loco in state["locomotives"].values():
                progress = 0.0
                if loco["motion"] != "STOP" and loco["confirmed_at"]:
                    elapsed_ms = max(0.0, (now - loco["confirmed_at"]) * 1000)
                    progress = min(0.95, elapsed_ms / max(500, loco["expected_segment_ms"]))
                loco["progress"] = round(progress, 3)
                loco.pop("last_seen_monotonic", None)
                loco.pop("confirmed_at", None)
                loco.pop("office_stop_at", None)
            state["events"] = copy.deepcopy(self.events[-30:][::-1])
            return state

    def broadcast(self):
        payload = json.dumps(self.snapshot(), ensure_ascii=False)
        with self.lock:
            if payload == self.last_payload:
                return
            self.last_payload = payload
        for subscriber in list(self.subscribers):
            try:
                subscriber.put_nowait(payload)
            except queue.Full:
                try:
                    subscriber.get_nowait()
                except queue.Empty:
                    pass
                try:
                    subscriber.put_nowait(payload)
                except queue.Full:
                    pass

    def next_sequence(self) -> int:
        with self.lock:
            self.command_sequence += 1
            return self.command_sequence

    def send_arduino(self, line: str):
        if not self.mock and not self.state["arduino"]["connected"]:
            now = time.monotonic()
            if now - self.last_serial_warning > 5:
                self.last_serial_warning = now
                self.log("ARDUINO", "Comando enfileirado, mas Arduino está desconectado", "WARNING")
        self.serial_write.put(line.rstrip("\r\n") + "\n")

    def send_loco(self, loco_id: str, action: str) -> bool:
        with self.lock:
            loco = self.state["locomotives"].get(loco_id)
            if not loco or not loco.get("ip") or loco.get("ip") == "simulado":
                if self.mock and loco:
                    self._apply_mock_loco_command(loco_id, action)
                    return True
                return False
            ip = loco["ip"]
        seq = self.next_sequence()
        packet = f"CMD|{loco_id}|{seq}|{action}".encode("ascii")
        try:
            if self.udp_socket:
                self.udp_socket.sendto(packet, (ip, int(self.config["udp"]["locomotive_port"])))
                return True
        except OSError as exc:
            self.log("COMUNICACAO", f"Falha ao enviar {action}: {exc}", "ERROR", loco_id)
        return False

    def _apply_mock_loco_command(self, loco_id: str, action: str):
        loco = self.state["locomotives"][loco_id]
        if action in ("FORWARD", "REVERSE"):
            loco["motion"] = action
            loco["direction"] = action
            loco["operational_state"] = "EM_MOVIMENTO"
            if loco["confirmed_at"] is None:
                loco["confirmed_at"] = time.monotonic()
        elif action == "STOP":
            loco["motion"] = "STOP"
            if loco["operational_state"] not in ("OFICINA", "FALHA"):
                loco["operational_state"] = "PARADA"
        loco["last_seen_monotonic"] = time.monotonic()
        loco["last_seen"] = now_iso()

    def set_operator(self, name: str):
        name = " ".join(name.strip().split())[:80]
        if not name:
            raise ValueError("Informe o nome do operador")
        with self.lock:
            self.state["operator"] = name
        self.log("OPERADOR", f"Operador ativo: {name}")

    def start_session(self):
        with self.lock:
            if not self.state["operator"]:
                raise ValueError("Identifique o operador antes de iniciar")
            self.state["session"] = {"active": True, "started_at": now_iso(), "ended_at": None}
        self.log("TURNO", "Turno iniciado")

    def end_session(self):
        self.emergency(True, reason="Encerramento do turno")
        with self.lock:
            self.state["session"]["active"] = False
            self.state["session"]["ended_at"] = now_iso()
        self.log("TURNO", "Turno encerrado")

    def emergency(self, active: bool, reason: str = "Comando do operador"):
        with self.lock:
            self.state["emergency"] = active
        if active:
            for loco_id in self.state["locomotives"]:
                self.send_loco(loco_id, "STOP")
                self.state["locomotives"][loco_id]["motion"] = "STOP"
                self.state["locomotives"][loco_id]["stop_reason"] = reason
            self.send_arduino(f"EMERGENCY|ON|{self.next_sequence()}")
            self.log("EMERGENCIA", reason, "CRITICAL")
        else:
            self.send_arduino(f"EMERGENCY|OFF|{self.next_sequence()}")
            self.log("EMERGENCIA", "Sistema rearmado")
        self.broadcast()

    def configure_route(self, loco_id: str, route_name: str):
        route = self.config["routes"].get(route_name)
        if not route:
            raise ValueError("Rota desconhecida")
        if not self.mock and not self.state["arduino"]["connected"]:
            raise ValueError("Arduino desconectado; não é possível preparar as chaves da rota")
        with self.lock:
            loco = self.state["locomotives"][loco_id]
            if loco["motion"] != "STOP":
                raise ValueError("Pare a locomotiva antes de alterar a rota")
            for other_id, other in self.state["locomotives"].items():
                if other_id != loco_id and other["motion"] != "STOP":
                    other_switches = self.config["routes"][other["route"]]["switches"]
                    if other_switches != route["switches"]:
                        raise ValueError("Pare a outra locomotiva antes de mudar as chaves da rota")
            loco["route"] = route_name
            if loco.get("last_sensor") in route["sensors"]:
                loco["route_index"] = route["sensors"].index(loco["last_sensor"])
                next_index = loco["route_index"] + 1
                if next_index >= len(route["sensors"]):
                    next_index = 0 if route_name != "OFICINA" else loco["route_index"]
                loco["next_sensor"] = route["sensors"][next_index]
            else:
                loco["route_index"] = -1
                loco["next_sensor"] = route["sensors"][0]
            loco["expected_segment_ms"] = route["expected_segment_ms"]
            loco["mission"] = "OFICINA" if route_name == "OFICINA" else None
            for switch_id, position in route["switches"].items():
                self.state["switches"][switch_id] = position
                self.send_arduino(f"SWITCH|{switch_id}|{position}|{self.next_sequence()}")
        self.log("ROTA", f"Rota {route_name} solicitada", loco=loco_id)
        self.broadcast()

    def command_locomotive(self, loco_id: str, action: str):
        action = action.upper()
        desired_stop_state = None
        if loco_id not in self.state["locomotives"]:
            raise ValueError("Locomotiva desconhecida")
        with self.lock:
            loco = self.state["locomotives"][loco_id]
            if action == "OFFICE":
                self.configure_route(loco_id, "OFICINA")
                action = "FORWARD"
            elif action == "WAIT":
                action = "STOP"
                desired_stop_state = "AGUARDANDO"
            elif action == "AVAILABLE":
                action = "STOP"
                desired_stop_state = "DISPONIVEL"
            if self.state["emergency"] and action != "STOP":
                raise ValueError("Sistema em emergência")
            if action in ("FORWARD", "REVERSE"):
                if not self.state["session"]["active"]:
                    raise ValueError("Inicie o turno antes de movimentar")
                if loco_id not in self.state["operation"]["active_ids"]:
                    raise ValueError("Locomotiva reserva: selecione a simples ativa antes de movimentar")
                calibration = self.state["calibration"]
                if calibration["active"] and calibration["loco"] != loco_id:
                    raise ValueError("Somente a locomotiva em calibração pode se mover")
                if loco["fault"]:
                    raise ValueError(f"Falha ativa: {loco['fault']}. Verifique e confirme a posição")
                if not self.state["arduino"]["connected"]:
                    raise ValueError("Arduino desconectado")
                if not loco["connected"]:
                    raise ValueError("Locomotiva sem comunicação")
                if loco["confidence"] != "CONFIRMADA":
                    raise ValueError("Confirme a posição inicial da locomotiva antes de movimentar")
                if loco["motion"] != "STOP" and loco["motion"] != action:
                    self.command_locomotive(loco_id, "STOP")
                desired_route = loco["route"]
                if desired_route != "OFICINA":
                    desired_route = desired_route.rsplit("_", 1)[0] + ("_RE" if action == "REVERSE" else "_FRENTE")
                if loco["motion"] == "STOP":
                    self.configure_route(loco_id, desired_route)
                moving_others = sum(
                    1 for other_id, other in self.state["locomotives"].items()
                    if other_id != loco_id and other["motion"] != "STOP"
                )
                if moving_others >= int(self.config["safety"].get("max_moving_locomotives", 2)):
                    raise ValueError("Limite de duas locomotivas em movimento atingido")
                # Reserva o próximo ponto esperado para impedir dois trens no mesmo bloco lógico.
                next_sensor = loco.get("next_sensor")
                for other_id, other in self.state["locomotives"].items():
                    if other_id != loco_id and next_sensor and (
                        (other.get("next_sensor") == next_sensor and other["motion"] != "STOP")
                        or (other.get("last_sensor") == next_sensor and other["confidence"] != "DESCONHECIDA")
                    ):
                        raise ValueError(f"Trecho reservado por {other_id}")
            if action not in ("FORWARD", "REVERSE", "STOP"):
                raise ValueError("Comando inválido")
        sent = self.send_loco(loco_id, action)
        if not sent and not self.mock:
            raise ValueError("Locomotiva sem comunicação")
        with self.lock:
            if action in ("FORWARD", "REVERSE"):
                loco["motion"] = action
                loco["direction"] = action
                loco["operational_state"] = "EM_MOVIMENTO"
                loco["confirmed_at"] = time.monotonic()
                loco["motion_generation"] += 1
                loco["segment_interrupted"] = True
                loco["stop_reason"] = None
                loco["expected_segment_ms"] = self.segment_time(loco_id)
            elif action == "STOP":
                loco["motion"] = "STOP"
                loco["operational_state"] = desired_stop_state or "PARADA"
                loco["segment_interrupted"] = True
                loco["motion_generation"] += 1
                loco["stop_reason"] = "Parada solicitada pelo operador"
        self.log("COMANDO", action, loco=loco_id)
        self.broadcast()

    def confirm_position(self, loco_id: str, sensor_id: str):
        sensor_id = sensor_id.upper()
        if loco_id not in self.state["locomotives"] or sensor_id not in self.state["sensors"]:
            raise ValueError("Locomotiva ou sensor desconhecido")
        with self.lock:
            loco = self.state["locomotives"][loco_id]
            if loco["motion"] != "STOP":
                raise ValueError("Pare a locomotiva antes de confirmar a posição")
            route = self.config["routes"][loco["route"]]
            if sensor_id not in route["sensors"]:
                raise ValueError(f"{sensor_id} não pertence à rota selecionada")
            index = route["sensors"].index(sensor_id)
            next_index = index + 1
            if next_index >= len(route["sensors"]):
                next_index = 0 if loco["route"] != "OFICINA" else index
            loco["route_index"] = index
            loco["last_sensor"] = sensor_id
            loco["next_sensor"] = route["sensors"][next_index]
            loco["confirmed_at"] = time.monotonic()
            loco["confidence"] = "CONFIRMADA"
            loco["fault"] = None
            loco["stop_reason"] = None
            loco["segment_interrupted"] = True
            if loco["operational_state"] == "FALHA":
                loco["operational_state"] = "PARADA"
        self.log("POSICAO", f"Posição confirmada manualmente em {sensor_id}", loco=loco_id)

    def register_maintenance(self, loco_id: str, action: str):
        action = action.upper()
        if loco_id not in self.state["locomotives"]:
            raise ValueError("Locomotiva desconhecida")
        with self.lock:
            loco = self.state["locomotives"][loco_id]
            if action == "BATTERY_SWAP":
                loco["stats"]["battery_swaps"] += 1
                message = "Troca de bateria registrada"
            elif action == "CORRECTIVE_STOP":
                loco["stats"]["corrective_stops"] += 1
                loco["motion"] = "STOP"
                loco["operational_state"] = "FALHA"
                self.send_loco(loco_id, "STOP")
                message = "Parada corretiva registrada"
            else:
                raise ValueError("Registro de manutenção inválido")
        self.log("MANUTENCAO", message, "WARNING", loco_id)

    def set_priority(self, loco_id: str, priority: str):
        priority = priority.upper()
        if priority not in ("BAIXA", "NORMAL", "ALTA", "EMERGENCIA"):
            raise ValueError("Prioridade inválida")
        with self.lock:
            self.state["locomotives"][loco_id]["priority"] = priority
        self.log("PRIORIDADE", f"Prioridade alterada para {priority}", loco=loco_id)

    def set_switch(self, switch_id: str, position: str):
        switch_id, position = switch_id.upper(), position.upper()
        if switch_id not in self.state["switches"] or position not in ("NORMAL", "REVERSA"):
            raise ValueError("Comando de chave inválido")
        if not self.mock and not self.state["arduino"]["connected"]:
            raise ValueError("Arduino desconectado; verifique o cabo USB")
        if any(loco["motion"] != "STOP" for loco in self.state["locomotives"].values()):
            raise ValueError("Pare as locomotivas antes de comandar uma chave manualmente")
        with self.lock:
            self.state["switches"][switch_id] = position
        self.send_arduino(f"SWITCH|{switch_id}|{position}|{self.next_sequence()}")
        self.log("CHAVE", f"{switch_id} em {position}")

    def set_signal(self, signal_id: str, color: str):
        signal_id, color = signal_id.upper(), color.upper()
        if signal_id not in self.state["signals"] or color not in ("RED", "YELLOW", "GREEN"):
            raise ValueError("Comando de farol inválido")
        if not self.mock and not self.state["arduino"]["connected"]:
            raise ValueError("Arduino desconectado; verifique o cabo USB")
        with self.lock:
            self.state["signals"]["F1_EXTERNO"] = color
            self.state["signals"]["F2_INTERNO"] = color
        self.send_arduino(f"SIGNAL|F1|{color}|{self.next_sequence()}")
        self.log("FAROL", f"Semáforos combinados em {color}")

    def set_passage_signals(self, color: str, reason: str):
        with self.lock:
            self.state["signals"]["F1_EXTERNO"] = color
            self.state["signals"]["F2_INTERNO"] = color
        self.send_arduino(f"SIGNAL|F1|{color}|{self.next_sequence()}")
        self.log("PASSAGEM", f"Faróis em {color}: {reason}")

    def on_sensor(self, sensor_id: str, active: bool):
        sensor_id = sensor_id.upper()
        if sensor_id not in self.state["sensors"]:
            return
        with self.lock:
            sensor = self.state["sensors"][sensor_id]
            if sensor["active"] == active:
                return
            sensor["active"] = active
            sensor["last_event"] = now_iso()
            if not active:
                self.broadcast()
                return
            sensor["hits"] += 1

            sensor["passage_loco"] = None
            candidates = []
            skipped_candidates = []
            for loco_id, loco in self.state["locomotives"].items():
                if loco["motion"] == "STOP":
                    continue
                route = self.config["routes"].get(loco["route"], {})
                sequence = route.get("sensors", [])
                if not sequence:
                    continue
                expected_index = loco["route_index"] + 1
                looping = loco["route"] != "OFICINA"
                if looping:
                    expected_index %= len(sequence)
                    ordered_indexes = [(expected_index + offset) % len(sequence) for offset in range(len(sequence))]
                else:
                    ordered_indexes = list(range(expected_index, len(sequence)))
                ordered_sensors = [sequence[index] for index in ordered_indexes]
                if ordered_sensors and ordered_sensors[0] == sensor_id:
                    candidates.append((loco_id, ordered_indexes[0], []))
                elif sensor_id in ordered_sensors[1:]:
                    offset = ordered_sensors.index(sensor_id)
                    actual_index = ordered_indexes[offset]
                    skipped = ordered_sensors[:offset]
                    skipped_candidates.append((loco_id, actual_index, skipped))

            selected = candidates if len(candidates) == 1 else skipped_candidates if not candidates and len(skipped_candidates) == 1 else []
            if len(candidates) > 1:
                for ambiguous_id, _, _ in candidates:
                    self.command_locomotive(ambiguous_id, "STOP")
                    ambiguous = self.state["locomotives"][ambiguous_id]
                    ambiguous["confidence"] = "INCERTA"
                    ambiguous["stop_reason"] = f"Passagem ambígua em {sensor_id}; confirme as posições"
            if selected:
                loco_id, index, skipped = selected[0]
                loco = self.state["locomotives"][loco_id]
                for missed_id in skipped:
                    self._mark_sensor_missed(missed_id, loco_id)
                sensor["consecutive_misses"] = 0
                sensor["health"] = "OK"
                sensor["passage_loco"] = loco_id if not skipped else None
                sensor["passage_motion"] = loco["motion"]
                sensor["passage_generation"] = loco["motion_generation"]
                if not skipped and not loco["segment_interrupted"] and loco["confirmed_at"]:
                    self.record_segment(loco_id, sensor_id, (time.monotonic() - loco["confirmed_at"]) * 1000)
                loco["segment_interrupted"] = bool(skipped)
                loco["route_index"] = index
                loco["last_sensor"] = sensor_id
                loco["confirmed_at"] = time.monotonic()
                loco["confidence"] = "INCERTA" if skipped else "CONFIRMADA"
                route = self.config["routes"][loco["route"]]
                next_index = index + 1
                if next_index >= len(route["sensors"]):
                    next_index = 0 if loco["route"] != "OFICINA" else index
                    if loco["route"] != "OFICINA":
                        loco["stats"]["routes_completed"] += 1
                loco["next_sensor"] = route["sensors"][next_index]
                loco["expected_segment_ms"] = self.segment_time(loco_id)
                reverse_route = loco["route"].endswith("_RE")
                if (not reverse_route and sensor_id in ("S06", "S07")):
                    self.set_passage_signals("YELLOW", f"{loco_id} aproximando-se")
                elif (not reverse_route and sensor_id == "S01") or (reverse_route and sensor_id == "S02"):
                    self.set_passage_signals("RED", f"{loco_id} ocupando a aproximação")
                elif (not reverse_route and sensor_id == "S02") or (reverse_route and sensor_id == "S01"):
                    self.set_passage_signals("GREEN", f"{loco_id} liberou a passagem")
                if loco.get("mission") == "OFICINA" and sensor_id == route.get("timed_stop_after"):
                    loco["office_stop_at"] = time.monotonic() + self.config["safety"]["office_stop_delay_ms"] / 1000
                for other_id in self.state["operation"]["active_ids"]:
                    other = self.state["locomotives"][other_id]
                    if other_id != loco_id and loco["motion"] != "STOP" and (
                        (other["last_sensor"] == loco["next_sensor"] and other["confidence"] != "DESCONHECIDA")
                        or (other["next_sensor"] == loco["next_sensor"] and other["motion"] != "STOP")
                    ):
                        self.command_locomotive(loco_id, "STOP")
                        loco["stop_reason"] = f"Próximo trecho reservado por {other['label']}"
                self.log("SENSOR", f"{sensor_id} confirmou posição", loco=loco_id)
            else:
                sensor["health"] = "SUSPEITO"
                self.state["alerts"].append({"time": now_iso(), "severity": "WARNING", "message": f"{sensor_id} acionado sem locomotiva esperada"})
                self.state["alerts"] = self.state["alerts"][-20:]
                self.log("SENSOR", f"{sensor_id} acionado fora da sequência", "WARNING")
        self.broadcast()

    def _mark_sensor_missed(self, sensor_id: str, loco_id: str):
        sensor = self.state["sensors"][sensor_id]
        sensor["misses"] += 1
        sensor["consecutive_misses"] += 1
        limit = int(self.config["safety"]["sensor_consecutive_failures"])
        sensor["health"] = "FALHA" if sensor["consecutive_misses"] >= limit else "SUSPEITO"
        self.state["locomotives"][loco_id]["confidence"] = "INCERTA"
        self.state["locomotives"][loco_id]["stop_reason"] = f"Sensor {sensor_id} não confirmou a passagem"
        self.state["locomotives"][loco_id]["motion"] = "STOP"
        self.state["alerts"].append({"time": now_iso(), "severity": "CRITICAL", "message": f"Leitura esperada não recebida em {sensor_id}"})
        self.log("SENSOR", f"{sensor_id} não confirmou a passagem", "CRITICAL", loco_id)
        self.send_loco(loco_id, "STOP")

    def on_arduino_line(self, line: str):
        parts = line.strip().split("|")
        if not parts:
            return
        with self.lock:
            self.state["arduino"]["connected"] = True
            self.state["arduino"]["last_seen"] = now_iso()
        kind = parts[0].upper()
        try:
            if kind == "SENSOR" and len(parts) >= 3:
                self.on_sensor(f"S{int(parts[1]):02d}", parts[2].upper() == "ACTIVE")
            elif kind == "SWITCH" and len(parts) >= 3:
                with self.lock:
                    self.state["switches"][parts[1].upper()] = parts[2].upper()
            elif kind == "SIGNAL" and len(parts) >= 3:
                with self.lock:
                    self.state["signals"]["F1_EXTERNO"] = parts[2].upper()
                    self.state["signals"]["F2_INTERNO"] = parts[2].upper()
            elif kind == "PASS" and len(parts) >= 3:
                self.on_passage(f"S{int(parts[1]):02d}", float(parts[2]))
            elif kind == "FAULT":
                self.log("ARDUINO", "|".join(parts[1:]), "ERROR")
        except Exception as exc:
            self.log("ARDUINO", f"Mensagem inválida: {line} ({exc})", "WARNING")
        self.broadcast()

    def on_udp(self, payload: str, address: tuple[str, int]):
        parts = payload.strip().split("|")
        if len(parts) < 2:
            return
        kind, loco_id = parts[0].upper(), parts[1].upper()
        if loco_id not in self.state["locomotives"]:
            now = time.monotonic()
            if now - self.last_unknown_loco_log > 10:
                self.last_unknown_loco_log = now
                self.log("COMUNICACAO", f"Pacote de locomotiva desconhecida {loco_id} em {address[0]}", "WARNING")
            return
        with self.lock:
            loco = self.state["locomotives"][loco_id]
            previous_ip = loco.get("ip")
            was_offline = not loco["connected"]
            loco["connected"] = True
            loco["ip"] = address[0]
            loco["last_seen_monotonic"] = time.monotonic()
            loco["last_seen"] = now_iso()
            if was_offline:
                self.log("COMUNICACAO", f"{loco_id} com telemetria ativa em {address[0]}", loco=loco_id)
            elif previous_ip and previous_ip not in (None, "simulado") and previous_ip != address[0]:
                self.log("COMUNICACAO", f"{loco_id} mudou de {previous_ip} para {address[0]} (verifique LOCO_ID duplicado)", "WARNING", loco_id)
            if kind == "STATUS" and len(parts) >= 7:
                loco["motion"] = parts[2].upper()
                loco["battery_mv"] = int(parts[3])
                loco["battery_pct"] = int(parts[4])
                current_min = loco["stats"].get("battery_min_pct")
                loco["stats"]["battery_min_pct"] = loco["battery_pct"] if current_min is None else min(current_min, loco["battery_pct"])
                loco["rssi"] = int(parts[5])
                fault = parts[6].upper()
                previous_fault = loco["fault"]
                loco["fault"] = None if fault == "NONE" else fault
                if loco["fault"]:
                    loco["operational_state"] = "FALHA"
                    loco["stop_reason"] = f"Falha reportada pela locomotiva: {loco['fault']}"
                    if loco["fault"] != previous_fault:
                        self.log("COMUNICACAO", f"{loco_id} reportou falha {loco['fault']}", "CRITICAL", loco_id)
                elif loco["operational_state"] == "FALHA":
                    loco["operational_state"] = "EM_MOVIMENTO" if loco["motion"] != "STOP" else "PARADA"
                    if previous_fault:
                        self.log("COMUNICACAO", f"{loco_id} sem falhas ativas", loco=loco_id)
            elif kind == "HELLO":
                if len(parts) >= 3:
                    loco["firmware_version"] = parts[2]
                if not was_offline:
                    self.log("COMUNICACAO", f"{loco_id} conectada em {address[0]}", loco=loco_id)
        self.broadcast()

    def background_loop(self):
        last_stats = time.monotonic()
        while not self.stop_event.wait(0.25):
            now = time.monotonic()
            if now - self.last_arduino_ping >= 1.0:
                self.last_arduino_ping = now
                self.send_arduino(f"PING|{self.next_sequence()}")
            if now - self.last_loco_ping >= 0.5:
                self.last_loco_ping = now
                for loco_id, loco in self.state["locomotives"].items():
                    if loco.get("connected"):
                        self.send_loco(loco_id, "PING")

            changed = False
            with self.lock:
                for loco_id, loco in self.state["locomotives"].items():
                    if loco["office_stop_at"] and now >= loco["office_stop_at"]:
                        loco["office_stop_at"] = None
                        self.send_loco(loco_id, "STOP")
                        loco["motion"] = "STOP"
                        loco["operational_state"] = "OFICINA"
                        loco["confidence"] = "ESTIMADA"
                        loco["stop_reason"] = "Chegada à oficina; confirme a posição visualmente"
                        self.log("OFICINA", "Parada temporizada concluída; confirmação visual necessária", "WARNING", loco_id)
                        changed = True
                    if not self.mock and loco["connected"] and now - loco["last_seen_monotonic"] > self.config["safety"]["locomotive_timeout_ms"] / 1000:
                        loco["connected"] = False
                        loco["motion"] = "STOP"
                        loco["operational_state"] = "FALHA"
                        loco["fault"] = "COMM_TIMEOUT"
                        loco["stop_reason"] = "Comunicação Wi-Fi perdida"
                        loco["stats"]["communication_losses"] += 1
                        self.log("COMUNICACAO", "Locomotiva sem telemetria", "CRITICAL", loco_id)
                        changed = True
                    if loco["motion"] != "STOP" and loco["confirmed_at"]:
                        max_ms = loco["expected_segment_ms"] * self.config["safety"]["sensor_timeout_multiplier"]
                        if (now - loco["confirmed_at"]) * 1000 > max_ms:
                            loco["confidence"] = "INCERTA"
                            self.send_loco(loco_id, "STOP")
                            loco["motion"] = "STOP"
                            loco["operational_state"] = "FALHA"
                            loco["stop_reason"] = f"Tempo excedido aguardando {loco['next_sensor']} ({max_ms / 1000:.1f} s)"
                            loco["stats"]["corrective_stops"] += 1
                            self.log("SEGURANCA", f"Tempo excedido aguardando {loco['next_sensor']}", "CRITICAL", loco_id)
                            changed = True
                if now - last_stats >= 1.0:
                    last_stats = now
                    for loco in self.state["locomotives"].values():
                        if self.state["session"]["active"]:
                            loco["stats"]["scheduled_seconds"] += 1
                            if loco["connected"] and loco["operational_state"] != "FALHA":
                                loco["stats"]["available_seconds"] += 1
                        if loco["motion"] != "STOP":
                            loco["stats"]["movement_seconds"] += 1
                        elif loco["operational_state"] == "AGUARDANDO":
                            loco["stats"]["waiting_seconds"] += 1
                    changed = True
            if changed:
                self.broadcast()

    def set_route_time(self, route_name: str, seconds: float):
        seconds = float(seconds)
        if route_name not in self.config["routes"] or not 1 <= seconds <= 120:
            raise ValueError("Informe um tempo entre 1 e 120 segundos e uma rota válida")
        with self.lock:
            if any(loco["motion"] != "STOP" for loco in self.state["locomotives"].values()):
                raise ValueError("Pare as locomotivas antes de ajustar os tempos")
            cal = self.state["calibration"]
            route_times = dict(cal["route_times"])
            route_times[route_name] = round(seconds * 1000)
            temporary = self.calibration_path.with_suffix(".tmp")
            temporary.parent.mkdir(parents=True, exist_ok=True)
            temporary.write_text(json.dumps({"profiles": cal["profiles"], "segments": cal["segments"], "route_times": route_times}, ensure_ascii=False, indent=2), encoding="utf-8")
            os.replace(temporary, self.calibration_path)
            cal["route_times"] = route_times
            for loco_id, loco in self.state["locomotives"].items():
                if loco["route"] == route_name:
                    loco["expected_segment_ms"] = self.segment_time(loco_id)
        self.log("CALIBRACAO", f"Tempo de referência de {route_name}: {seconds:g} s (trechos já calibrados mantêm sua medição)")

    def select_pair(self, simple: str):
        with self.lock:
            if simple not in ("L02", "L03"):
                raise ValueError("Selecione LC02 ou LC03")
            if self.state["calibration"]["active"]:
                raise ValueError("Encerre a calibração antes de trocar a simples")
            if any(loco["motion"] != "STOP" for loco in self.state["locomotives"].values()):
                raise ValueError("Pare as locomotivas antes de trocar a simples")
            previous_ids = self.state["operation"]["active_ids"]
            active_ids = ["L01", simple]
            for loco_id, loco in self.state["locomotives"].items():
                if loco_id not in active_ids or loco_id not in previous_ids:
                    loco.update(last_sensor=None, next_sensor="S03", route_index=-1,
                                confidence="DESCONHECIDA", confirmed_at=None,
                                operational_state="DISPONIVEL" if loco_id in active_ids else "FORA_DA_MALHA")
            self.state["operation"] = {"simple": simple, "active_ids": active_ids}
        self.log("OPERACAO", f"Dupla LC01 e simples {simple.replace('L', 'LC', 1)} selecionadas")

    def segment_time(self, loco_id: str) -> float:
        loco = self.state["locomotives"][loco_id]
        key = f"{loco_id}:{loco['route']}:{loco['last_sensor']}:{loco['next_sensor']}"
        return self.state["calibration"]["segments"].get(key, self.state["calibration"]["route_times"].get(loco["route"], self.config["routes"][loco["route"]]["expected_segment_ms"]))

    def record_segment(self, loco_id: str, sensor_id: str, duration_ms: float):
        cal = self.state["calibration"]
        if cal["active"] and cal["loco"] == loco_id and 300 <= duration_ms <= 120000:
            loco = self.state["locomotives"][loco_id]
            key = f"{loco_id}:{loco['route']}:{loco['last_sensor']}:{sensor_id}"
            values = cal["pending_segments"].setdefault(key, [])
            values.append(round(duration_ms))

    def calibration_command(self, action: str, loco_id: str = "L01", sensor_id: str = "S03", track_clear: bool = False):
        with self.lock:
            cal = self.state["calibration"]
            if action == "START":
                if cal["active"]:
                    raise ValueError("Já existe uma calibração em andamento")
                if loco_id not in self.state["operation"]["active_ids"] or sensor_id not in self.state["sensors"]:
                    raise ValueError("Escolha uma locomotiva ativa e um sensor válido")
                if any(loco["motion"] != "STOP" for loco in self.state["locomotives"].values()):
                    raise ValueError("Pare as locomotivas antes de calibrar")
                if any(sensor["active"] for sensor in self.state["sensors"].values()):
                    raise ValueError("Libere os sensores antes de iniciar a calibração")
                if track_clear is not True:
                    raise ValueError("Retire a outra locomotiva da via e confirme a pista livre para calibrar")
                for other_id in self.state["operation"]["active_ids"]:
                    if other_id != loco_id:
                        self.state["locomotives"][other_id].update(last_sensor=None, route_index=-1,
                            confidence="DESCONHECIDA", confirmed_at=None, operational_state="FORA_DA_MALHA")
                cal.update(active=True, loco=loco_id, sensor=sensor_id, samples=[], pending_segments={},
                           message="Faça 3 ou mais passagens contínuas, na mesma velocidade e sem vagões. Depois pare e salve.")
            elif action in ("SAVE", "CANCEL"):
                if not cal["active"]:
                    raise ValueError("Não há calibração em andamento")
                if any(loco["motion"] != "STOP" for loco in self.state["locomotives"].values()):
                    raise ValueError("Pare a locomotiva antes de encerrar a calibração")
                if any(sensor["active"] for sensor in self.state["sensors"].values()):
                    raise ValueError("Libere os sensores antes de encerrar a calibração")
                if action == "SAVE":
                    samples = cal["samples"]
                    if len(samples) < 3:
                        raise ValueError("São necessárias pelo menos 3 passagens válidas")
                    mean = sum(samples) / len(samples)
                    if max(samples) > mean * 1.25 or min(samples) < mean * .75:
                        raise ValueError("Tempos variaram demais. Cancele e repita em velocidade constante")
                    profile = {"mean_ms": round(mean), "min_ms": round(mean * .75),
                               "max_ms": round(mean * 1.25), "count": len(samples), "updated_at": now_iso()}
                    profiles = copy.deepcopy(cal["profiles"])
                    profiles.setdefault(cal["sensor"], {})[cal["loco"]] = profile
                    pair = profiles[cal["sensor"]]
                    other_id = self.state["operation"]["simple"] if cal["loco"] == "L01" else "L01"
                    other = pair.get(other_id)
                    if other and ((cal["loco"] == "L01" and profile["mean_ms"] <= other["mean_ms"])
                                  or (cal["loco"] != "L01" and profile["mean_ms"] >= other["mean_ms"])):
                        raise ValueError("A dupla deve ter duração maior que a simples. Confira a locomotiva e a velocidade")
                    if other and max(profile["min_ms"], other["min_ms"]) <= min(profile["max_ms"], other["max_ms"]):
                        raise ValueError("Faixas da dupla e simples se sobrepõem. Não é possível identificar com confiança")
                    segments = copy.deepcopy(cal["segments"])
                    for key, values in cal["pending_segments"].items():
                        if len(values) >= 3:
                            segments[key] = round(sum(values) / len(values))
                    self.calibration_path.parent.mkdir(parents=True, exist_ok=True)
                    temporary = self.calibration_path.with_suffix(".tmp")
                    temporary.write_text(json.dumps({"profiles": profiles, "segments": segments, "route_times": cal["route_times"]}, ensure_ascii=False, indent=2), encoding="utf-8")
                    os.replace(temporary, self.calibration_path)
                    cal.update(profiles=profiles, segments=segments)
                cal.update(active=False, message="Calibração salva" if action == "SAVE" else "Calibração cancelada; valores anteriores preservados")
            else:
                raise ValueError("Ação de calibração inválida")
        self.log("CALIBRACAO", cal["message"])

    def on_passage(self, sensor_id: str, duration_ms: float):
        if sensor_id not in self.state["sensors"] or not 30 <= duration_ms <= 60000:
            raise ValueError("Tempo de passagem inválido")
        with self.lock:
            sensor = self.state["sensors"][sensor_id]
            loco_id = sensor.pop("passage_loco", None)
            sensor["duration_ms"] = round(duration_ms)
            cal = self.state["calibration"]
            valid = (loco_id and self.state["locomotives"][loco_id]["motion"] == sensor.get("passage_motion")
                     and self.state["locomotives"][loco_id]["motion"] != "STOP"
                     and self.state["locomotives"][loco_id]["motion_generation"] == sensor.get("passage_generation")
                     and self.state["locomotives"][loco_id]["confidence"] == "CONFIRMADA")
            if cal["active"] and cal["sensor"] == sensor_id:
                if valid and loco_id == cal["loco"]:
                    cal["samples"].append(round(duration_ms))
                    cal["samples"] = cal["samples"][-20:]
                    cal["message"] = f"{len(cal['samples'])} passagens coletadas em {sensor_id}"
                else:
                    cal["message"] = "Leitura descartada: mantenha a locomotiva em movimento contínuo na sequência da rota"
            profiles = cal["profiles"].get(sensor_id, {})
            active_ids = self.state["operation"]["active_ids"]
            matches = [key for key in active_ids if key in profiles and profiles[key]["min_ms"] <= duration_ms <= profiles[key]["max_ms"]]
            identified = matches[0] if all(key in profiles for key in active_ids) and len(matches) == 1 else None
            sensor["identity"] = identified
            sensor["identity_status"] = "COMPATIVEL" if valid and identified == loco_id else "INCERTA"
            if not cal["active"] and identified and valid and identified != loco_id:
                self.state["locomotives"][loco_id]["confidence"] = "INCERTA"
                self.state["locomotives"][loco_id]["stop_reason"] = f"Identificação por tempo divergiu em {sensor_id}; confirme a posição"
                self.command_locomotive(loco_id, "STOP")
                self.state["locomotives"][loco_id]["stop_reason"] = f"Identificação por tempo divergiu em {sensor_id}; confirme a posição"
                self.log("IDENTIFICACAO", "Tempo incompatível com a locomotiva esperada; identidade preservada", "WARNING", loco_id)
        self.broadcast()

    def report_csv(self) -> bytes:
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        writer.writerow(["Locomotiva", "Estado", "Bateria (%)", "Bateria mínima (%)", "Utilização (%)", "Disponibilidade física (%)", "Tempo em movimento (s)", "Tempo aguardando (s)", "Rotas", "Trocas de bateria", "Paradas corretivas", "Perdas de comunicação"])
        with self.lock:
            for loco_id, loco in self.state["locomotives"].items():
                stats = loco["stats"]
                scheduled = max(1, stats["scheduled_seconds"])
                utilization = round(100 * stats["movement_seconds"] / scheduled, 1)
                availability = round(100 * stats["available_seconds"] / scheduled, 1)
                writer.writerow([loco_id, loco["operational_state"], loco["battery_pct"], stats["battery_min_pct"], utilization, availability, stats["movement_seconds"], stats["waiting_seconds"], stats["routes_completed"], stats["battery_swaps"], stats["corrective_stops"], stats["communication_losses"]])
        return ("\ufeff" + output.getvalue()).encode("utf-8")

    def report_html(self) -> bytes:
        snapshot = self.snapshot()
        rows = []
        for loco_id, loco in snapshot["locomotives"].items():
            stats = loco["stats"]
            scheduled = max(1, stats["scheduled_seconds"])
            utilization = round(100 * stats["movement_seconds"] / scheduled, 1)
            availability = round(100 * stats["available_seconds"] / scheduled, 1)
            rows.append(
                f"<tr><td>{loco_id}</td><td>{html.escape(loco['operational_state'])}</td>"
                f"<td>{loco['battery_pct'] if loco['battery_pct'] is not None else '-'}</td>"
                f"<td>{stats['battery_min_pct'] if stats['battery_min_pct'] is not None else '-'}</td>"
                f"<td>{utilization}%</td><td>{availability}%</td>"
                f"<td>{stats['movement_seconds']}</td><td>{stats['waiting_seconds']}</td>"
                f"<td>{stats['routes_completed']}</td><td>{stats['battery_swaps']}</td><td>{stats['corrective_stops']}</td>"
                f"<td>{stats['communication_losses']}</td></tr>"
            )
        sensor_rows = "".join(
            f"<tr><td>{sid}</td><td>{s['description']}</td><td>{s['health']}</td><td>{s['hits']}</td><td>{s['misses']}</td></tr>"
            for sid, s in snapshot["sensors"].items()
        )
        page = f"""<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>Relatório CCO</title>
<style>body{{font:14px Arial;margin:32px;color:#17323d}}h1,h2{{color:#0f536a}}table{{border-collapse:collapse;width:100%;margin:12px 0 28px}}th,td{{border-bottom:1px solid #bccbd0;padding:8px;text-align:left}}th{{background:#eaf2f4}}.meta{{display:flex;gap:32px}}</style></head>
<body><h1>Relatório de funcionamento - CCO Ferrovia</h1><div class='meta'><p><b>Operador:</b> {html.escape(snapshot.get('operator') or '-')}</p><p><b>Gerado:</b> {now_iso()}</p><p><b>Início:</b> {snapshot['session'].get('started_at') or '-'}</p></div>
<h2>Locomotivas</h2><table><tr><th>ID</th><th>Estado</th><th>Bateria %</th><th>Mínima %</th><th>Utilização</th><th>Disponibilidade</th><th>Movimento s</th><th>Espera s</th><th>Rotas</th><th>Trocas de bateria</th><th>Paradas corretivas</th><th>Falhas de comunicação</th></tr>{''.join(rows)}</table>
<h2>Sensores</h2><table><tr><th>Sensor</th><th>Localização</th><th>Saúde</th><th>Leituras</th><th>Falhas</th></tr>{sensor_rows}</table></body></html>"""
        return page.encode("utf-8")


class SerialWorker(threading.Thread):
    daemon = True

    def __init__(self, system: CCOSystem):
        super().__init__(name="arduino-serial")
        self.system = system

    def run(self):
        if self.system.mock:
            return
        try:
            import serial
            from serial.tools import list_ports
        except ImportError:
            self.system.log("ARDUINO", "pyserial não instalado; comunicação USB desativada", "ERROR")
            return
        reported_ports: set[str] = set()
        last_port_warning = 0.0
        while not self.system.stop_event.is_set():
            port_name = self.system.config["serial"]["port"]
            if port_name == "AUTO":
                ports = list(list_ports.comports())
                if not ports:
                    if time.monotonic() - last_port_warning > 10:
                        last_port_warning = time.monotonic()
                        self.system.log("ARDUINO", "Nenhuma porta serial encontrada; verifique o cabo USB", "WARNING")
                    time.sleep(2)
                    continue
                preferred = [
                    p for p in ports
                    if any(
                        key in ((p.description or "") + " " + (p.hwid or "")).lower()
                        for key in ("arduino", "ch340", "ch341", "usb serial", "usb-serial", "ft232")
                    )
                ]
                chosen = (preferred or ports)[0]
                port_name = chosen.device
                if port_name not in reported_ports:
                    reported_ports.add(port_name)
                    self.system.log("ARDUINO", f"Porta detectada: {port_name} ({chosen.description})")
            if not port_name:
                time.sleep(2)
                continue
            try:
                with serial.Serial(port_name, self.system.config["serial"]["baud"], timeout=0.15) as connection:
                    with self.system.lock:
                        self.system.state["arduino"].update({"connected": True, "port": port_name, "last_seen": now_iso()})
                    self.system.log("ARDUINO", f"Conectado em {port_name}")
                    while not self.system.stop_event.is_set():
                        try:
                            while True:
                                connection.write(self.system.serial_write.get_nowait().encode("ascii", "ignore"))
                        except queue.Empty:
                            pass
                        line = connection.readline().decode("utf-8", "replace").strip()
                        if line:
                            self.system.on_arduino_line(line)
            except Exception as exc:
                with self.system.lock:
                    self.system.state["arduino"]["connected"] = False
                self.system.log("ARDUINO", f"{port_name}: {exc}", "WARNING")
                time.sleep(2)


class UDPWorker(threading.Thread):
    daemon = True

    def __init__(self, system: CCOSystem):
        super().__init__(name="locomotive-udp")
        self.system = system

    def run(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.bind(("0.0.0.0", int(self.system.config["udp"]["listen_port"])))
        sock.settimeout(0.5)
        self.system.udp_socket = sock
        while not self.system.stop_event.is_set():
            try:
                data, address = sock.recvfrom(1024)
                self.system.on_udp(data.decode("ascii", "replace"), address)
            except socket.timeout:
                continue
            except OSError:
                break


class CCOHandler(BaseHTTPRequestHandler):
    server_version = "CCOFerrovia/0.1"

    @property
    def system(self) -> CCOSystem:
        return self.server.system  # type: ignore[attr-defined]

    def log_message(self, format, *args):
        return

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionAbortedError, ConnectionResetError):
            self.close_connection = True

    def send_bytes(self, body: bytes, content_type: str, status: int = 200, filename: str | None = None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def json_response(self, payload, status=200):
        self.send_bytes(json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", status)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            return self.json_response(self.system.snapshot())
        if path == "/api/events":
            return self.handle_sse()
        if path == "/api/reports/current.csv":
            return self.send_bytes(self.system.report_csv(), "text/csv; charset=utf-8", filename="relatorio-cco.csv")
        if path == "/api/reports/current.html":
            return self.send_bytes(self.system.report_html(), "text/html; charset=utf-8")
        if path == "/":
            path = "/index.html"
        target = (PUBLIC / path.lstrip("/")).resolve()
        if PUBLIC.resolve() not in target.parents or not target.is_file():
            return self.send_error(HTTPStatus.NOT_FOUND)
        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        return self.send_bytes(target.read_bytes(), mime)

    def handle_sse(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        subscriber: queue.Queue[str] = queue.Queue(maxsize=8)
        self.system.subscribers.append(subscriber)
        try:
            self.wfile.write(f"data: {json.dumps(self.system.snapshot(), ensure_ascii=False)}\n\n".encode("utf-8"))
            self.wfile.flush()
            while not self.system.stop_event.is_set():
                try:
                    payload = subscriber.get(timeout=15)
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                except queue.Empty:
                    self.wfile.write(b": keepalive\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass
        finally:
            try:
                self.system.subscribers.remove(subscriber)
            except ValueError:
                pass

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = self.read_json()
            parts = [part for part in path.split("/") if part]
            if path == "/api/operation":
                self.system.select_pair(body.get("simple", "L02"))
            elif path == "/api/timing":
                self.system.set_route_time(body.get("route", ""), body.get("seconds", 0))
            elif path == "/api/calibration":
                self.system.calibration_command(body.get("action", ""), body.get("loco", "L01"), body.get("sensor", "S03"), body.get("track_clear", False))
            elif path == "/api/operator":
                self.system.set_operator(body.get("name", ""))
            elif path == "/api/session/start":
                self.system.start_session()
            elif path == "/api/session/end":
                self.system.end_session()
            elif path == "/api/emergency":
                self.system.emergency(bool(body.get("active", True)))
            elif len(parts) == 4 and parts[:2] == ["api", "locomotives"] and parts[3] == "command":
                self.system.command_locomotive(parts[2].upper(), body.get("action", ""))
            elif len(parts) == 4 and parts[:2] == ["api", "locomotives"] and parts[3] == "route":
                self.system.configure_route(parts[2].upper(), body.get("route", ""))
            elif len(parts) == 4 and parts[:2] == ["api", "locomotives"] and parts[3] == "priority":
                self.system.set_priority(parts[2].upper(), body.get("priority", "NORMAL"))
            elif len(parts) == 4 and parts[:2] == ["api", "locomotives"] and parts[3] == "position":
                self.system.confirm_position(parts[2].upper(), body.get("sensor", ""))
            elif len(parts) == 4 and parts[:2] == ["api", "locomotives"] and parts[3] == "maintenance":
                self.system.register_maintenance(parts[2].upper(), body.get("action", ""))
            elif len(parts) == 3 and parts[:2] == ["api", "switches"]:
                self.system.set_switch(parts[2].upper(), body.get("position", ""))
            elif len(parts) == 3 and parts[:2] == ["api", "signals"]:
                self.system.set_signal(parts[2].upper(), body.get("color", ""))
            elif len(parts) == 4 and parts[:3] == ["api", "mock", "sensor"] and self.system.mock:
                self.system.on_sensor(parts[3].upper(), bool(body.get("active", True)))
            elif path == "/api/mock/reset" and self.system.mock:
                with self.system.lock:
                    self.system.state = self.system._initial_state()
                    self.system.events = []
                self.system.broadcast()
            else:
                return self.json_response({"ok": False, "error": "Rota de API não encontrada"}, 404)
            return self.json_response({"ok": True, "state": self.system.snapshot()})
        except (ValueError, KeyError) as exc:
            return self.json_response({"ok": False, "error": str(exc)}, 400)
        except Exception as exc:
            return self.json_response({"ok": False, "error": f"Erro interno: {exc}"}, 500)


class CCOHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    parser = argparse.ArgumentParser(description="Servidor local do CCO Ferrovia")
    parser.add_argument("--mock", action="store_true", help="Simula Arduino e locomotivas")
    parser.add_argument("--port", type=int, help="Porta HTTP")
    args = parser.parse_args()
    config = load_json(CONFIG_PATH)
    if args.port:
        config["http_port"] = args.port
    system = CCOSystem(config, mock=args.mock)
    system.log("SISTEMA", f"Servidor CCO iniciado em modo {'SIMULAÇÃO' if args.mock else 'HARDWARE'}")
    SerialWorker(system).start()
    UDPWorker(system).start()
    threading.Thread(target=system.background_loop, name="cco-watchdog", daemon=True).start()
    server = CCOHTTPServer(("127.0.0.1", int(config["http_port"])), CCOHandler)
    server.system = system  # type: ignore[attr-defined]
    print(f"CCO disponível em http://127.0.0.1:{config['http_port']}  modo={'SIMULAÇÃO' if args.mock else 'HARDWARE'}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        system.stop_event.set()
        server.server_close()


if __name__ == "__main__":
    main()
