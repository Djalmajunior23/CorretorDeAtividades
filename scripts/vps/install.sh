#!/usr/bin/env bash
set -euo pipefail
umask 077
test "$(id -u)" = 0 || { echo "Execute como root no terminal da VPS."; exit 1; }
OPS_ROOT=/opt/codecheck-ops
if [ "${1:-}" = "--local" ]; then
  BUNDLE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  for file in worker.mjs runner.mjs Dockerfile sync-postgres-tls.py; do test -s "$BUNDLE/$file"; done
  RELEASE_SHA=$(sha256sum "$BUNDLE/worker.mjs" "$BUNDLE/runner.mjs" "$BUNDLE/Dockerfile" "$BUNDLE/sync-postgres-tls.py" | sha256sum | cut -c1-40)
  SOURCE="$OPS_ROOT/releases/$RELEASE_SHA"
  mkdir -p "$SOURCE"
  for file in worker.mjs runner.mjs Dockerfile sync-postgres-tls.py; do
    if [ "$BUNDLE/$file" != "$SOURCE/$file" ]; then install -m 600 "$BUNDLE/$file" "$SOURCE/$file"; fi
  done
else
  RELEASE_SHA=${1:?Informe o SHA revisado ou --local para um pacote local.}
  [[ "$RELEASE_SHA" =~ ^[a-f0-9]{40}$ ]] || { echo "SHA inválido."; exit 1; }
  mkdir -p "$OPS_ROOT/releases/$RELEASE_SHA"
  SOURCE="$OPS_ROOT/releases/$RELEASE_SHA"
  for file in worker.mjs runner.mjs Dockerfile sync-postgres-tls.py; do
    curl --fail --silent --show-error --proto '=https' --tlsv1.2 \
      "https://raw.githubusercontent.com/Djalmajunior23/CorretorDeAtividades/$RELEASE_SHA/scripts/vps/$file" \
      -o "$SOURCE/$file"
  done
fi
docker info >/dev/null
TRAEFIK_NETWORK=$(docker inspect traefik --format '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' | head -n1)
test -n "$TRAEFIK_NETWORK" || { echo "Rede do Traefik não encontrada."; exit 1; }
if [ ! -s "$OPS_ROOT/ops.token" ]; then
  openssl rand -hex 32 > "$OPS_ROOT/ops.token"
fi
chmod 600 "$OPS_ROOT/ops.token"

# Install renewal only after validating the hook against the current certificate.
install -m 700 "$SOURCE/sync-postgres-tls.py" /usr/local/sbin/codecheck-sync-postgres-tls
/usr/local/sbin/codecheck-sync-postgres-tls
cat > /etc/systemd/system/codecheck-postgres-tls.service <<'UNIT'
[Unit]
Description=Sincroniza certificado do PostgreSQL com o Traefik
After=postgresql.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/codecheck-sync-postgres-tls
UMask=0077
UNIT
cat > /etc/systemd/system/codecheck-postgres-tls.timer <<'UNIT'
[Unit]
Description=Confere renovação do certificado PostgreSQL a cada seis horas
[Timer]
OnBootSec=5min
OnUnitActiveSec=6h
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now codecheck-postgres-tls.timer

docker build --target runner -t codecheck-isolated-runner:1 "$SOURCE"
docker build --target worker -t "codecheck-ops:$RELEASE_SHA" "$SOURCE"

# Exercise the real image before exposing its authenticated service.
SMOKE=$(printf '%s' '{"language":"javascript","code":"console.log(42)","stdin":"","timeout_ms":1000}' | \
  docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
    --memory 256m --memory-swap 256m --pids-limit 32 --cpus 1 --user 10001:10001 \
    --tmpfs /work:rw,nosuid,nodev,noexec,size=16m,mode=1777 \
    --tmpfs /tmp:rw,nosuid,nodev,noexec,size=16m,mode=1777 codecheck-isolated-runner:1)
printf '%s' "$SMOKE" | python3 -c 'import json,sys; r=json.load(sys.stdin); assert r["status"]=="accepted" and r["stdout"].strip()=="42"'

# Restart only our service. Existing backend, Traefik and database remain running.
if docker container inspect codecheck-ops >/dev/null 2>&1; then docker rm -f codecheck-ops >/dev/null; fi
docker run -d --name codecheck-ops --restart unless-stopped \
  --network "$TRAEFIK_NETWORK" --add-host host.docker.internal:host-gateway \
  --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 128 --memory 256m \
  --tmpfs /tmp:rw,nosuid,nodev,noexec,size=32m \
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  --mount "type=bind,src=$OPS_ROOT/ops.token,dst=/run/secrets/ops_token,readonly" \
  --label traefik.enable=true \
  --label "traefik.docker.network=$TRAEFIK_NETWORK" \
  --label 'traefik.http.routers.codecheck-ops.rule=Host(`api.teacherjuniors.com.br`) && PathPrefix(`/codecheck-ops/`)' \
  --label traefik.http.routers.codecheck-ops.priority=2147480000 \
  --label traefik.http.routers.codecheck-ops.service=codecheck-ops \
  --label traefik.http.routers.codecheck-ops.entrypoints=websecure \
  --label traefik.http.routers.codecheck-ops.tls.certresolver=letsencrypt \
  --label traefik.http.services.codecheck-ops.loadbalancer.server.port=8080 \
  "codecheck-ops:$RELEASE_SHA" >/dev/null

# Confirm the actual service before checking routing; never parse an empty curl pipe.
docker exec -i codecheck-ops node --input-type=module <<'JS'
import fs from 'node:fs';
const token=fs.readFileSync('/run/secrets/ops_token','utf8').trim();
let ready=false;
for(let i=0;i<20;i++){
 try{const r=await fetch('http://127.0.0.1:8080/health',{headers:{Authorization:'Bearer '+token}});if(r.ok&&(await r.json()).isolation==='docker'){ready=true;break;}}catch{}
 await new Promise(r=>setTimeout(r,500));
}
if(!ready){console.error('Serviço local não iniciou; confira docker logs codecheck-ops.');process.exit(1);}
console.log('Serviço local autenticado: OK');
JS

TOKEN=$(cat "$OPS_ROOT/ops.token")
AUTH_FILE=$(mktemp)
trap 'rm -f "$AUTH_FILE"' EXIT
printf 'header = "Authorization: Bearer %s"\n' "$TOKEN" > "$AUTH_FILE"
HEALTH_OK=0
for attempt in $(seq 1 15); do
  if curl --config "$AUTH_FILE" --fail --silent --show-error --max-time 10 \
    https://api.teacherjuniors.com.br/codecheck-ops/health > "$OPS_ROOT/health.json" && \
    python3 -c 'import json; d=json.load(open("/opt/codecheck-ops/health.json")); assert d.get("isolation")=="docker" and d.get("status")=="ready"' 2>/dev/null; then HEALTH_OK=1; break; fi
  sleep 2
done
test "$HEALTH_OK" = 1 || { echo "Worker local pronto, mas o Traefik não encaminhou HTTPS ao worker. Envie: docker logs --tail 30 traefik"; exit 1; }
if ! curl --config "$AUTH_FILE" --fail --silent --show-error --max-time 25 \
  -H 'Content-Type: application/json' -d '{"language":"python","code":"print(42)","timeout_ms":1000}' \
  https://api.teacherjuniors.com.br/codecheck-ops/run -o "$OPS_ROOT/run-test.json"; then
  echo 'Falha HTTP no teste de execução; nenhum JSON vazio será interpretado.'; exit 1
fi
python3 -c 'import json; r=json.load(open("/opt/codecheck-ops/run-test.json")); assert r["status"]=="accepted" and r["stdout"].strip()=="42", r.get("stderr","Falha na execução"); print("Worker HTTPS e execução Python isolada: OK")'
if curl --config "$AUTH_FILE" --fail --silent --show-error --max-time 15 \
  https://api.teacherjuniors.com.br/codecheck-ops/ollama/api/tags > "$OPS_ROOT/models.json"; then
  python3 -c 'import json; d=json.load(open("/opt/codecheck-ops/models.json")); print("Modelos Ollama:", ", ".join(m["name"] for m in d.get("models",[])) or "nenhum instalado")'
else
  echo "Worker pronto. Ollama não respondeu em host.docker.internal:11434; a IA precisa desse serviço."
fi
echo 'Instalação concluída. Renovação TLS automática ativada.'
echo 'Token salvo em /opt/codecheck-ops/ops.token. Copie somente para as variáveis sensíveis da Vercel; não publique no chat.'
