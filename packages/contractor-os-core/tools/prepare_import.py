#!/usr/bin/env python3
"""Prepare private, bounded import arguments from a Port ZIP. Never imports remotely."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

BLUEPRINTS = set(json.loads((Path(__file__).resolve().parents[1] / 'model' / 'blueprints.summary.json').read_text())['blueprints'])

def unique_keys(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f'Duplicate JSON object key: {key!r}')
        result[key] = value
    return result

def reject_constant(value: str) -> None:
    raise ValueError(f'Non-JSON numeric constant: {value}')

def dump(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)

def prepare(source: Path, output: Path) -> dict[str, object]:
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output directory must be empty; existing files will not be overwritten.')
    rows: list[dict[str, object]] = []
    seen: dict[tuple[str, str], str] = {}
    empty, ignored = [], []
    with zipfile.ZipFile(source) as archive:
        if len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError('Duplicate archive member paths are ambiguous.')
        for name in sorted(archive.namelist()):
            bp = name.removesuffix('.json')
            if not name.endswith('.json') or bp not in BLUEPRINTS:
                ignored.append(name)
                continue
            content = json.loads(archive.read(name), object_pairs_hook=unique_keys, parse_constant=reject_constant)
            if not isinstance(content, list):
                raise ValueError(f'{name}: expected an entity array')
            if not content:
                empty.append(bp)
            for row in content:
                if not isinstance(row, dict) or row.get('blueprint') != bp or not isinstance(row.get('identifier'), str):
                    raise ValueError(f'{name}: unexpected record shape or blueprint')
                serialized = dump(row)
                if len(serialized.encode()) > 100_000:
                    raise ValueError(f'{name}: record exceeds component import size cap')
                key = (bp, row['identifier'])
                if key in seen:
                    if seen[key] != serialized:
                        raise ValueError(f'{name}: conflicting identity {key}')
                    continue
                seen[key] = serialized
                rows.append(row)
    batches: list[list[dict[str, object]]] = []
    current: list[dict[str, object]] = []
    for row in rows:
        candidate = current + [row]
        if current and (len(candidate) > 25 or len(dump(candidate).encode()) > 250_000):
            batches.append(current)
            current = [row]
        else:
            current = candidate
    if current:
        batches.append(current)
    output.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    manifest = {'source': source.name, 'sourceSha256': digest, 'records': len(rows),
                'batchCount': len(batches), 'emptyBlueprints': empty, 'excludedFiles': ignored,
                'remoteImportPerformed': False}
    for index, batch in enumerate(batches, 1):
        packet = {'source': source.name, 'requestKey': f'port-{digest}-{index:04d}', 'recordsJson': dump(batch)}
        with (output / f'batch-{index:04d}.json').open('x', encoding='utf-8') as handle:
            json.dump(packet, handle, ensure_ascii=False, indent=2)
            handle.write('\n')
    with (output / 'manifest.json').open('x', encoding='utf-8') as handle:
        json.dump(manifest, handle, indent=2)
        handle.write('\n')
    return manifest

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_zip', type=Path)
    parser.add_argument('--output-dir', type=Path, default=Path('private-import'))
    args = parser.parse_args()
    try:
        result = prepare(args.source_zip, args.output_dir)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        parser.exit(1, f'Import preparation failed: {error}\n')
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
