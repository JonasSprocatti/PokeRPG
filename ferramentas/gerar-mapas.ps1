# Gera js/dados-mapas.js: os mapas por Gen (10 rotas cada), com Pokémon, pesos de aparição, Alfas e lendários.
# Uso (PowerShell, precisa de internet — baixa da PokéAPI):  powershell -File ferramentas/gerar-mapas.ps1
# Os nomes/temas das rotas estão aqui embaixo (REGIOES); o resto sai dos dados da PokéAPI:
#   - "nível natural" de cada espécie: base = pelo total de atributos; evoluída = nível em que evolui (ou o da forma
#     anterior + 15/20 quando evolui por pedra, troca, amizade…)
#   - cada espécie vai pra rota cuja faixa de nível mais combina, com preferência pela rota do tema (tipos)
#   - peso de aparição = taxa de captura da espécie (comum aparece mais); míticos: peso 0,2 nas rotas 8 e 9
#   - Alfa da rota = o mais forte entre os da rota e as evoluções deles (mesma Gen, até 12 níveis acima do teto)
#   - rota final = lendários da Gen (os de total ≥ 500; o último, de maior total, é o principal)
# Salve este arquivo com BOM (UTF-8) — o PowerShell 5 lê sem BOM como ANSI e estraga os acentos.
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent

$q = @'
{ s: pokemon_v2_pokemonspecies(order_by:{id:asc}) { id name generation_id is_legendary is_mythical is_baby capture_rate evolves_from_species_id
  ev: pokemon_v2_pokemonevolutions { min_level evolution_trigger_id }
  p: pokemon_v2_pokemons(where:{is_default:{_eq:true}}) { base_experience st: pokemon_v2_pokemonstats { base_stat } ty: pokemon_v2_pokemontypes(order_by:{slot:asc}) { t: pokemon_v2_type { name } } } } }
'@
$r = Invoke-RestMethod -Uri 'https://beta.pokeapi.co/graphql/v1beta' -Method Post -Body (@{ query = $q } | ConvertTo-Json -Compress) -ContentType 'application/json' -TimeoutSec 180
$esp = @{}
foreach ($s in $r.data.s) {
  $p = $s.p | Select-Object -First 1
  $esp[[int]$s.id] = [pscustomobject]@{
    id = [int]$s.id; nome = $s.name; gen = [int]$s.generation_id; lend = [bool]$s.is_legendary; mitico = [bool]$s.is_mythical; bebe = [bool]$s.is_baby
    captura = [int]$s.capture_rate; pai = $s.evolves_from_species_id
    evo = ($s.ev | Select-Object -First 1)
    bst = ($p.st | Measure-Object base_stat -Sum).Sum; xp = [int]$p.base_experience; tipos = @($p.ty | ForEach-Object { $_.t.name })
  }
}
# Formas regionais (Alolan, Galarian, Hisuian, Paldean). Na PokéAPI elas NÃO são espécies: são variedades de
# `pokemon` com id acima de 10000 (raichu-alola = 10100), então nunca entravam em lugar nenhum do jogo. Cada uma vai
# pro Santuário da Gen em que a forma foi criada (Alola=7, Galar e Hisui=8, Paldea=9), não da Gen da espécie
# original. `n` continua sendo a ESPÉCIE (é a chave do registro/Pokédex) e `f` guarda o nome da forma pra mostrar.
# Fora: formas "totem", que são só versões grandes de encontro especial.
$qf = @'
{ f: pokemon_v2_pokemon(where:{is_default:{_eq:false}, name:{_regex:"-(alola|galar|hisui|paldea)"}}, order_by:{id:asc})
  { id name pokemon_v2_pokemonspecy { name capture_rate is_legendary is_mythical } } }
'@
$rf = Invoke-RestMethod -Uri 'https://beta.pokeapi.co/graphql/v1beta' -Method Post -Body (@{ query = $qf } | ConvertTo-Json -Compress) -ContentType 'application/json' -TimeoutSec 180
$GEN_DA_FORMA = @{ alola = 7; galar = 8; hisui = 8; paldea = 9 }
$formas = @()
foreach ($f in $rf.data.f) {
  # o nome nem sempre TERMINA na região: as três raças de Tauros de Paldea (tauros-paldea-combat-breed) e o
  # Darmanitan de Galar (darmanitan-galar-standard) vêm com sufixo depois. Fora da lista:
  #   totem  = versão gigante de encontro especial, não é forma regional
  #   -cap   = Pikachu de boné (fantasia, não região)
  #   -zen   = o estado transformado do Darmanitan, que só existe em batalha (a forma dele é a -standard)
  if ($f.name -like '*totem*' -or $f.name -like '*-cap' -or $f.name -like '*-zen') { continue }
  $sufixo = @('alola', 'galar', 'hisui', 'paldea') | Where-Object { $f.name -like "*-$_*" } | Select-Object -First 1
  $formas += [pscustomobject]@{
    id = [int]$f.id; nome = $f.name; especie = $f.pokemon_v2_pokemonspecy.name; gen = $GEN_DA_FORMA[$sufixo]
    captura = [int]$f.pokemon_v2_pokemonspecy.capture_rate
    mitico = [bool]$f.pokemon_v2_pokemonspecy.is_mythical; lend = [bool]$f.pokemon_v2_pokemonspecy.is_legendary
  }
}
"formas regionais: $($formas.Count)"

$filhos = @{}
foreach ($e in $esp.Values) { if ($e.pai) { if (-not $filhos[[int]$e.pai]) { $filhos[[int]$e.pai] = @() }; $filhos[[int]$e.pai] += $e } }

# nível natural (memo)
$memo = @{}
function Natural($e) {
  if ($memo.ContainsKey($e.id)) { return $memo[$e.id] }
  if ($e.bebe) { $L = 1 }
  # forma base — ou "base" cujo pai é um bebê criado em Gen posterior (Snorlax ← Munchlax, Pikachu ← Pichu)
  elseif (-not $e.pai -or $esp[[int]$e.pai].bebe) { $L = [math]::Round(($e.bst - 250) * 0.22) }
  else {
    $pai = $esp[[int]$e.pai]; $Lp = Natural $pai
    $t = $e.evo.evolution_trigger_id
    if ($t -eq 1 -and $e.evo.min_level) { $L = [int]$e.evo.min_level }
    elseif ($t -eq 2) { $L = $Lp + 20 }
    else { $L = $Lp + 15 }
    $L = [math]::Max($L, $Lp + 5)
  }
  $L = [math]::Min(58, [math]::Max(1, $L)); $memo[$e.id] = $L; return $L
}
function NomeBonito($n) { ($n -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ' ' }

# Alfas escolhidos à mão (id da rota => nome da espécie na PokéAPI). Tudo o mais é decidido pela regra (tema + força);
# esta tabela existe pros casos em que a regra acerta tecnicamente mas erra no gosto.
#   a-diglett: a regra só achava Sandygast (320 de BST) combinando com Terra/Pedra/Aço no nível da rota — fraco
#              demais pra guardar um túnel. Lycanroc é Pedra, cabe no nível e tem cara de chefe de caverna.
#   a-wela:    com o Lycanroc reservado, sobrava só Salandit (320). Turtonator (Fogo/Dragão, 485) é uma tartaruga
#              VULCÂNICA guardando um parque vulcânico — a regra o descarta porque, sem evolução, o "nível natural"
#              dele é estimado em 52, alto demais pra rota; aqui a escolha humana vale mais que a estimativa.
$ALFA_FIXO = @{ 'a-diglett' = 'lycanroc'; 'a-wela' = 'turtonator' }

# faixas de nível (iguais em toda Gen): min, max, libera
$FAIXAS = @(@(2,6,1), @(5,10,5), @(9,15,9), @(13,20,13), @(18,26,18), @(24,32,24), @(30,38,30), @(36,45,36), @(43,55,43), @(52,62,50))

# rotas de cada região: id, nome, descrição, tipos do tema. A 10ª é a final (lendários).
$REGIOES = @(
  @{ gen = 1; regiao = 'Kanto'; rotas = @(
    @('rota1', 'Rota 1', 'Grama baixa e trilhas de terra.', 'normal,flying,grass'),
    @('floresta', 'Floresta de Viridian', 'Árvores fechadas, muitos insetos.', 'bug,grass'),
    @('montelua', 'Monte Lua', 'Caverna escura e cheia de pedras.', 'rock,ground,poison,fairy'),
    @('rota24', 'Rota 24', 'Campos abertos e a Ponte Pepita.', 'water,normal,grass,fighting'),
    @('k-usina', 'Usina Elétrica', 'Máquinas zumbindo no escuro.', 'electric,steel'),
    @('torre', 'Torre Pokémon', 'Silêncio, velas e névoa.', 'ghost,poison,psychic'),
    @('safari', 'Zona Safari', 'Pokémon raros em terreno selvagem.', 'normal,ground,grass,bug,water'),
    @('k-ilhas', 'Ilhas Espuma', 'Gelo, correntes e ondas geladas.', 'ice,water'),
    @('k-vitoria', 'Estrada Vitória', 'O último teste antes da liga.', 'fighting,rock,dragon,fire,psychic'),
    @('caverna', 'Caverna Cerúlea', 'Só para quem já é forte. Algo lendário espera no fundo.', 'psychic,poison,rock')) },
  @{ gen = 2; regiao = 'Johto'; rotas = @(
    @('j-rota29', 'Rota 29', 'Trilhas calmas perto de New Bark.', 'normal,flying,bug'),
    @('j-ilex', 'Bosque Ilex', 'Um bosque antigo e sombrio.', 'bug,grass,poison'),
    @('j-ruinas', 'Ruínas de Alph', 'Pedras com símbolos que ninguém entende.', 'psychic,rock,ground'),
    @('j-olivine', 'Costa de Olivine', 'Farol, mar e vento salgado.', 'water,electric'),
    @('j-queimada', 'Torre Queimada', 'Cinzas de um incêndio antigo.', 'fire,ghost,poison,normal'),
    @('j-furia', 'Lago da Fúria', 'Águas agitadas e escamas vermelhas.', 'water,dragon,flying'),
    @('j-gelo', 'Caminho de Gelo', 'Chão escorregadio e ar congelante.', 'ice,water,rock'),
    @('j-dragao', 'Toca do Dragão', 'O santuário do clã dos dragões.', 'dragon,water,fire'),
    @('j-prata', 'Monte Prata', 'Picos gelados onde só os fortes chegam.', 'rock,fighting,ground,steel,dark'),
    @('j-sino', 'Torre do Sino', 'Nove andares, sinos e uma ave de arco-íris.', 'ghost,fire,psychic,flying')) },
  @{ gen = 3; regiao = 'Hoenn'; rotas = @(
    @('h-rota101', 'Rota 101', 'Grama alta ao sul de Littleroot.', 'normal,bug,dark'),
    @('h-petalburgo', 'Bosque Petalburgo', 'Cogumelos e insetos por toda parte.', 'bug,grass'),
    @('h-granito', 'Caverna Granito', 'Túneis de pedra perto do mar.', 'rock,steel,fighting'),
    @('h-rota110', 'Rota 110', 'Ciclovia sobre o mar e fios elétricos.', 'electric,water,normal'),
    @('h-chimney', 'Monte Chimney', 'Cinzas vulcânicas no ar.', 'fire,ground,poison'),
    @('h-deserto', 'Deserto da Rota 111', 'Tempestade de areia sem fim.', 'ground,rock,bug,dragon'),
    @('h-pira', 'Monte Pira', 'Uma montanha de túmulos.', 'ghost,psychic,dark'),
    @('h-mar', 'Mar de Hoenn', 'Ondas, correntes e fundo do mar.', 'water,flying'),
    @('h-shoal', 'Caverna Shoal', 'Maré alta, maré baixa e gelo.', 'ice,water,dragon'),
    @('h-pilar', 'Pilar Celeste', 'Uma torre que toca o céu.', 'dragon,flying,psychic')) },
  @{ gen = 4; regiao = 'Sinnoh'; rotas = @(
    @('s-rota201', 'Rota 201', 'Caminho de terra entre cidades pequenas.', 'normal,flying,bug'),
    @('s-eterna', 'Bosque Eterna', 'Árvores altas e luz fraca.', 'bug,grass,ghost'),
    @('s-oreburgh', 'Mina Oreburgh', 'Carvão, pedra e aço.', 'rock,ground,steel'),
    @('s-eolico', 'Vale Eólico', 'Moinhos e vento forte.', 'electric,flying,water'),
    @('s-pantano', 'Grande Pântano', 'Lama até os joelhos.', 'water,poison,ground,grass'),
    @('s-mansao', 'Mansão Velha', 'Ninguém mora aqui há anos. Será?', 'ghost,dark,psychic'),
    @('s-neve', 'Rota 216', 'Neve funda e nevasca.', 'ice,water'),
    @('s-vitoria', 'Estrada Vitória', 'Treinadores fortes e pedras enormes.', 'fighting,steel,dragon,rock'),
    @('s-sobrevivencia', 'Área de Sobrevivência', 'Terra dura depois da liga.', 'fire,dark,fighting'),
    @('s-lanca', 'Pilar Lança', 'Ruínas no topo do Monte Coronet.', 'dragon,steel,water,psychic')) },
  @{ gen = 5; regiao = 'Unova'; rotas = @(
    @('u-rota1', 'Rota 1 de Unova', 'Estrada larga saindo de Nuvema.', 'normal,dark'),
    @('u-sonhos', 'Bosque dos Sonhos', 'Uma fábrica abandonada e neblina rosa.', 'psychic,grass,bug'),
    @('u-pinwheel', 'Floresta Pinwheel', 'Mata densa e cheia de vida.', 'bug,grass,poison'),
    @('u-deserto', 'Resort Deserto', 'Ruínas enterradas na areia.', 'ground,rock,fire'),
    @('u-chargestone', 'Caverna Chargestone', 'Pedras que flutuam com eletricidade.', 'electric,steel,rock'),
    @('u-celestial', 'Torre Celestial', 'Um sino para as almas que partiram.', 'ghost,flying,psychic'),
    @('u-gelada', 'Caverna Gelada', 'Gelo eterno sob a montanha.', 'ice,water'),
    @('u-humilau', 'Baía Humilau', 'Águas claras e céu aberto.', 'water,flying,fighting'),
    @('u-vitoria', 'Estrada Vitória de Unova', 'Um labirinto de pedra.', 'dragon,fighting,dark,steel'),
    @('u-castelo', 'Castelo de N', 'Um castelo erguido do chão, e dragões lendários.', 'dragon,psychic')) },
  @{ gen = 6; regiao = 'Kalos'; rotas = @(
    @('ka-rota2', 'Rota 2 de Kalos', 'Prados floridos perto de Aquacorde.', 'normal,bug,flying'),
    @('ka-santalune', 'Bosque Santalune', 'Luz entre as folhas.', 'bug,grass,fairy'),
    @('ka-glittering', 'Caverna Glittering', 'Cristais que brilham no escuro.', 'rock,ground,steel'),
    @('ka-riviere', 'Prado Rivière', 'Jardins, canais e flores.', 'fairy,normal,grass'),
    @('ka-usina', 'Usina de Kalos', 'Energia e calor.', 'electric,fire,steel'),
    @('ka-pantano', 'Pântano da Rota 14', 'Brejo escuro e nebuloso.', 'poison,dark,ghost'),
    @('ka-frost', 'Gruta Frost', 'Frio que corta.', 'ice,water'),
    @('ka-azure', 'Costa Azure', 'Mar aberto e rochas altas.', 'water,flying,dragon'),
    @('ka-terminus', 'Caverna Terminus', 'O fim da linha, onde a terra se abre.', 'dragon,ground,fighting,dark'),
    @('ka-arma', 'Arma Suprema', 'Uma arma antiga desperta vida e destruição.', 'fairy,dark,dragon')) },
  @{ gen = 7; regiao = 'Alola'; rotas = @(
    @('a-rota1', 'Rota 1 de Alola', 'Sol, grama e brisa do mar.', 'normal,bug,flying'),
    @('a-selva', 'Selva Lush', 'Uma floresta tropical fechada.', 'grass,bug,fairy'),
    @('a-diglett', 'Túnel Diglett', 'Túneis cavados por muitas mãos.', 'ground,rock,steel'),
    @('a-hano', 'Praia Hano', 'Areia branca e água morna.', 'water,electric'),
    @('a-wela', 'Parque Vulcânico Wela', 'Rocha quente e vapor.', 'fire,rock'),
    @('a-memorial', 'Morro Memorial', 'Um cemitério sob a lua.', 'ghost,dark,poison'),
    @('a-lanakila', 'Monte Lanakila', 'O pico nevado de Alola.', 'ice,rock,flying'),
    @('a-poni', 'Cânion Vast Poni', 'Paredões enormes e dragões.', 'dragon,fighting,rock'),
    @('a-ruinas', 'Ruínas da Abundância', 'Templos dos guardiões das ilhas.', 'psychic,fairy,steel'),
    @('a-altar', 'Altar do Sol e da Lua', 'Onde a luz do outro mundo desce.', 'psychic,steel,ghost')) },
  @{ gen = 8; regiao = 'Galar'; rotas = @(
    @('g-rota1', 'Rota 1 de Galar', 'Campos verdes perto de Postwick.', 'normal,bug,flying'),
    @('g-slumbering', 'Bosque Slumbering', 'Névoa que faz a gente se perder.', 'fairy,grass,psychic'),
    @('g-mina', 'Mina de Galar', 'Esteiras de carvão e poeira.', 'rock,ground,steel'),
    @('g-miloc', 'Lago Miloc', 'A Área Selvagem se abre à sua frente.', 'water,electric,grass'),
    @('g-motostoke', 'Arredores de Motostoke', 'Fumaça das fábricas e engrenagens.', 'fire,fighting,normal'),
    @('g-glimwood', 'Bosque Glimwood', 'Cogumelos que brilham sozinhos.', 'fairy,psychic,ghost'),
    @('g-rota8', 'Rota 8 Nevada', 'Ruínas cobertas de neve.', 'ice,water,steel'),
    @('g-coroa', 'Tundra da Coroa', 'Planícies geladas e ventos antigos.', 'ice,ground,dragon'),
    @('g-armadura', 'Ilha da Armadura', 'Um dojo no meio do mar.', 'fighting,water,poison,dark'),
    @('g-hammerlocke', 'Torre Energia de Hammerlocke', 'A energia de Galar pulsa descontrolada.', 'dragon,poison')) },
  @{ gen = 9; regiao = 'Paldea'; rotas = @(
    @('p-poco', 'Trilha de Poco', 'Uma trilha tranquila perto do farol.', 'normal,bug,grass'),
    @('p-sul', 'Planície Sul', 'Campos abertos e céu grande.', 'normal,flying,electric'),
    @('p-caverna', 'Caverna de Alfornada', 'Túneis profundos e escuros.', 'ground,rock,dark'),
    @('p-casseroya', 'Lago Casseroya', 'O maior lago de Paldea.', 'water,dragon,flying'),
    @('p-asado', 'Deserto Asado', 'Calor seco e ossos na areia.', 'fire,ground,steel'),
    @('p-tagtree', 'Bosque Tagtree', 'Árvores enormes e insetos gigantes.', 'bug,grass,poison,ghost'),
    @('p-glaseado', 'Monte Glaseado', 'Neve no topo de Paldea.', 'ice,psychic'),
    @('p-kitakami', 'Kitakami', 'Uma vila de lendas e máscaras.', 'fairy,psychic,ghost'),
    @('p-borda', 'Borda da Grande Cratera', 'O abismo no centro de Paldea.', 'dragon,fighting,steel,dark'),
    @('p-zero', 'Área Zero', 'O fundo da cratera, onde o tempo se mistura.', 'dragon,psychic,fighting'))
  }
)

$mids = $FAIXAS | ForEach-Object { ($_[0] + $_[1]) / 2 }
$CAP = 16
$saida = New-Object System.Collections.Generic.List[string]
$saida.Add('/* GERADO por ferramentas/gerar-mapas.ps1 a partir da PokéAPI — não editar à mão (rode o script de novo). */')
$saida.Add('// Mapas por Gen: 10 rotas cada (a 10ª é a final, com os lendários). pool = [{ id, n: speciesName, p: peso de aparição, m?: mítico }].')
$saida.Add('// chefe = Alfa da rota; lendarios = sequência da luta final (o último é o principal). Lógica em js/mapas.js.')
$saida.Add('export const GENS = [')
# Iniciais das 9 regiões E as evoluções deles ficam FORA das rotas: o inicial é a escolha que abre a jornada, achar
# um solto no mato tira o peso dela. Cada trio ocupa ids seguidos a partir do primeiro (1-9, 152-160, 252-260, ...).
# Pikachu (25) e Eevee (133) não entram aqui — exceção pedida, eles aparecem no mundo como sempre.
# js/mapas.js faz a MESMA limpeza em cima dos dados já gerados, então dados antigos também obedecem a regra.
$INICIAIS_BASE = @(1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912)
function EhInicial($id) { foreach ($b in $INICIAIS_BASE) { if ($id -ge $b -and $id -le ($b + 2)) { return $true } } return $false }
foreach ($R in $REGIOES) {
  $g = $R.gen
  $cands = @($esp.Values | Where-Object { $_.gen -eq $g -and -not $_.lend -and -not $_.mitico -and -not (EhInicial $_.id) } | Sort-Object { Natural $_ }, id)
  $temas = $R.rotas | ForEach-Object { ,@($_[3] -split ',') }
  $pools = @(); for ($i = 0; $i -lt 10; $i++) { $pools += ,(New-Object System.Collections.Generic.List[object]) }
  function Nota($e, $i) {
    $L = Natural $e
    if ($i -eq 9 -and $L -lt 42) { return 999 }
    $d = [math]::Abs($L - $mids[$i]) / 5
    $m = @($e.tipos | Where-Object { $temas[$i] -contains $_ }).Count
    return $d - ($(if ($m -ge 2) { 1.8 } elseif ($m -eq 1) { 1.2 } else { 0 }))
  }
  foreach ($e in $cands) {
    # só rotas de nível parecido; todas lotadas = entra na melhor mesmo assim (nunca vai parar numa rota de nível errado)
    $L = Natural $e
    $ordem = @(0..9 | Where-Object { (Nota $e $_) -lt 999 -and [math]::Abs($L - $mids[$_]) -le 12 } | Sort-Object { Nota $e $_ })
    if (-not $ordem.Count) { $ordem = @(0..9 | Sort-Object { Nota $e $_ } | Select-Object -First 1) }
    $livre = $ordem | Where-Object { $pools[$_].Count -lt $CAP } | Select-Object -First 1
    $pools[$(if ($null -ne $livre) { $livre } else { $ordem[0] })].Add($e)
  }
  # rota com pouca coisa: completa com os que mais combinam (repetir espécie de outra rota é permitido)
  for ($i = 0; $i -lt 10; $i++) {
    if ($pools[$i].Count -ge 5) { continue }
    $extra = $cands | Where-Object { -not $pools[$i].Contains($_) } | Sort-Object { Nota $_ $i } | Select-Object -First (5 - $pools[$i].Count)
    foreach ($e in $extra) { $pools[$i].Add($e) }
  }
  $mitos = @($esp.Values | Where-Object { $_.gen -eq $g -and $_.mitico } | Sort-Object id)
  $lends = @($esp.Values | Where-Object { $_.gen -eq $g -and $_.lend } | Sort-Object bst, id)
  $principal = $lends[-1]
  $outros = @($lends | Where-Object { $_ -ne $principal -and $_.bst -ge 500 })
  <# ---- Alfas do mapa: um por rota, NUNCA repetindo dentro da mesma Gen ----
     Força = BST + metade do XP base. São os dois sinais que a PokéAPI dá de "quão forte e quão valioso é derrotar";
     o XP entra com peso menor porque a escala dele é bem menor que a do BST.
     A escolha vai da rota MAIS ALTA pra mais baixa, cada uma levando o mais forte que ainda não virou Alfa. Isso
     resolve as duas coisas de uma vez: a fila de Alfas cresce junto com o nível das rotas e ninguém se repete —
     antes o mesmo Pokémon era Alfa de duas rotas em quase todo mapa (14 casos), porque cada rota escolhia sozinha.
     Se uma rota ficar sem candidato próprio (todos já usados), abre pra qualquer espécie da Gen ainda livre. #>
  $Forca = { param($e) $e.bst + [math]::Round($e.xp / 2) }
  $alfas = @($null) * 10
  $usados = New-Object System.Collections.Generic.HashSet[int]
  # Alfas escolhidos À MÃO (rota => espécie): a regra acerta quase tudo, mas em alguns lugares a decisão é de gosto.
  # Entram ANTES do resto, já reservados, pra nenhuma outra rota levar a espécie. Um por linha, com o motivo.
  foreach ($par in $ALFA_FIXO.GetEnumerator()) {
    $idx = [array]::IndexOf(@($R.rotas | ForEach-Object { $_[0] }), $par.Key)
    if ($idx -lt 0 -or $idx -gt 8) { continue }
    $escolhido = $esp.Values | Where-Object { $_.nome -eq $par.Value } | Select-Object -First 1
    if (-not $escolhido) { throw "ALFA_FIXO: espécie '$($par.Value)' não existe" }
    $alfas[$idx] = $escolhido; [void]$usados.Add([int]$escolhido.id)
  }
  for ($i = 8; $i -ge 0; $i--) {
    if ($alfas[$i]) { continue }   # já veio do ALFA_FIXO
    $fx = $FAIXAS[$i]
    $opcoes = New-Object System.Collections.Generic.List[object]
    foreach ($e in $pools[$i]) {
      $opcoes.Add($e)
      foreach ($fi in @($filhos[$e.id])) { if ($fi -and $fi.gen -eq $g -and -not $fi.lend -and -not $fi.mitico -and -not (EhInicial $fi.id)) { $opcoes.Add($fi) } }
    }
    <# O Alfa tem de FAZER SENTIDO na rota: um Aggron (Aço/Pedra) guardando o Mar de Hoenn era estranho de ler.
       Cada rota declara tipos-tema (a 4ª coluna de REGIOES, a mesma que monta o elenco), e agora eles mandam na
       escolha: primeiro quantos tipos do Alfa batem com o tema, e só depois a força. A ÚLTIMA rota com Alfa (a 9ª)
       é a exceção pedida: lá vale o mais forte do mapa, sem tema — é o pseudo-lendário fechando a progressão.
       O piso de força continua valendo, mas agora só procura substituto que também combine com o tema. #>
    $piso = 350 + 4 * $fx[1]
    $temaRota = $temas[$i]
    $PontosTema = { param($e) @($e.tipos | Where-Object { $temaRota -contains $_ }).Count }
    
    $proprios = @($opcoes | Where-Object { (Natural $_) -le $fx[1] + 12 -and -not $usados.Contains($_.id) })
    if ($i -eq 8) {
      # rota do pseudo-lendário: só força
      $alfa = $proprios | Sort-Object @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1
      if (-not $alfa -or $alfa.bst -lt $piso) {
        $m = $cands | Where-Object { -not $usados.Contains($_.id) -and $_.bst -ge $piso } | Sort-Object @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1
        if ($m) { $alfa = $m }
      }
    } else {
      $alfa = @($proprios | Where-Object { (& $PontosTema $_) -ge 1 }) | Sort-Object @{ Expression = { & $PontosTema $_ }; Descending = $true }, @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1
      if (-not $alfa -or $alfa.bst -lt $piso) {
        # abre pra Gen inteira, mas continua exigindo o tema da rota
        $m = $cands | Where-Object { -not $usados.Contains($_.id) -and (Natural $_) -le $fx[1] + 12 -and $_.bst -ge $piso -and (& $PontosTema $_) -ge 1 } |
          Sort-Object @{ Expression = { & $PontosTema $_ }; Descending = $true }, @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1
        if ($m) { $alfa = $m }
      }
      # nada com o tema: cai no mais forte da própria rota (melhor um fora do tema do que rota sem Alfa)
      if (-not $alfa) { $alfa = $proprios | Sort-Object @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1 }
    }
    if (-not $alfa) { $alfa = $cands | Where-Object { -not $usados.Contains($_.id) -and (Natural $_) -le $fx[1] + 12 } | Sort-Object @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1 }
    if (-not $alfa) { $alfa = $cands | Where-Object { -not $usados.Contains($_.id) } | Sort-Object @{ Expression = { & $Forca $_ }; Descending = $true }, id | Select-Object -First 1 }
    $alfas[$i] = $alfa; [void]$usados.Add([int]$alfa.id)
  }
  $saida.Add("  { gen: $g, regiao: '$($R.regiao)', rotas: [")
  for ($i = 0; $i -lt 10; $i++) {
    $def = $R.rotas[$i]; $f = $FAIXAS[$i]
    $pool = @($pools[$i] | Sort-Object id | ForEach-Object { "{ id: $($_.id), n: '$($_.nome)', p: $([math]::Max(1, [math]::Round($_.captura / 30))) }" })
    # míticos: ~0,4% dos encontros cada (peso relativo ao total da rota), metade na rota 8 e metade na 9
    $totalRota = ($pools[$i] | ForEach-Object { [math]::Max(1, [math]::Round($_.captura / 30)) } | Measure-Object -Sum).Sum
    $pesoMito = ([math]::Round($totalRota * 0.004, 3)).ToString([Globalization.CultureInfo]::InvariantCulture)
    if ($i -eq 7 -or $i -eq 8) { for ($k = 0; $k -lt $mitos.Count; $k++) { if (($k % 2) -eq ($i - 7) -or $mitos.Count -eq 1) { $pool += "{ id: $($mitos[$k].id), n: '$($mitos[$k].nome)', p: $pesoMito, m: 1 }" } } }
    $txt = "    { id: '$($def[0])', gen: $g, name: '$($def[1])', desc: '$($def[2] -replace "'", "\'")', min: $($f[0]), max: $($f[1]), libera: $($f[2]), pool: [$($pool -join ', ')]"
    if ($i -lt 9) {
      $alfa = $alfas[$i]   # escolhido antes, pro mapa inteiro (sem repetir — ver o bloco "Alfas do mapa")
      $txt += ", chefe: { id: $($alfa.id), nome: '$(NomeBonito $alfa.nome)', nivel: $($f[1] + 4) }"
    } else {
      $seq = @($outros | ForEach-Object { "{ id: $($_.id), nome: '$(NomeBonito $_.nome)', nivel: 68 }" }) + "{ id: $($principal.id), nome: '$(NomeBonito $principal.nome)', nivel: 75 }"
      $txt += ", final: true, lendarios: [$($seq -join ', ')]"
    }
    $saida.Add($txt + ' },')
  }
  # 11ª rota: o SANTUÁRIO, que só abre depois de vencer os lendários do mapa (js/regras.zonaLiberada usa posVitoria).
  # Aqui aparece TODA a Gen — inclusive os iniciais (que não vivem nas rotas comuns), os lendários e os míticos —
  # com o mesmo peso por taxa de captura das outras rotas. É o que garante que dá pra encontrar todo mundo de uma
  # Gen sem depender de sorte de geração: qualquer espécie que ficasse de fora das 10 rotas cai aqui.
  $todos = @($esp.Values | Where-Object { $_.gen -eq $g } | Sort-Object id)
  $poolS = @($todos | ForEach-Object {
    $peso = [math]::Max(1, [math]::Round($_.captura / 30))
    "{ id: $($_.id), n: '$($_.nome)', p: $peso$(if ($_.mitico) { ', m: 1' })$(if ($_.lend) { ', l: 1' }) }"
  })
  # + as formas regionais criadas nesta Gen (Alolan na 7, Galarian/Hisuian na 8, Paldean na 9)
  $poolS += @($formas | Where-Object { $_.gen -eq $g } | ForEach-Object {
    $peso = [math]::Max(1, [math]::Round($_.captura / 30))
    "{ id: $($_.id), n: '$($_.especie)', f: '$($_.nome)', p: $peso$(if ($_.mitico) { ', m: 1' })$(if ($_.lend) { ', l: 1' }) }"
  })
  $saida.Add("    { id: '$($R.regiao.ToLower())-santuario', gen: $g, name: 'Santuário de $($R.regiao)', desc: 'Aberto depois que você vence os lendários: aqui vive toda a Gen $g, dos iniciais aos lendários.', min: 58, max: 70, libera: 1, posVitoria: true, pool: [$($poolS -join ', ')] }")
  $saida.Add('  ] }' + $(if ($g -lt 9) { ',' } else { '' }))
}
$saida.Add('];')
[System.IO.File]::WriteAllLines("$raiz\js\dados-mapas.js", $saida, (New-Object System.Text.UTF8Encoding $false))
"ok: $($saida.Count) linhas"
