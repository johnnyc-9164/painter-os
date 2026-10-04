"""Run with: python3 -m unittest discover -s tests -p 'test_composition.py'."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from validate_composition import CompositionError, load_json, validate_composition


class CompositionTests(unittest.TestCase):
    def setUp(self):
        self.ir = load_json(ROOT / "model/product.composition.json")
        self.registry = load_json(ROOT / "model/component-registry.json")

    def validate(self, ir=None, registry=None):
        return validate_composition(
            self.ir if ir is None else ir,
            self.registry if registry is None else registry,
            ROOT,
        )

    def rejects(self, change, message):
        bad = copy.deepcopy(self.ir)
        change(bad)
        with self.assertRaisesRegex(CompositionError, message):
            self.validate(bad)

    def test_example_contains_exactly_real_core_and_nine_trades(self):
        plan = self.validate()
        self.assertEqual(len(plan["mounts"]), 10)
        self.assertEqual(plan["mounts"][0]["component"], "core")
        self.assertEqual(
            {m["component"] for m in plan["mounts"]},
            {"core", *load_json(ROOT / "model/trades.ir.json")["trades"]},
        )

    def test_host_bindings_and_constructor_order(self):
        plan = self.validate()
        painting = next(m for m in plan["mounts"] if m["component"] == "painting")
        self.assertEqual(painting["client"]["constructor"], "PaintingClient")
        self.assertEqual(painting["client"]["arguments"], [
            "components.contractorPainting", "components.contractorOs", "host.membership",
        ])
        self.assertEqual(plan["mounts"][0]["options"]["env"]["MODE"], "development")

    def test_order_does_not_change_plan(self):
        changed = copy.deepcopy(self.ir)
        changed["components"].reverse()
        changed["configPacks"].reverse()
        for pack in changed["configPacks"]:
            pack["applyTo"].reverse()
        self.assertEqual(self.validate(changed), self.validate())

    def test_core_only_and_single_trade_products(self):
        for selected in ({"core"}, {"core", "painting"}):
            changed = copy.deepcopy(self.ir)
            changed["components"] = [c for c in changed["components"] if c["ref"] in selected]
            for pack in changed["configPacks"]:
                pack["applyTo"] = [ref for ref in pack["applyTo"] if ref in selected]
            changed["configPacks"] = [p for p in changed["configPacks"] if p["applyTo"]]
            changed["ui"]["bindings"] = [b for b in changed["ui"]["bindings"] if b["componentRef"] in selected]
            self.assertEqual(len(self.validate(changed)["mounts"]), len(selected))

    def test_unknown_component_and_config_as_component_rejected(self):
        for unknown in ("dispatch", "scorecards"):
            self.rejects(lambda ir: ir["components"][1].update(component=unknown), "Unknown component")

    def test_unknown_keys_are_rejected(self):
        self.rejects(lambda ir: ir.update(componentsExtra=[]), "Unknown.*keys")
        self.rejects(lambda ir: ir["components"][1].update(enabled=True), "Unknown.*keys")
        self.rejects(lambda ir: ir["components"][1]["config"].update(rate=10), "config")
        self.rejects(lambda ir: ir["components"][0]["config"]["env"].update(SECRET="x"), "keys")

    def test_config_and_versions_fail_closed(self):
        self.rejects(lambda ir: ir["components"][0]["config"]["env"].update(MODE="staging"), "MODE")
        self.rejects(lambda ir: ir["components"][0].update(version="latest"), "version")
        self.rejects(lambda ir: ir["configPacks"][0].update(version="0.0.0"), "version")
        self.rejects(lambda ir: ir["configPacks"][0].update(mode="disabled"), "mode")

    def test_refs_dependencies_and_binding_targets_rejected(self):
        self.rejects(lambda ir: ir["components"][1].update(dependsOn=[]), "depend")
        self.rejects(lambda ir: ir["components"][1].update(dependsOn=["missing"]), "depend")
        self.rejects(lambda ir: ir["components"][1]["bindings"].pop("core"), "binding")
        self.rejects(lambda ir: ir["components"][1]["bindings"].update(core="roofing"), "core")
        self.rejects(lambda ir: ir["components"][1]["bindings"].update(core="missing"), "core")
        self.rejects(lambda ir: ir["components"][1]["bindings"].update(membership="host.other"), "membership")

    def test_duplicate_mounts_refs_and_components_rejected(self):
        self.rejects(lambda ir: ir["components"][1].update(ref="core"), "Duplicate")
        self.rejects(lambda ir: ir["components"][1].update(mount="contractorOs"), "Duplicate")
        self.rejects(lambda ir: ir["components"][2].update(component="painting"), "Duplicate")
        self.rejects(lambda ir: ir["components"][1].update(mount="foo.bar"), "mount")

    def test_core_and_packs_required(self):
        self.rejects(lambda ir: ir["components"].pop(0), "core")
        self.rejects(lambda ir: ir["configPacks"].clear(), "Missing config")
        self.rejects(lambda ir: ir["configPacks"][0].update(pack="imaginary"), "Unknown config")
        self.rejects(lambda ir: ir["configPacks"][0].update(applyTo=["missing"]), "Unknown.*ref")
        self.rejects(lambda ir: ir["configPacks"][0].update(applyTo=["painting"]), "applicable")
        self.rejects(lambda ir: ir["configPacks"].append(copy.deepcopy(ir["configPacks"][0])), "Duplicate")

    def test_registry_is_checked_against_source(self):
        for mutate in (
            lambda reg: reg["components"]["painting"].update(source="src/future/component"),
            lambda reg: reg["components"]["painting"].update(componentName="futurePainting"),
            lambda reg: reg["components"].update(future=copy.deepcopy(reg["components"]["painting"])),
            lambda reg: reg["configPacks"]["schema"]["sources"].append("../outside"),
            lambda reg: reg["foundation"]["profile"].update(backend="future"),
            lambda reg: reg["ui"].update(items=[{}]),
            lambda reg: reg["ui"].update(items=None),
            lambda reg: reg["configPacks"]["scorecards"].update(mode="enforced_authorization"),
            lambda reg: reg["configPacks"]["schema"].update(sources=["package.json"]),
            lambda reg: reg["components"]["core"]["operations"].append("scope"),
        ):
            bad = copy.deepcopy(self.registry)
            mutate(bad)
            with self.assertRaises(CompositionError):
                self.validate(registry=bad)

    def test_custom_registry_cannot_bless_matching_unsupported_ir(self):
        for target in ("scaffold", "pack", "private_operation"):
            registry, ir = copy.deepcopy(self.registry), copy.deepcopy(self.ir)
            if target == "scaffold":
                registry["foundation"]["profile"]["backend"] = "hono"
                ir["foundation"]["config"]["backend"] = "hono"
            elif target == "pack":
                registry["configPacks"]["schema"]["mode"] = "future_mode"
                ir["configPacks"][0]["mode"] = "future_mode"
            else:
                registry["components"]["core"]["operations"].append("scope")
                ir["ui"]["bindings"][0]["operations"] = ["scope"]
            with self.assertRaises(CompositionError):
                self.validate(ir=ir, registry=registry)

    def test_scaffold_is_pinned_nonexecuting_and_no_provisioning(self):
        plan = self.validate()
        self.assertEqual(plan["scaffold"]["argv"][0], "npx")
        self.assertIn("create-json", plan["scaffold"]["argv"])
        self.assertEqual(plan["scaffold"]["execute"], False)
        self.assertEqual(plan["scaffold"]["config"]["backend"], "convex")
        self.assertFalse(plan["scaffold"]["config"]["install"])
        self.assertTrue(plan["scaffold"]["config"]["dryRun"])
        self.rejects(lambda ir: ir["foundation"].update(version="latest"), "version")
        self.rejects(lambda ir: ir["foundation"]["config"].update(backend="hono"), "scaffold")
        self.rejects(lambda ir: ir["foundation"]["config"].update(serverDeploy="cloudflare"), "scaffold")
        self.rejects(lambda ir: ir["foundation"]["config"].update(install=True), "scaffold")
        self.rejects(lambda ir: ir["foundation"]["config"].update(yes=1), "scaffold")

    def test_ui_registry_items_and_backend_operations(self):
        plan = self.validate()
        self.assertEqual(plan["ui"]["status"], "declaration_only")
        self.assertEqual(plan["ui"]["style"], "base-lyra")
        self.rejects(lambda ir: ir["ui"]["items"].append("imaginary"), "registry item")
        self.rejects(lambda ir: ir["ui"].update(registry="https://unverified.example/r"), "registry")
        self.rejects(lambda ir: ir["ui"]["bindings"][0].update(componentRef="future"), "component ref")
        self.rejects(lambda ir: ir["ui"]["bindings"][0].update(operations=["chargeCard"]), "operation")
        self.rejects(lambda ir: ir["ui"].update(tokensFile="../outside"), "tokensFile")

    def test_token_values_shapes_and_themes(self):
        self.rejects(lambda ir: ir["tokens"]["color"]["light"].update(primary="not-a-color"), "Color")
        self.rejects(lambda ir: ir["tokens"]["type"].update(bodyPx=True), "tokens.type")
        self.rejects(lambda ir: ir["tokens"]["spacing"].update(scale=[0, 2, 1]), "ascending")
        self.rejects(lambda ir: ir["tokens"]["radii"].update(cardPx=-1), "radii")
        self.rejects(lambda ir: ir["tokens"]["motion"].update(fastMs=500), "durations")
        self.rejects(lambda ir: ir["tokens"]["motion"].update(reducedMotion="ignore"), "Reduced motion")
        self.rejects(lambda ir: ir["tokens"]["theme"].update(default="sepia"), "theme")
        self.rejects(lambda ir: ir["tokens"].update(customCss="body{}"), "keys")

    def test_core_mount_and_ref_can_be_renamed(self):
        changed = copy.deepcopy(self.ir)
        changed["components"][0].update(ref="businessCore", mount="businessCore")
        for entry in changed["components"][1:]:
            entry["dependsOn"] = ["businessCore"]
            entry["bindings"]["core"] = "businessCore"
        for pack in changed["configPacks"]:
            pack["applyTo"] = ["businessCore" if ref == "core" else ref for ref in pack["applyTo"]]
        changed["ui"]["bindings"][0]["componentRef"] = "businessCore"
        plan = self.validate(changed)
        self.assertEqual(plan["mounts"][1]["client"]["arguments"][1], "components.businessCore")

    def test_duplicate_keys_and_nonfinite_json_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            for text in ('{"irVersion":1,"irVersion":2}', '{"value":NaN}'):
                path.write_text(text)
                with self.assertRaises(CompositionError):
                    load_json(path)

    def test_cli_invalid_ir_has_nonzero_exit_without_traceback(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            path.write_text('{"irVersion":1}')
            result = subprocess.run([sys.executable, "tools/validate_composition.py", str(path)],
                                    cwd=ROOT, text=True, capture_output=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn("Invalid product composition", result.stderr)
            self.assertNotIn("Traceback", result.stderr)

    def test_malformed_objects_fail_as_validation_errors(self):
        for key in ("product", "components", "foundation", "host", "configPacks"):
            self.rejects(lambda ir, key=key: ir.update({key: None}), key)
        self.rejects(lambda ir: ir.update(irVersion=True), "irVersion")
        self.rejects(lambda ir: ir["components"][0].update(component=[]), "component")

    def test_cli_plan_is_json(self):
        result = subprocess.run([sys.executable, "tools/validate_composition.py", "--plan"],
                                cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), self.validate())


if __name__ == "__main__":
    unittest.main()
