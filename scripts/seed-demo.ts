/**
 * Popula o ambiente local com dados de DEMONSTRAÇÃO. Todo estabelecimento, pessoa, CNPJ, endereço e
 * agendamento daqui é FICTÍCIO: nomes gerados, CNPJs válidos só pelo dígito verificador (`cnpjFrom`),
 * ruas "de demonstração" e e-mails no domínio reservado `example.com`. Nenhum dado real.
 *
 * Duas etapas:
 *
 *   bun scripts/seed-demo.ts              30 estabelecimentos pela própria API (cadastro, estabelecimento,
 *                                         profissionais, serviços, jornada, submissão) e aprovação pelo
 *                                         Admin de demonstração em `api/admin/businesses`.
 *
 *   bun scripts/seed-demo.ts --historico  ⚠️ SÓ PARA O BANCO LOCAL DO DOCKER. Consumidores fictícios,
 *                                         60 dias de histórico (concluídos, cancelados, faltas) e agenda
 *                                         futura parcialmente ocupada, gravados por SQL direto: o passado
 *                                         não passa pela API (antecedência mínima, horizonte). Roda as duas
 *                                         etapas, nesta ordem.
 *
 * Escrita direta no banco, além do histórico: conceder o papel de Admin (ADR-020 — nunca por endpoint) e
 * confirmar o e-mail das contas de demonstração (Onda 6A — `example.com` não recebe e-mail).
 *
 * Idempotente e reexecutável: conta que já existe é pulada, CNPJ já cadastrado é pulado, e o histórico só
 * é gravado uma vez (marcador em `customer_notes`). Com `docker compose up` rodando.
 *
 * Bairros: os 7 que o Nominatim (OpenStreetMap) devolveu como bairro de Garça-SP em 27/10/2026, a partir da
 * lista de bairros da Página Amarela. Cada estabelecimento fica a até ~300 m do ponto do bairro — o ponto é
 * gerado, não é endereço real. Os 3 estabelecimentos originais mantêm o ponto do seed anterior.
 *
 * As senhas abaixo são credenciais de TESTE do ambiente local, sem valor fora dele.
 */

const API = process.env.API_URL ?? 'http://localhost:8081'
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'demo-12345678'
const TIME_ZONE = 'America/Sao_Paulo'
const WITH_HISTORY = process.argv.includes('--historico')

type Json = Record<string, unknown>

class ApiCallError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function call<T = Json>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // As rotas de autenticação aceitam 10 chamadas por minuto por IP.
    if (response.status === 429 && attempt < 12) {
      console.log('  limite de requisições de autenticação; aguardando 15 s…')
      await sleep(15_000)
      continue
    }

    const text = await response.text()
    const isJson = response.headers.get('content-type')?.includes('json') ?? false
    const data = text && isJson ? JSON.parse(text) : undefined

    if (!response.ok) {
      const code = data?.code as string | undefined
      throw new ApiCallError(response.status, code, `${method} ${path} → ${response.status} ${code ?? text}`)
    }

    return data as T
  }
}

/** CNPJ com dígitos verificadores válidos, gerado a partir de uma raiz fixa — fictício. */
function cnpjFrom(root: string): string {
  const digits = root.padStart(12, '0').slice(0, 12).split('').map(Number)
  const check = (base: number[], weights: number[]) => {
    const sum = base.reduce((acc, digit, index) => acc + digit * weights[index]!, 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  const first = check(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = check([...digits, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return [...digits, first, second].join('')
}

/** Gerador pseudoaleatório com semente (mulberry32): a mesma execução gera sempre os mesmos dados. */
function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)]!

// --- Catálogo de demonstração -------------------------------------------------------------------------

type DemoService = {
  name: string
  description: string
  durationMinutes: number
  priceCents: number
  bufferAfterMinutes?: number
}
type DemoProfessional = { displayName: string; specialty: string; bio: string; isMe: boolean; pattern: number }
type DemoBusiness = {
  owner: { fullName: string; email: string }
  name: string
  cnpjRoot: string
  category: 'Beleza' | 'Saude'
  autoConfirm: boolean
  address: { street: string; streetNumber: string; district: string; city: string; state: string; postalCode: string }
  location: { latitude: number; longitude: number }
  professionals: DemoProfessional[]
  services: DemoService[]
}

/** Jornadas. `DayOfWeek` do .NET: 0 = domingo. Duas linhas no mesmo dia são a pausa do almoço. */
const PATTERNS: { day: number; start: string; end: string }[][] = [
  [1, 2, 3, 4, 5].map((day) => ({ day, start: '09:00:00', end: '18:00:00' })),
  [2, 3, 4, 5, 6].flatMap((day) => [
    { day, start: '09:00:00', end: '12:00:00' },
    { day, start: '13:00:00', end: '19:00:00' },
  ]),
  [1, 2, 3, 4, 5, 6].map((day) => ({ day, start: '08:00:00', end: '14:00:00' })),
  [1, 2, 3, 4, 5].map((day) => ({ day, start: '13:00:00', end: '21:00:00' })),
]

const KINDS = {
  barbearia: {
    category: 'Beleza',
    label: 'Barbearia',
    specialty: 'Barbeiro',
    services: [
      { name: 'Corte masculino', description: 'Corte na tesoura ou máquina, com finalização.', durationMinutes: 30, priceCents: 4000 },
      { name: 'Barba', description: 'Barba modelada com navalha.', durationMinutes: 20, priceCents: 3000 },
      { name: 'Corte + barba', description: 'Corte completo e barba com toalha quente.', durationMinutes: 50, priceCents: 6500 },
      { name: 'Pigmentação', description: 'Pigmentação de barba ou cabelo.', durationMinutes: 40, priceCents: 5500 },
    ],
  },
  salao: {
    category: 'Beleza',
    label: 'Salão',
    specialty: 'Cabeleireira',
    services: [
      { name: 'Corte feminino', description: 'Corte e finalização.', durationMinutes: 50, priceCents: 7000 },
      { name: 'Escova', description: 'Escova modeladora.', durationMinutes: 40, priceCents: 5000 },
      { name: 'Coloração', description: 'Coloração completa.', durationMinutes: 120, priceCents: 18000, bufferAfterMinutes: 10 },
      { name: 'Hidratação', description: 'Hidratação profunda.', durationMinutes: 45, priceCents: 6000 },
    ],
  },
  esmalteria: {
    category: 'Beleza',
    label: 'Esmalteria',
    specialty: 'Manicure',
    services: [
      { name: 'Manicure', description: 'Cutilagem e esmaltação.', durationMinutes: 45, priceCents: 3500 },
      { name: 'Pedicure', description: 'Cutilagem e esmaltação dos pés.', durationMinutes: 45, priceCents: 4000 },
      { name: 'Pé e mão', description: 'Manicure e pedicure.', durationMinutes: 90, priceCents: 6500 },
      { name: 'Unha em gel', description: 'Alongamento em gel.', durationMinutes: 90, priceCents: 12000 },
    ],
  },
  estetica: {
    category: 'Beleza',
    label: 'Estética',
    specialty: 'Esteticista',
    services: [
      { name: 'Limpeza de pele', description: 'Limpeza de pele profunda.', durationMinutes: 60, priceCents: 12000 },
      { name: 'Design de sobrancelha', description: 'Design com pinça e linha.', durationMinutes: 30, priceCents: 4000 },
      { name: 'Depilação', description: 'Depilação com cera.', durationMinutes: 30, priceCents: 5000 },
    ],
  },
  fisioterapia: {
    category: 'Saude',
    label: 'Clínica de Fisioterapia',
    specialty: 'Fisioterapeuta',
    services: [
      { name: 'Sessão de fisioterapia', description: 'Sessão individual.', durationMinutes: 50, priceCents: 12000, bufferAfterMinutes: 10 },
      { name: 'Avaliação fisioterapêutica', description: 'Primeira consulta.', durationMinutes: 60, priceCents: 15000, bufferAfterMinutes: 10 },
    ],
  },
  nutricao: {
    category: 'Saude',
    label: 'Consultório de Nutrição',
    specialty: 'Nutricionista',
    services: [
      { name: 'Consulta de nutrição', description: 'Primeira consulta com avaliação.', durationMinutes: 60, priceCents: 18000 },
      { name: 'Retorno de nutrição', description: 'Acompanhamento.', durationMinutes: 30, priceCents: 9000 },
    ],
  },
  psicologia: {
    category: 'Saude',
    label: 'Consultório de Psicologia',
    specialty: 'Psicóloga',
    services: [{ name: 'Sessão de psicoterapia', description: 'Sessão individual.', durationMinutes: 50, priceCents: 16000, bufferAfterMinutes: 10 }],
  },
  fonoaudiologia: {
    category: 'Saude',
    label: 'Clínica de Fonoaudiologia',
    specialty: 'Fonoaudióloga',
    services: [{ name: 'Sessão de fonoaudiologia', description: 'Sessão individual.', durationMinutes: 40, priceCents: 13000 }],
  },
} as const

type KindKey = keyof typeof KINDS

// 23 de Beleza e 4 de Saúde, além dos 3 originais.
const GENERATED_KINDS: KindKey[] = [
  ...Array<KindKey>(7).fill('barbearia'),
  ...Array<KindKey>(7).fill('salao'),
  ...Array<KindKey>(5).fill('esmalteria'),
  ...Array<KindKey>(4).fill('estetica'),
  'fisioterapia',
  'nutricao',
  'psicologia',
  'fonoaudiologia',
]

/** Pontos dos bairros, do Nominatim (OpenStreetMap), consultados em 27/10/2026. */
const BAIRROS = [
  { name: 'Vila Araceli', latitude: -22.224207, longitude: -49.6536966 },
  { name: 'Cascata', latitude: -22.202021, longitude: -49.6528534 },
  { name: 'Jardim Ecoville', latitude: -22.2304392, longitude: -49.640451 },
  { name: 'Jardim Sol Nascente', latitude: -22.2109354, longitude: -49.68169 },
  { name: 'Labienópolis', latitude: -22.2176256, longitude: -49.6568871 },
  { name: 'Vila Mariana', latitude: -22.1986906, longitude: -49.6514849 },
  { name: 'Vila Rebelo', latitude: -22.2088776, longitude: -49.6669187 },
] as const

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius',
  'Yasmin', 'Larissa', 'Mateus', 'Beatriz', 'Gustavo', 'Letícia', 'Rodrigo', 'Juliana', 'Thiago', 'Paula',
] as const
const SURNAMES = [
  'Almeida', 'Barros', 'Campos', 'Duarte', 'Esteves', 'Faria', 'Gomes', 'Lacerda', 'Moraes', 'Nogueira',
  'Pacheco', 'Queiroz', 'Ramos', 'Siqueira', 'Teixeira', 'Vasconcelos', 'Xavier', 'Andrade', 'Brandão', 'Coelho',
  'Dantas', 'Freitas', 'Guedes', 'Lima', 'Macedo', 'Pires', 'Rezende', 'Sales',
] as const

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')

/** Os 3 estabelecimentos do seed anterior, mantidos (com mais profissionais) para o script seguir idempotente. */
const ORIGINAL: DemoBusiness[] = [
  {
    owner: { fullName: 'Duartina Souza', email: 'dono.duartina@example.com' },
    name: 'Estúdio Duartina',
    cnpjRoot: '112223330001',
    category: 'Beleza',
    autoConfirm: false,
    address: { street: 'Rua Carlos Ferrari', streetNumber: '100', district: 'Centro', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2125, longitude: -49.6564 },
    professionals: [
      { displayName: 'Duartina Souza', specialty: 'Cabeleireira', bio: 'Cortes e coloração há 12 anos.', isMe: true, pattern: 0 },
      { displayName: 'Marcos Lima', specialty: 'Barbeiro', bio: 'Especialista em barba e degradê.', isMe: false, pattern: 1 },
      { displayName: 'Paula Ramos', specialty: 'Cabeleireira', bio: 'Escova e hidratação.', isMe: false, pattern: 3 },
    ],
    services: [
      { name: 'Corte masculino', description: 'Corte na tesoura ou máquina, com finalização.', durationMinutes: 30, priceCents: 4500 },
      { name: 'Corte + barba', description: 'Corte completo e barba com toalha quente.', durationMinutes: 60, priceCents: 8000 },
      { name: 'Barba', description: 'Barba modelada com navalha.', durationMinutes: 20, priceCents: 3000 },
    ],
  },
  {
    owner: { fullName: 'Helena Prado', email: 'dono.helena@example.com' },
    name: 'Espaço Helena Unhas',
    cnpjRoot: '445556660001',
    category: 'Beleza',
    autoConfirm: true,
    address: { street: 'Avenida Rafael Paes de Barros', streetNumber: '520', district: 'Jardim Paulista', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2068, longitude: -49.6611 },
    professionals: [
      { displayName: 'Helena Prado', specialty: 'Manicure', bio: 'Unhas em gel e esmaltação.', isMe: true, pattern: 0 },
      { displayName: 'Yasmin Coelho', specialty: 'Manicure', bio: 'Pedicure e spa dos pés.', isMe: false, pattern: 2 },
      { displayName: 'Letícia Dantas', specialty: 'Manicure', bio: 'Nail art.', isMe: false, pattern: 1 },
    ],
    services: [
      { name: 'Manicure', description: 'Cutilagem e esmaltação.', durationMinutes: 45, priceCents: 3500 },
      { name: 'Pé e mão', description: 'Manicure e pedicure.', durationMinutes: 90, priceCents: 6000 },
    ],
  },
  {
    owner: { fullName: 'Rogério Antunes', email: 'dono.rogerio@example.com' },
    name: 'Barbearia do Rogério',
    cnpjRoot: '778889990001',
    category: 'Beleza',
    autoConfirm: false,
    address: { street: 'Rua Barão do Rio Branco', streetNumber: '45', district: 'Vila Willi', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2167, longitude: -49.6502 },
    professionals: [
      { displayName: 'Rogério Antunes', specialty: 'Barbeiro', bio: 'Barbearia clássica desde 2010.', isMe: true, pattern: 0 },
      { displayName: 'Tiago Melo', specialty: 'Barbeiro', bio: 'Cortes modernos e pigmentação.', isMe: false, pattern: 1 },
      { displayName: 'Samuel Pires', specialty: 'Barbeiro', bio: 'Degradê e navalhado.', isMe: false, pattern: 3 },
      { displayName: 'Gustavo Lima', specialty: 'Barbeiro', bio: 'Barba e acabamento.', isMe: false, pattern: 2 },
    ],
    services: [
      { name: 'Corte masculino', description: 'Corte e lavagem.', durationMinutes: 40, priceCents: 4000 },
      { name: 'Barba', description: 'Barba completa.', durationMinutes: 30, priceCents: 3500 },
    ],
  },
]

function generatedBusinesses(): DemoBusiness[] {
  const random = seededRandom(20261027)
  const usedNames = new Set<string>()

  return GENERATED_KINDS.map((kindKey, index) => {
    const kind = KINDS[kindKey]
    const bairro = BAIRROS[index % BAIRROS.length]!
    const ownerFirst = FIRST_NAMES[(index * 7) % FIRST_NAMES.length]!
    const ownerLast = SURNAMES[(index * 5) % SURNAMES.length]!

    let name = `${kind.label} ${ownerLast}`
    if (usedNames.has(name)) name = `${kind.label} ${ownerFirst} ${ownerLast}`
    usedNames.add(name)

    // Até ~300 m do ponto do bairro, para lados variados.
    const dLat = ((random() - 0.5) * 2 * 300) / 111_000
    const dLon = ((random() - 0.5) * 2 * 300) / (111_000 * Math.cos((bairro.latitude * Math.PI) / 180))

    const count = 3 + Math.floor(random() * 3)
    const professionals: DemoProfessional[] = Array.from({ length: count }, (_, p) => {
      const first = p === 0 ? ownerFirst : FIRST_NAMES[(index * 11 + p * 3) % FIRST_NAMES.length]!
      const last = p === 0 ? ownerLast : SURNAMES[(index * 3 + p * 7) % SURNAMES.length]!
      return { displayName: `${first} ${last}`, specialty: kind.specialty, bio: `${kind.specialty} na equipe.`, isMe: p === 0, pattern: (index + p) % PATTERNS.length }
    })

    const services = kind.services.filter((_, s) => s === 0 || random() > 0.2)

    return {
      owner: { fullName: `${ownerFirst} ${ownerLast}`, email: `dono.${slug(name)}@example.com` },
      name,
      cnpjRoot: String(900_000_000_000 + index * 1_013).slice(0, 12),
      category: kind.category,
      autoConfirm: random() < 0.4,
      address: {
        street: 'Rua de Demonstração',
        streetNumber: String(100 + index * 10),
        district: bairro.name,
        city: 'Garça',
        state: 'SP',
        postalCode: '17400000',
      },
      location: { latitude: bairro.latitude + dLat, longitude: bairro.longitude + dLon },
      professionals,
      services: services.map((s) => ({ ...s })),
    }
  })
}

const BUSINESSES: DemoBusiness[] = [...ORIGINAL, ...generatedBusinesses()]

const CUSTOMER = { fullName: 'Ana Consumidora', email: 'consumidor@example.com', birthDate: '1995-05-10' }

/** Admin da plataforma de demonstração — credencial de teste do ambiente local, como as outras. */
const ADMIN = { fullName: 'Admin de Demonstração', email: 'admin@example.com' }

const today = new Date().toISOString().slice(0, 10)

/** Cadastra e entra. `null` se a conta já existia — o seed já rodou. */
async function registerAndLogin(fullName: string, email: string): Promise<string | null> {
  try {
    await call('POST', '/api/auth/register', { email, password: DEMO_PASSWORD, fullName })
  } catch (error) {
    if (error instanceof ApiCallError && error.code === 'user.email_already_registered') return null
    throw error
  }
  confirmEmail(email)
  const auth = await call<{ accessToken: string }>('POST', '/api/auth/login', { email, password: DEMO_PASSWORD })
  return auth.accessToken
}

async function seedBusiness(demo: DemoBusiness) {
  console.log(`• ${demo.name} (${demo.category}, ${demo.address.district})`)
  const userToken = await registerAndLogin(demo.owner.fullName, demo.owner.email)
  if (!userToken) {
    console.log('  já existe — pulando')
    return
  }

  let business: { id: string }
  try {
    business = await call<{ id: string }>(
      'POST',
      '/api/businesses',
      { name: demo.name, document: cnpjFrom(demo.cnpjRoot), category: demo.category },
      userToken,
    )
  } catch (error) {
    // Banco de um seed antigo (e-mails em exemplo.com): o CNPJ já está lá, com outro dono.
    if (error instanceof ApiCallError && error.code === 'business.document_already_registered') {
      console.log('  CNPJ já cadastrado por um seed anterior — pulando')
      return
    }
    throw error
  }

  // O token precisa carregar o estabelecimento ativo para as rotas `businesses/current` (ADR-004).
  const { accessToken: token } = await call<{ accessToken: string }>(
    'POST',
    '/api/users/me/context',
    { businessId: business.id },
    userToken,
  )

  await call('PUT', '/api/businesses/current/address', demo.address, token)
  await call('PUT', '/api/businesses/current/location', { ...demo.location, precision: 'Rooftop', source: 'seed-demo' }, token)
  await call(
    'PUT',
    '/api/businesses/current/scheduling-policy',
    {
      autoConfirm: demo.autoConfirm,
      pendingExpirationHours: 12,
      minLeadTimeHours: 2,
      bookingHorizonDays: 60,
      cancellationWindowHours: 24,
      timeZone: TIME_ZONE,
    },
    token,
  )

  const professionalIds: string[] = []
  for (const professional of demo.professionals) {
    const created = await call<{ id: string }>('POST', '/api/businesses/current/professionals', professional, token)
    professionalIds.push(created.id)

    // Sem consentimento, a vitrine mostra só o nome (ADR-004, invariante 4). Só o próprio
    // profissional consente — o dono não pode por outra pessoa —, então só vale para "sou eu".
    if (professional.isMe) {
      await call('PUT', `/api/businesses/current/professionals/${created.id}/public-profile-consent`, undefined, token)
      await call(
        'PUT',
        `/api/businesses/current/professionals/${created.id}`,
        { displayName: professional.displayName, specialty: professional.specialty, bio: professional.bio, isActive: true, showFullProfile: true },
        token,
      )
    }

    for (const { day, start, end } of PATTERNS[professional.pattern]!) {
      await call(
        'POST',
        '/api/businesses/current/work-schedules',
        { professionalId: created.id, dayOfWeek: day, startTime: start, endTime: end, effectiveFrom: daysFromToday(-70), effectiveTo: null },
        token,
      )
    }
  }

  for (const service of demo.services) {
    const created = await call<{ id: string }>(
      'POST',
      '/api/businesses/current/services',
      {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: service.bufferAfterMinutes ?? 0,
        slotStepMinutes: 15,
        suppliesNote: null,
        isActive: true,
      },
      token,
    )
    for (const professionalId of professionalIds) {
      await call(
        'PUT',
        `/api/businesses/current/services/${created.id}/professionals/${professionalId}`,
        { priceOverrideCents: null, durationOverrideMinutes: null },
        token,
      )
    }
  }

  await call('POST', '/api/businesses/current/submit', undefined, token)
  console.log('  criado e enviado para revisão')
}

/** A jornada vale desde antes do histórico, para os 60 dias de passado caírem dentro dela. */
function daysFromToday(days: number): string {
  const date = new Date(`${today}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function seedCustomer() {
  console.log(`• Consumidor ${CUSTOMER.email}`)
  const token = await registerAndLogin(CUSTOMER.fullName, CUSTOMER.email)
  if (!token) {
    console.log('  já existe — pulando')
    return
  }
  await call('POST', '/api/customers/me', { birthDate: CUSTOMER.birthDate, socialName: null }, token)
  console.log('  criado com perfil de consumidor')
}

// --- Banco local (docker compose) ---------------------------------------------------------------------

/** Roda SQL no container `db`. Só no banco local do Docker. */
function psql(sql: string, options: { quiet?: boolean } = {}): string {
  const result = Bun.spawnSync(
    ['docker', 'compose', 'exec', '-T', 'db', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -1 -tA -q -f -'],
    { stdin: Buffer.from(sql, 'utf8'), stdout: 'pipe', stderr: 'pipe' },
  )
  if (result.exitCode !== 0) {
    throw new Error(`Falha no SQL: ${result.stderr.toString().slice(0, 2000)}`)
  }
  const out = result.stdout.toString().trim()
  if (!options.quiet && result.stderr.length > 0) console.log(result.stderr.toString().trim())
  return out
}

const sqlText = (value: string | null | undefined) => (value == null ? 'NULL' : `'${value.replace(/'/g, "''")}'`)

/**
 * O papel de Admin da plataforma nunca é concedido por endpoint (ADR-020): só por SQL no banco. Esta é a única
 * escrita direta do seed fora do histórico, e só no banco local do Docker.
 */
function grantPlatformAdmin(email: string) {
  psql(`UPDATE identity."user" SET is_platform_admin = true WHERE email = ${sqlText(email)};`)
}

/**
 * O login exige e-mail confirmado (Onda 6A). As contas de demonstração usam domínio `example.com`, que não recebe
 * e-mail: o seed confirma por SQL, como faz com o Admin, e só no banco local do Docker.
 */
function confirmEmail(email: string) {
  psql(`UPDATE identity."user" SET email_confirmed_at = now() WHERE email = ${sqlText(email)} AND email_confirmed_at IS NULL;`)
}

/** O Admin de demonstração aprova pela API tudo o que estiver em análise. */
async function approvePendingBusinesses() {
  console.log(`• Admin ${ADMIN.email}`)
  await registerAndLogin(ADMIN.fullName, ADMIN.email)
  grantPlatformAdmin(ADMIN.email)

  // O token só carrega o papel depois de concedido: entra de novo.
  const { accessToken } = await call<{ accessToken: string }>('POST', '/api/auth/login', { email: ADMIN.email, password: DEMO_PASSWORD })

  const pending = await call<{ items: { id: string; name: string }[] }>(
    'GET',
    '/api/admin/businesses?status=PendingReview&pageSize=100',
    undefined,
    accessToken,
  )
  for (const business of pending.items) {
    await call('POST', `/api/admin/businesses/${business.id}/approve`, { note: 'Aprovado pelo seed de demonstração' }, accessToken)
  }
  console.log(pending.items.length === 0 ? '  nada em análise' : `  ${pending.items.length} aprovados`)
}

// --- Histórico (--historico) --------------------------------------------------------------------------

const HISTORY_MARKER = 'Histórico de demonstração'
const HISTORY_DAYS_BACK = 60
const FUTURE_DAYS = 14
const HISTORY_CUSTOMERS = 60

/** UUID v7: os 48 bits mais altos são o instante em ms (ADR-010, decisão 3). */
function uuidV7(random: () => number, at: number): string {
  const bytes = new Uint8Array(16)
  let ms = at
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256
    ms = Math.floor(ms / 256)
  }
  for (let i = 6; i < 16; i++) bytes[i] = Math.floor(random() * 256)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Instante UTC de uma hora de parede no fuso IANA — sem offset fixo, que quebra no horário de verão. */
function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const guess = new Date(`${date}T${time}Z`)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(guess)
      .map((p) => [p.type, p.value]),
  )
  const asIfUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!)
  return new Date(guess.getTime() - (asIfUtc - guess.getTime()))
}

/** Feriados nacionais (o mesmo critério de `BrazilianHolidays`): fechado, sem agendamento. */
function isNationalHoliday(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const fixed = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25']
  if (fixed.includes(date.slice(5))) return true
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const mm = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * mm + 114) / 31)
  const day = ((h + l - 7 * mm + 114) % 31) + 1
  const goodFriday = new Date(Date.UTC(y, month - 1, day - 2))
  return goodFriday.getUTCMonth() + 1 === m && goodFriday.getUTCDate() === d
}

type HistorySource = {
  businesses: { id: string; tz: string; category: string }[]
  offers: { business_id: string; professional_id: string; service_id: string; name: string; duration: number; buffer_before: number; buffer_after: number; price: number }[]
  schedules: { professional_id: string; day: number; start: string; end: string }[]
  demo_customer_hash: string | null
}

function seedHistory() {
  console.log('\n• Histórico (SQL direto, só banco local)')

  const already = Number(psql(`SELECT count(*) FROM scheduling.appointment WHERE customer_notes = ${sqlText(HISTORY_MARKER)};`))
  if (already > 0) {
    console.log(`  já existe (${already} agendamentos) — pulando`)
    return
  }

  const source = JSON.parse(
    psql(`
      WITH seeded AS (
        SELECT b.id, b.time_zone, b.category FROM tenancy.business b
        JOIN tenancy.business_membership m ON m.business_id = b.id AND m.role = 'Owner'
        JOIN identity."user" u ON u.id = m.user_id
        WHERE u.email LIKE 'dono.%@example.com' AND b.status = 'Active')
      SELECT json_build_object(
        'businesses', (SELECT coalesce(json_agg(json_build_object('id', id, 'tz', time_zone, 'category', category)), '[]') FROM seeded),
        'offers', (SELECT coalesce(json_agg(json_build_object(
            'business_id', s.business_id, 'professional_id', sp.professional_id, 'service_id', s.id, 'name', s.name,
            'duration', coalesce(sp.duration_override_minutes, s.duration_minutes),
            'buffer_before', s.buffer_before_minutes, 'buffer_after', s.buffer_after_minutes,
            'price', coalesce(sp.price_override_cents, s.price_cents))), '[]')
          FROM catalog.service s JOIN catalog.service_professional sp ON sp.service_id = s.id
          WHERE s.is_active AND s.business_id IN (SELECT id FROM seeded)),
        'schedules', (SELECT coalesce(json_agg(json_build_object(
            'professional_id', w.professional_id, 'day', w.day_of_week, 'start', w.start_time, 'end', w.end_time)), '[]')
          FROM availability.work_schedule w WHERE w.business_id IN (SELECT id FROM seeded) AND w.effective_to IS NULL),
        'demo_customer_hash', (SELECT password_hash FROM identity."user" WHERE email = ${sqlText(CUSTOMER.email)}));
    `),
  ) as HistorySource

  if (source.businesses.length === 0) throw new Error('Nenhum estabelecimento de demonstração ativo. Rode o seed sem --historico antes.')
  if (!source.demo_customer_hash) throw new Error(`A conta ${CUSTOMER.email} não existe. Rode o seed sem --historico antes.`)

  const random = seededRandom(1027)
  const now = Date.now()
  const lines: string[] = []

  // Consumidores fictícios do histórico: mesma senha de teste da conta de demonstração (o hash é copiado).
  const customers: { userId: string; customerId: string; name: string }[] = []
  const userRows: string[] = []
  const customerRows: string[] = []
  for (let i = 1; i <= HISTORY_CUSTOMERS; i++) {
    const name = `${pick(random, FIRST_NAMES)} ${pick(random, SURNAMES)}`
    const userId = uuidV7(random, now - 90 * 86_400_000 + i * 1000)
    const customerId = uuidV7(random, now - 90 * 86_400_000 + i * 1000 + 1)
    const birth = `${1960 + Math.floor(random() * 45)}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`
    customers.push({ userId, customerId, name })
    userRows.push(`('${userId}', ${sqlText(`consumidor.hist.${String(i).padStart(2, '0')}@example.com`)}, ${sqlText(source.demo_customer_hash)}, ${sqlText(name)}, 'Active', now())`)
    customerRows.push(`('${customerId}', '${userId}', '${birth}', now())`)
  }
  lines.push(`INSERT INTO identity."user" (id, email, password_hash, full_name, status, created_at) VALUES\n${userRows.join(',\n')};`)
  lines.push(`INSERT INTO people.customer (id, user_id, birth_date, created_at) VALUES\n${customerRows.join(',\n')};`)

  const appointmentRows: string[] = []
  const eventRows: string[] = []
  const iso = (ms: number) => `'${new Date(ms).toISOString()}'`
  const minute = 60_000

  const event = (businessId: string, appointmentId: string, from: string | null, to: string, actorId: string | null, role: string, at: number) => {
    eventRows.push(`('${uuidV7(random, at)}', '${businessId}', '${appointmentId}', ${sqlText(from)}, '${to}', ${actorId ? `'${actorId}'` : 'NULL'}, '${role}', ${iso(at)}, NULL)`)
  }

  for (const business of source.businesses) {
    const sensitive = business.category === 'Saude'
    const offersByProfessional = new Map<string, HistorySource['offers']>()
    for (const offer of source.offers.filter((o) => o.business_id === business.id)) {
      offersByProfessional.set(offer.professional_id, [...(offersByProfessional.get(offer.professional_id) ?? []), offer])
    }

    for (const [professionalId, offers] of offersByProfessional) {
      const windows = source.schedules.filter((s) => s.professional_id === professionalId)

      for (let offset = -HISTORY_DAYS_BACK; offset <= FUTURE_DAYS; offset++) {
        const date = daysFromToday(offset)
        if (isNationalHoliday(date)) continue
        const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
        // Passado mais cheio; futuro vai esvaziando — "parcialmente ocupado".
        const fill = offset < 0 ? 0.55 : Math.max(0.12, 0.5 - offset * 0.03)

        for (const window of windows.filter((w) => w.day === weekday)) {
          let cursor = zonedToUtc(date, window.start, business.tz).getTime()
          const windowEnd = zonedToUtc(date, window.end, business.tz).getTime()

          while (cursor < windowEnd) {
            const offer = pick(random, offers)
            const blockedStart = cursor
            const startsAt = blockedStart + offer.buffer_before * minute
            const endsAt = startsAt + offer.duration * minute
            const blockedEnd = endsAt + offer.buffer_after * minute

            if (blockedEnd > windowEnd) break
            if (random() > fill) {
              cursor += 30 * minute
              continue
            }

            const inPast = endsAt < now
            if (!inPast && startsAt < now + 3 * 60 * minute) {
              cursor = blockedEnd
              continue
            }

            const id = uuidV7(random, startsAt - 5 * 86_400_000)
            const atCounter = random() < 0.15
            const customer = atCounter ? null : pick(random, customers)
            const requestedAt = atCounter
              ? startsAt - Math.floor(1 + random() * 48) * 60 * minute
              : inPast
                ? startsAt - Math.floor(1 + random() * 10) * 86_400_000
                : Math.min(now - Math.floor(random() * 6) * 60 * minute, startsAt - 3 * 60 * minute)

            let status: string
            let confirmedAt: number | null = null
            let cancelledAt: number | null = null
            let completedAt: number | null = null
            let cancelledBy: string | null = null
            let reason: string | null = null
            let expiresAt: number | null = null
            const actor = customer?.userId ?? null

            if (atCounter) {
              confirmedAt = requestedAt
              event(business.id, id, null, 'Confirmed', null, 'Owner', requestedAt)
            } else {
              event(business.id, id, null, 'Pending', actor, 'Customer', requestedAt)
            }

            if (inPast) {
              const r = random()
              if (r < 0.76) status = 'Completed'
              else if (r < 0.88) status = 'Cancelled'
              else if (r < 0.96) status = 'NoShow'
              else if (r < 0.98 && !atCounter) status = 'Expired'
              else status = atCounter ? 'Completed' : 'Rejected'

              if (status === 'Expired') {
                cancelledBy = 'System'
                event(business.id, id, 'Pending', 'Expired', null, 'System', requestedAt + 12 * 60 * minute)
              } else if (status === 'Rejected') {
                reason = 'Horário indisponível'
                event(business.id, id, 'Pending', 'Rejected', null, 'Owner', requestedAt + 60 * minute)
              } else {
                if (!atCounter) {
                  confirmedAt = requestedAt + 30 * minute
                  event(business.id, id, 'Pending', 'Confirmed', null, 'Owner', confirmedAt)
                }
                if (status === 'Completed') {
                  completedAt = endsAt
                  event(business.id, id, 'Confirmed', 'Completed', null, 'Owner', endsAt)
                } else if (status === 'NoShow') {
                  event(business.id, id, 'Confirmed', 'NoShow', null, 'Owner', endsAt + 10 * minute)
                } else {
                  const byCustomer = !atCounter && random() < 0.7
                  cancelledBy = byCustomer ? 'Customer' : 'Business'
                  reason = byCustomer ? 'Imprevisto' : 'Profissional indisponível'
                  cancelledAt = startsAt - Math.floor(25 + random() * 48) * 60 * minute
                  event(business.id, id, 'Confirmed', 'Cancelled', byCustomer ? actor : null, byCustomer ? 'Customer' : 'Owner', cancelledAt)
                }
              }
            } else if (atCounter || random() < 0.65) {
              status = 'Confirmed'
              if (!atCounter) {
                confirmedAt = requestedAt + 30 * minute
                event(business.id, id, 'Pending', 'Confirmed', null, 'Owner', confirmedAt)
              }
            } else {
              status = 'Pending'
              expiresAt = Math.min(requestedAt + 12 * 60 * minute, startsAt - 2 * 60 * minute)
            }

            appointmentRows.push(
              `('${id}', '${business.id}', '${professionalId}', '${offer.service_id}', ${customer ? `'${customer.customerId}'` : 'NULL'}, ` +
                `${atCounter ? sqlText(`${pick(random, FIRST_NAMES)} ${pick(random, SURNAMES)}`) : 'NULL'}, NULL, ` +
                `${iso(startsAt)}, ${iso(endsAt)}, ${iso(blockedStart)}, ${iso(blockedEnd)}, ${sqlText(offer.name)}, ` +
                `${offer.duration}, ${offer.buffer_before}, ${offer.buffer_after}, ${offer.price}, ${sensitive}, '${status}', ` +
                `'${atCounter ? 'Counter' : 'Online'}', ${sqlText(HISTORY_MARKER)}, NULL, ${iso(requestedAt)}, ` +
                `${confirmedAt ? iso(confirmedAt) : 'NULL'}, ${cancelledAt ? iso(cancelledAt) : 'NULL'}, ${completedAt ? iso(completedAt) : 'NULL'}, ` +
                `${sqlText(cancelledBy)}, ${sqlText(reason)}, ${expiresAt ? iso(expiresAt) : 'NULL'}, NULL, ${iso(requestedAt)})`,
            )

            cursor = blockedEnd
          }
        }
      }
    }
  }

  const columns =
    'id, business_id, professional_id, service_id, customer_id, walk_in_name, walk_in_phone, starts_at, ends_at, ' +
    'blocked_starts_at, blocked_ends_at, service_name_snapshot, duration_minutes, buffer_before_minutes, buffer_after_minutes, ' +
    'price_cents, is_sensitive, status, source, customer_notes, business_notes, requested_at, confirmed_at, cancelled_at, ' +
    'completed_at, cancelled_by, cancellation_reason, expires_at, idempotency_key, created_at'
  for (let i = 0; i < appointmentRows.length; i += 500) {
    lines.push(`INSERT INTO scheduling.appointment (${columns}) VALUES\n${appointmentRows.slice(i, i + 500).join(',\n')};`)
  }
  for (let i = 0; i < eventRows.length; i += 1000) {
    lines.push(
      `INSERT INTO scheduling.appointment_event (id, business_id, appointment_id, from_status, to_status, actor_user_id, actor_role, occurred_at, note) VALUES\n${eventRows.slice(i, i + 1000).join(',\n')};`,
    )
  }

  // Uma transação só (-1): ou o histórico inteiro entra, ou nada entra.
  psql(lines.join('\n'))
  console.log(`  ${HISTORY_CUSTOMERS} consumidores, ${appointmentRows.length} agendamentos, ${eventRows.length} eventos`)
}

function printCounts() {
  const counts = psql(`
    SELECT 'tenancy.business', count(*) FROM tenancy.business
    UNION ALL SELECT 'tenancy.business_membership', count(*) FROM tenancy.business_membership
    UNION ALL SELECT 'identity.user', count(*) FROM identity."user"
    UNION ALL SELECT 'people.customer', count(*) FROM people.customer
    UNION ALL SELECT 'people.professional', count(*) FROM people.professional
    UNION ALL SELECT 'catalog.service', count(*) FROM catalog.service
    UNION ALL SELECT 'catalog.service_professional', count(*) FROM catalog.service_professional
    UNION ALL SELECT 'availability.work_schedule', count(*) FROM availability.work_schedule
    UNION ALL SELECT 'scheduling.appointment', count(*) FROM scheduling.appointment
    UNION ALL SELECT 'scheduling.appointment_event', count(*) FROM scheduling.appointment_event;
    SELECT 'appointment ' || status, count(*) FROM scheduling.appointment GROUP BY status ORDER BY 1;
    SELECT 'business ' || category || ' ' || status, count(*) FROM tenancy.business GROUP BY category, status ORDER BY 1;
  `)
  console.log('\nRegistros no banco:')
  for (const line of counts.split('\n')) {
    const [table, count] = line.split('|')
    console.log(`  ${table!.padEnd(34)} ${count}`)
  }
}

async function main() {
  console.log(`Populando ${API} com dados de demonstração${WITH_HISTORY ? ' (com histórico)' : ''}\n`)
  await call('GET', '/health').catch(() => {
    throw new Error(`A API não respondeu em ${API}. Rode "docker compose up" antes.`)
  })

  for (const business of BUSINESSES) {
    await seedBusiness(business)
  }
  await seedCustomer()
  await approvePendingBusinesses()

  if (WITH_HISTORY) seedHistory()
  printCounts()

  console.log(`\nPronto. Contas de demonstração (senha: ${DEMO_PASSWORD}):`)
  console.log(`  consumidor   ${CUSTOMER.email}`)
  console.log(`  admin        ${ADMIN.email}`)
  console.log(`  donos        dono.<estabelecimento>@example.com — ${BUSINESSES.length} estabelecimentos, por exemplo ${BUSINESSES[0]!.owner.email}`)
}

main().catch((error) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
