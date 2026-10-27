import copy
import importlib.util
import tempfile
import unittest
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("cco_server", ROOT / "cco_server.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class CCOTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        config = MODULE.load_json(ROOT / "config.json")
        config["calibration_path"] = str(Path(self.temp_dir.name) / "calibration.json")
        self.system = MODULE.CCOSystem(copy.deepcopy(config), mock=True)
        self.system.event_file = Path(self.temp_dir.name) / "events.jsonl"
        self.system.events = []
        self.system.set_operator("Teste automático")
        self.system.start_session()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_bloqueia_partida_sem_posicao(self):
        with self.assertRaisesRegex(ValueError, "Confirme a posição"):
            self.system.command_locomotive("L01", "FORWARD")

    def test_para_ao_pular_sensor(self):
        self.system.confirm_position("L01", "S01")
        self.system.command_locomotive("L01", "FORWARD")
        self.system.on_sensor("S03", True)
        loco = self.system.state["locomotives"]["L01"]
        self.assertEqual(loco["motion"], "STOP")
        self.assertEqual(loco["confidence"], "INCERTA")
        self.assertEqual(self.system.state["sensors"]["S02"]["misses"], 1)

    def test_limita_duas_locomotivas_em_movimento(self):
        for loco_id, sensor_id in (("L01", "S03"), ("L02", "S06"), ("L03", "S02")):
            self.system.confirm_position(loco_id, sensor_id)
        self.system.command_locomotive("L01", "FORWARD")
        self.system.command_locomotive("L02", "FORWARD")
        with self.assertRaisesRegex(ValueError, "Locomotiva reserva"):
            self.system.command_locomotive("L03", "FORWARD")

    def test_reconhece_locomotiva_pelo_hello_wifi(self):
        self.system.state["locomotives"]["L01"]["connected"] = False
        self.system.state["locomotives"]["L01"]["ip"] = None
        self.system.on_udp("HELLO|L01|2", ("192.168.137.10", 4211))
        loco = self.system.state["locomotives"]["L01"]
        self.assertTrue(loco["connected"])
        self.assertEqual(loco["ip"], "192.168.137.10")
        self.assertEqual(loco["firmware_version"], "2")

    def test_automatiza_semaforos_combinados_da_passagem(self):
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "FORWARD")
        self.system.on_sensor("S04", True)
        self.system.on_sensor("S06", True)
        self.assertEqual(self.system.state["signals"]["F1_EXTERNO"], "YELLOW")
        self.assertEqual(self.system.state["signals"]["F2_INTERNO"], "YELLOW")
        self.system.on_sensor("S01", True)
        self.assertEqual(self.system.state["signals"]["F1_EXTERNO"], "RED")
        self.assertEqual(self.system.state["signals"]["F2_INTERNO"], "RED")
        self.system.on_sensor("S02", True)
        self.assertEqual(self.system.state["signals"]["F1_EXTERNO"], "GREEN")
        self.assertEqual(self.system.state["signals"]["F2_INTERNO"], "GREEN")


    def test_troca_simples_somente_com_todas_paradas(self):
        self.system.select_pair("L03")
        self.assertEqual(self.system.state["operation"]["active_ids"], ["L01", "L03"])
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "FORWARD")
        with self.assertRaisesRegex(ValueError, "Pare as locomotivas"):
            self.system.select_pair("L02")

    def test_partida_reinicia_prazo_do_sensor(self):
        self.system.confirm_position("L01", "S03")
        self.system.state["locomotives"]["L01"]["confirmed_at"] = time.monotonic() - 100
        before = time.monotonic()
        self.system.command_locomotive("L01", "FORWARD")
        self.assertGreaterEqual(self.system.state["locomotives"]["L01"]["confirmed_at"], before)

    def test_re_alinha_rota_ao_sentido(self):
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "REVERSE")
        loco = self.system.state["locomotives"]["L01"]
        self.assertEqual(loco["route"], "PLANO_RE")
        self.assertEqual(loco["next_sensor"], "S02")

    def test_bloqueia_destino_ocupado(self):
        self.system.confirm_position("L01", "S03")
        self.system.confirm_position("L02", "S04")
        with self.assertRaisesRegex(ValueError, "reservado"):
            self.system.command_locomotive("L01", "FORWARD")

    def test_sensor_nao_repete_passagem_enquanto_ocupado(self):
        self.system.on_sensor("S03", True)
        self.system.on_sensor("S03", True)
        self.assertEqual(self.system.state["sensors"]["S03"]["hits"], 1)

    def collect(self, loco_id="L01", durations=(2000, 2100, 1900)):
        for other_id in self.system.state["operation"]["active_ids"]:
            if other_id != loco_id:
                self.system.confirm_position(other_id, "S02")
        self.system.calibration_command("START", loco_id, "S04", track_clear=True)
        self.system.confirm_position(loco_id, "S03")
        self.system.command_locomotive(loco_id, "FORWARD")
        for duration in durations:
            loco = self.system.state["locomotives"][loco_id]
            # Arrange a new lap at S03; the actual reading uses the serial parser.
            loco.update(route_index=0, last_sensor="S03", next_sensor="S04", confidence="CONFIRMADA")
            self.system.on_arduino_line("SENSOR|4|ACTIVE|100")
            self.system.on_arduino_line(f"PASS|4|{duration}")
            self.system.on_arduino_line("SENSOR|4|CLEAR|3000")
        self.system.command_locomotive(loco_id, "STOP")

    def test_calibra_salva_e_recarrega(self):
        self.collect()
        self.system.calibration_command("SAVE")
        profile = self.system.state["calibration"]["profiles"]["S04"]["L01"]
        self.assertEqual(profile["mean_ms"], 2000)
        restored = MODULE.CCOSystem(copy.deepcopy(self.system.config), mock=True)
        self.assertEqual(restored.state["calibration"]["profiles"]["S04"]["L01"], profile)

    def test_calibracao_rejeita_poucas_amostras(self):
        self.collect(durations=(2000,))
        with self.assertRaisesRegex(ValueError, "3 passagens"):
            self.system.calibration_command("SAVE")

    def test_calibracao_rejeita_variacao_e_sobreposicao(self):
        self.collect(durations=(1000, 2000, 4000))
        with self.assertRaisesRegex(ValueError, "variaram"):
            self.system.calibration_command("SAVE")
        self.system.calibration_command("CANCEL")
        self.collect()
        self.system.calibration_command("SAVE")
        self.collect("L02", (1900, 2000, 2100))
        with self.assertRaisesRegex(ValueError, "sobrepõem|duração maior"):
            self.system.calibration_command("SAVE")

    def test_calibracao_exige_confirmar_pista_livre(self):
        with self.assertRaisesRegex(ValueError, "Retire"):
            self.system.calibration_command("START", "L01", "S04")

    def test_calibracao_exclusiva_e_cancelamento(self):
        self.system.calibration_command("START", "L01", "S04", track_clear=True)
        self.system.confirm_position("L02", "S06")
        with self.assertRaisesRegex(ValueError, "Somente"):
            self.system.command_locomotive("L02", "FORWARD")
        self.system.calibration_command("CANCEL")
        self.assertFalse(self.system.state["calibration"]["active"])
        self.assertFalse(self.system.calibration_path.exists())

    def test_passagem_interrompida_nao_calibra(self):
        self.system.calibration_command("START", "L01", "S04", track_clear=True)
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "FORWARD")
        self.system.on_sensor("S04", True)
        self.system.command_locomotive("L01", "STOP")
        self.system.command_locomotive("L01", "FORWARD")
        self.system.on_passage("S04", 2000)
        self.assertEqual(self.system.state["calibration"]["samples"], [])

    def test_classificacao_nao_troca_identidade(self):
        cal = self.system.state["calibration"]
        cal["profiles"]["S04"] = {"L01": {"min_ms": 1500, "max_ms": 2500}, "L02": {"min_ms": 700, "max_ms": 1200}}
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "FORWARD")
        self.system.on_sensor("S04", True)
        self.system.on_passage("S04", 1000)
        self.assertEqual(self.system.state["sensors"]["S04"]["identity"], "L02")
        self.assertEqual(self.system.state["locomotives"]["L01"]["motion"], "STOP")
        self.assertEqual(self.system.state["locomotives"]["L02"]["last_sensor"], None)

    def test_troca_simples_remove_posicao_da_reserva(self):
        self.system.confirm_position("L02", "S04")
        self.system.select_pair("L03")
        self.assertIsNone(self.system.state["locomotives"]["L02"]["last_sensor"])
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "FORWARD")

    def test_para_antes_de_entrar_em_trecho_reservado(self):
        self.system.confirm_position("L01", "S03")
        self.system.confirm_position("L02", "S06")
        self.system.command_locomotive("L01", "FORWARD")
        self.system.on_sensor("S04", True)
        self.assertEqual(self.system.state["locomotives"]["L01"]["motion"], "STOP")
        self.assertIn("reservado", self.system.state["locomotives"]["L01"]["stop_reason"])

    def test_tempo_percurso_validado_e_persistente(self):
        self.system.set_route_time("PLANO_FRENTE", 20)
        self.system.confirm_position("L01", "S03")
        self.system.command_locomotive("L01", "FORWARD")
        self.assertEqual(self.system.state["locomotives"]["L01"]["expected_segment_ms"], 20000)
        with self.assertRaisesRegex(ValueError, "Pare"):
            self.system.set_route_time("PLANO_FRENTE", 30)
        restored = MODULE.CCOSystem(copy.deepcopy(self.system.config), mock=True)
        self.assertEqual(restored.state["calibration"]["route_times"]["PLANO_FRENTE"], 20000)

    def test_tempos_de_trecho_so_aprendem_em_calibracao(self):
        cal = self.system.state["calibration"]
        self.system.record_segment("L01", "S04", 9000)
        self.assertEqual(cal["pending_segments"], {})
        self.system.calibration_command("START", "L01", "S04", track_clear=True)
        self.system.state["locomotives"]["L01"]["last_sensor"] = "S03"
        for value in (9000, 9100, 8900):
            self.system.record_segment("L01", "S04", value)
        cal["samples"] = [2000, 2000, 2000]
        self.system.calibration_command("SAVE")
        self.assertEqual(cal["segments"]["L01:PLANO_FRENTE:S03:S04"], 9000)


if __name__ == "__main__":
    unittest.main(verbosity=2)
