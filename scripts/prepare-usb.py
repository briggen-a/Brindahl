"""Build the ESP edition into a new staging folder, without touching a mounted drive."""
import argparse
import os
from pathlib import Path
import secrets
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path, help='new staging folder')
dest = parser.parse_args().output.resolve()
if dest.exists() or dest.is_relative_to(root):
    parser.error('Choose a new folder outside the source tree.')
dest.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=dest.parent) as tmp:
    package = Path(tmp) / 'package'
    package.mkdir()
    subprocess.run(['npm', 'run', 'build', '--', '--outDir', str(package / 'site')],
                   cwd=root, env=dict(os.environ, VITE_REGISTRY_TARGET='esp'), check=True)
    (package / 'registry').mkdir()
    cfg = package / 'party.cfg'
    cfg.write_text(f'wifi={secrets.token_hex(8)}\nhost={secrets.token_hex(32)}\n')
    cfg.chmod(0o600)
    if dest.exists():
        parser.error('The destination already exists.')
    package.rename(dest)
print(f'Copy site, registry and party.cfg from {dest} to the USB root.')
