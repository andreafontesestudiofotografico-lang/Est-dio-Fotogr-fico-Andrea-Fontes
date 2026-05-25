# Planejamento Técnico - Fase 3: Serverless & Enterprise Operations

Este documento detalha o desenho arquitetural seguro, modular e financeiramente sustentável para implementar a Fase 3 da Galeria V2. Esta etapa consolidará a migração das responsabilidades de confiança e segurança pesada para o ambiente Backend (Serverless e Workers).

---

## 1. Topologia Serverless & Infraestrutura Base

A arquitetura baseará a lógica de negócios na Nuvem (Backend), utilizando Firebase Cloud Functions ou Google Cloud Run (event-driven). A escolha dependerá do tempo estimado de execução de cada tarefa:

- **APIs de Validação Rápidas (Triggers, Autenticação, Webhooks):** Firebase Cloud Functions (Gen 2). Tempo de inicialização rápido, escalonamento automático e custo baseado em milissegundos.
- **Processamento Pesado Assíncrono (ZIP Creation / Resizing Batch):** Cloud Run Jobs ou Cloud Functions com alocação customizada (maior CPU/RAM) e timeouts extensos (ex: até 60 minutos), acionados via filas.

**Premissa Multi-Tenant Inicial:** 
Para preparar a escalabilidade B2B futura (vários estúdios), todas as entidades (`bookings`, `galleries`, `packages`) conterão uma referência obrigatória `tenantId`. O Firebase Security Rules e o backend usarão esse atributo para manter um isolamento (Sandboxing) dos dados, impedindo cruzamento.

---

## 2. Endpoints Críticos (A Fonte da Verdade)

O Frontend passará a atuar apenas como cliente/consumidor desses serviços para as funções de segurança e dinheiro.

### A. Validação de Cobrança (Extras)
- **Endpoint:** `POST /api/checkout/validate`
- **Fluxo:** 
  1. Frontend submete: `{ bookingId: 'xyz' }` (somente os identificadores, sem preços).
  2. Serverless recupera as *Selections* do BD e o *Package Limit*.
  3. Serverless quantifica (Total Selecionado - Permitido) e mapeia contra o Catálogo Seguro de Preços do fotógrafo.
  4. Serverless retorna o *Payload Re-hidratado* com o valor total a pagar e o link criptografado do Checkout Externo. (Zero manipulação da UI).

### B. Gestão Segura de Arquivos (Signed URLs)
- **Endpoint:** `GET /api/delivery/signed-link`
- **Fluxo:** 
  1. Frontend requisita download em alta da galeria logada.
  2. Server verifica se galeria está `PAID` ou não contém extras bloqueantes.
  3. Gera um *Signed URL* via permissão de Service Account com vida útil de (ex: 2 a 4 horas).
  4. Retorna a URL efêmera ao Front para download seguro. Protege links vazados/persistentes e restringe Egress fraudulento.

---

## 3. Estratégia de Workers, Filas & ZIP Strategy

A geração de um ZIP contendo 50+ fotos em RAW ou Alta Resolução é o tipo de processamento "CPU e I/O Bound" que nunca pode ficar em tempo real na rota principal da API, pois causa timeout (`Gateway Timeout 504`).

1. **Invocação (Cloud Tasks / PubSub):** A função `/api/delivery/request` enfileira um evento na Cloud Task: `{ action: "GENERATE_ZIP", target: "bookingId_XYZ" }` e devolve um simples `202 Accepted` ao front.
2. **Asynchronous Stream-Zip (O Worker):**
   - O Worker não baixa 10GB de fotos originais na memória RAM do container.
   - Instancia instâncias de Node com *Streaming*: `Storage ReadStream` conectado diretamente à biblioteca de empacotamento ZIP (`archiver`), a qual faz o pipe final direto em `Storage WriteStream` na pasta `/final/`.
   - Evita *Out-of-Memory (OOM)*. Memória constante.
3. **Mecanismo de Retorno (Firestore Document):**
   - Worker atualiza um subdocumento de `jobs`: `status: "COMPLETED", zipUrl: "gs://...zip"`.
   - Snapshot Listener no Frontend reage a essa mudança e dispara confetes + Botão de Download na tela.

---

## 4. Custom Claims & Role-based Access (RBAC)

Para evitar as custosas chamadas redundantes `isGalleryOwner()` nas Security Rules (que abusam de limites do Firestore):
- Um Trigger `onCreate` ao gerarmos um Estúdio (Admin) injeta no Firebase Auth Token dele: `{ admin: true, tenantId: "studio_alpha" }`.
- Nas Security Rules do Firestore, a consulta cai drasticamente a `request.auth.token.admin == true`, o que custa quase "zero" ao banco, sem precisar cruzar coleções. Modos granulares (Viewers/Editors) também residirão aqui.

---

## 5. Idempotência Financeira

Problema comum: Webhooks de pagamento chegam duplicados da operadora, podendo atualizar faturas duas vezes.
- **Implementação "Anti-Replay":** A Cloud Function armazenará IDs de Transação num doc auxiliar `transactions/{tx_id}`. A inserção sempre ocorre usando `setDoc` ou Transaction DB com verificação (`if exists -> return 200 OK without executing`). Firebase lidará com a concorrência bloqueando replays.

---

## 6. Observabilidade & Telemetria 

- Implementar logs estruturados (em JSON) utilizando o Stackdriver/Cloud Logging desde o dia 1 do Serverless (`severity: INFO/ERROR`).
- **Casos de Alertas P1 (Paging):**
   - Taxa de Erro acima de 1% em `/api/checkout`. 
   - Timeouts ou OOM nos Workers de ZIP.
- Mapeamento transacional (Audit Logging) indicando "*Admin A alterou a data base da Galeria Y*". Fundamental para proteger SLA (Nível de Acordo Mútuo) do cliente em modelos B2B Enterprise.
