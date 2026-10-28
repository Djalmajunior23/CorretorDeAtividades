#!/usr/bin/env python3
"""Root-only deploy hook for the existing Traefik ACME store; never logs keys."""
import base64
import json
import os
import pathlib
import pwd
import subprocess
import tempfile
import fcntl

def command(args):
    return subprocess.check_output(args, stderr=subprocess.PIPE)

def main():
    if os.geteuid() != 0:
        raise RuntimeError("Execute como root.")
    lock = open('/run/codecheck-tls.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX)
    domain = 'api.teacherjuniors.com.br'
    data = json.loads(pathlib.Path('/opt/teacherjuniors/traefik/acme.json').read_text())
    found = [c for cfg in data.values() if isinstance(cfg, dict) for c in cfg.get('Certificates', [])
             if domain in [c.get('domain', {}).get('main'), *(c.get('domain', {}).get('sans') or [])]]
    if len(found) != 1:
        raise RuntimeError("Certificado único do domínio não encontrado.")
    user = pwd.getpwnam('postgres')
    target = pathlib.Path('/etc/postgresql/18/main/tls-codecheck')
    target.mkdir(mode=0o700, exist_ok=True)
    os.chown(target, 0, user.pw_gid)
    os.chmod(target, 0o750)
    with tempfile.TemporaryDirectory(prefix='codecheck-tls-') as tmp:
        cert, key = pathlib.Path(tmp)/'server.crt', pathlib.Path(tmp)/'server.key'
        cert.write_bytes(base64.b64decode(found[0]['certificate'], validate=True))
        key.write_bytes(base64.b64decode(found[0]['key'], validate=True))
        key.chmod(0o600)
        command(['openssl', 'x509', '-in', str(cert), '-noout', '-checkhost', domain])
        command(['openssl', 'x509', '-in', str(cert), '-noout', '-checkend', '86400'])
        command(['openssl', 'verify', '-purpose', 'sslserver', '-verify_hostname', domain,
                 '-untrusted', str(cert), '-CAfile', '/etc/ssl/certs/ca-certificates.crt', str(cert)])
        if command(['openssl', 'x509', '-in', str(cert), '-pubkey', '-noout']) != command(['openssl', 'pkey', '-in', str(key), '-pubout']):
            raise RuntimeError("Chave não corresponde ao certificado.")
        changed = any(not (target/p.name).exists() or (target/p.name).read_bytes() != p.read_bytes() for p in [cert, key])
        if changed:
            previous = {p.name: (target/p.name).read_bytes() if (target/p.name).exists() else None for p in [cert,key]}
            for source in [cert, key]:
                fd, name = tempfile.mkstemp(prefix=source.name+'.', dir=target)
                destination = pathlib.Path(name)
                with os.fdopen(fd, 'wb') as f:
                    f.write(source.read_bytes())
                    os.fchown(f.fileno(), 0, user.pw_gid)
                    os.fchmod(f.fileno(), 0o640)
                os.replace(destination, target/source.name)
        try:
            subprocess.run(['sudo','-u','postgres','psql','-p','5432','-v','ON_ERROR_STOP=1',
                            '-c',"ALTER SYSTEM SET ssl_cert_file = '/etc/postgresql/18/main/tls-codecheck/server.crt';"],check=True,stdout=subprocess.DEVNULL)
            subprocess.run(['sudo','-u','postgres','psql','-p','5432','-v','ON_ERROR_STOP=1',
                            '-c',"ALTER SYSTEM SET ssl_key_file = '/etc/postgresql/18/main/tls-codecheck/server.key';"],check=True,stdout=subprocess.DEVNULL)
            command(['sudo','-u','postgres','psql','-p','5432','-Atc','SELECT pg_reload_conf();'])
            import time
            time.sleep(1)
            subprocess.run(['openssl','s_client','-starttls','postgres','-connect','127.0.0.1:5432',
                            '-servername',domain,'-verify_hostname',domain,'-verify_return_error',
                            '-CAfile','/etc/ssl/certs/ca-certificates.crt'],input=b'',check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        except Exception:
            if changed:
                for name, value in previous.items():
                    if value is not None:
                        (target/name).write_bytes(value)
                command(['sudo','-u','postgres','psql','-p','5432','-Atc','SELECT pg_reload_conf();'])
            raise
    print('PostgreSQL TLS validado; certificado '+('atualizado.' if changed else 'já atualizado.'))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Do not print subprocess output or ACME data.
        print('Falha na sincronização TLS:', str(error) if not isinstance(error, subprocess.CalledProcessError) else 'validação externa falhou.')
        raise SystemExit(1)
