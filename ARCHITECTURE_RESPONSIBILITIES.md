# Constituição Técnica da Plataforma - Galeria V2

Este documento estabelece a divisão oficial de responsabilidades, arquitetura, escalabilidade e roadmap da plataforma. Ele serve como a diretriz fundamental para todas as futuras implementações e refatorações (Fase 3 em diante).

---

## 1. O que permanece PERMANENTEMENTE Client-Side

A seguinte lista de responsabilidades deve ser mantida *estritamente* no client-side (navegador do usuário). O motivo operacional e econômico é simples: transferir o custo computacional (CPU/RAM) e o tempo de processamento ocioso para a máquina do usuário final de forma distribuída e gratuita.

- **Virtualização de Listas e Grids:** Cálculo de posição de milhares de imagens. O backend enviará apenas metadados ou ponteiros de paginação; o cliente renderiza `viewports` fixos dinâmicos.
- **Lightbox, Visualizações e Swipe Gestures:** Tratamento de eventos de `touch`, `scroll` veloz, pinch-to-zoom e transições animadas.
- **Seleção Visual e Optimistic UI:** Ao clicar numa foto, a UI deve mostrar o *check* imediatamente, mesmo antes da confirmação de rede, provendo a melhor UX sem engasgos por latência.
- **Cache Local de Recursos Visuais:** Manuseio de LRU cache local, reaproveitamento de Object URLs pre-validadas via blobs para evitar refetched data ou requisições desnecessárias aos subdomínios do Firebase (Economiza Egress da nuvem).
- **Processamento/Compressão de Upload Base (Web Workers):** Cortar ou redimensionar imagens para resoluções de "preview" ANTES do upload inicial economiza Storage space temporário e gigantesca latência na subida das fotos pesadas.
- **Paginação Visual Infinita:** Controle do cursor do grid `startAfter`.

---

## 2. O que DEVE migrar obrigatoriamente para Backend

Tudo que envolve *Trust* (Verdade absoluta de negócio), Processamento Intensivo Centralizado, e *Billing/Auditoria* será gradualmente isolado no back-end.

- **Processamento de Grandes Formatos (Geração de ZIPs de Originais):** Executar no Front-End trava navegadores (limites de RAM do celular/notebook) e pode gerar conexões zumbis interrompidas pela nuvem. Task em background tira o estresse da página, empacota milhares de MBytes num Node.js server/Cloud Run de alta memória e gera link definitivo.
- **Validação de Preços (Extras) e Checkouts:** Um cliente malicioso sempre pode injetar payloads mockando valores no client. A "Verdade" de que uma foto extra custa $10 deve vir estritamente de banco para a Payment Gateway, atestada por backend.
- **Webhooks e Confirmação de Entregas (Eventos Idempotentes):** Confirmações e transiçoes dependentes de APIs de pagamentos.
- **Auditoria de Sistemas (Security Logs):** Logs que salvam informações sensíveis (deleções) sem depender de que o navegador decida enviá-las voluntariamente.
- **Signed URLs Efêmeras e Autorização Estrita de Downloads:** Geração protegida para a sub-pasta `final/` original.

**Por que não manter no Frontend:** Custo imenso em possíveis perdas financeiras (Price Spoof), instabilidade massiva em OOM (Out-of-memory) de navegadores zippando GBs locais e falta de irrevogabilidade (se o cliente não tem link com Signed URL por tempo limitado, o HD pode vazar e dar prejuízo contínuo de Bandwidth/LGPD).

---

## 3. Linha Oficial de Escalabilidade

- **Limite Seguro da Arquitetura Atual (Client/Firebase direta):** Suportamos confortavelmente 5.000 clientes anuais / dezenas de sessões pesadas simultâneas sem perdas (com a virtualização introduzida). 
- **Ponto de Inflexão (Cloud Functions Obrigatória):** No instante em que os pacotes começarem a ser cobrados com "Gateway de Cartão de Crédito" ou a "Geração de ZIP Final" para os Fotógrafos for massiva e gerar falha pro cliente comum no PC dele (~Mais de 5GB de fotos na transação ou >200 uploads complexos).
- **CDN (Edge Cache) mandatória:** Assim que as marca d'águas de fotos "preview" ultrapassarem a faixa de Tb/mês transferidos, pois a conta do Firebase Egress se tornará o imposto mais oneroso.
- **Firestore Bottlenecks:** Quando os documentos únicos com contadores e array writers (ex: arrays gigantes de seleção) atingirem as margens de TPS simultânea do Google. Deveremos desmembrar os grids visuais e fazer Sharding/Sub-coleções ou batch server-side.

---

## 4. Política Oficial de Segurança

1. **Modelagem de Acesso (Zero Trust Backend):** Nenhum client é dono de métricas vitais ou valores. O Firebase Database Rules deve garantir que "status financeiros e limites contratuais" sejam chaves restritas apenas a *Server Admins*.
2. **Roles & Custom Claims JWT:** O nível de acesso futuro será baseado no token (`"role": "photographer"`), não no `uid` batendo toda hora no DB via fan-out em Rule, o que destrói a cota de leitura.
3. **App Check:** Implantação futura do Firebase App Check bloqueia bots diretos não provenientes dos hosts da Vercel ou G.Cloud validadas (impede scraping do grid via terminal Python).
4. **Lifecycle Rule Estrita:** `original/` deve cair no Coldline ou sumir depois de 90 dias, por regra automatizada.
5. **Autenticação Pura e Signed URLs:** Download do alta qualidade NUNCA será via referência Firebase Client SDK. Sempre gerado num link encriptado com vida máxima (ex: 2h).

---

## 5. Estratégia Oficial de Custos

A prioridade é a sobrevivência e margem saudável do SaaS/Estúdio:

- **O que gasta mais:** Transferência de Arquivos Brutos e Egress de Imagens HD do Storage para clientes no final da ponta. 
- **O que está Otimizado:** Processamento de Grid e Frontend Hosting. Custo praticamente Zero. Uso do Firestore (Writes) após as otimizações e virtualizações diminuiu para a base gratuita razoável.
- **Risco Primário Atual:** Falta de LifeCycle Policy (O fotógrafo esquece galleries preenchidas com 15GBs eternamente no Bucket caro de linha de frente "Standard"). Adotaremos Coldline em 60-90 dias mandatório.
- **O segredo de Preço:** Transferir parte operacional brutal para Caching/Edge e evitar a retenção infinita do arquivo "original". As miniaturas são baratas, os RAWs são caros.

---

## 6. Dívida Técnica Aceita

Estamos perdoando conscientemente, por agora:
1. **Compressão/Upload no Front:** Confiar no Browser local para reduzir as imagens. É propenso a pequenas inconsistências dependendo se for Safari/Chrome, mas o custo para transpor isso a um Cluster de Edição agora invalidaria o fluxo MVP acelerado ($ Cost / Speed to Market).
2. **Security Rules com `get()` / Fan-Out:** Apesar de alertado como lento nas queries cruzadas (`isGalleryOwner()`), continuará rodando para a escala de base até inserirmos os `Custom Claims` no Server.
3. **Optimistic Updates Totais e Revert States complexos:** Confiar cegamente no front num *toggle* de "Seleção". Se rolar des-sincronia pesada com offline mode sem worker background, ele recarrega a página.

---

## 7. Roadmap REAL da Plataforma

A cadência rigorosa:

### 1. Automação Crítica e Monetização (Urgente e Escalabilidade)
- Refatoração do fluxo de "Checkout e Fotos Extras" validado em Backend Node / Cloud Functions (Source of Truth Financeira).
- Endpoint assíncrono para Geração Segura do ZIP para o cliente (do `original/` para mem/stream para zip final).
- Integração rígida de Webhooks de Pagamento (Idempotency).

### 2. Segurança de Arquivos e Isolamento (Importante)
- Lifecycle Policies aplicadas à Nuvem GCP Storage (Cold storage de Inativos).
- Integração com Firebase App Check.
- Downloads via Signed URLs temporárias. 

### 3. Escalabilidade Operacional (Escalabilidade e Monetização)
- Controle via JWT Custom Claims para as roles (`Admin`/`Client`), expurgando queries aninhadas.
- Opção para CDN Edge cacheando Thumbnails se custo Egress explodir.
- Infra e workers para redimensionar fotos em backend (em vez do local-device).

### 4. Nível Enterprise (Enterprise & Nice-to-Have)
- Automação via AI (Seleção inteligente de Duplicadas).
- Tracing Dashboard Global com observabilidade sobre falhas invisíveis do usuário (Drop de upload, Falha no Checkout).
- Suporte nativo a múltiplos estúdios "Tenants" independentes e controle RBAC avançado por equipe.
