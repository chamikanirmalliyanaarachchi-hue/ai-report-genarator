<#
.SYNOPSIS
  Initialize git and push the AI Reporter project to GitHub in one shot.

.DESCRIPTION
  - git init (branch "main") if not already initialized
  - ensures .gitignore protects node_modules / .next / uploads
  - aborts if those dirs are NOT ignored (prevents the 100k+ file blowup)
  - aborts if any file > 100MB is about to be committed (GitHub hard limit)
  - commits everything, then creates a GitHub repo via gh and pushes

.PARAMETER RepoName    GitHub repo name (default: ai-report-generator)
.PARAMETER Visibility  "private" (default) or "public"
.PARAMETER CommitMsg   Initial commit message
.PARAMETER Branch      Default branch name (default: main)

.EXAMPLE
  .\push-to-github.ps1
  .\push-to-github.ps1 -RepoName ai-reporter -Visibility public
#>
param(
  [string]$RepoName  = "ai-report-generator",
  [string]$Visibility = "private",
  [string]$CommitMsg = "Initial commit: AI Reporter",
  [string]$Branch    = "main"
)

$ErrorActionPreference = "Stop"

function Require($cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "'$cmd' was not found on PATH. Install Git for Windows and the GitHub CLI (gh), then re-run."
    exit 1
  }
}
Require git
Require gh

# --- 1. git identity (required to commit) ---
if (-not (git config user.name)) {
  git config user.name  (Read-Host "Git user.name not set. Enter your GitHub username")
}
if (-not (git config user.email)) {
  git config user.email (Read-Host "Git user.email not set. Enter your GitHub email")
}

# --- 2. init if needed ---
if (-not (Test-Path .git)) {
  git init -b $Branch
  Write-Host "Initialized git repo on branch '$Branch'."
}

# --- 3. ensure critical ignore rules exist ---
$required = @('node_modules/', '.next/', 'out/', 'build/', 'uploads/', '.env*.local', '.env')
foreach ($r in $required) {
  if (-not (Select-String -Quiet -Pattern ([regex]::Escape($r)) .gitignore)) {
    Add-Content .gitignore "`n# added by push-to-github.ps1`n$r"
    Write-Host "Added missing ignore rule: $r"
  }
}

# --- 4. GUARD: these must be ignored, or we abort ---
$ignored = git check-ignore node_modules .next uploads 2>$null
if (-not $ignored) {
  Write-Error "SAFETY ABORT: node_modules/.next/uploads are NOT ignored. Fix .gitignore before pushing (committing node_modules hits GitHub file-count limits)."
  exit 1
}
Write-Host "Ignore guard OK: node_modules / .next / uploads are excluded."

# --- 5. GUARD: block files larger than GitHub's 100MB hard limit ---
$tooBig = @()
git status --porcelain --untracked-files=all | Where-Object { $_ -match '^\?\? ' } | ForEach-Object {
  $p = $_.Substring(3)
  if (Test-Path $p -PathType Leaf) {
    $sz = (Get-Item $p).Length
    if ($sz -gt 100MB) { $tooBig += "$p ($('{0:N1}' -f ($sz/1MB)) MB)" }
  }
}
if ($tooBig.Count) {
  Write-Error "SAFETY ABORT: files exceed GitHub's 100MB limit:`n$($tooBig -join "`n")"
  exit 1
}

# --- 6. stage + commit ---
git add .
$status = git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit (working tree clean)."
} else {
  git commit -m $CommitMsg
  Write-Host "Committed."
}

# --- 7. GitHub auth ---
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Opening GitHub login..."
  gh auth login
}

# --- 8. create repo + push (or just push if origin exists) ---
$origin = git remote get-url origin 2>$null
if ($origin) {
  Write-Host "Remote 'origin' already set ($origin). Pushing..."
  git push -u origin $Branch
} else {
  $visFlag = if ($Visibility -eq 'public') { '--public' } else { '--private' }
  gh repo create $RepoName $visFlag --source=. --remote=origin --push `
    --description "AI Reporter — intelligent data & report generator"
}

Write-Host "`nDONE. Repository '$RepoName' is live on GitHub." -ForegroundColor Green
