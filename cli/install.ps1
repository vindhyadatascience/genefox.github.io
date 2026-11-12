# Install the genefox command-line tool on Windows, per user, and optionally
# the GeneFox account helper: per user by default, or as the hardened
# service.
#
#   irm <release base>/install.ps1 | iex
#   powershell -ExecutionPolicy RemoteSigned -File install-genefox-cli.ps1 [-Prefix DIR] [-Version X.Y.Z] [-Base URL]
#   powershell -ExecutionPolicy RemoteSigned -File install-genefox-cli.ps1 -Helper [-HelperProject ID -HelperApiKey KEY]
#   powershell -ExecutionPolicy RemoteSigned -File install-genefox-cli.ps1 -UninstallHelper
#   powershell -ExecutionPolicy RemoteSigned -File install-genefox-cli.ps1 -HelperHardened [-HelperProject ID -HelperApiKey KEY]
#   powershell -ExecutionPolicy RemoteSigned -File install-genefox-cli.ps1 -UninstallHelperHardened
#
# Never use -ExecutionPolicy Bypass: RemoteSigned is enough. If Windows refuses the
# downloaded copy (Mark of the Web), unblock the file you verified instead of widening
# the policy:
#   Unblock-File -LiteralPath .\install-genefox-cli.ps1
#
# The Windows twin of install-genefox-cli.sh, with the same checks in the same order, and
# nothing unpacked before both pass:
#
#   1. Reads latest.json to learn the current version (or takes -Version). That file is only
#      a pointer here; nothing in it is trusted yet.
#   2. Downloads <version>/manifest.json and its minisign signature and verifies the signature
#      against GeneFox's release key, pinned below. The trusted comment must name this product
#      and exactly this version, so an old, genuinely signed manifest cannot be replayed.
#   3. Downloads this machine's archive (windows-x64 or windows-arm64) and checks its SHA-256
#      and size against the verified manifest.
#   4. Unpacks it, runs the unpacked genefox.exe --version, then installs the layout under the
#      prefix (default %LOCALAPPDATA%\Programs\GeneFox):
#        <prefix>\bin\genefox.exe, bin\genefox.commit, and any runtime DLLs the archive's
#        bin\ holds
#        <prefix>\share\genefox\Resources, share\genefox\GeneFoxCLI-ThirdParty-NOTICE.txt
#      replacing a previous genefox install there and nothing else (including the
#      bin\locus_genefox.{bundle,resources} an older release carried).
#   5. Adds <prefix>\bin to the user PATH (not with -NoModifyPath or GENEFOX_NO_MODIFY_PATH=1)
#      and runs genefox --version.
#
# -Helper (or GENEFOX_HELPER=1) then sets up the per-user account helper, with no administrator
# approval. The helper is genefox.exe itself, as `genefox helper`:
# `genefox helper setup` (this account's private folder under
# %LOCALAPPDATA%\GeneFox\Helper, and its configuration); a `GeneFoxHelper` value under this
# account's Run key (HKCU\Software\Microsoft\Windows\CurrentVersion\Run) that runs
# `"<prefix>\bin\genefoxw.exe" helper start` at sign-in (genefoxw.exe is genefox with no window,
# `start` runs `genefox helper run` with no window; an older archive with no
# genefoxw.exe gets `"<prefix>\bin\genefox.exe" helper start`, as before); and `genefox helper
# start` now. An update rewrites an earlier version's genefox.exe value to genefoxw.exe. Refused from an elevated PowerShell. It runs as you, so
# AI tools that run as you can use its sign-in: `setup` says so. It holds no sync key and does
# not sync. An update moves a per-user helper an earlier version set up (bin\genefox-helper.exe
# and its Run value) to genefox.exe. -UninstallHelper signs it (and only it) out, stops it,
# deletes its folder and credential, and removes the Run value; -HelperHardened does the same
# first. genefox.exe stays.
#
# -HelperStrictAdminPrompt (or GENEFOX_HELPER_STRICT_ADMIN_PROMPT=1), with -HelperHardened, installs
# the service in strict mode: link and unlink need Windows set to ask administrators every time.
# Strict mode is sticky: a later -HelperHardened keeps it, unless given
# -HelperAdminPromptDefault (or GENEFOX_HELPER_ADMIN_PROMPT_DEFAULT=1).
#
# -HelperHardened (or GENEFOX_HELPER_HARDENED=1) instead installs the account helper service,
# with one UAC prompt: it keeps its sign-in under an account of its own, which AI tools running
# as you cannot read. The elevated step reads no script from a folder you can write: it is
# passed as a command. In a
# new folder under %ProgramData%\GeneFox\HelperStaging that only SYSTEM and Administrators can
# change, it downloads and verifies the signed release again, from the start (nothing the
# unelevated step fetched is trusted), using only a verifier that sits in an administrators-only
# location (never one found on your PATH, which you could replace), unpacks it there, and runs
# `genefox helper install` from it, which copies genefox.exe to %ProgramFiles%\GeneFox\Helper and
# runs it as the service (`genefox.exe helper service`). The staging folder is removed whatever
# happens. -UninstallHelperHardened stages the same way and runs `genefox helper uninstall` from
# that copy.
#
# -Helper and -HelperHardened need a release that offers the account helper: while the downloaded
# genefox's `doctor` reports "account helper: unavailable" (GeneFox 1.1.0), they are refused before
# anything is installed or changed. The uninstall switches always run.
#
# Signature verification uses minisign.exe when it is on PATH (winget install jedisct1.minisign),
# and otherwise OpenSSL 3's Ed25519: openssl on PATH, or the one Git for Windows ships. .NET
# has no Ed25519. With neither it stops: it never installs unverified.
#
# Windows PowerShell 5.1 compatible. Through `irm | iex` there are no parameters, so each has an
# environment variable too: GENEFOX_PREFIX, GENEFOX_VERSION, GENEFOX_CLI_BASE, GENEFOX_HELPER,
# GENEFOX_HELPER_HARDENED.
param(
    [string]$Prefix = $(if ($env:GENEFOX_PREFIX) { $env:GENEFOX_PREFIX } else { Join-Path $env:LOCALAPPDATA 'Programs\GeneFox' }),
    [string]$Version = $env:GENEFOX_VERSION,
    [string]$Base = $env:GENEFOX_CLI_BASE,
    [string]$PubkeyFile = '',
    [switch]$NoModifyPath,
    [switch]$Helper = ($env:GENEFOX_HELPER -eq '1'),
    [switch]$UninstallHelper,
    [switch]$HelperHardened = ($env:GENEFOX_HELPER_HARDENED -eq '1'),
    # With -HelperHardened: the service's strict mode, which accepts a link or
    # unlink only while Windows asks administrators every time (ConsentPromptBehaviorAdmin 2).
    [switch]$HelperStrictAdminPrompt = ($env:GENEFOX_HELPER_STRICT_ADMIN_PROMPT -eq '1'),
    # With -HelperHardened: leave strict mode. Strict mode is sticky, so without this a reinstall
    # keeps it.
    [switch]$HelperAdminPromptDefault = ($env:GENEFOX_HELPER_ADMIN_PROMPT_DEFAULT -eq '1'),
    [switch]$UninstallHelperHardened,
    [string]$HelperProject = '',
    [string]$HelperApiKey = '',
    # Tests only: run the hardened helper step's
    # verification unelevated against this folder, with the same administrators-only verifiers,
    # applying no permissions and running nothing.
    [string]$HelperDryRunRoot = '',
    # Tests only: the per-user helper step with its Run value under HKCU\Software\GeneFoxTest\
    # <root's name>\Run (never the real Run key), and `genefox helper` itself never run.
    [string]$HelperUserTestRoot = ''
)

# ---------------------------------------------------------------------------------------
# Pinned by the release, identical to install-genefox-cli.sh.
# GENEFOX_CLI_PUBKEY is the second line of the minisign .pub file (base64).
$GENEFOX_CLI_PUBKEY = 'RWTc+F0bd3qlNlApONI2qRpbBAcrDfUhxdVUrsoaVYGdkaHjUWAB75BL'
$GENEFOX_CLI_BASE_URL = 'https://storage.googleapis.com/vds-genefox-releases/genefox-cli'
# The account helper's Firebase project id and web API key: public client identifiers, the
# same ones the apps carry, never secrets. -HelperProject and -HelperApiKey override them.
$GENEFOX_HELPER_PROJECT = 'vds-genefox'
$GENEFOX_HELPER_API_KEY = 'AIzaSyCdBtmkreiH3q-rPdSdDhlcSd7BsYGyT_c'
# ---------------------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2
$PRODUCT = 'genefox-cli'

# What both the unelevated install and the elevated helper step run, byte for byte: the elevated
# step receives this same text, so the checks it makes are the ones here.
$GeneFoxShared = @'
# Windows PowerShell 5.1 turns a native program's stderr into a terminating error under
# ErrorActionPreference Stop, so native calls run with Continue here and are judged by their
# exit code alone. Returns stdout lines; $LASTEXITCODE is the program's.
function Invoke-Native([string]$program, [string[]]$arguments) {
    $ErrorActionPreference = 'Continue'
    & $program @arguments 2>$null
}

function Say([string]$message) { Write-Host "genefox install: $message" }
function Fail([string]$message) { throw "genefox install: $message" }

function Get-Remote([string]$url, [string]$destination) {
    if ($url.StartsWith('file://')) {
        $path = ([Uri]$url).LocalPath
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $false }
        Copy-Item -LiteralPath $path -Destination $destination
        return $true
    }
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Invoke-WebRequest -Uri $url -OutFile $destination -UseBasicParsing -TimeoutSec 600
            return $true
        } catch {
            if ($attempt -eq 3) { return $false }
            Start-Sleep -Seconds 2
        }
    }
}

function Same-Bytes([byte[]]$a, [byte[]]$b) {
    if ($a.Length -ne $b.Length) { return $false }
    for ($i = 0; $i -lt $a.Length; $i++) { if ($a[$i] -ne $b[$i]) { return $false } }
    return $true
}

# Verify <file> against <sig> (minisign format) and return the trusted comment, or $null if the
# signature does not verify. Throws 'no-verifier' when neither minisign nor OpenSSL 3 exists.
# Where it looks for them is Find-Minisign and Find-OpenSSL3, defined per step.
function Test-Minisign([string]$file, [string]$sig, [string]$pubkey, [string]$work) {
    $ErrorActionPreference = 'Continue'  # native calls; see Invoke-Native
    $minisign = Find-Minisign
    if ($minisign) {
        $keyFile = Join-Path $work 'key.pub'
        [IO.File]::WriteAllText($keyFile, "untrusted comment: genefox-cli release key`n$pubkey`n")
        # -Q prints only the trusted comment, and only when the signature verifies.
        $trusted = & $minisign -V -p $keyFile -m $file -x $sig -Q 2>$null
        if ($LASTEXITCODE -ne 0) { return $null }
        return ($trusted | Select-Object -First 1)
    }

    # OpenSSL 3: the minisign format, checked by hand, exactly as install-genefox-cli.sh does.
    #   public key  base64("Ed" | key id (8) | Ed25519 public key (32))
    #   signature   line 2: base64(alg (2) | key id (8) | sig (64)); alg "ED" = prehashed with
    #               BLAKE2b-512 (minisign's default) or "Ed" = the file itself
    #               line 3: "trusted comment: <text>"
    #               line 4: base64(Ed25519 over sig (64) | <text>)
    $openssl = Find-OpenSSL3
    if (-not $openssl) { throw 'no-verifier' }
    $d = Join-Path $work 'ms'
    New-Item -ItemType Directory -Force -Path $d | Out-Null
    try {
        $pk = [Convert]::FromBase64String($pubkey)
        $lines = [IO.File]::ReadAllLines($sig)
        if ($lines.Length -lt 4) { return $null }
        $sigBytes = [Convert]::FromBase64String($lines[1])
        $globalBytes = [Convert]::FromBase64String($lines[3])
    } catch { return $null }
    if ($pk.Length -ne 42 -or [Text.Encoding]::ASCII.GetString($pk, 0, 2) -ne 'Ed') { return $null }
    if ($sigBytes.Length -ne 74 -or $globalBytes.Length -ne 64) { return $null }
    if (-not $lines[2].StartsWith('trusted comment: ')) { return $null }
    $trusted = $lines[2].Substring('trusted comment: '.Length)
    # Key ids must match: a signature from another key is refused before any crypto.
    if (-not (Same-Bytes $pk[2..9] $sigBytes[2..9])) { return $null }
    # SubjectPublicKeyInfo for Ed25519 = fixed 12-byte prefix + the raw key.
    $spki = [byte[]](0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00) + $pk[10..41]
    [IO.File]::WriteAllBytes((Join-Path $d 'pk.der'), [byte[]]$spki)
    & $openssl pkey -pubin -inform DER -in (Join-Path $d 'pk.der') -out (Join-Path $d 'pk.pem') 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    [IO.File]::WriteAllBytes((Join-Path $d 'sig64.bin'), [byte[]]$sigBytes[10..73])
    $msg = Join-Path $d 'msg.bin'
    switch -CaseSensitive ([Text.Encoding]::ASCII.GetString($sigBytes, 0, 2)) {
        'ED' { & $openssl dgst -blake2b512 -binary -out $msg $file 2>$null; if ($LASTEXITCODE -ne 0) { return $null } }
        'Ed' { Copy-Item -LiteralPath $file -Destination $msg }
        default { return $null }
    }
    & $openssl pkeyutl -verify -pubin -inkey (Join-Path $d 'pk.pem') -rawin -in $msg `
        -sigfile (Join-Path $d 'sig64.bin') *> $null
    if ($LASTEXITCODE -ne 0) { return $null }
    $globalMessage = [byte[]]$sigBytes[10..73] + [Text.Encoding]::UTF8.GetBytes($trusted)
    [IO.File]::WriteAllBytes((Join-Path $d 'global.msg'), [byte[]]$globalMessage)
    [IO.File]::WriteAllBytes((Join-Path $d 'global.bin'), $globalBytes)
    & $openssl pkeyutl -verify -pubin -inkey (Join-Path $d 'pk.pem') -rawin -in (Join-Path $d 'global.msg') `
        -sigfile (Join-Path $d 'global.bin') *> $null
    if ($LASTEXITCODE -ne 0) { return $null }
    return $trusted
}

# Steps 2 and 3: the signed manifest for <version>, then this platform's archive checked against
# it. Returns the archive's path in <work>; fails, installing nothing, on any mismatch.
function Get-VerifiedArchive([string]$base, [string]$version, [string]$pubkey, [string]$platform, [string]$work) {
    $product = 'genefox-cli'
    $manifest = Join-Path $work 'manifest.json'
    $signature = Join-Path $work 'manifest.json.minisig'
    if (-not (Get-Remote "$base/$version/manifest.json" $manifest)) { Fail "no manifest for $version at $base/$version/" }
    if (-not (Get-Remote "$base/$version/manifest.json.minisig" $signature)) { Fail "no signature for the $version manifest" }
    try {
        $trusted = Test-Minisign $manifest $signature $pubkey $work
    } catch {
        if ("$_" -eq 'no-verifier') {
            Fail 'cannot verify the release signature: install minisign (winget install jedisct1.minisign) or Git for Windows (which ships OpenSSL 3), then re-run. Nothing was installed.'
        }
        throw
    }
    if ($null -eq $trusted) { Fail "the $version manifest's signature does NOT verify against GeneFox's release key. Nothing was installed." }
    if (" $trusted " -notlike "* product:$product *") { Fail "the signature is for another product ($trusted). Nothing was installed." }
    if (" $trusted " -notlike "* version:$version *") { Fail "the signature names another version ($trusted), not $version. Nothing was installed." }
    $manifestLines = [IO.File]::ReadAllLines($manifest)
    if ($manifestLines -cnotcontains "  `"id`": `"$product`",") { Fail "the manifest is not a $product manifest" }
    if ($manifestLines -cnotcontains "  `"version`": `"$version`",") { Fail "the manifest does not describe $version" }
    Say "verified the signed manifest for $product $version"

    $line = $manifestLines | Where-Object { $_.StartsWith("    {`"id`": `"$platform`",") } | Select-Object -First 1
    if (-not $line) { Fail "$version has no build for $platform" }
    $entry = $line.TrimEnd(',') | ConvertFrom-Json
    $filename = "genefox-cli-$version-$platform.zip"
    if ($entry.filename -cne $filename) { Fail "unexpected artefact name '$($entry.filename)'" }
    if ($entry.path -cne "$version/$filename") { Fail "unexpected artefact path '$($entry.path)'" }
    if ($entry.sha256 -cnotmatch '^[0-9a-f]{64}$') { Fail "the manifest has no usable SHA-256 for $filename" }
    Say "downloading $filename"
    $archive = Join-Path $work $filename
    if (-not (Get-Remote "$base/$($entry.path)" $archive)) { Fail "could not download $base/$($entry.path)" }
    if ((Get-Item -LiteralPath $archive).Length -ne [int64]$entry.sizeBytes) { Fail "$filename has the wrong size. Nothing was installed." }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -cne $entry.sha256) {
        Fail "$filename does not match the signed SHA-256. Nothing was installed."
    }
    Say 'SHA-256 matches the signed manifest'
    return $archive
}
'@

# The elevated helper step's own pieces. Defined here too, so the step can be
# exercised unelevated against a test root (Install-HelperStaged -DryRun).
$GeneFoxHelperStage = @'
$GENEFOX_TRUSTED_SIDS = @('S-1-5-18', 'S-1-5-32-544', 'S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464')

# Whether only SYSTEM, Administrators and TrustedInstaller can change <path>: the owner is one of
# them, and no other account is allowed any right that writes, deletes or re-permissions it.
function Test-AdminOnly([string]$path) {
    try { $acl = Get-Acl -LiteralPath $path } catch { return $false }
    try {
        $owner = (New-Object Security.Principal.NTAccount($acl.Owner)).Translate([Security.Principal.SecurityIdentifier]).Value
    } catch { return $false }
    if ($GENEFOX_TRUSTED_SIDS -notcontains $owner) { return $false }
    $writes = [Security.AccessControl.FileSystemRights]'WriteData, AppendData, WriteExtendedAttributes, WriteAttributes, Delete, DeleteSubdirectoriesAndFiles, ChangePermissions, TakeOwnership'
    foreach ($rule in $acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier])) {
        if ($rule.AccessControlType -ne 'Allow') { continue }
        if (($rule.FileSystemRights -band $writes) -eq 0) { continue }
        if ($GENEFOX_TRUSTED_SIDS -notcontains $rule.IdentityReference.Value) { return $false }
    }
    return $true
}

# Owner Administrators; SYSTEM and Administrators full control; inheritance from above cut.
function Protect-AdminOnly([string]$path) {
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)
    $acl.SetOwner((New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544')))
    foreach ($sid in @('S-1-5-18', 'S-1-5-32-544')) {
        $rule = New-Object Security.AccessControl.FileSystemAccessRule(
            (New-Object Security.Principal.SecurityIdentifier($sid)), 'FullControl',
            'ContainerInherit, ObjectInherit', 'None', 'Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $path -AclObject $acl
}

function Test-ReparsePoint([string]$path) {
    $item = Get-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    return [bool]($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint))
}

# The helper step: everything verified again, in a folder only administrators can change, then
# `genefox helper install` (or uninstall) run from it. <stagingRoot> is %ProgramData%\GeneFox\
# HelperStaging for real. -DryRun (tests, unelevated) applies no ACL and runs nothing.
function Install-HelperStaged([string]$mode, [string]$version, [string]$base, [string]$pubkey, [string]$platform,
                              [string]$project, [string]$apiKey, [string]$stagingRoot, [string]$adminPrompt = '',
                              [switch]$DryRun) {
    $parent = Split-Path -Parent $stagingRoot
    foreach ($path in @($parent, $stagingRoot)) {
        if (-not (Test-Path -LiteralPath $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
        if (Test-ReparsePoint $path) { Fail "$path is a link or junction; refusing to stage there. Nothing was installed." }
    }
    if (-not $DryRun) { Protect-AdminOnly $stagingRoot }
    $stage = Join-Path $stagingRoot ([Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $stage | Out-Null
    try {
        if (-not $DryRun) {
            Protect-AdminOnly $stage
            if (-not (Test-AdminOnly $stage)) { Fail "the staging folder $stage is not administrators-only. Nothing was installed." }
        }
        $archive = Get-VerifiedArchive $base $version $pubkey $platform $stage
        $unpack = Join-Path $stage 'unpack'
        Expand-Archive -LiteralPath $archive -DestinationPath $unpack
        # The helper is genefox.exe itself.
        $exe = Join-Path $unpack "genefox-cli-$version-$platform\bin\genefox.exe"
        if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { Fail "the $version release has no genefox.exe. Nothing was installed." }
        $arguments = @('helper', $mode)
        if ($mode -eq 'install' -and $project -and $apiKey) {
            $arguments += @('--project', $project, '--api-key', $apiKey)
            if ($adminPrompt -eq 'strict') { $arguments += '--strict-admin-prompt' }
            if ($adminPrompt -eq 'default') { $arguments += '--admin-prompt-default' }
        }
        if ($DryRun) {
            Say "verified in $stage; would run genefox helper $mode"
            return
        }
        & $exe @arguments
        if ($LASTEXITCODE -ne 0) { Fail "genefox helper $mode exited $LASTEXITCODE" }
    } finally {
        Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    }
}
'@

# Where the elevated step may find a verifier: only in administrators-only locations. A program
# on your PATH, or in a folder you can write, could be replaced by anything running as you, and
# would then run elevated.
$GeneFoxAdminVerifiers = @'
function Find-Minisign {
    foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if (-not $root) { continue }
        foreach ($candidate in @((Join-Path $root 'minisign\minisign.exe'), (Join-Path $root 'Minisign\minisign.exe'))) {
            if ((Test-Path -LiteralPath $candidate -PathType Leaf) -and (Test-AdminOnly $candidate) -and
                (Test-AdminOnly (Split-Path -Parent $candidate))) { return $candidate }
        }
    }
    return $null
}
function Find-OpenSSL3 {
    $ErrorActionPreference = 'Continue'
    foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if (-not $root) { continue }
        $candidate = Join-Path $root 'Git\usr\bin\openssl.exe'
        if ((Test-Path -LiteralPath $candidate -PathType Leaf) -and (Test-AdminOnly $candidate) -and
            (Test-AdminOnly (Split-Path -Parent $candidate))) {
            $banner = & $candidate version 2>$null
            if ($banner -match '^OpenSSL 3') { return $candidate }
        }
    }
    return $null
}
'@

. ([ScriptBlock]::Create($GeneFoxShared))
. ([ScriptBlock]::Create($GeneFoxHelperStage))

# The unelevated install's verifiers: minisign on PATH, else OpenSSL 3 on PATH or Git's.
function Find-Minisign {
    $found = Get-Command minisign.exe -ErrorAction SilentlyContinue
    if ($found) { return $found.Source }
    return $null
}

function Find-OpenSSL3 {
    $ErrorActionPreference = 'Continue'  # native calls; see Invoke-Native
    $candidates = @()
    $onPath = Get-Command openssl.exe -ErrorAction SilentlyContinue
    if ($onPath) { $candidates += $onPath.Source }
    foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs'))) {
        if ($root) { $candidates += (Join-Path $root 'Git\usr\bin\openssl.exe') }
    }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $banner = & $candidate version 2>$null
            if ($banner -match '^OpenSSL 3') { return $candidate }
        }
    }
    return $null
}

function Get-Platform {
    $arch = $null
    try { $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString() } catch { }
    if (-not $arch) {
        # A 32-bit host on 64-bit Windows reports the real machine in PROCESSOR_ARCHITEW6432.
        $arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
    }
    switch -Regex ($arch) {
        '^(X64|AMD64)$' { return 'windows-x64' }
        '^(Arm64|ARM64)$' { return 'windows-arm64' }
        default { Fail "no genefox build for Windows on $arch" }
    }
}

# The release key, base and version, settled and checked once for every step.
function Resolve-Release([string]$work) {
    # Windows PowerShell 5.1 may default to TLS 1.0, which storage.googleapis.com refuses.
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }

    $pubkey = $GENEFOX_CLI_PUBKEY
    if ($PubkeyFile) {
        if (-not (Test-Path -LiteralPath $PubkeyFile -PathType Leaf)) { Fail "no public key file at $PubkeyFile" }
        $pubkey = ([IO.File]::ReadAllLines($PubkeyFile))[1]
    }
    if (-not $pubkey) { Fail 'this installer has no release public key pinned, so it cannot verify anything. Nothing was installed.' }
    if ($pubkey -notmatch '^[A-Za-z0-9+/]+={0,2}$') { Fail 'the release public key is not base64' }
    $base = if ($Base) { $Base } else { $GENEFOX_CLI_BASE_URL }
    $base = $base.TrimEnd('/')
    if (-not ($base.StartsWith('https://') -or $base.StartsWith('file://'))) {
        Fail 'the release location must be https:// (or file:// for a local copy)'
    }
    # Carried into the elevated step inside a quoted command, so no quote may be in it.
    if ($base.IndexOfAny([char[]]@([char]39, [char]34, [char]96)) -ge 0) { Fail 'the release location may not contain quotes' }

    # ---- 1. which version --------------------------------------------------------------
    $version = $Version
    if (-not $version) {
        $latest = Join-Path $work 'latest.json'
        if (-not (Get-Remote "$base/latest.json" $latest)) { Fail "could not read $base/latest.json" }
        $match = Select-String -LiteralPath $latest -Pattern '^ *"version": "([^"]*)",?$' | Select-Object -First 1
        if ($match) { $version = $match.Matches[0].Groups[1].Value }
    }
    if ($version -like 'v*') { Fail 'pass the version without a leading v (e.g. 1.1.0)' }
    if ($version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$') { Fail "'$version' is not a release version" }
    return @{ Pubkey = $pubkey; Base = $base; Version = $version; Platform = (Get-Platform) }
}

# Whether this run sets up an account helper, however it was asked for: -Helper or
# -HelperHardened, or their GENEFOX_HELPER=1 / GENEFOX_HELPER_HARDENED=1 spellings, which set the
# same switches. Every helper install is gated by this one predicate.
function Test-InstallsHelper { return [bool]($Helper -or $HelperHardened) }

function Install-GeneFoxCli($release, [string]$work) {
    $version = $release.Version
    $platform = $release.Platform
    $archive = Get-VerifiedArchive $release.Base $version $release.Pubkey $platform $work

    # ---- 4. unpack and install ---------------------------------------------------------
    $unpack = Join-Path $work 'unpack'
    Expand-Archive -LiteralPath $archive -DestinationPath $unpack
    $src = Join-Path $unpack "genefox-cli-$version-$platform"
    $exe = Join-Path $src 'bin\genefox.exe'
    if (-not (Test-Path -LiteralPath $exe -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $src 'share\genefox\Resources\ScientificResources.json') -PathType Leaf)) {
        Fail 'the archive does not hold the expected layout. Nothing was installed.'
    }
    # Run it from the unpacked copy BEFORE touching the prefix, so a binary this machine
    # cannot run never replaces one that works.
    $null = Invoke-Native $exe @('--version')
    if ($LASTEXITCODE -ne 0) { Fail 'the downloaded genefox does not run on this machine. Nothing was installed.' }
    # The account helper is offered per release: while this genefox's doctor reports
    # "account helper: unavailable", -Helper and -HelperHardened stop here, before anything is
    # changed. A release from before that line prints none and had no such gate.
    if (Test-InstallsHelper) {
        $doctor = @(Invoke-Native $exe @('doctor', '--output-dir', (Join-Path $work 'doctor')))
        if (@($doctor | Where-Object { "$_".TrimEnd() -ceq 'account helper: unavailable' }).Count) {
            Fail "the account helper is not available in GeneFox $version, so -Helper and -HelperHardened cannot set it up. Nothing was installed or changed; run without them to install genefox."
        }
    }

    $bin = Join-Path $Prefix 'bin'
    $share = Join-Path $Prefix 'share'
    New-Item -ItemType Directory -Force -Path $bin, $share | Out-Null
    # The account helper is genefox.exe itself; a genefox-helper.exe an
    # older archive carries is never copied, and the hardened service is installed from its own
    # staged copy, never from here.
    $shipped = @(Get-ChildItem -LiteralPath (Join-Path $src 'bin') | Where-Object { $_.Name -ne 'genefox-helper.exe' })
    # Replace a previous genefox install (and only that): genefox's own names, and every
    # name this archive's bin\ ships (its runtime DLLs).
    $owned = @('genefox.exe', 'genefoxw.exe', 'genefox.commit', 'locus_genefox.resources', 'locus_genefox.bundle', 'locus_GenefoxTools.resources', 'locus_GenefoxTools.bundle') +
        @($shipped | ForEach-Object { $_.Name })
    # A running per-user helper from this prefix holds genefox.exe and bin\'s runtime DLLs: stopped here, as late
    # as possible (everything is verified), and started again when the install ends either way.
    Suspend-UserHelper
    foreach ($name in ($owned | Sort-Object -Unique)) {
        $target = Join-Path $bin $name
        if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
    }
    $shareGenefox = Join-Path $share 'genefox'
    if (Test-Path -LiteralPath $shareGenefox) { Remove-Item -LiteralPath $shareGenefox -Recurse -Force }
    Copy-Item -LiteralPath (Join-Path $src 'share\genefox') -Destination $shareGenefox -Recurse
    $shipped | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $bin -Recurse
    }

    # ---- 5. PATH and smoke -------------------------------------------------------------
    $installedExe = Join-Path $bin 'genefox.exe'
    $installed = Invoke-Native $installedExe @('--version')
    if ($LASTEXITCODE -ne 0) { Fail 'the installed genefox did not run' }
    Say "installed $installed at $installedExe"
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @(if ($userPath) { $userPath.Split(';') | Where-Object { $_ } })
    if ($entries | Where-Object { $_.TrimEnd('\') -ieq $bin.TrimEnd('\') }) {
        # Already on the user PATH.
    } elseif ($NoModifyPath -or $env:GENEFOX_NO_MODIFY_PATH -eq '1') {
        Say "add $bin to your PATH to run genefox by name"
    } else {
        [Environment]::SetEnvironmentVariable('Path', (($entries + $bin) -join ';'), 'User')
        Say "added $bin to your user PATH; open a new terminal to run genefox by name"
    }
}

# The helper's Firebase project id and web API key, validated (they are passed to `genefox helper`
# as arguments): -HelperProject and -HelperApiKey, else the pinned ones.
function Get-HelperConfiguration {
    $project = if ($HelperProject) { $HelperProject } else { $GENEFOX_HELPER_PROJECT }
    $apiKey = if ($HelperApiKey) { $HelperApiKey } else { $GENEFOX_HELPER_API_KEY }
    if ($project -and $project -notmatch '^[a-z][a-z0-9-]{4,28}[a-z0-9]$') { Fail "'$project' is not a Firebase project id" }
    if ($apiKey -and $apiKey -notmatch '^AIza[0-9A-Za-z_-]{35}$') { Fail 'the helper API key is not a Firebase web API key' }
    return @{ Project = $project; ApiKey = $apiKey }
}

# ---- the per-user account helper ------------------------------------
# It is this prefix's genefox.exe, run as `genefox helper run`, and
# started at sign-in by a value under this account's Run key:
# "<prefix>\bin\genefoxw.exe" helper start (earlier, genefox.exe). An earlier
# version's was bin\genefox-helper.exe, with the value "<genefox-helper.exe>" start;
# Move-LegacyUserHelper moves it to genefox.exe.
$HELPER_RUN_VALUE = 'GeneFoxHelper'

function Get-GenefoxExe { return Join-Path (Join-Path $Prefix 'bin') 'genefox.exe' }
# genefox with no window: a Windows-subsystem launcher that runs the
# genefox.exe beside it with its arguments and CREATE_NO_WINDOW. Explorer starts Run values at
# sign-in with no console, so genefox.exe itself gets a console window for as long as
# `helper start` runs (measured); genefoxw.exe gets none.
function Get-GenefoxwExe { return Join-Path (Join-Path $Prefix 'bin') 'genefoxw.exe' }
function Get-LegacyHelperExe { return Join-Path (Join-Path $Prefix 'bin') 'genefox-helper.exe' }

function Get-HelperRunKey {
    # Tests only: a key of their own under HKCU\Software\GeneFoxTest, never the real Run key.
    if ($HelperUserTestRoot) { return "HKCU:\Software\GeneFoxTest\$(Split-Path -Leaf $HelperUserTestRoot)\Run" }
    return 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
}

function Get-HelperRunEntry {
    try { return (Get-ItemProperty -LiteralPath (Get-HelperRunKey) -Name $HELPER_RUN_VALUE -ErrorAction Stop).$HELPER_RUN_VALUE }
    catch { return $null }
}

# The sign-in entry: `"<genefoxw.exe>" helper start`, so nothing shows at sign-in; with an
# archive that has no genefoxw.exe (an older release), `"<genefox.exe>" helper start` as before.
function Get-HelperRunCommand {
    $launcher = if (Test-Path -LiteralPath (Get-GenefoxwExe) -PathType Leaf) { Get-GenefoxwExe } else { Get-GenefoxExe }
    return "`"$launcher`" helper start"
}

function Set-HelperRunEntry {
    $key = Get-HelperRunKey
    if (-not (Test-Path -LiteralPath $key)) { New-Item -Path $key -Force | Out-Null }
    New-ItemProperty -LiteralPath $key -Name $HELPER_RUN_VALUE -Value (Get-HelperRunCommand) -PropertyType String -Force | Out-Null
}

# An update rewrites this prefix's sign-in entry to the current form: an
# earlier version's `"<genefox.exe>" helper start` becomes `"<genefoxw.exe>" helper start`. Only
# a value this installer wrote for this prefix is touched; no value, or anyone else's, is left.
function Update-HelperRunEntry {
    $entry = Get-HelperRunEntry
    if ($null -eq $entry) { return }
    $ours = @("`"$(Get-GenefoxExe)`" helper start", "`"$(Get-GenefoxwExe)`" helper start")
    if (-not ($ours | Where-Object { $_ -ieq $entry })) { return }
    $wanted = Get-HelperRunCommand
    if ($entry -ceq $wanted) { return }
    Set-HelperRunEntry
    if ($wanted -like '*genefoxw.exe*') { Say 'the per-user helper now starts at sign-in with no window (genefoxw.exe)' }
}

function Remove-HelperRunEntry {
    if ($null -ne (Get-HelperRunEntry)) { Remove-ItemProperty -LiteralPath (Get-HelperRunKey) -Name $HELPER_RUN_VALUE }
}

# Elevated (review M2): an elevated token's default owner is Administrators, so a per-user helper
# set up, started or removed from it would not be this account's. GENEFOX_TEST_ELEVATED (tests,
# with -HelperUserTestRoot) only makes this refuse; it can never make it allow.
function Test-Elevated {
    if ($HelperUserTestRoot -and $env:GENEFOX_TEST_ELEVATED -eq '1') { return $true }
    return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Assert-NotElevated {
    if (Test-Elevated) {
        Fail ('run this from a normal (not elevated) PowerShell: the per-user helper runs as you, without ' +
            'administrator rights; for the service, use -HelperHardened.')
    }
}

# This prefix's per-user helper, owned by this account (review L4): genefox.exe at exactly this
# path whose command line is `helper run`, or an earlier version's genefox-helper.exe at exactly
# its path. Never any other genefox command (an MCP server, say), never another program, never
# another account's process.
function Get-UserHelperProcess {
    $me = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $genefox = Get-GenefoxExe
    $legacy = Get-LegacyHelperExe
    $helperRun = '^\s*"?' + [regex]::Escape($genefox) + '"?\s+helper\s+run(\s|$)'
    return @(Get-CimInstance Win32_Process -Filter "Name = 'genefox.exe' OR Name = 'genefox-helper.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -and
            ((($_.ExecutablePath -ieq $genefox) -and ($_.CommandLine -match $helperRun)) -or ($_.ExecutablePath -ieq $legacy)) -and
            ((Invoke-CimMethod -InputObject $_ -MethodName GetOwnerSid -ErrorAction SilentlyContinue).Sid -eq $me) })
}

function Stop-UserHelper {
    foreach ($process in (Get-UserHelperProcess)) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        Wait-Process -Id $process.ProcessId -Timeout 5 -ErrorAction SilentlyContinue
    }
}

function Test-UserHelperRunning { return [bool](@(Get-UserHelperProcess).Count) }

# This prefix's per-user helper, if it is running, is stopped before bin\ is replaced, and
# Resume-UserHelper starts it again when the install ends, succeeded or failed, as long as its
# Run value and its program are still there. Only a helper that was running is started (review
# L1): an update never starts one the user did not already have.
$script:ResumeUserHelper = $false

function Suspend-UserHelper {
    if (Test-UserHelperRunning) {
        Stop-UserHelper
        $script:ResumeUserHelper = $true
        Say 'stopped this account''s per-user helper while its folder is updated; it starts again afterwards'
    }
}

function Resume-UserHelper {
    if (-not $script:ResumeUserHelper) { return }
    $script:ResumeUserHelper = $false
    $entry = Get-HelperRunEntry
    # Retired (-HelperHardened) or removed: nothing to start.
    if ($null -eq $entry) { return }
    # An install that failed before Move-LegacyUserHelper leaves an earlier version's helper as it was.
    $legacy = Get-LegacyHelperExe
    $started = if (($entry -like '*genefox-helper.exe*') -and (Test-Path -LiteralPath $legacy -PathType Leaf)) {
        Invoke-UserHelper @('start') $legacy
    } elseif (Test-Path -LiteralPath (Get-GenefoxExe) -PathType Leaf) {
        Invoke-UserHelper @('start')
    } else { 1 }
    if ($started -ne 0) {
        Say 'could not start the per-user helper again; it starts at your next sign-in, or run genefox helper start'
    }
}

# Runs `genefox helper` (or, given an earlier version's genefox-helper.exe, that) with these
# arguments, showing what it prints, and returns its exit code; under -HelperUserTestRoot it only
# says it would (the API key value is never shown).
function Invoke-UserHelper([string[]]$arguments, [string]$legacyExe = '') {
    $shown = (@($arguments | Where-Object { $_ -notmatch '^AIza' })) -join ' '
    if ($HelperUserTestRoot) {
        if ($legacyExe) { Say "would run genefox-helper $shown" } else { Say "would run genefox helper $shown" }
        return 0
    }
    if ($legacyExe) { Invoke-Native $legacyExe $arguments | ForEach-Object { Say $_ } }
    else { Invoke-Native (Get-GenefoxExe) (@('helper') + $arguments) | ForEach-Object { Say $_ } }
    return $LASTEXITCODE
}

# An earlier version's per-user helper (bin\genefox-helper.exe, with its Run value) becomes
# genefox.exe's: the old program, stopped already (Suspend-UserHelper), is deleted, and the Run
# value is rewritten to `"<genefox.exe>" helper start`. Its folder and sign-in stay as they are:
# `genefox helper run` uses the same ones. A genefox-helper.exe with no Run value is left alone,
# as before.
function Move-LegacyUserHelper {
    $legacy = Get-LegacyHelperExe
    if (-not (Test-Path -LiteralPath $legacy -PathType Leaf) -or $null -eq (Get-HelperRunEntry)) { return }
    Stop-UserHelper
    Remove-Item -LiteralPath $legacy -Force
    Set-HelperRunEntry
    Say 'moved the per-user helper into genefox.exe (genefox helper); its sign-in is kept'
}

# -Helper: the per-user helper, set up and started, with its sign-in entry.
function Install-HelperUser($configuration) {
    Assert-NotElevated
    Move-LegacyUserHelper
    $arguments = @('setup')
    if ($configuration.Project -and $configuration.ApiKey) {
        $arguments += @('--project', $configuration.Project, '--api-key', $configuration.ApiKey)
    }
    if ((Invoke-UserHelper $arguments) -ne 0) { Fail 'genefox helper setup did not finish' }
    Set-HelperRunEntry
    $script:ResumeUserHelper = $false
    if ((Invoke-UserHelper @('start')) -ne 0) { Fail 'genefox helper start did not start the helper' }
    Say 'the GeneFox account helper is set up for this account (no administrator approval); it starts when you sign in'
    if (-not ($configuration.Project -and $configuration.ApiKey)) {
        Say 'it has no account configuration, so it cannot link yet; re-run with -HelperProject and -HelperApiKey'
    }
    Say "next: `"$(Get-GenefoxExe)`" helper link"
}

# -UninstallHelper (and before -HelperHardened): signs the per-user helper out, never the service
# (`unlink --per-user`, review M1), starting it first if it is not running; stops it; deletes its
# folder and credential; removes its sign-in entry and an earlier version's program. genefox.exe
# stays. No download. Nothing is run when no per-user helper was set up (no Run value and no
# earlier program).
function Uninstall-HelperUser {
    Assert-NotElevated
    $legacy = Get-LegacyHelperExe
    $legacyExe = if (Test-Path -LiteralPath $legacy -PathType Leaf) { $legacy } else { '' }
    $setUp = $legacyExe -or ($null -ne (Get-HelperRunEntry))
    if ($setUp -and ($legacyExe -or (Test-Path -LiteralPath (Get-GenefoxExe) -PathType Leaf))) {
        $unlinked = Invoke-UserHelper @('unlink', '--per-user') $legacyExe
        # 3: not running. Started to be signed out, so the link is revoked at GeneFox too.
        if ($unlinked -eq 3 -and (Invoke-UserHelper @('start') $legacyExe) -eq 0) {
            $unlinked = Invoke-UserHelper @('unlink', '--per-user') $legacyExe
        }
        if ($unlinked -ne 0) {
            Say ("could not sign the per-user helper out here, so GeneFox may still list this computer's link: " +
                "remove it from your account's linked computers when that screen is available")
        }
        Stop-UserHelper
        if ((Invoke-UserHelper @('remove-data') $legacyExe) -ne 0) { Fail "genefox helper remove-data did not remove the helper's folder" }
    }
    if ($legacyExe) { Remove-Item -LiteralPath $legacyExe -Force }
    Remove-HelperRunEntry
    Say 'the per-user GeneFox account helper and its credential are removed'
}

# The elevated helper step's whole program: the shared checks, the staging step and the
# admin-only verifiers, then one call. Every value in the call was validated above, and none can
# carry a quote. Compressed, so it fits a command line as -EncodedCommand.
function Get-HelperCommand([string]$mode, $release, [string]$project, [string]$apiKey, [string]$adminPrompt) {
    $call = "try { Install-HelperStaged '$mode' '$($release.Version)' '$($release.Base)' '$($release.Pubkey)' " +
        "'$($release.Platform)' '$project' '$apiKey' (Join-Path `$env:ProgramData 'GeneFox\HelperStaging') '$adminPrompt'; exit 0 } " +
        "catch { Write-Host `$_.Exception.Message -ForegroundColor Red; Read-Host 'Press Enter to close'; exit 1 }"
    $program = "`$ErrorActionPreference = 'Stop'`nSet-StrictMode -Version 2`n" + $GeneFoxShared + "`n" +
        $GeneFoxHelperStage + "`n" + $GeneFoxAdminVerifiers + "`n" + $call
    $bytes = [Text.Encoding]::UTF8.GetBytes($program)
    $buffer = New-Object IO.MemoryStream
    $gzip = New-Object IO.Compression.GZipStream($buffer, [IO.Compression.CompressionMode]::Compress)
    $gzip.Write($bytes, 0, $bytes.Length)
    $gzip.Close()
    $payload = [Convert]::ToBase64String($buffer.ToArray())
    $bootstrap = "`$z = New-Object IO.Compression.GZipStream((New-Object IO.MemoryStream(,[Convert]::FromBase64String('$payload'))), " +
        "[IO.Compression.CompressionMode]::Decompress); `$r = New-Object IO.StreamReader(`$z, [Text.Encoding]::UTF8); " +
        "Invoke-Expression `$r.ReadToEnd()"
    return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($bootstrap))
}

function Invoke-HelperStep([string]$mode, $release) {
    # Only 'strict', 'default' or nothing reaches the elevated step's command (validated like the others).
    $adminPrompt = ''
    if ($mode -eq 'install' -and $HelperStrictAdminPrompt) { $adminPrompt = 'strict' }
    if ($mode -eq 'install' -and $HelperAdminPromptDefault) { $adminPrompt = 'default' }
    # Tests only, with -HelperUserTestRoot: the elevated step is never run; GENEFOX_TEST_HARDENED
    # says how it ends ('declined' as a refused UAC prompt, anything else as installed).
    if ($HelperUserTestRoot) {
        if ($env:GENEFOX_TEST_HARDENED -eq 'declined') { Fail 'the account helper step did not finish (exit 1223); see its window for why' }
        Say "would run the elevated helper step: $mode$(if ($adminPrompt) { " ($adminPrompt admin prompt)" })"
        return
    }
    $configuration = Get-HelperConfiguration
    $project = $configuration.Project
    $apiKey = $configuration.ApiKey
    $encoded = Get-HelperCommand $mode $release $project $apiKey $adminPrompt
    Say "the account helper needs administrator approval to $mode; approve the prompt to continue"
    $child = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -Verb RunAs -Wait -PassThru `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'RemoteSigned', '-EncodedCommand', $encoded)
    if ($child.ExitCode -ne 0) { Fail "the account helper step did not finish (exit $($child.ExitCode)); see its window for why" }
    if ($mode -eq 'install') {
        Say 'the GeneFox account helper is installed'
        if (-not ($project -and $apiKey)) {
            Say 'it runs without an account configuration, so it cannot link yet; re-run with -HelperProject and -HelperApiKey'
        }
        Say "next: `"$(Get-GenefoxExe)`" helper link"
    } else {
        Say 'the GeneFox account helper and its credential are removed'
    }
}

$work = Join-Path ([IO.Path]::GetTempPath()) ('genefox-install-' + [Guid]::NewGuid().ToString('N').Substring(0, 12))
try {
    $helperSteps = @(@($Helper.IsPresent, $HelperHardened.IsPresent, $UninstallHelper.IsPresent,
        $UninstallHelperHardened.IsPresent) | Where-Object { $_ })
    if ($helperSteps.Count -gt 1) { Fail 'choose one of -Helper, -HelperHardened, -UninstallHelper or -UninstallHelperHardened' }
    if ($HelperStrictAdminPrompt -and -not $HelperHardened) { Fail '-HelperStrictAdminPrompt goes with -HelperHardened (the service), not on its own' }
    if ($HelperAdminPromptDefault -and -not $HelperHardened) { Fail '-HelperAdminPromptDefault goes with -HelperHardened (the service), not on its own' }
    if ($HelperStrictAdminPrompt -and $HelperAdminPromptDefault) { Fail 'choose one of -HelperStrictAdminPrompt or -HelperAdminPromptDefault' }
    if ($UninstallHelper) {
        # Nothing to download: the per-user helper is removed from this prefix and this account.
        Uninstall-HelperUser
        return
    }
    # Checked before anything is downloaded or installed.
    if ($Helper) { Assert-NotElevated }
    $configuration = if ($Helper -or $HelperHardened -or $UninstallHelperHardened) { Get-HelperConfiguration } else { $null }
    New-Item -ItemType Directory -Path $work | Out-Null
    $release = Resolve-Release $work
    if ($HelperDryRunRoot) {
        . ([ScriptBlock]::Create($GeneFoxAdminVerifiers))
        Install-HelperStaged 'install' $release.Version $release.Base $release.Pubkey $release.Platform '' '' $HelperDryRunRoot -DryRun
    } elseif ($UninstallHelperHardened) {
        Invoke-HelperStep 'uninstall' $release
    } else {
        Install-GeneFoxCli $release $work
        if ($Helper) { Install-HelperUser $configuration }
        elseif (-not $HelperHardened) { Move-LegacyUserHelper; Update-HelperRunEntry }
        if ($HelperHardened) {
            # One helper per account, the one chosen. The service is installed first;
            # only once it is (the UAC prompt accepted, the step finished) is a per-user helper
            # retired, signed out and removed, so declining the prompt leaves the user with the
            # helper they had.
            Invoke-HelperStep 'install' $release
            if ((Test-Path -LiteralPath (Get-LegacyHelperExe) -PathType Leaf) -or $null -ne (Get-HelperRunEntry)) {
                Say 'the service is installed; retiring this account''s per-user helper'
                Uninstall-HelperUser
            }
        }
    }
    Resume-UserHelper
} catch {
    # Whatever failed, a per-user helper stopped for this install runs again if its program is intact.
    Resume-UserHelper
    Write-Host $_.Exception.Message -ForegroundColor Red
    # As a script file, a failure is exit 1. Through `irm | iex` there is no script file,
    # and `exit` would close the user's shell, so the error is reported and the script stops.
    if ($PSCommandPath) { exit 1 }
} finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
