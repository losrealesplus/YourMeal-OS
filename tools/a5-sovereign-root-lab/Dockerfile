# TEST LAB ONLY: Linux ARM64. Baseline implementation b829e539 is unchanged.
# Platform-specific immutable official Node manifest (not a mutable tag).
FROM node:22.14.0-bookworm-slim@sha256:663c09e4fd483fbcb2bb7297b3618061ac23f0a1925b0958db2ab734efad7c94
USER root
# Immutable Debian snapshot; signatures/hash verification remain enabled.
# HTTP bootstrap requires no extra certificate package; apt authenticates Release.
RUN test "$(dpkg --print-architecture)" = arm64 \
    && rm -f /etc/apt/sources.list /etc/apt/sources.list.d/* \
    && printf 'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20250407T205129Z/ bookworm main\n' > /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends --no-upgrade \
        libssl3=3.0.15-1~deb12u1 \
        libpython3.11-minimal=3.11.2-6+deb12u5 \
        libexpat1=2.5.0-1+deb12u1 \
        python3.11-minimal=3.11.2-6+deb12u5 \
        python3-minimal=3.11.2-1+b1 \
        media-types=10.0.0 \
        libncursesw6=6.4-4 \
        libkrb5support0=1.20.1-2+deb12u2 \
        libk5crypto3=1.20.1-2+deb12u2 \
        libkeyutils1=1.6.3-2 \
        libkrb5-3=1.20.1-2+deb12u2 \
        libgssapi-krb5-2=1.20.1-2+deb12u2 \
        libtirpc-common=1.3.3+ds-1 \
        libtirpc3=1.3.3+ds-1 \
        libnsl2=1.3.0-2 \
        readline-common=8.2-1.3 \
        libreadline8=8.2-1.3 \
        libsqlite3-0=3.40.1-2+deb12u1 \
        libpython3.11-stdlib=3.11.2-6+deb12u5 \
        python3.11=3.11.2-6+deb12u5 \
        libpython3-stdlib=3.11.2-1+b1 \
        python3=3.11.2-1+b1 \
    && dpkg-query -W -f='${Package}=${Version}\n' | LC_ALL=C sort > /lab-packages.txt \
    && rm -rf /var/lib/apt/lists/* /var/log/apt/* /var/log/dpkg.log \
    && find /usr /lab-packages.txt -name '*.pyc' -delete
WORKDIR /lab
COPY tools/a5-sovereign-root-lab/ /lab/
USER node
ENTRYPOINT ["node", "qualify.mjs"]
