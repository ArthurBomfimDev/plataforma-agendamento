# Objetivo

<!-- O que este PR entrega, em uma ou duas frases, do ponto de vista de quem usa. -->

**Issue:** Closes #

**Módulo:** <!-- Identity · Tenancy · People · Catalog · Availability · Scheduling · Reputation · Compliance · Frontend · Infra · Docs -->

---

## Mudanças

<!-- O que mudou de fato. Liste por arquivo ou por comportamento, não por commit. -->

-

## Decisões tomadas

<!-- Escolhas de implementação que outra pessoa questionaria. Se houve decisão
     arquitetural, ela precisa de ADR — marque o checklist abaixo. -->

-

## Testes

<!-- O que foi testado e como. Cole a saída relevante, não descreva de memória. -->

- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testado manualmente em **390px** (mobile) e desktop
- [ ] `dotnet format --verify-no-changes` limpo
- [ ] `npm run lint` e `npm run typecheck` limpos

```
<!-- saída dos testes -->
```

## Riscos

<!-- O que pode quebrar. "Nenhum" é uma resposta válida, mas pense antes. -->

-

## Breaking changes

<!-- Contrato de API alterado? Migration destrutiva? Token de design renomeado?
     Se sim, descreva o impacto e o que a outra frente precisa fazer. -->

- [ ] Não há
- [ ] Há — descrito acima e comunicado à outra frente

## Evidência para o TCC

<!-- Este PR gera evidência? Métrica de RNF, teste de concorrência, decisão registrada,
     resultado de usabilidade. Se sim, aponte onde foi registrada em docs/tcc/. -->

- [ ] Não se aplica
- [ ] Sim — registrada em `docs/tcc/`:

---

## ⚠️ Revisão humana obrigatória

Marque toda área que este PR toca. **Se qualquer caixa abaixo estiver marcada, o merge exige
revisão humana explícita — aprovação automática ou de IA não basta.**

- [ ] Autenticação
- [ ] Autorização / matriz de permissões
- [ ] Multi-tenancy — qualquer coisa que envolva `business_id`
- [ ] Dado de saúde / LGPD Art. 11 / consentimento
- [ ] Migration de banco
- [ ] Infraestrutura, CI/CD ou segredo
- [ ] Nenhuma das áreas acima

## Checklist final

- [ ] Segue o glossário canônico — **nenhuma ocorrência de "cliente" ou `Client`**
- [ ] Respeita as 6 regras de empacotamento (se tocou o frontend)
- [ ] Alvo de toque ≥ 44px em todo controle novo (se tocou o painel)
- [ ] Nenhum valor hardcoded onde existe token de design
- [ ] Nenhum segredo, `.env` ou credencial no diff
- [ ] Fronteira de módulo respeitada — `ArchitectureTests` passando
- [ ] ADR criado em `docs/decisions/` se houve decisão arquitetural
- [ ] `PROJECT-CONTEXT.md` atualizado se alguma decisão ou pendência mudou
- [ ] Documentação atualizada quando necessário
