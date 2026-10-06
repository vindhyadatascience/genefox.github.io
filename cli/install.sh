#!/bin/bash
# Install the genefox command-line tool into ~/.local (RNABrowser-o47.4).
#
#   curl -fsSL <release base>/install.sh | bash
#   bash install-genefox-cli.sh [--prefix DIR] [--version X.Y.Z] [--base URL]
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
#   4. Unpacks it and installs the o47.1 layout under the prefix:
#        <prefix>/bin/genefox, bin/genefox.commit, bin/locus_genefox.{bundle,resources}
#        <prefix>/share/genefox/Resources, share/genefox/GeneFoxCLI-ThirdParty-NOTICE.txt
#      replacing a previous genefox install there and nothing else.
#   5. Runs `genefox --version`.
#
# Signature verification uses `minisign` when it is installed, and otherwise OpenSSL 3's
# Ed25519 (macOS's /usr/bin/openssl is LibreSSL and cannot; Homebrew's openssl@3 can, as
# can every current Linux). With neither, it stops: it never installs unverified.
#
# macOS: the binary is Developer ID signed and notarized. Downloaded with curl it carries no
# quarantine flag, so Gatekeeper does not assess it; the checks above are what protect this
# path. Bash 3.2 compatible (macOS /bin/bash).
set -euo pipefail

# ---------------------------------------------------------------------------------------
# Pinned by the release (see docs/CLIReleasePipeline.md). Both EMPTY until Jared generates
# GeneFox's minisign key and the bucket convention is confirmed with timetracking; until
# then this script refuses to run rather than trust anything.
#
# GENEFOX_CLI_PUBKEY is the second line of the minisign .pub file (base64). The release
# pipeline refuses to sign with any key whose public half differs from this line.
GENEFOX_CLI_PUBKEY="RWTc+F0bd3qlNlApONI2qRpbBAcrDfUhxdVUrsoaVYGdkaHjUWAB75BL"
# The public base the release is served from: <bucket URL>/<prefix>, no trailing slash.
GENEFOX_CLI_BASE_URL="https://storage.googleapis.com/vds-genefox-releases/genefox-cli"
# ---------------------------------------------------------------------------------------

PRODUCT="genefox-cli"
prefix="${GENEFOX_PREFIX:-$HOME/.local}"
version=""
base="$GENEFOX_CLI_BASE_URL"
pubkey_file=""

usage() {
    cat <<'EOF'
usage: install-genefox-cli.sh [--prefix DIR] [--version X.Y.Z] [--base URL]

  --prefix DIR      install under DIR (default ~/.local): DIR/bin/genefox, DIR/share/genefox
  --version X.Y.Z   install this version instead of the latest
  --base URL        the release location (a mirror, or file:// for a local copy)
  --pubkey-file F   verify with this minisign public key instead of the pinned one
                    (for testing a mirror's own signing key; never needed normally)
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --prefix) prefix="${2:?--prefix needs a directory}"; shift 2 ;;
        --version) version="${2:?--version needs X.Y.Z}"; shift 2 ;;
        --base) base="${2:?--base needs a URL}"; shift 2 ;;
        --pubkey-file) pubkey_file="${2:?--pubkey-file needs a file}"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "unknown option: $1" >&2; usage >&2; exit 64 ;;
    esac
done

die() { echo "genefox install: $*" >&2; exit 1; }
say() { echo "genefox install: $*"; }

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
    # timetracking's release index names them; a universal macOS build has no arch).
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

work="$(mktemp -d "${TMPDIR:-/tmp}/genefox-install.XXXXXX")"
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
    else openssl dgst -sha256 -r "$1" | awk '{print $1}'; fi
}

# ---- minisign verification ------------------------------------------------------------
# verify_minisign <file> <file.minisig> -> prints the trusted comment on success.
b64d() { openssl base64 -d -A; }

verify_minisign() {
    local file="$1" sig="$2"
    if command -v minisign >/dev/null 2>&1; then
        printf 'untrusted comment: genefox-cli release key\n%s\n' "$pubkey" > "$work/key.pub"
        minisign -V -p "$work/key.pub" -m "$file" -x "$sig" -Q 2>/dev/null \
            || return 1
        return 0
    fi
    # OpenSSL 3 path: the minisign format, checked by hand.
    #   public key  base64("Ed" | key id (8) | Ed25519 public key (32))
    #   signature   line 2: base64(alg (2) | key id (8) | sig (64)), alg "ED" = prehashed with
    #               BLAKE2b-512 (minisign's default) or "Ed" = the file itself
    #               line 3: "trusted comment: <text>"
    #               line 4: base64(Ed25519 over sig (64) | <text>)
    command -v openssl >/dev/null 2>&1 || return 2
    case "$(openssl version 2>/dev/null)" in OpenSSL\ 3*) ;; *) return 2 ;; esac
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
    openssl pkey -pubin -inform DER -in "$d/pk.der" -out "$d/pk.pem" 2>/dev/null || return 1
    tail -c 64 "$d/sig.bin" > "$d/sig64.bin"
    case "$(head -c 2 "$d/sig.bin")" in
        ED) openssl dgst -blake2b512 -binary "$file" > "$d/msg.bin" ;;
        Ed) cp "$file" "$d/msg.bin" ;;
        *) return 1 ;;
    esac
    openssl pkeyutl -verify -pubin -inkey "$d/pk.pem" -rawin -in "$d/msg.bin" \
        -sigfile "$d/sig64.bin" >/dev/null 2>&1 || return 1
    { cat "$d/sig64.bin"; printf '%s' "$trusted"; } > "$d/global.msg"
    openssl pkeyutl -verify -pubin -inkey "$d/pk.pem" -rawin -in "$d/global.msg" \
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

mkdir -p "$prefix/bin" "$prefix/share"
# Replace a previous genefox install (and only that): every path below is genefox's own.
rm -rf "$prefix/bin/genefox" "$prefix/bin/genefox.commit" "$prefix/bin/locus_genefox.bundle" \
       "$prefix/bin/locus_genefox.resources" "$prefix/share/genefox"
cp -R "$src/share/genefox" "$prefix/share/genefox"
for item in "$src/bin/"*; do
    cp -R "$item" "$prefix/bin/"
done
chmod 755 "$prefix/bin/genefox"

# ---- 5. smoke -------------------------------------------------------------------------
installed="$("$prefix/bin/genefox" --version)" || die "the installed genefox did not run"
say "installed $installed at $prefix/bin/genefox"
case ":$PATH:" in
    *":$prefix/bin:"*) ;;
    *) say "add $prefix/bin to your PATH to run genefox by name" ;;
esac
