# System Architecture Blueprint & Enterprise Readiness

Este documento traz o planejamento de arquitetura e evolução do backend, desenhando o roteiro da plataforma para a escalabilidade, segurança, retenção de dados e operação comercial de forma sustentável e escalável.

---

## 1. Arquitetura Server-Side Futura

A plataforma atingiu o limite de arquitetura *Serverless Client-Centric*. Para escalar com segurança e permitir cobranças automáticas e entregas massivas, o processamento pesado e a regra de negócio deverão migrar para o backend.

### **O que DEVE continuar Client-Side:**
- Renderização virtualizada de milhares de fotos
- Caching em memória via LRU das imagens com marca d'água
- Criptografia e compactação base do lado do fotógrafo para previews
- Optimistic UI (feedbacks instantâneos de clique, drag and drop, etc.)

### **O que PRECISA migrar para Backend:**
- **Pagamentos e Limites:** A validação se uma foto é "extra" ou não. O client não manda mais o payload de preço. O backend analisa o carrinho via *Cloud Function* / POST em endpoint.
- **Custom Claims & Regras de Acesso:** Substituir validações extensas em regras por Claims embutidas no JWT (`admin: true`, `client_for: [id1, id2]`), injetadas via um hook após criação da conta ou vínculo de email ao pacote.
- **Entregas (Signed URLs):** O client perde o acesso total via Firebase SDK ao storage e começa a usar `getSignedUrl()` validado por backend, expirando rapidamente para impossibilitar vazamento.

### **Workers / Queues / Cloud Functions Necessárias:**
- Trabalhos orientados a eventos via Servidor/Cloud Task:
  - **`onGalleryLock` (Criar Zip):** Gatilho que empilha uma Task apontando os IDs escolhidos, puxa as fotos `original/` isoladas, encapsula, compacta do lado da cloud em background, cospe na pasta `final/`, gera o Signed Link e envia email transacional. 
  - **`onPaymentSuccess` (Webhook Idempotente):** Gatilho da gateway de pagamento para marcar pacote como pago, ativando Task de entrega. As mensagens Pub/Sub garantirão a entrega uma única vez (idem potentes).
  - **`onImageUploaded` (Thumbnails):** Substituir compressores locais por um micro-serviço (Cloud Run / Functions) que gere marca d'água robusta e múltiplas resoluções, protegendo o código original na nuvem, assim que o arquivo RAW é depositado.

---

## 2. Estratégia de Storage Enterprise (Lifecycle & Retenção)

Com o uso intensivo de fotografia, o Storage evolui de um balde simples para uma topologia com **Storage Lifecycle Rules**:

### Ciclo de Vida:
- **`original/`:** Mantido em armazenamento Standard para velocidade por **60 dias**. Após aprovação e entrega com sucesso, migra automaticamente p/ a camada `Nearline/Coldline` para backup histórico a custo reduzido. Exclui-se da nuvem (Archive class fallback) em 2 anos ou mediante renovação de plano / arquivamento local (físico).
- **`watermark/preview/` e `thumbs/`:** Gerados pela API e mantidos com tempo de expiração curto (**60 a 90 dias**). Se a galeria não foi escolhida e expirou, um *CRON Job* deleta todos os thumbnails gerados para poupar cache de nuvem e *Bandwidth* morto.
- **`final/`:** Cópia limpa das fotos e arquivos *.ZIP*. Permanecem em acesso publico (com token via SignedURL) por tempo determinado em plano contratual estrito (ex: 30 dias para o download max).

### Projeção e Disaster Recovery:
- **100 Clientes (~15,000 Fotos RAW/Mês):** ~200GB/mês de arquivos ativos e 10GB de preview. Cost-effective via Storage convencional. 
- **1.000 Clientes:** ~2TB de *Standard*, a regra de transição imediata para `Coldline/Archive` reduz os custos em 60%. O disaster recovery pode ser um sync para bucket *Multi-region*.
- **10.000 Clientes:** ~20+ TB. Será estritamente necessário ter Cloud CDN operando nas bordas para as pastas `preview/` para minar drasticamente a tarifa de Ego (Net Egress), pois as solicitações simultâneas de galerias matariam o custo de Network.

---

## 3. Backend Security Blueprint

Para um SaaS estruturado, a confiança deve partir do topo:
- **Custom Claims:** Substitui reads custosas no login. Todo usuário porta os papéis (*Roles*): `Admin`, `Photographer`, `Client`. A *Firebase Security Rule* lerá estritamente: `request.auth.token.admin == true`.
- **Signed URLs para Downloads:** As seleções finalizadas gerarão URLs assinadas usando Service Accounts em background, com limite de tempo (ex: `1 hora de vida`), impedindo que URLs de HD Vazem na internet ou que o link direto se torne um *forever host*.
- **Rate Limiting Interno:** Endpoint que checa requests por minuto e bloqueia spams vindos de bots de scrap usando Cloud Armor (se usando balanceador com serverless) / Recaptcha Enterprise. 
- **Privilege Escalation:** Não faremos mais updates livres do client-side no nível do `book/uid`. Somente sub-coleções e propriedades mínimas com verificação de tamanho predeterminado. 

---

## 4. Escalabilidade Operacional (Limites & Red Flags)

- **A Fricção Atual (No-Backend):** Ao invés de dependermos de client SDK para update local do `lock` e da deleção/submissão mútua das arrays que gera um volume insano de *Firestore Writes*.
- **O Limite do Firestore:** Aproximando-se das 10.000 *writes/segundo* e nos limites de regras profundas de `get()` com fan-out. É momento de abandonar `get()` em rules.
- **Micro-serviços Isolados (Event-Driven):** Eventos como extrair Zips, Webhooks de Gateways de pagamentos demoram (até X min de timeout). Esses não devem ficar bloqueando o Express ou Function Base, usando um Worker de Fila.
- **Quando o CND vira obrigatório:** Quando passarmos de múltiplos clientes abrindo suas galerias 3 ou 4 vezes ao dia, o painel estourará Gbit de tráfego de leitura repetitiva nas imagens thumb. Uma camada CDN na frente aliviará 80% dessa repetição dos nós do Storage.

---

## 5. Arquitetura de Pagamentos Futuros

Para permitir up-sells de álbuns, quadros ou arquivos extras:

1. O Botão `Finalizar / Pagar` no Front invoca um server endpoint e NÃO uma alteração no doc. 
2. O Endpoint do Backend busca a tabela de preços do fotógrafo do BD e avalia:
   - Pacote dá direito a *25* arquivos reais; Cliente mandou *30*. (5 Arquivos avulsos * R$ 20). 
   - Backend envia ordem HTTP Secure para a Processor (MercadoPago / Stripe), devolve o link de checkout para a tela. Checkout está *desacoplado* e isolado num sistema blindado. 
3. **Webhook Callback Idempotente:** A Gateway sinaliza para a Cloud Function `/webhook/payment`. O UUID salva a chave de transação num registro de eventos (`processed: true`). Se a gateway der *retries*, a redundância para imediatamente. 
4. **Entrega Automática:** Na consagração do `SUCCESS`, o evento emite a Cloud Task *ZIP Delivery*.

---

## 6. Observabilidade e DevOps

Quando rodar com carga e falhas reais:
- **Auditoria de Ações (Admin):** O Backend escreverá log de deleções/alterações do Studio em um índice `audit_logs` que conta quem, qual IPv4 e que payload alterou tabelas financeiras para tracking de perdas. 
- **Tracing dos Fluxos Assíncronos:** Teremos OpenTelemetry ou ferramentas Cloud Trace logando "Zip Started -> Zip Uploaded -> Email Sent". Assim o estúdio não perguntará "Cadê o email do fulano?", ele checa no trace daquela task individual.
- **Monitoramento e Alertas:** Firebase Alerts integrados que notificam estouramento dos *Cloud Storage Egress Limits*; Function Error rate de geração de zips estourando OOM (Out Of Memory / Error 500), disparando *Pings Slack/Mail*.

---

## 7. Custos Reais: Uma Projeção Honesta

| Recurso / Camada | Volume Baixo (Start) | Volume Médio | Escala (+10k bookings) |
| --- | --- | --- | --- |
| **Db Firestore** | Gratuito | ~$15 - $50 (Writes) | ~$200 - $400/mês | 
| **Storage Bruto** | ~$1 - $2 | ~$50 - $150 (Necessita Coldline) | ~$500 - $1.2K+ (Múltiplos TBs) |
| **Network / Egress** | Gratuito | ~$20 - $80 (Download Tax) | ~$800+ (Sem CDN será esmagador) |
| **Cloud Functions** | Gratuito | ~$10 - $20 | ~$80 - $250 (Faturas Zip intensivas) | 
| **Estimativa Base** | **~$0 a $5 /mo** | **~$100 a $300 /mo** | **~$2.000 a $3.000 /mo** |

A otimização principal foca na migração rápida das sessões concluídas do *Bucket Standard* de $0.02+/GB para o *Archive* (frações de Cents por TB guardado no fundo). 

---

## 8. Enterprise Readiness Final

- **O Que já é Enterprise-Grade:** Autenticação por Magic Links/Sessões sem senha. Desacoplamento Client-Admin na UX. Proteção por RBAC nas Rules do original Storage. Performance Virtualizada e UI Escalável robusta, isolada por ID aleatório.
- **O Que é Status "Startup-Grade" (Nosso estado hj):** Pagamentos informais (Cobrança externa baseada na contagem "por favor"); Uploading feito puramente da máquina final pro storage usando poder passivo (Sem fila controlada estrita de compressão em backend, que é complexa - é aceitável na largada por poupar dinheiro do Servidor e ser prático).
- **O que será OBRIGATÓRIO refatorar amanhã:** A passagem final de estado (o `LOCK`, `SEND TO CLIENT`, `PROCESS PAYMENT`), terá que ser movida do `setDoc` para um `Cloud Function` seguro e invisível. Se houver integração com emissão financeira, NF-e etc, isso precisará sair urgentemente dos scripts client-side base.
