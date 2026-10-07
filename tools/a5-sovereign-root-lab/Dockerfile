# LAB ONLY. Caller must supply a reviewed immutable node image digest. No default/latest.
ARG LAB_NODE_IMAGE
FROM ${LAB_NODE_IMAGE}
USER root
# This recipe is NOT a qualified image until built, pinned by output digest and tested.
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /lab
COPY tools/a5-sovereign-root-lab/ /lab/
USER node
ENTRYPOINT ["node", "qualify.mjs"]
