# Verificação final de 10/11/2026

Branch `feat/integracao-final`. Código testado: commit `71d3d62` (os commits seguintes só mudam documentos). Prova **local**: o
GitHub está com a cobrança bloqueada, então não houve CI nem PR. Navegador: Chrome do Windows, via Playwright, em pilha isolada
com banco novo (18 migrations aplicadas do zero) e o seed.

## Testes

| Suíte | Resultado |
|---|---|
| Arquitetura | 28 de 28 |
| Unitários | 419 de 419 |
| Integração (Docker) | 171 de 171 |
| Frontend (vitest) | 664 de 664, em 84 arquivos |
| `dotnet format`, typecheck, Prettier | limpos |
| Lint | sem erro; 2 avisos que já existiam |
| Build do frontend | ok (o build da imagem `web` rodou `bun run build`) |

## Fluxos novos, de ponta a ponta no navegador: 34 de 34

- **Cadastro de estabelecimento sem conta prévia:** "Tenho um negócio" → página → "Sua conta" → "Confira seu e-mail" (com a frase de
  continuação) → login recusado sem confirmar → link do e-mail → "Entrar" → volta ao assistente no passo "Negócio" → Documento →
  Endereço (erros por campo, CEP incompleto, "Buscar CEP", cursor no número) → localização da Fatec em **ponto exato** → Revisão.
- **Convite para quem já tem conta sem confirmação:** login recusado (abrir o convite não confirma o e-mail) → destino guardado →
  confirmação → login volta ao convite → aceite → perfil com a especialidade "Barbeira".

## Auditoria (390 e 1280 px, claro e escuro)

- Roteiro genérico: 334 medições em 45 telas (180 no estado inicial, 154 com sobreposição aberta). **0 falhas.**
- Fluxos acima: 60 medições. **0 falhas.**
- Sobreposições dirigidas: 38 medidas (convite com papel Profissional e enviado vazio, convite de Atendente, "Eu também atendo",
  editar e remover da equipe, recorte de foto, detalhe do agendamento do Dono e do Atendente, seletor de localização, menu da
  conta). **0 falhas.** Sem abridor: a conta do painel em 390 px (no celular ela fica em "Mais").
- Controle negativo: um botão de 20 px posto de propósito dentro da gaveta foi reprovado.
- Capturas fora do repositório (pasta temporária do scratchpad: `shots\audit-final`, `audit-final3`, `audit-journey`).

## Não verificado

- Contraste de cor no tema escuro (a auditoria mede rolagem, alvos e texto cortado, não contraste).
- Detalhe do agendamento do Dono em 1280 px aberto pela grade só foi coberto pela busca por horário; o resto, pela lista.
- Celular real (toque, teclado do sistema); Parte 6 (Figma): link em branco, não feita.
- Migrations `AddServiceShowPhotoInShowcase` e `AddInvitationSpecialty`: **NÃO APLICADAS** no ambiente do Arthur.
