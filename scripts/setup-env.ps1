# Gera o .env na raiz do repositório com senha e chave JWT aleatórias.
# Não sobrescreve um .env existente. Uso: ./scripts/setup-env.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root '.env'

if (Test-Path $target) {
    Write-Host '.env já existe — nada foi alterado. Apague-o para gerar um novo.'
    exit 0
}

function New-Secret([int] $bytes) {
    $buffer = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return ([Convert]::ToBase64String($buffer) -replace '[+/=]', '')
}

$content = (Get-Content (Join-Path $root '.env.example') -Raw) `
    -replace 'POSTGRES_PASSWORD=.*', "POSTGRES_PASSWORD=$(New-Secret 24)" `
    -replace 'JWT_SIGNING_KEY=.*', "JWT_SIGNING_KEY=$(New-Secret 48)"

[System.IO.File]::WriteAllText($target, $content, (New-Object System.Text.UTF8Encoding $false))
Write-Host '.env criado com senha e chave aleatórias.'
