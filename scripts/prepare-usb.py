"""Build the ESP edition into a new staging folder, without touching a mounted drive."""
import argparse
import getpass
import os
from pathlib import Path
import secrets
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path, help='new staging folder')
parser.add_argument('--choose-password', action='store_true', help='prompt privately for a host password')
args = parser.parse_args()
dest = args.output.resolve()
password = secrets.token_hex(16)
if args.choose_password:
    password = getpass.getpass('Host password (12–64 printable ASCII characters): ')
    if not 12 <= len(password) <= 64 or not all(32 <= ord(c) <= 126 for c in password):
        parser.error('Use 12–64 printable ASCII characters.')
    if getpass.getpass('Repeat host password: ') != password:
        parser.error('Passwords do not match.')
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
    cfg.write_text(f'wifi={secrets.token_hex(8)}\nhost={password}\n')
    cfg.chmod(0o600)
    if dest.exists():
        parser.error('The destination already exists.')
    package.rename(dest)
print(f'Copy site, registry and party.cfg from {dest} to the USB root.')
