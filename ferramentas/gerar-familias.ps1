# Gera js/dados-familias.js a partir da PokéAPI (GraphQL): quais espécies são EVOLUÇÃO FINAL.
# Rode com:  powershell -File ferramentas/gerar-familias.ps1
#
# Por que existe: a Mega é conquistada derrotando SENDO a espécie que megaevolui, e quem megaevolui é a forma
# final. Sem esta lista, cada estágio tinha o próprio contador — derrotar como Marshtomp enchia uma barra que
# não levava a lugar nenhum, e evoluir parecia zerar o progresso (relatado em jogo).
# Regra: é final quem NÃO é `evolves_from_species_id` de ninguém. Espécie que não evolui (Tauros, Absol) também
# é final — ela já é a forma dela, e várias dessas têm Mega.
# É um arquivo GERADO: mexer nele à mão se perde na próxima execução.

$ErrorActionPreference = 'Stop'
$q = '{"query":"{ pokemon_v2_pokemonspecies(order_by: {id: asc}) { id name evolves_from_species_id } }"}'
$r = Invoke-RestMethod -Uri "https://beta.pokeapi.co/graphql/v1beta" -Method Post -Body $q -ContentType "application/json" -TimeoutSec 120
$sp = $r.data.pokemon_v2_pokemonspecies
if (-not $sp -or $sp.Count -lt 1000) { throw "veio pouca coisa da PokeAPI ($($sp.Count) especies)" }

$temFilho = @{}
foreach ($s in $sp) { if ($null -ne $s.evolves_from_species_id) { $temFilho[[string]$s.evolves_from_species_id] = $true } }
$finais = @($sp | Where-Object { -not $temFilho.ContainsKey([string]$_.id) } | ForEach-Object { $_.name })

$nomes = ($finais | ForEach-Object { "'" + $_ + "'" })
$linhas = @()
for ($i = 0; $i -lt $nomes.Count; $i += 10) {
  $linhas += '  ' + (($nomes[$i..([Math]::Min($i + 9, $nomes.Count - 1))]) -join ', ') + ','
}
$corpo = ($linhas -join "`n").TrimEnd(',')

$saida = @"
/* GERADO por ferramentas/gerar-familias.ps1 a partir da PokeAPI - nao editar a mao (rode o script de novo).
   Especies que sao EVOLUCAO FINAL da linha delas ($($finais.Count) de $($sp.Count)).
   Quem megaevolui e a forma final, entao so ela acumula golpe final pra Mega (conquistas.js). Antes cada
   estagio tinha contador proprio: derrotar como Marshtomp enchia uma barra que nao levava a Mega nenhuma, e
   evoluir parecia zerar o progresso - foi relatado em jogo.
   Especie que nao evolui (Tauros, Absol) tambem entra: ela ja e a forma dela, e varias dessas tem Mega. */
export const EVOLUCAO_FINAL = new Set([
$corpo
]);
export const ehEvolucaoFinal = especie => EVOLUCAO_FINAL.has(especie);
"@

$destino = Join-Path $PSScriptRoot '..\js\dados-familias.js'
Set-Content -Path $destino -Value $saida -Encoding utf8
Write-Host "ok: $($finais.Count) evolucoes finais de $($sp.Count) especies -> js/dados-familias.js"
