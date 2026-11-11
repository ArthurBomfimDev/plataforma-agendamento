# Seed de demonstração

> ### ⚠️ Nada disto é evidência para o TCC
> Todo dado criado por `scripts/seed-demo.ts` é **fictício**: estabelecimentos, pessoas, CNPJs (válidos só pelo
> dígito verificador), endereços, agendamentos, avaliações, fotos e folgas. Os e-mails usam o domínio reservado
> `example.com`. Nenhum número, avaliação ou "uso" desta demonstração pode ser citado como resultado de teste com
> usuários, métrica de adoção ou validação de hipótese. A evidência do TCC vem de `docs/tcc/evidencias/`, medida
> sobre o sistema, e nunca do volume que o seed fabrica.

## O que a demonstração mostra

| Área | Conteúdo |
|---|---|
| Estabelecimentos | 30 ativos (26 de Beleza, 4 de Saúde) e 1 de Saúde **em análise** para o Admin aprovar ao vivo |
| Equipe | Owner, Attendant e Professional (o do Estúdio Duartina tem conta, atendente e dois convites pendentes) |
| Serviços | Preço em centavos, duração e intervalo |
| Jornada e folgas | 4 padrões de jornada (um com pausa de almoço); folga de um dia e férias de uma semana, sempre depois dos próximos 14 dias |
| Agendamentos | Futuros, concluídos, cancelados, faltas, expirados e recusados (`--passado`) |
| Avaliações | Ligadas a atendimento concluído, em 3 estabelecimentos de Beleza e 1 de Saúde (sem o nome do serviço) |
| Fotos | Logotipo em todos, capa em dois de cada três, fotos de serviços e de profissionais |
| Vitrine | "Mostrar foto na vitrine" ligado em metade dos serviços com foto e desligado na outra metade |
| Saúde | O consumidor concede o consentimento específico (LGPD Art. 11) e marca uma consulta |

As decisões de quem recebe foto, vitrine e folga estão em `scripts/seed-demo/plan.ts`, em funções puras, para a
demonstração sair igual a cada execução.

## Como rodar

Com a pilha de pé (`docker compose up`):

```bash
bun scripts/seed-demo.ts --passado
```

Sem `--passado` o seed faz tudo pela API e grava, por SQL, só os atendimentos concluídos que sustentam as avaliações
(ver abaixo); a agenda de hoje e de amanhã sai pela API. Com `--passado`, entram também os 60 dias de histórico.
`--historico` continua valendo como sinônimo.

**Senhas, só por variável de ambiente.** `SEED_PASSWORD` vale para as contas de demonstração e `SEED_ADMIN_PASSWORD`
para o Admin. Nunca estão no código nem no log. Fora de Development, o seed se recusa a usar a senha padrão do
repositório (ela é pública).

## O passado não passa pela API (decisão registrada)

A API não deixa criar nem concluir um atendimento que já passou (`Appointment.Complete` exige `now >= EndsAt`) e a
avaliação exige atendimento concluído. Foram avaliadas três saídas, e o Arthur escolheu a **(c)**:

| Opção | Resultado |
|---|---|
| (a) caminho que já existe no domínio | Só serve para a agenda de hoje: a demonstração precisa de 60 dias de passado já prontos |
| (b) flag de configuração só na demo | Rejeitada: relógio ajustável dentro da API de produção, o mesmo relógio que expira JWT e refresh token |
| **(c) SQL direto, em passo explícito** | **Adotada**: nenhum código novo na API; roda só contra o Postgres do Docker local (`docker compose exec db psql`), com marcador em `customer_notes` e uma transação só |

O SQL fica em `seedHistory` e `seedReviews`, no próprio `seed-demo.ts`, em seção marcada. Eles só gravam o que a API
**recusaria** por causa do relógio.

## Idempotência

Rodar duas vezes não duplica nem quebra: conta existente é pulada; CNPJ já cadastrado é pulado; foto, vitrine e folga
só são enviadas se faltam (a folga pela marca `Demonstração: folga fictícia`); o consentimento só é concedido se não
há um vigente; a consulta de Saúde usa chave de idempotência fixa; o passado tem marcador. Para restaurar do zero, use
`docker compose down -v` e suba de novo (ver `publicacao-demo.md`).

## Fotos

Nada de imagem de terceiros e nada de hotlink. Sem arquivos, o seed **gera** imagens originais por código
(`scripts/seed-demo/png.ts`: degradê de cor estável por nome, mais iniciais ou silhueta, 512 × 512). Para usar as
suas, ponha os arquivos em `scripts/seed-assets/` (ver o `README.md` de lá). O envio é o mesmo da interface: `PUT`
multipart, campo `file`, quadrado como o recorte da tela entrega, e a API gera os três tamanhos. O limite de 20 envios
por hora vale por dono e é respeitado porque o seed só envia o que falta.

## Testes

```bash
bun test scripts/seed-demo
```

Cobre o gerador de PNG (assinatura, CRC, dimensões, determinismo, limite de 5 MB), a escolha entre arquivo e imagem
gerada, o plano de fotos, vitrine e folgas, e as datas. **Não** cobre o seed contra a API real: isso exige a pilha de pé
e está em `docs/verificacao-pendente.md`.
