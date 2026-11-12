#!/bin/bash
# Install the genefox command-line tool into ~/.local.
#
#   curl -fsSL <release base>/install.sh | bash
#   bash install-genefox-cli.sh [--prefix DIR] [--version X.Y.Z] [--base URL] [--helper]
#   bash install-genefox-cli.sh --uninstall-helper [--prefix DIR]
#
# Linux and WSL, --helper (the default helper): the per-user account helper,
# with no sudo and refused as root. genefox is installed as usual, then `genefox helper setup`
# (this account's 0700 folder, $XDG_STATE_HOME/genefox-helper, and its 0600 config.json), then a
# systemd --user unit, ~/.config/systemd/user/genefox-helper.service (`genefox helper run`,
# Restart=on-failure, no secret in it), enabled and started when `systemctl --user` works;
# without a systemd user instance (WSL without systemd) it runs `genefox helper start` now and
# says to run it again after each sign-in. An update restarts a running per-user helper.
# --uninstall-helper signs it out (`unlink --per-user`), stops it, removes its folder and its
# unit; genefox stays.
#
# macOS, --helper: also installs the standalone account helper for Macs
# without the GeneFox app. After the checks below it verifies bin/genefox-helper's signature
# against the helper's pinned requirement (`codesign --verify --strict`, `--test-requirement`),
# installs its signed bundle under <prefix>/libexec and a launcher in bin, then runs `genefox-helper install --user`, which
# writes ~/Library/LaunchAgents/com.vds.GeneFox.helper.plist and bootstraps it into
# gui/<uid>. No sudo. The prefix is the user's, so these checks catch accidents; the
# boundary is the provisioned keychain access group, which a swapped binary cannot claim.
# Homebrew's formula runs the same path (no `brew services`).
# --uninstall-helper runs `genefox-helper uninstall --user` (keychain items, agent, folder)
# and removes the binary.
#
# What it does, in order, and why nothing is unpacked before both checks pass:
#
#   1. Reads latest.json to learn the current version (or takes --version). That file is
#      only a pointer here; nothing in it is trusted yet.
#   2. Downloads <version>/manifest.json and its minisign signature from the version's
#      immutable directory and verifies the signature against the public key below, which
#      is GeneFox's own release key. The signature's trusted comment must name this product
#      and exactly this version, so an old, genuinely signed manifest cannot be replayed.
#   3. Downloads this platform's archive and checks its SHA-256 and size against the
#      verified manifest.
#   4. Unpacks it and installs the release layout under the prefix:
#        <prefix>/bin/genefox, bin/genefox.commit
#        <prefix>/share/genefox/Resources, share/genefox/GeneFoxCLI-ThirdParty-NOTICE.txt
#      replacing a previous genefox install there and nothing else (including the
#      bin/locus_genefox.{bundle,resources} an older release carried).
#   5. Runs `genefox --version`.
#
# Signature verification uses `minisign` when it is installed, and otherwise OpenSSL 3's
# Ed25519 (macOS's /usr/bin/openssl is LibreSSL and cannot; Homebrew's openssl@3 can, as
# can every current Linux). With neither, it stops: it never installs unverified.
#
# macOS: the binary is Developer ID signed and notarized. Downloaded with curl it carries no
# quarantine flag, so Gatekeeper does not assess it; the checks above are what protect this
# path. Bash 3.2 compatible (macOS /bin/bash).
#
# Linux, the optional hardened account helper service (--helper in earlier releases):
#
#   sudo bash install-genefox-cli.sh --helper-hardened [--helper-project ID --helper-api-key KEY]
#   sudo bash install-genefox-cli.sh --uninstall-helper-hardened
#
# Run as root through sudo, after the per-user install. PATH is pinned to the system's own
# folders; the release is downloaded and verified AGAIN in a fresh folder under
# /var/lib/genefox-helper-staging (root, 0700), with only /usr/bin/minisign or /usr/bin/openssl,
# never one from the invoking user's PATH. It then installs the release's genefox as
# /usr/local/lib/genefox-helper/genefox (root, 0755), which the service runs as `genefox helper
# service`, and /usr/local/bin/genefox-helper, a one-line alias for
# `genefox helper` kept for one release; creates the genefox-helper system user, and writes the
# unit, tmpfiles.d, the polkit
# action and /etc/genefox-helper/{clients,config.json}; `clients` admits the sudo caller's
# uid. The staging folder is removed whatever happens. --uninstall-helper-hardened removes all of it,
# the credential included, and reports each step.
set -euo pipefail

# ---------------------------------------------------------------------------------------
# Pinned by the release. An empty value makes this script refuse to run rather than trust
# anything.
#
# GENEFOX_CLI_PUBKEY is the second line of the minisign .pub file (base64). The release
# pipeline refuses to sign with any key whose public half differs from this line.
GENEFOX_CLI_PUBKEY="RWTc+F0bd3qlNlApONI2qRpbBAcrDfUhxdVUrsoaVYGdkaHjUWAB75BL"
# The public base the release is served from: <bucket URL>/<prefix>, no trailing slash.
GENEFOX_CLI_BASE_URL="https://storage.googleapis.com/vds-genefox-releases/genefox-cli"
# The account helper's backend, as install-genefox-cli.ps1 pins it: the
# vds-genefox Firebase project and its web API key, public client identifiers, never secrets.
# --helper-project and --helper-api-key override them.
GENEFOX_HELPER_PROJECT="vds-genefox"
GENEFOX_HELPER_API_KEY="AIzaSyCdBtmkreiH3q-rPdSdDhlcSd7BsYGyT_c"
# ---------------------------------------------------------------------------------------

PRODUCT="genefox-cli"
prefix="${GENEFOX_PREFIX:-$HOME/.local}"
version=""
base="$GENEFOX_CLI_BASE_URL"
pubkey_file=""
helper=no
uninstall_helper=no
# The released helper's designated requirement.
GENEFOX_HELPER_REQUIREMENT='anchor apple generic and identifier "com.vds.GeneFox.helper" and certificate leaf[subject.OU] = "6NXG8V2R8W"'
helper_action=""
# Linux and WSL: the per-user helper (--helper, --uninstall-helper).
user_helper=""
helper_project=""
helper_api_key=""
helper_dry_root=""

usage() {
    cat <<'EOF'
usage: install-genefox-cli.sh [--prefix DIR] [--version X.Y.Z] [--base URL]

  --prefix DIR      install under DIR (default ~/.local): DIR/bin/genefox, DIR/share/genefox
  --version X.Y.Z   install this version instead of the latest
  --base URL        the release location (a mirror, or file:// for a local copy)
  --pubkey-file F   verify with this minisign public key instead of the pinned one
                    (for testing a mirror's own signing key; never needed normally)
  --helper          also set up the account helper (no sudo): macOS, the agent; Linux and WSL,
                    the per-user helper (a systemd --user unit, or started now)
  --uninstall-helper  remove that helper and its credential (genefox stays)
  (--helper and --helper-hardened are refused, with nothing changed, for a release whose
   `genefox doctor` reports "account helper: unavailable", as GeneFox 1.1.0 does)

Linux optional hardened helper service (run with sudo, after the per-user install):
  --helper-hardened             install or update the helper service for the sudo caller
  --uninstall-helper-hardened   remove the service, its user and its credential
Linux helper configuration (per-user or hardened):
  --helper-project ID       the Firebase project the helper links through
  --helper-api-key KEY      that project's web API key
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --prefix) prefix="${2:?--prefix needs a directory}"; shift 2 ;;
        --version) version="${2:?--version needs X.Y.Z}"; shift 2 ;;
        --base) base="${2:?--base needs a URL}"; shift 2 ;;
        --pubkey-file) pubkey_file="${2:?--pubkey-file needs a file}"; shift 2 ;;
        # --helper and --uninstall-helper name the macOS agent or the Linux service: which one is
        # settled by the platform, below (both set the flags; the other platform clears its own).
        --helper) helper=yes; user_helper=install; shift ;;
        --uninstall-helper) uninstall_helper=yes; user_helper=uninstall; shift ;;
        --helper-hardened) helper_action=install; shift ;;
        --uninstall-helper-hardened) helper_action=uninstall; shift ;;
        --helper-project) helper_project="${2:?--helper-project needs an id}"; shift 2 ;;
        --helper-api-key) helper_api_key="${2:?--helper-api-key needs a key}"; shift 2 ;;
        # Tests only: write every file under DIR, run nothing as root, change no account.
        --helper-dry-run-root) helper_dry_root="${2:?--helper-dry-run-root needs a directory}"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "unknown option: $1" >&2; usage >&2; exit 64 ;;
    esac
done

die() { echo "genefox install: $*" >&2; exit 1; }
say() { echo "genefox install: $*"; }

# The platform picks the helper: the macOS agent on Darwin; on Linux the per-user helper
# (--helper) or the hardened service (--helper-hardened).
case "$(uname -s)" in
    Darwin)
        [ -z "$helper_action" ] || die "--helper-hardened and --uninstall-helper-hardened are for Linux"
        user_helper="" ;;
    Linux)
        helper=no; uninstall_helper=no
        if [ -n "$user_helper" ] && [ -n "$helper_action" ]; then
            die "choose one of --helper, --uninstall-helper, --helper-hardened or --uninstall-helper-hardened"
        fi ;;
    *) if [ -n "$helper_action" ] || [ -n "$user_helper" ] || [ "$helper" = yes ] || [ "$uninstall_helper" = yes ]; then
           die "--helper and --uninstall-helper are for macOS and Linux (Windows: install-genefox-cli.ps1 -Helper)"
       fi ;;
esac

if [ "$helper" = yes ] || [ "$uninstall_helper" = yes ]; then
    [ "$(uname -s)" = Darwin ] || die "--helper and --uninstall-helper are for macOS (Windows: genefox-helper install; Linux: see the GeneFox site)"
fi

# ---- --uninstall-helper: nothing is downloaded --------------------------------------------
if [ "$uninstall_helper" = yes ]; then
    [ -x "$prefix/bin/genefox-helper" ] || die "no genefox-helper at $prefix/bin"
    # The trusted reader removes its own keychain items, then the agent and its folder.
    # shellcheck disable=SC2086
    if "$prefix/bin/genefox-helper" uninstall --user ${GENEFOX_HELPER_ARGS:-}; then status=0; else status=$?; fi
    if [ $status -ne 0 ]; then
        say "cleanup was incomplete; kept the helper launcher so you can retry after addressing the reported items"
        exit "$status"
    fi
    rm -f "$prefix/bin/genefox-helper"
    say "removed $prefix/bin/genefox-helper"
    exit $status
fi

# ---- the helper step's preconditions ---------------------------------
# Decided before anything is read or downloaded: the platform, root, the sudo caller, and
# a PATH of the system's own folders only.
MINISIGN=""
OPENSSL=""
if [ -n "$helper_action" ]; then
    [ "$(uname -s)" = Linux ] || die "the account helper service is installed this way on Linux only (Windows: install-genefox-cli.ps1 -Helper)"
    PATH=/usr/sbin:/usr/bin:/sbin:/bin
    export PATH
    [ -x /usr/bin/minisign ] && MINISIGN=/usr/bin/minisign
    [ -x /usr/bin/openssl ] && OPENSSL=/usr/bin/openssl
    if [ -n "$helper_dry_root" ]; then
        helper_root="${helper_dry_root%/}"
        helper_client="${SUDO_UID:-$(id -u)}"
    else
        helper_root=""
        [ "$(id -u)" = 0 ] || die "run the helper step as root: sudo bash install-genefox-cli.sh --$([ "$helper_action" = install ] && echo helper-hardened || echo uninstall-helper-hardened)"
        helper_client="${SUDO_UID:-}"
    fi
    if [ "$helper_action" = install ]; then
        case "$helper_client" in
            ''|0|*[!0-9]*) die "run this with sudo from your own account (not a root shell), so the helper knows whom to admit" ;;
        esac
        [ -n "$helper_project" ] || helper_project="$GENEFOX_HELPER_PROJECT"
        [ -n "$helper_api_key" ] || helper_api_key="$GENEFOX_HELPER_API_KEY"
        if [ -n "$helper_project" ]; then
            echo "$helper_project" | grep -Eq '^[a-z][a-z0-9-]{4,28}[a-z0-9]$' || die "'$helper_project' is not a Firebase project id"
        fi
        if [ -n "$helper_api_key" ]; then
            echo "$helper_api_key" | grep -Eq '^AIza[0-9A-Za-z_-]{35}$' || die "the helper API key is not a Firebase web API key"
        fi
    fi
else
    MINISIGN="$(command -v minisign 2>/dev/null || true)"
    OPENSSL="$(command -v openssl 2>/dev/null || true)"
fi

# ---- the account helper service (Linux) ------------------------------
HELPER_ACCOUNT="genefox-helper"
# The service's own root-owned copy of genefox (the helper is `genefox
# helper`), and the `genefox-helper` alias for it, kept one release for scripts that name it.
HELPER_PROGRAM_DIR="/usr/local/lib/genefox-helper"
HELPER_PROGRAM="$HELPER_PROGRAM_DIR/genefox"
HELPER_BIN="/usr/local/bin/genefox-helper"
HELPER_UNIT="/etc/systemd/system/genefox-helper.service"
HELPER_TMPFILES="/etc/tmpfiles.d/genefox-helper.conf"
HELPER_POLKIT="/usr/share/polkit-1/actions/app.genefox.helper.policy"
HELPER_ETC="/etc/genefox-helper"
HELPER_STATE="/var/lib/genefox-helper"
HELPER_RUN="/run/genefox-helper"

# A system command, or in a dry run the line it would be.
helper_run() {
    if [ -n "$helper_dry_root" ]; then say "would run: $*"; else "$@"; fi
}

helper_account_exists() {
    [ -z "$helper_dry_root" ] && getent passwd "$HELPER_ACCOUNT" >/dev/null 2>&1
}

# helper_put <mode> <destination> : stdin to a root-owned file, replaced atomically.
helper_put() {
    local mode="$1" dest="$helper_root$2" tmp
    mkdir -p "$(dirname "$dest")"
    [ -L "$dest" ] && rm -f "$dest"
    tmp="$(mktemp "$dest.XXXXXX")"
    cat > "$tmp"
    chmod "$mode" "$tmp"
    [ -n "$helper_dry_root" ] || chown root:root "$tmp"
    mv -f "$tmp" "$dest"
}

helper_unit() {
    cat <<EOF
# Written by install-genefox-cli.sh --helper. Removed by --uninstall-helper.
[Unit]
Description=GeneFox account helper
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$HELPER_ACCOUNT
Group=$HELPER_ACCOUNT
ExecStart=$HELPER_PROGRAM helper service
Restart=on-failure
RestartSec=5
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
ReadWritePaths=$HELPER_STATE $HELPER_RUN
CapabilityBoundingSet=
AmbientCapabilities=
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
SystemCallFilter=@system-service
SystemCallArchitectures=native
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectControlGroups=yes
RestrictNamespaces=yes
LockPersonality=yes
RestrictRealtime=yes
UMask=0077

[Install]
WantedBy=multi-user.target
EOF
}

# The socket folder is root's, 1771: the service (its group) creates its sockets there, other
# users can reach them by path, and no one else can create, list or replace anything in it.
helper_tmpfiles() {
    cat <<EOF
# Written by install-genefox-cli.sh --helper.
d $HELPER_RUN 1771 root $HELPER_ACCOUNT -
d $HELPER_STATE 0700 $HELPER_ACCOUNT $HELPER_ACCOUNT -
EOF
}

# The presence confirmation (the Linux rule): the person's own password, asked by their
# polkit agent, and only in an active local session. allow_any (remote sessions, SSH) and
# allow_inactive are "no", so with no interactive session the answer is no. The owner
# annotation lets the service, and only it, check another user's process for this action.
# No "--" inside the XML comment: it is not well-formed XML, and polkitd drops the whole file
# ("parse error: not well-formed"), so the action is unknown and every link is refused
helper_polkit() {
    cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC "-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
 "http://www.freedesktop.org/standards/PolicyKit/1/policyconfig.dtd">
<!-- Written by install-genefox-cli.sh, the hardened helper install. -->
<policyconfig>
  <vendor>GeneFox</vendor>
  <action id="app.genefox.helper.confirm">
    <description>Link or sign out the GeneFox command-line tools</description>
    <message>Let AI assistants on this computer use your GeneFox account?</message>
    <defaults>
      <allow_any>no</allow_any>
      <allow_inactive>no</allow_inactive>
      <allow_active>auth_self</allow_active>
    </defaults>
    <annotate key="org.freedesktop.policykit.owner">unix-user:$HELPER_ACCOUNT</annotate>
  </action>
</policyconfig>
EOF
}

# The allowed uids: the ones already listed, plus the sudo caller. Anything that is not a
# plain uid line is dropped (the service would refuse the whole file).
helper_clients() {
    local existing="$helper_root$HELPER_ETC/clients"
    {
        echo "# uids the GeneFox helper admits, one a line (install-genefox-cli.sh --helper)"
        if [ -f "$existing" ] && [ ! -L "$existing" ]; then
            grep -E '^[1-9][0-9]*$' "$existing" | grep -vx "$helper_client" || true
        fi
        echo "$helper_client"
    }
}

# The `genefox-helper` alias: `genefox helper`, from the service's copy.
helper_alias() {
    cat <<EOF
#!/bin/sh
# Written by install-genefox-cli.sh --helper. genefox-helper is \`genefox helper\`;
# this alias is kept for one release. Removed by --uninstall-helper.
exec $HELPER_PROGRAM helper "\$@"
EOF
}

helper_install() {
    local src="$1" helper="$1/bin/genefox" status
    [ -f "$helper" ] || die "this release has no genefox for $platform. Nothing was installed."
    chmod 755 "$helper"
    set +e
    "$helper" helper --help >/dev/null 2>&1
    status=$?
    set -e
    [ $status -eq 2 ] || die "the downloaded genefox helper does not run on this machine. Nothing was installed."

    if helper_account_exists; then
        say "the $HELPER_ACCOUNT system user exists"
    else
        helper_run useradd --system --user-group --no-create-home --home-dir /nonexistent \
            --shell /usr/sbin/nologin "$HELPER_ACCOUNT"
    fi
    mkdir -p "$helper_root$HELPER_PROGRAM_DIR"
    chmod 0755 "$helper_root$HELPER_PROGRAM_DIR"
    helper_put 0755 "$HELPER_PROGRAM" < "$helper"
    say "installed $HELPER_PROGRAM"
    helper_alias | helper_put 0755 "$HELPER_BIN"
    say "installed $HELPER_BIN (an alias for genefox helper)"
    helper_unit | helper_put 0644 "$HELPER_UNIT"
    helper_tmpfiles | helper_put 0644 "$HELPER_TMPFILES"
    helper_polkit | helper_put 0644 "$HELPER_POLKIT"
    mkdir -p "$helper_root$HELPER_ETC"
    chmod 0755 "$helper_root$HELPER_ETC"
    helper_clients | helper_put 0644 "$HELPER_ETC/clients"
    say "uid $helper_client may use the helper ($HELPER_ETC/clients)"
    if [ -n "$helper_project" ] && [ -n "$helper_api_key" ]; then
        printf '{"apiKey":"%s","projectID":"%s"}\n' "$helper_api_key" "$helper_project" | helper_put 0644 "$HELPER_ETC/config.json"
        say "the helper links through $helper_project"
    elif [ -f "$helper_root$HELPER_ETC/config.json" ]; then
        say "kept the existing $HELPER_ETC/config.json"
    else
        say "no account configuration: the helper runs, but cannot link until re-run with --helper-project and --helper-api-key"
    fi
    helper_run systemd-tmpfiles --create "$HELPER_TMPFILES"
    helper_run systemctl daemon-reload
    helper_run systemctl enable "$(basename "$HELPER_UNIT")"
    helper_run systemctl restart "$(basename "$HELPER_UNIT")"
    if [ -z "$helper_dry_root" ]; then
        systemctl is-active --quiet "$(basename "$HELPER_UNIT")" \
            || die "the helper service did not start; see: journalctl -u $(basename "$HELPER_UNIT")"
    fi
    say "the GeneFox account helper is installed and running"
    say "next, as yourself (not root): genefox helper link (a per-user helper of yours is passed over while this runs)"
}

helper_uninstall() {
    local unit
    unit="$(basename "$HELPER_UNIT")"
    if [ -z "$helper_dry_root" ] && ! systemctl cat "$unit" >/dev/null 2>&1; then
        say "the helper service is not installed"
    else
        helper_run systemctl disable --now "$unit" || true
        say "stopped and disabled $unit"
    fi
    for file in "$HELPER_UNIT" "$HELPER_TMPFILES" "$HELPER_POLKIT" "$HELPER_BIN" "$HELPER_PROGRAM"; do
        rm -f "$helper_root$file"
        say "removed $file"
    done
    rmdir "$helper_root$HELPER_PROGRAM_DIR" 2>/dev/null || true
    helper_run systemctl daemon-reload
    # The state folder holds the credential and the sync copy; rm never follows a link in it.
    for folder in "$HELPER_ETC" "$HELPER_STATE" "$HELPER_RUN" "/var/lib/genefox-helper-staging"; do
        rm -rf "$helper_root$folder"
        say "removed $folder"
    done
    if helper_account_exists; then
        helper_run userdel "$HELPER_ACCOUNT"
        say "removed the $HELPER_ACCOUNT system user"
    elif [ -n "$helper_dry_root" ]; then
        helper_run userdel "$HELPER_ACCOUNT"
    fi
    say "the GeneFox account helper and its credential are removed"
}

# Removing the helper needs no release: it happens before anything is read or downloaded.
if [ "$helper_action" = uninstall ]; then
    helper_uninstall
    exit 0
fi

# ---- the per-user Linux helper ----------------------------------------
# Tests only: --helper-dry-run-root DIR puts the unit under DIR and runs nothing (each command is
# said instead).
user_root="${helper_dry_root%/}"
user_unit_dir="$user_root${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
USER_UNIT="genefox-helper.service"

# A command, or in a dry run the line it would be.
user_run() {
    if [ -n "$helper_dry_root" ]; then say "would run: $*"; return 0; fi
    "$@"
}

# Whether this session has a systemd user instance to run the unit (WSL without systemd has none).
user_systemd() {
    if [ -n "$helper_dry_root" ]; then [ "${GENEFOX_TEST_USER_SYSTEMD:-yes}" = yes ]; return; fi
    command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1
}

# The unit: genefox helper run, restarted on failure; no secret is in it (the configuration is
# in the helper's 0600 config.json).
user_unit() {
    cat <<EOF
# Written by install-genefox-cli.sh --helper. Removed by --uninstall-helper.
[Unit]
Description=GeneFox account helper (per-user)

[Service]
Type=simple
ExecStart="$prefix/bin/genefox" helper run
Restart=on-failure
RestartSec=5
NoNewPrivileges=yes

[Install]
WantedBy=default.target
EOF
}

if [ -n "$user_helper" ]; then
    if [ -z "$helper_dry_root" ] && [ "$(id -u)" = 0 ]; then
        die "run --helper as your own account, without sudo: the per-user helper never runs as root (for the service: --helper-hardened)"
    fi
fi

if [ "$user_helper" = uninstall ]; then
    g="$prefix/bin/genefox"
    if [ -f "$user_unit_dir/$USER_UNIT" ]; then
        user_systemd && { user_run systemctl --user disable --now "$USER_UNIT" || true; }
        rm -f "$user_unit_dir/$USER_UNIT"
        user_systemd && { user_run systemctl --user daemon-reload || true; }
        say "removed $user_unit_dir/$USER_UNIT"
    fi
    if [ -n "$helper_dry_root" ] || [ -x "$g" ]; then
        # Signed out first, so the link is revoked at GeneFox too; started for it if it is not running.
        set +e
        user_run "$g" helper unlink --per-user; unlinked=$?
        if [ $unlinked -eq 3 ]; then user_run "$g" helper start >/dev/null && { user_run "$g" helper unlink --per-user; unlinked=$?; }; fi
        set -e
        [ $unlinked -eq 0 ] || say "could not sign the per-user helper out here, so GeneFox may still list this computer's link"
        user_run "$g" helper stop || true
        user_run "$g" helper remove-data || die "genefox helper remove-data did not remove the helper's folder"
    fi
    say "the per-user GeneFox account helper and its credential are removed; genefox stays"
    exit 0
fi

pubkey="$GENEFOX_CLI_PUBKEY"
if [ -n "$pubkey_file" ]; then
    [ -f "$pubkey_file" ] || die "no public key file at $pubkey_file"
    pubkey="$(sed -n '2p' "$pubkey_file")"
fi
[ -n "$pubkey" ] || die "this installer has no release public key pinned yet, so it cannot verify anything. Nothing was installed."
[ -n "$base" ] || die "this installer has no release location configured yet (GENEFOX_CLI_BASE_URL). Nothing was installed."
base="${base%/}"
case "$base" in
    file://*) ;;
    https://*) command -v curl >/dev/null || die "curl is required" ;;
    *) die "the release location must be https:// (or file:// for a local copy)" ;;
esac

# ---- platform -------------------------------------------------------------------------
case "$(uname -s)" in
    # platform: the archive's name; id: the manifest's artefact id (GOOS-GOARCH, as
    # the release index names them; a universal macOS build has no arch).
    Darwin) platform="macos-universal"; id="darwin-universal"; ext="zip" ;;
    Linux)
        case "$(uname -m)" in
            x86_64|amd64) platform="linux-x86_64"; id="linux-amd64" ;;
            aarch64|arm64) platform="linux-arm64"; id="linux-arm64" ;;
            *) die "no genefox build for Linux $(uname -m)" ;;
        esac
        ext="tar.gz" ;;
    *) die "no genefox build for $(uname -s); see the GeneFox site for other platforms" ;;
esac

if [ -n "$helper_action" ]; then
    staging="$helper_root/var/lib/genefox-helper-staging"
    [ -L "$staging" ] && die "$staging is a link; refusing to stage there"
    mkdir -p "$helper_root/var/lib"
    (umask 077 && mkdir -p "$staging")
    if [ -z "$helper_dry_root" ]; then
        [ "$(stat -c '%u %a' "$staging")" = "0 700" ] || die "$staging is not root's own 0700 folder; refusing to stage there"
    fi
    work="$(mktemp -d "$staging/run.XXXXXX")"
else
    work="$(mktemp -d "${TMPDIR:-/tmp}/genefox-install.XXXXXX")"
fi
trap 'rm -rf "$work"' EXIT

fetch() {
    case "$1" in
        file://*) cp "${1#file://}" "$2" 2>/dev/null ;;
        *) curl -fsSL --proto '=https' --retry 3 --max-time 600 "$1" -o "$2" ;;
    esac
}

sha256() {
    if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | awk '{print $1}'
    elif command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
    else "$OPENSSL" dgst -sha256 -r "$1" | awk '{print $1}'; fi
}

# ---- minisign verification ------------------------------------------------------------
# verify_minisign <file> <file.minisig> -> prints the trusted comment on success.
b64d() { "$OPENSSL" base64 -d -A; }

verify_minisign() {
    local file="$1" sig="$2"
    if [ -n "$MINISIGN" ]; then
        printf 'untrusted comment: genefox-cli release key\n%s\n' "$pubkey" > "$work/key.pub"
        "$MINISIGN" -V -p "$work/key.pub" -m "$file" -x "$sig" -Q 2>/dev/null \
            || return 1
        return 0
    fi
    # OpenSSL 3 path: the minisign format, checked by hand.
    #   public key  base64("Ed" | key id (8) | Ed25519 public key (32))
    #   signature   line 2: base64(alg (2) | key id (8) | sig (64)), alg "ED" = prehashed with
    #               BLAKE2b-512 (minisign's default) or "Ed" = the file itself
    #               line 3: "trusted comment: <text>"
    #               line 4: base64(Ed25519 over sig (64) | <text>)
    [ -n "$OPENSSL" ] || return 2
    case "$("$OPENSSL" version 2>/dev/null)" in OpenSSL\ 3*) ;; *) return 2 ;; esac
    local d="$work/ms"
    mkdir -p "$d"
    printf '%s' "$pubkey" | b64d > "$d/pk.bin" 2>/dev/null || return 1
    [ "$(wc -c < "$d/pk.bin" | tr -d ' ')" = 42 ] || return 1
    [ "$(head -c 2 "$d/pk.bin")" = "Ed" ] || return 1
    sed -n '2p' "$sig" | b64d > "$d/sig.bin" 2>/dev/null || return 1
    [ "$(wc -c < "$d/sig.bin" | tr -d ' ')" = 74 ] || return 1
    local trusted
    trusted="$(sed -n '3p' "$sig")"
    case "$trusted" in "trusted comment: "*) ;; *) return 1 ;; esac
    trusted="${trusted#trusted comment: }"
    sed -n '4p' "$sig" | b64d > "$d/global.bin" 2>/dev/null || return 1
    [ "$(wc -c < "$d/global.bin" | tr -d ' ')" = 64 ] || return 1
    # Key ids must match: a signature from another key is refused before any crypto.
    [ "$(head -c 10 "$d/pk.bin" | tail -c 8 | od -An -tx1 | tr -d ' \n')" = \
      "$(head -c 10 "$d/sig.bin" | tail -c 8 | od -An -tx1 | tr -d ' \n')" ] || return 1
    # SubjectPublicKeyInfo for Ed25519 = fixed 12-byte prefix + the raw key.
    { printf '\060\052\060\005\006\003\053\145\160\003\041\000'; tail -c 32 "$d/pk.bin"; } > "$d/pk.der"
    "$OPENSSL" pkey -pubin -inform DER -in "$d/pk.der" -out "$d/pk.pem" 2>/dev/null || return 1
    tail -c 64 "$d/sig.bin" > "$d/sig64.bin"
    case "$(head -c 2 "$d/sig.bin")" in
        ED) "$OPENSSL" dgst -blake2b512 -binary "$file" > "$d/msg.bin" ;;
        Ed) cp "$file" "$d/msg.bin" ;;
        *) return 1 ;;
    esac
    "$OPENSSL" pkeyutl -verify -pubin -inkey "$d/pk.pem" -rawin -in "$d/msg.bin" \
        -sigfile "$d/sig64.bin" >/dev/null 2>&1 || return 1
    { cat "$d/sig64.bin"; printf '%s' "$trusted"; } > "$d/global.msg"
    "$OPENSSL" pkeyutl -verify -pubin -inkey "$d/pk.pem" -rawin -in "$d/global.msg" \
        -sigfile "$d/global.bin" >/dev/null 2>&1 || return 1
    printf '%s\n' "$trusted"
}


# ---- 1. which version -----------------------------------------------------------------
if [ -z "$version" ]; then
    fetch "$base/latest.json" "$work/latest.json" || die "could not read $base/latest.json"
    version="$(sed -n 's/^ *"version": "\([^"]*\)",*$/\1/p' "$work/latest.json" | head -1)"
fi
case "$version" in
    v*) die "pass the version without a leading v (e.g. 1.1.0)" ;;
esac
echo "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' \
    || die "'$version' is not a release version"

# ---- 2. the signed manifest -----------------------------------------------------------
fetch "$base/$version/manifest.json" "$work/manifest.json" || die "no manifest for $version at $base/$version/"
fetch "$base/$version/manifest.json.minisig" "$work/manifest.json.minisig" || die "no signature for the $version manifest"
set +e
trusted="$(verify_minisign "$work/manifest.json" "$work/manifest.json.minisig")"
status=$?
set -e
if [ $status -eq 2 ]; then
    die "cannot verify the release signature: install minisign (brew install minisign / apt install minisign) or OpenSSL 3, then re-run. Nothing was installed."
elif [ $status -ne 0 ]; then
    die "the $version manifest's signature does NOT verify against GeneFox's release key. Nothing was installed."
fi
case " $trusted " in
    *" product:$PRODUCT "*) ;;
    *) die "the signature is for another product ($trusted). Nothing was installed." ;;
esac
case " $trusted " in
    *" version:$version "*) ;;
    *) die "the signature names another version ($trusted), not $version. Nothing was installed." ;;
esac
grep -q "^  \"id\": \"$PRODUCT\",$" "$work/manifest.json" || die "the manifest is not a $PRODUCT manifest"
grep -q "^  \"version\": \"$version\",$" "$work/manifest.json" || die "the manifest does not describe $version"
say "verified the signed manifest for $PRODUCT $version"

# ---- 3. the archive -------------------------------------------------------------------
line="$(grep "^    {\"id\": \"$id\"," "$work/manifest.json" | head -1 || true)"
[ -n "$line" ] || die "$version has no build for $platform"
field() { printf '%s' "$line" | sed -n "s/.*\"$1\": \"\{0,1\}\([^\",]*\)\"\{0,1\}[,}].*/\1/p"; }
filename="$(field filename)"; path="$(field path)"; want_sha="$(field sha256)"; want_size="$(field sizeBytes)"
[ "$filename" = "genefox-cli-$version-$platform.$ext" ] || die "unexpected artefact name '$filename'"
[ "$path" = "$version/$filename" ] || die "unexpected artefact path '$path'"
echo "$want_sha" | grep -Eq '^[0-9a-f]{64}$' || die "the manifest has no usable SHA-256 for $filename"
say "downloading $filename"
fetch "$base/$path" "$work/$filename" || die "could not download $base/$path"
[ "$(wc -c < "$work/$filename" | tr -d ' ')" = "$want_size" ] || die "$filename has the wrong size. Nothing was installed."
[ "$(sha256 "$work/$filename")" = "$want_sha" ] || die "$filename does not match the signed SHA-256. Nothing was installed."
say "SHA-256 matches the signed manifest"

# ---- 4. unpack and install ------------------------------------------------------------
mkdir -p "$work/unpack"
case "$ext" in
    zip)
        if command -v ditto >/dev/null 2>&1; then ditto -x -k "$work/$filename" "$work/unpack"
        else (cd "$work/unpack" && unzip -q "$work/$filename"); fi ;;
    tar.gz) tar -xzf "$work/$filename" -C "$work/unpack" ;;
esac
src="$work/unpack/genefox-cli-$version-$platform"
[ -x "$src/bin/genefox" ] && [ -f "$src/share/genefox/Resources/ScientificResources.json" ] \
    || die "the archive does not hold the expected layout. Nothing was installed."

# Run it from the unpacked copy BEFORE touching the prefix, so a binary this machine cannot
# run never replaces one that works. The Linux build links the Swift runtime statically but
# loads the system libcurl (libcurl.so.4), which minimal images leave out.
if ! "$src/bin/genefox" --version >/dev/null 2>"$work/run.err"; then
    if grep -q "libcurl" "$work/run.err"; then
        die "genefox needs the system libcurl (Debian/Ubuntu: apt install libcurl4; Fedora: dnf install libcurl). Nothing was installed."
    fi
    cat "$work/run.err" >&2
    die "the downloaded genefox does not run on this machine. Nothing was installed."
fi

# Whether this run sets up an account helper, however it was asked for: the macOS agent
# (--helper on Darwin: helper=yes), the Linux per-user helper (--helper on Linux, which the
# platform switch above records as user_helper=install) or the hardened service
# (--helper-hardened). Every helper install is gated by this one predicate.
installs_helper() {
    [ "$helper" = yes ] || [ "$user_helper" = install ] || [ "$helper_action" = install ]
}

# The account helper is offered per release: while this genefox's doctor reports
# "account helper: unavailable", --helper and --helper-hardened stop here, before anything is
# changed. A release from before that line prints none and had no such gate.
if installs_helper; then
    doctor="$("$src/bin/genefox" doctor --output-dir "$work/doctor" 2>/dev/null || true)"
    if printf '%s\n' "$doctor" | grep -qx 'account helper: unavailable'; then
        die "the account helper is not available in GeneFox $version, so --helper and --helper-hardened cannot set it up. Nothing was installed or changed; run without them to install genefox."
    fi
fi

if [ "$helper_action" = install ]; then
    helper_install "$src"
    exit 0
fi

mkdir -p "$prefix/bin" "$prefix/share"
# Replace a previous genefox install (and only that): every path below is genefox's own.
rm -rf "$prefix/bin/genefox" "$prefix/bin/genefox.commit" "$prefix/bin/locus_genefox.bundle" \
       "$prefix/bin/locus_genefox.resources" "$prefix/bin/locus_GenefoxTools.bundle" \
       "$prefix/bin/locus_GenefoxTools.resources" "$prefix/share/genefox"
cp -R "$src/share/genefox" "$prefix/share/genefox"
for item in "$src/bin/"*; do
    # The account helper is installed only as a service (--helper), never per user; on Linux
    # it is `genefox helper`, and genefox-helper only its alias.
    [ "$(basename "$item")" = genefox-helper ] && continue
    cp -R "$item" "$prefix/bin/"
done
chmod 755 "$prefix/bin/genefox"

# ---- 4a. the per-user Linux helper (--helper) -----------------------------
if [ "$user_helper" = install ]; then
    g="$prefix/bin/genefox"
    [ -n "$helper_project" ] || helper_project="$GENEFOX_HELPER_PROJECT"
    [ -n "$helper_api_key" ] || helper_api_key="$GENEFOX_HELPER_API_KEY"
    setup=(helper setup)
    if [ -n "$helper_project" ] && [ -n "$helper_api_key" ]; then
        echo "$helper_project" | grep -Eq '^[a-z][a-z0-9-]{4,28}[a-z0-9]$' || die "'$helper_project' is not a Firebase project id"
        echo "$helper_api_key" | grep -Eq '^AIza[0-9A-Za-z_-]{35}$' || die "the helper API key is not a Firebase web API key"
        setup+=(--project "$helper_project" --api-key "$helper_api_key")
    fi
    if [ -n "$helper_dry_root" ]; then
        say "would run: $g helper setup${helper_project:+ --project $helper_project}${helper_api_key:+ --api-key (key)}"
    else
        "$g" "${setup[@]}" || die "genefox helper setup did not finish; see its message above"
    fi
    if user_systemd; then
        mkdir -p "$user_unit_dir"
        user_unit > "$user_unit_dir/$USER_UNIT"
        chmod 0644 "$user_unit_dir/$USER_UNIT"
        user_run systemctl --user daemon-reload
        user_run systemctl --user enable "$USER_UNIT"
        # Restarted, so an update runs the new genefox.
        user_run "$g" helper stop >/dev/null || true
        user_run systemctl --user restart "$USER_UNIT"
        say "the per-user GeneFox account helper runs from $user_unit_dir/$USER_UNIT (systemd --user)"
    else
        user_run "$g" helper stop >/dev/null || true
        user_run "$g" helper start || die "genefox helper start did not start the helper"
        say "no systemd user instance here (WSL without systemd, say): the helper is started now; run"
        say "  $g helper start   after each sign-in, or enable systemd in /etc/wsl.conf and re-run --helper"
    fi
    say "next: $g helper link"
elif [ -f "$user_unit_dir/$USER_UNIT" ]; then
    # An update: a per-user helper run by its unit is restarted, so it runs the new genefox
    # One started by hand keeps running the old one until `genefox helper stop` and
    # `start`.
    user_systemd && { user_run systemctl --user restart "$USER_UNIT" || true; say "restarted the per-user helper"; }
fi

# ---- 4b. the macOS account helper (--helper) -----------------------------------------------
if [ "$helper" = yes ]; then
    happ="$src/libexec/GeneFoxHelper.app"
    hsrc="$happ/Contents/MacOS/genefox-helper"
    [ -x "$hsrc" ] && [ -f "$happ/Contents/embedded.provisionprofile" ] \
        || die "this release has no provisioned helper bundle. genefox was installed; the helper was not."
    /usr/bin/codesign --verify --strict --deep "$happ" 2>/dev/null || die "the helper bundle's signature does not verify. The helper was not installed."
    /usr/bin/codesign --test-requirement="=$GENEFOX_HELPER_REQUIREMENT" --verify "$happ" 2>/dev/null \
        || die "the bundle is not GeneFox's signed helper. The helper was not installed."
    "$hsrc" check-custody || die "the helper's protected keychain entitlement was refused. The helper was not installed."
    # Versioned immutable bundles keep an interrupted upgrade from damaging the old binary.
    hhash="$(/usr/bin/codesign -dvvv "$happ" 2>&1 | sed -n 's/^CDHash=//p')"
    case "$hhash" in ''|*[!0-9a-fA-F]*) die "could not read the helper code-directory hash" ;; esac
    [ "${#hhash}" = 40 ] || die "the helper code-directory hash is malformed"
    hname="GeneFoxHelper-$hhash.app"
    mkdir -p "$prefix/libexec"
    [ ! -L "$prefix/libexec" ] || die "refused a symbolic-link helper bundle directory"
    hdst="$prefix/libexec/$hname"
    if [ ! -e "$hdst" ]; then
        hstage="$prefix/libexec/.GeneFoxHelper-$$.app"
        [ ! -e "$hstage" ] && [ ! -L "$hstage" ] || die "helper staging directory already exists"
        /usr/bin/ditto "$happ" "$hstage"
        /usr/bin/codesign --verify --strict --deep "$hstage" || die "copied helper signature does not verify"
        mv "$hstage" "$hdst"
    fi
    [ ! -L "$hdst" ] || die "refused a symbolic-link helper bundle"
    /usr/bin/codesign --verify --strict --deep "$hdst" || die "installed helper signature does not verify"
    /usr/bin/codesign --test-requirement="=$GENEFOX_HELPER_REQUIREMENT" --verify "$hdst" \
        || die "installed bundle is not GeneFox's signed helper"
    installed_hash="$(/usr/bin/codesign -dvvv "$hdst" 2>&1 | sed -n 's/^CDHash=//p')"
    [ "$installed_hash" = "$hhash" ] || die "the existing helper bundle differs from this verified release"
    "$hdst/Contents/MacOS/genefox-helper" check-custody || die "the installed helper's protected custody was refused"
    # The launcher carries no entitlement. Only the executable inside the signed bundle does.
    hlauncher="$prefix/bin/.genefox-helper-$$"
    [ ! -e "$hlauncher" ] && [ ! -L "$hlauncher" ] || die "helper launcher staging file already exists"
    printf '#!/bin/sh\nexec "$(dirname "$0")/../libexec/%s/Contents/MacOS/genefox-helper" "$@"\n' "$hname" > "$hlauncher"
    chmod 755 "$hlauncher"
    mv -f "$hlauncher" "$prefix/bin/genefox-helper"
    "$prefix/bin/genefox-helper" install --user || die "genefox-helper install --user failed; see its message above."
    "$prefix/bin/genefox-helper" status || true
fi

# ---- 5. smoke -------------------------------------------------------------------------
installed="$("$prefix/bin/genefox" --version)" || die "the installed genefox did not run"
say "installed $installed at $prefix/bin/genefox"
case ":$PATH:" in
    *":$prefix/bin:"*) ;;
    *) say "add $prefix/bin to your PATH to run genefox by name" ;;
esac
