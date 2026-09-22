# LAC BUILD: 이전 버전에서 프로젝트 최상위에 남은 UPDATE 텍스트 정리
# 사용: BUILD 프로젝트 폴더에서
# powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\organize-existing-root.ps1
# 동일한 업데이트 내역이 docs/updates/에 존재하고 SHA256도 같은 경우에만 최상위 중복 파일을 제거합니다.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$updatesDir = Join-Path $PSScriptRoot 'updates'
if (-not (Test-Path -LiteralPath $updatesDir -PathType Container)) {
    throw 'docs/updates 폴더가 없습니다. 전체본을 먼저 복사하세요.'
}
$removed = 0
$kept = 0
Get-ChildItem -LiteralPath $projectRoot -File -Filter 'UPDATE-V*.txt' | ForEach-Object {
    $original = $_
    $archived = Join-Path $updatesDir $original.Name
    if (-not (Test-Path -LiteralPath $archived -PathType Leaf)) {
        Write-Warning "보존: $($original.Name) - 보관본이 없습니다."
        $kept++
        return
    }
    $sourceHash = (Get-FileHash -LiteralPath $original.FullName -Algorithm SHA256).Hash
    $archivedHash = (Get-FileHash -LiteralPath $archived -Algorithm SHA256).Hash
    if ($sourceHash -ne $archivedHash) {
        Write-Warning "보존: $($original.Name) - 보관본 내용이 다릅니다."
        $kept++
        return
    }
    Remove-Item -LiteralPath $original.FullName -ErrorAction Stop
    Write-Host "중복 정리: $($original.Name)"
    $removed++
}
Write-Host "완료: 중복 업데이트 내역 $removed 개 정리, 다른 내용/보관본 없는 파일 $kept 개 보존."
