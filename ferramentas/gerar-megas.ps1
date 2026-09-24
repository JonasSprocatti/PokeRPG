# Gera js/dados-megas.js a partir da PokéAPI: as formas de Mega Evolução e de Reversão Primitiva.
# Rode com:  powershell -File ferramentas/gerar-megas.ps1
#
# Por que é uma tabela e não uma busca em tempo real: `loadSpecies` (api.js) guarda só a forma padrão da espécie,
# então o jogo não tem como saber sozinho que Charizard tem duas Megas. Tabela estática também funciona offline
# e dá pra testar.
# A forma em si (status, tipos, habilidade, sprite) continua vindo da API pelo nome — aqui só fica o índice.
#
# Grava SEM BOM: `Set-Content -Encoding utf8` no PowerShell 5.1 escreve BOM, e BOM quebra parser (foi o que
# derrubou o deploy do Supabase).

$ErrorActionPreference = 'Stop'
$lista = (Invoke-RestMethod "https://pokeapi.co/api/v2/pokemon?limit=20000" -TimeoutSec 120).results
$formas = $lista | Where-Object { $_.name -match '(-mega(-[xy])?|-primal)$' }
if ($formas.Count -lt 40) { throw "veio pouca coisa da PokeAPI ($($formas.Count) formas)" }

# nome de exibição: "Mega Charizard X" / "Groudon Primitivo"
function Rotulo($especie, $forma) {
  # os parênteses em volta do -replace são obrigatórios: sem eles o PowerShell lê como 2 argumentos do método
  $base = (Get-Culture).TextInfo.ToTitleCase(($especie -replace '-', ' '))
  if ($forma -match '-primal$') { return "$base Primitivo" }
  if ($forma -match '-mega-x$') { return "Mega $base X" }
  if ($forma -match '-mega-y$') { return "Mega $base Y" }
  return "Mega $base"
}

$porEspecie = [ordered]@{}
foreach ($f in $formas) {
  $especie = $f.name -replace '-(mega(-[xy])?|primal)$', ''
  $id = [int]($f.url.TrimEnd('/') -split '/')[-1]
  $primal = if ($f.name -match '-primal$') { ', primal: true' } else { '' }
  $item = "{ forma: '$($f.name)', id: $id, nome: '$(Rotulo $especie $f.name)'$primal }"
  if (-not $porEspecie.Contains($especie)) { $porEspecie[$especie] = @() }
  $porEspecie[$especie] += $item
}

$linhas = foreach ($e in $porEspecie.Keys) { "  '$e': [" + ($porEspecie[$e] -join ', ') + "]," }
$corpo = ($linhas -join "`n").TrimEnd(',')

$saida = @"
/* GERADO por ferramentas/gerar-megas.ps1 a partir da PokeAPI - nao editar a mao (rode o script de novo).
   Formas de Mega Evolucao e de Reversao Primitiva, por especie ($($porEspecie.Count) especies, $($formas.Count) formas).
   Charizard e Mewtwo tem duas (X e Y): por isso o valor e sempre uma LISTA.
   So o indice mora aqui; status, tipos, habilidade e sprite da forma vem da API pelo nome (`forma`), como
   qualquer outro Pokemon - e sao pre-carregados no comeco da batalha pra nao esperar rede no meio do turno. */
export const MEGAS = {
$corpo
};
export const megasDe = especie => MEGAS[especie] || [];
export const temMega = especie => !!MEGAS[especie];
// Groudon e Kyogre nao "megaevoluem": o nome da mecanica deles e Reversao Primitiva (mesma mecanica, outro nome)
export const ehPrimal = forma => !!forma?.primal;
"@

$destino = Join-Path $PSScriptRoot '..\js\dados-megas.js'
[System.IO.File]::WriteAllText($destino, $saida, (New-Object System.Text.UTF8Encoding $false))
Write-Host "ok: $($formas.Count) formas em $($porEspecie.Count) especies -> js/dados-megas.js"
