"""Validate before extraction; only regular files/directories under .output are allowed."""
import pathlib
import shutil
import sys
import tarfile
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    members = archive.getmembers()
    total = 0
    for member in members:
        name = pathlib.PurePosixPath(member.name)
        if name.is_absolute() or '..' in name.parts or not name.parts or name.parts[0] != '.output':
            raise ValueError('Unsafe artifact path')
        if not (member.isfile() or member.isdir()):
            raise ValueError('Links/special files are forbidden in release artifacts')
        total += member.size
    if total > 1024 * 1024 * 1024 or len(members) > 50000:
        raise ValueError('Artifact limits exceeded')
    if not any(m.name == '.output/server/index.mjs' and m.isfile() for m in members):
        raise ValueError('Entrypoint missing')
    if len({str(pathlib.PurePosixPath(m.name)) for m in members}) != len(members):
        raise ValueError('Duplicate archive paths')
    destination = pathlib.Path(sys.argv[2]).resolve()
    if (destination / '.output').exists() or (destination / '.output').is_symlink():
        raise ValueError('Extraction destination must be fresh')
    # Prevalidated regular files only; works with Python 3.9 as well as hosted runners.
    for member in members:
        target = destination / member.name
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(member) as source, target.open('xb') as output:
                shutil.copyfileobj(source, output)
