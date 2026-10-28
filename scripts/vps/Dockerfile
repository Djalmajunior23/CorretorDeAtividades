FROM node:24-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
COPY runner.mjs /opt/runner.mjs
USER 10001:10001
WORKDIR /work
ENTRYPOINT ["node", "/opt/runner.mjs"]

FROM node:24-bookworm-slim AS worker
RUN apt-get update && apt-get install -y --no-install-recommends docker.io && rm -rf /var/lib/apt/lists/*
COPY worker.mjs /opt/worker.mjs
CMD ["node", "/opt/worker.mjs"]
