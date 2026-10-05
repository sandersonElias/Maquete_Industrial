import copy
import importlib.util
import tempfile
import unittest
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
        for loco_id, sensor_id in (("L01", "S03"), ("L02", "S04"), ("L03", "S06")):
            self.system.confirm_position(loco_id, sensor_id)
        self.system.command_locomotive("L01", "FORWARD")
        self.system.command_locomotive("L02", "FORWARD")
        with self.assertRaisesRegex(ValueError, "Limite de duas"):
            self.system.command_locomotive("L03", "FORWARD")

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
