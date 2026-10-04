#!/usr/bin/env python3
"""Validate a bounded product declaration and print a deterministic, nonexecuting plan."""
import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
IDENTIFIER = re.compile(r"[A-Za-z][A-Za-z0-9_]*\Z")
SEMVER = re.compile(r"\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?\Z")
FOUNDATION_PROFILE = {
    "frontend": ["next"], "backend": "convex", "runtime": "none", "database": "none",
    "orm": "none", "api": "none", "auth": "none", "payments": "none", "addons": [],
    "examples": [], "dbSetup": "none", "webDeploy": "none", "serverDeploy": "none",
    "packageManager": "npm", "git": False, "install": False, "yes": True,
    "directoryConflict": "error", "disableAnalytics": True, "dryRun": True,
}
UI_REGISTRY = {
    "library": "shadcn/ui", "style": "base-lyra",
    "registry": "https://ui.shadcn.com/r/styles/base-lyra/{name}.json",
    "items": ["button", "card", "input", "table"], "packageDirectory": "packages/ui",
    "componentDirectory": "packages/ui/src/components", "tokensFile": "packages/ui/src/styles/globals.css",
}
PACK_MODES = {
    "schema": "source_aligned", "workflows": "builtin_commands",
    "business_policy": "contractor_operations_v1", "projections": "component_explicit_paths_v1",
    "scorecards": "advisory_supplied_predicates", "trade_partition": "explicit_trade_fields_v1",
}
PACK_SOURCES = {
    "schema": {"model/blueprints.summary.json", "model/schema-supplement.json", "src/shared/domainManifest.ts"},
    "workflows": {"docs/workflow-definitions.json", "src/component/workflows.ts"},
    "business_policy": {"src/shared/businessPolicy.ts"},
    "projections": {"src/shared/derivedManifest.ts", "src/shared/projections.ts"},
    "scorecards": {"docs/scorecard-definitions.json", "src/shared/scorecardManifest.ts", "src/shared/scorecards.ts"},
    "trade_partition": {"model/trades.ir.json", "src/shared/tradeManifest.ts"},
}
CORE_OPERATIONS = {"componentInfo", "execute", "history", "jobFinancials", "invoiceBalance",
                   "listJobs", "listLeads", "inspectRecord"}
TRADE_OPERATIONS = {"get", "list", "create", "update", "calculations"}


class CompositionError(ValueError):
    """A declaration is unsupported, inconsistent, or references unavailable source."""


def require(condition, message):
    if not condition:
        raise CompositionError(message)


def keys(value, expected, path):
    require(isinstance(value, dict), f"{path} must be an object")
    require(set(value) == set(expected),
            f"Unknown or missing {path} keys: expected {', '.join(expected)}")


def string(value, path):
    require(isinstance(value, str) and bool(value.strip()), f"{path} must be a nonempty string")
    return value


def strings(value, path, nonempty=False):
    require(isinstance(value, list), f"{path} must be an array")
    for item in value:
        string(item, path)
    require(len(value) == len(set(value)), f"Duplicate {path}")
    require(bool(value) or not nonempty, f"{path} must not be empty")
    return value


def identifier(value, path):
    require(IDENTIFIER.fullmatch(string(value, path)) is not None, f"Invalid {path}")
    return value


def source_file(root, relative):
    string(relative, "source path")
    path = (root / relative).resolve()
    require(not Path(relative).is_absolute() and path.is_relative_to(root.resolve()),
            f"Source path escapes repository: {relative}")
    require(path.is_file(), f"Missing source file: {relative}")
    return path


def load_json(path):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            require(key not in value, f"Duplicate JSON key: {key}")
            value[key] = item
        return value
    def reject_constant(value):
        raise CompositionError(f"Invalid JSON constant: {value}")
    return json.loads(Path(path).read_text(), object_pairs_hook=unique,
                      parse_constant=reject_constant)


def validate_registry(registry, root):
    keys(registry, ("registryVersion", "package", "version", "foundation", "components", "configPacks", "ui"), "registry")
    require(type(registry["registryVersion"]) is int and registry["registryVersion"] == 1,
            "Unsupported registryVersion")
    package = load_json(root / "package.json")
    require(registry["package"] == package["name"] and registry["version"] == package["version"],
            "Registry package/version drift")
    keys(registry["foundation"], ("package", "version", "command", "profile", "nodeEngine", "sources"), "registry foundation")
    require(registry["foundation"]["package"] == "create-better-t-stack"
            and registry["foundation"]["version"] == "3.44.2"
            and registry["foundation"]["command"] == "create-json", "Unsupported registry foundation")
    require(json.dumps(registry["foundation"]["profile"], sort_keys=True) == json.dumps(FOUNDATION_PROFILE, sort_keys=True),
            "Unsupported registry scaffold profile")
    keys(registry["ui"], ("library", "registry", "items", "style", "packageDirectory", "componentDirectory", "tokensFile"), "registry ui")
    require(registry["ui"] == UI_REGISTRY, "Unsupported registry ui profile")
    trades = load_json(root / "model/trades.ir.json")["trades"]
    components = registry["components"]
    keys(components, ("core", *trades), "registry components")
    packs = registry["configPacks"]
    keys(packs, ("schema", "workflows", "business_policy", "projections", "scorecards", "trade_partition"), "registry configPacks")
    for name, entry in components.items():
        keys(entry, ("kind", "version", "source", "componentName", "configExport", "clientExport", "clientClass", "configKind", "requiredPacks", "operations"), f"registry component {name}")
        expected_source = "src/component" if name == "core" else f"src/trades/{name}/component"
        expected_name = "contractorOs" if name == "core" else trades[name]["componentName"]
        require(entry["kind"] == "convex_component" and entry["source"] == expected_source
                and entry["componentName"] == expected_name, f"Registry source identity drift: {name}")
        require(entry["version"] == package["version"], f"Registry component version drift: {name}")
        config_path = source_file(root, expected_source + "/convex.config.ts")
        require(re.search(r"defineComponent\s*\(\s*['\"]" + re.escape(expected_name) + r"['\"]", config_path.read_text()),
                f"Component definition drift: {name}")
        expected_config_export = "./convex.config" if name == "core" else f"./trades/{name}/convex.config"
        expected_client_export = "./backend" if name == "core" else f"./trades/{name}/client"
        require(entry["configExport"] == expected_config_export and entry["clientExport"] == expected_client_export,
                f"Registry export drift: {name}")
        require(package["exports"].get(expected_config_export) == "./" + expected_source + "/convex.config.ts",
                f"Unavailable component export: {name}")
        client_path = "src/backendClient.ts" if name == "core" else f"src/trades/{name}/client.ts"
        require(package["exports"].get(expected_client_export) == "./" + client_path,
                f"Unavailable client export: {name}")
        client_source = source_file(root, client_path).read_text()
        expected_class = "ContractorBackend" if name == "core" else "".join(s.title() for s in name.split("_")) + "Client"
        require(entry["clientClass"] == expected_class and f"class {expected_class}<" in client_source,
                f"Unavailable client class: {name}")
        require(entry["configKind"] == ("core_env" if name == "core" else "none"), f"Invalid configKind: {name}")
        expected_packs = set(packs) - {"trade_partition"} if name == "core" else {"trade_partition"}
        require(set(strings(entry["requiredPacks"], "requiredPacks")) == expected_packs,
                f"Registry required config packs drift: {name}")
        operations = strings(entry["operations"], "operations", nonempty=True)
        require(set(operations) == (CORE_OPERATIONS if name == "core" else TRADE_OPERATIONS),
                f"Unsupported registry client operations: {name}")
        for operation in operations:
            require(re.search(r"^\s*async\s+" + re.escape(operation) + r"\s*\(", client_source, re.MULTILINE),
                    f"Unavailable client operation: {name}.{operation}")
    for name, entry in packs.items():
        keys(entry, ("mode", "appliesTo", "sources", "kind", "version"), f"registry config pack {name}")
        require(entry["kind"] == "config_pack" and entry["version"] == package["version"],
                f"Invalid config pack identity/version: {name}")
        string(entry["mode"], "config mode")
        require(entry["mode"] == PACK_MODES[name], f"Unsupported registry config mode: {name}")
        expected_targets = set(trades) if name == "trade_partition" else {"core"}
        require(set(strings(entry["appliesTo"], "config applicability")) == expected_targets,
                f"Invalid config applicability: {name}")
        sources = strings(entry["sources"], "config sources", nonempty=True)
        require(set(sources) == PACK_SOURCES[name], f"Registry config source drift: {name}")
        for relative in sources:
            source_file(root, relative)
    return components, packs


def validate_tokens(tokens):
    keys(tokens, ("color", "type", "spacing", "radii", "motion", "theme"), "tokens")
    keys(tokens["color"], ("light", "dark"), "tokens.color")
    for theme, colors in tokens["color"].items():
        keys(colors, ("background", "foreground", "primary"), f"tokens.color.{theme}")
        for value in colors.values():
            require(isinstance(value, str) and re.fullmatch(r"#[0-9A-Fa-f]{6}", value), "Color tokens require #RRGGBB")
    def number(value, low, high, path):
        require(type(value) in (int, float) and low <= value <= high, f"Invalid {path}")
    keys(tokens["type"], ("fontFamily", "bodyPx", "headingPx"), "tokens.type")
    require(re.fullmatch(r"[A-Za-z0-9 ,'-]+", string(tokens["type"]["fontFamily"], "fontFamily")), "Invalid fontFamily")
    for field in ("bodyPx", "headingPx"):
        number(tokens["type"][field], 1, 200, "tokens.type." + field)
    keys(tokens["spacing"], ("unitPx", "scale"), "tokens.spacing")
    number(tokens["spacing"]["unitPx"], 1, 32, "tokens.spacing.unitPx")
    scale = tokens["spacing"]["scale"]
    require(isinstance(scale, list) and bool(scale), "Invalid tokens.spacing.scale")
    for value in scale:
        number(value, 0, 100, "tokens.spacing.scale")
    require(scale == sorted(set(scale)), "tokens.spacing.scale must be ascending and unique")
    keys(tokens["radii"], ("controlPx", "cardPx"), "tokens.radii")
    for value in tokens["radii"].values():
        number(value, 0, 100, "tokens.radii")
    keys(tokens["motion"], ("fastMs", "normalMs", "easing", "reducedMotion"), "tokens.motion")
    for field in ("fastMs", "normalMs"):
        number(tokens["motion"][field], 0, 10000, "tokens.motion." + field)
    require(tokens["motion"]["fastMs"] <= tokens["motion"]["normalMs"], "Motion durations out of order")
    require(tokens["motion"]["easing"] in ("linear", "ease", "ease-in", "ease-out", "ease-in-out"), "Invalid motion easing")
    require(tokens["motion"]["reducedMotion"] == "respect-system", "Reduced motion must respect-system")
    keys(tokens["theme"], ("default", "supported"), "tokens.theme")
    require(tokens["theme"]["default"] in ("system", "light", "dark")
            and tokens["theme"]["supported"] == ["light", "dark"], "Invalid tokens.theme")


def validate_composition(ir, registry, root=ROOT):
    """Return a deterministic plan; never write, install, run, deploy, or provision."""
    root = Path(root)
    components, packs = validate_registry(registry, root)
    keys(ir, ("irVersion", "product", "foundation", "host", "components", "configPacks", "ui", "tokens"), "composition")
    require(type(ir["irVersion"]) is int and ir["irVersion"] == 1, "Unsupported irVersion")
    keys(ir["product"], ("id", "name", "version"), "product")
    require(re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", string(ir["product"]["id"], "product.id")), "Invalid product.id")
    string(ir["product"]["name"], "product.name")
    require(SEMVER.fullmatch(string(ir["product"]["version"], "product.version")), "Invalid product.version")
    foundation = ir["foundation"]
    keys(foundation, ("package", "version", "command", "config"), "foundation")
    for key in ("package", "version", "command"):
        require(foundation[key] == registry["foundation"][key], f"Unsupported foundation {key}")
    expected_config = {"projectName": ir["product"]["id"], **registry["foundation"]["profile"]}
    # JSON comparison distinguishes true from 1, unlike Python object equality.
    require(json.dumps(foundation["config"], sort_keys=True) == json.dumps(expected_config, sort_keys=True),
            "Unsupported scaffold config; use the pinned Next/Convex dry-run profile")
    keys(ir["host"], ("membership",), "host")
    require(ir["host"]["membership"] == "authenticated_host_resolver", "Unsupported host membership binding")
    require(isinstance(ir["components"], list) and bool(ir["components"]), "components must be a nonempty array")
    by_ref, mounted, selected = {}, set(), set()
    for entry in ir["components"]:
        keys(entry, ("ref", "component", "version", "mount", "config", "dependsOn", "bindings"), "component")
        ref = identifier(entry["ref"], "component ref")
        name = string(entry["component"], "component")
        mount = identifier(entry["mount"], "component mount")
        require(name in components, f"Unknown component: {name}")
        require(ref not in by_ref and mount not in mounted and name not in selected,
                "Duplicate component, ref or mount")
        require(entry["version"] == components[name]["version"], f"Unsupported component version: {name}")
        strings(entry["dependsOn"], "dependencies")
        if name == "core":
            keys(entry["config"], ("env",), "core config")
            keys(entry["config"]["env"], ("MODE",), "core config.env")
            require(entry["config"]["env"]["MODE"] in ("development", "test", "production"), "Invalid core MODE")
        else:
            keys(entry["config"], (), "trade config")
        by_ref[ref] = entry
        mounted.add(mount)
        selected.add(name)
    require("core" in selected, "Exactly one core component is required")
    core = next(entry for entry in by_ref.values() if entry["component"] == "core")
    for entry in by_ref.values():
        is_core = entry["component"] == "core"
        keys(entry["bindings"], ("membership",) if is_core else ("core", "membership"), "component bindings")
        require(entry["bindings"]["membership"] == "host.membership", "Unknown membership binding")
        require(entry["dependsOn"] == ([] if is_core else [core["ref"]]), "Missing or invalid core dependency")
        if not is_core:
            require(entry["bindings"]["core"] == core["ref"], "Missing or invalid core binding")
    require(isinstance(ir["configPacks"], list), "configPacks must be an array")
    applied, pack_names = set(), set()
    for pack in ir["configPacks"]:
        keys(pack, ("pack", "version", "mode", "applyTo"), "config pack")
        name = string(pack["pack"], "config pack")
        require(name in packs, f"Unknown config pack: {name}")
        require(name not in pack_names, f"Duplicate config pack: {name}")
        pack_names.add(name)
        require(pack["version"] == packs[name]["version"], f"Unsupported config pack version: {name}")
        require(pack["mode"] == packs[name]["mode"], f"Unsupported config pack mode: {name}")
        for ref in strings(pack["applyTo"], "config pack applyTo", nonempty=True):
            require(ref in by_ref, f"Unknown config target ref: {ref}")
            require(by_ref[ref]["component"] in packs[name]["appliesTo"], f"Config pack not applicable: {name} -> {ref}")
            applied.add((name, ref))
    for ref, entry in by_ref.items():
        for pack in components[entry["component"]]["requiredPacks"]:
            require((pack, ref) in applied, f"Missing config pack: {pack} -> {ref}")
    ui = ir["ui"]
    keys(ui, ("library", "registry", "items", "bindings", "style", "packageDirectory", "componentDirectory", "tokensFile"), "ui")
    for key in ("library", "registry", "style", "packageDirectory", "componentDirectory", "tokensFile"):
        require(ui[key] == registry["ui"][key], f"Unsupported ui {key}")
    require(set(strings(ui["items"], "ui items", nonempty=True)) <= set(registry["ui"]["items"]), "Unknown shadcn registry item")
    require(isinstance(ui["bindings"], list), "ui.bindings must be an array")
    views = set()
    for binding in ui["bindings"]:
        keys(binding, ("view", "componentRef", "operations"), "ui binding")
        view = identifier(binding["view"], "ui view")
        require(view not in views, "Duplicate ui view")
        views.add(view)
        ref = string(binding["componentRef"], "ui componentRef")
        require(ref in by_ref, f"Unknown ui component ref: {ref}")
        operations = strings(binding["operations"], "ui operations", nonempty=True)
        require(set(operations) <= set(components[by_ref[ref]["component"]]["operations"]), "Unknown ui backend operation")
    validate_tokens(ir["tokens"])
    mounts = []
    for ref, entry in sorted(by_ref.items(), key=lambda item: (item[1]["component"] != "core", item[0])):
        spec = components[entry["component"]]
        arguments = ["components." + entry["mount"]]
        if entry["component"] != "core":
            arguments.append("components." + core["mount"])
        arguments.append("host.membership")
        mounts.append({"ref": ref, "component": entry["component"], "version": entry["version"],
                       "import": registry["package"] + spec["configExport"][1:],
                       "source": spec["source"], "name": entry["mount"], "options": entry["config"],
                       "client": {"import": registry["package"] + spec["clientExport"][1:],
                                  "constructor": spec["clientClass"], "arguments": arguments}})
    scaffold_config = foundation["config"]
    return {"planVersion": 1, "product": ir["product"],
            "scaffold": {"execute": False, "config": scaffold_config,
                         "argv": ["npx", "--yes", foundation["package"] + "@" + foundation["version"],
                                  "create-json", "--input", json.dumps(scaffold_config, sort_keys=True, separators=(",", ":"))]},
            "host": ir["host"], "mounts": mounts,
            "configPacks": [{**pack, "applyTo": sorted(pack["applyTo"])}
                            for pack in sorted(ir["configPacks"], key=lambda p: p["pack"])],
            "ui": {**ui, "status": "declaration_only", "items": sorted(ui["items"]),
                   "bindings": [{**binding, "operations": sorted(binding["operations"])}
                                for binding in sorted(ui["bindings"], key=lambda b: b["view"])]},
            "tokens": ir["tokens"]}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("composition", nargs="?", type=Path, default=ROOT / "model/product.composition.json")
    parser.add_argument("--registry", type=Path, default=ROOT / "model/component-registry.json")
    parser.add_argument("--plan", action="store_true", help="Print deterministic JSON; do not execute anything")
    args = parser.parse_args(argv)
    try:
        plan = validate_composition(load_json(args.composition), load_json(args.registry))
    except (CompositionError, OSError, json.JSONDecodeError) as error:
        print(f"Invalid product composition: {error}", file=sys.stderr)
        return 1
    print(json.dumps(plan, indent=2, sort_keys=True) if args.plan else
          f"Product composition valid: {len(plan['mounts'])} runtime components; "
          f"{len(plan['configPacks'])} config packs; scaffold/UI/tokens are declarations only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
