# Plano de Homologação Real e QA - Galeria V2

Este plano define os procedimentos de teste prático para validar a estabilidade, UX, consumo de memória e segurança da arquitetura Client-Side atual, antes de iniciarmos o acoplamento do backend da Fase 3.

---

## 1. Checklist Completo de QA Manual (Caminho Feliz)

### A. Upload e Administração (Fotógrafo)
- [ ] **Upload Base:** Selecionar 50 imagens RAW/JPEG em alta.
- [ ] **Compressão Local:** Observar se o browser não congela durante a leitura (`canvas`/`Web Worker` flow).
- [ ] **Concorrência:** Verificar se o sistema envia as imagens em pequenos blocos (lotes) ou se afoga o network.
- [ ] **Miniaturas vs Original:** Confirmar no painel do Firebase Storage que as imagens subiram nas pastas corretas (`original/` e `watermark/`).

### B. Navegação Cliente (Client-Side)
- [ ] **Acesso Protegido:** Cliente faz login via CPF/Email e vê apenas sua própria galeria.
- [ ] **Carregamento Virtualizado:** Acessar galeria com 50+ fotos. O DOM deve conter apenas as fotos visíveis no monitor.
- [ ] **Seleção (Optimistic UI):** Clicar rapidamente em 5 fotos. O botão de *Check* deve acender imediatamente, sem delay de rede.
- [ ] **Persistência:** Fechar a aba, reabrir e verificar se as 5 fotos continuam selecionadas.

---

## 2. Cenários Extremos de Teste (Stress Test)

Estes cenários buscam o limite do Frontend (Browser) e estabilidade de estado:

- [ ] **Carga Massiva (500+ fotos):** Fazer upload de 500 fotos. Testar velocidade do *scroll rápido* (flick) do topo ao final da página no celular. O Virtualizer **não deve** exibir tela branca prolongada nem quebrar a barra de rolagem.
- [ ] **Swipe Flood (Lightbox):** Abrir uma foto e fazer o gesto de swipe (próxima foto) dezenas de vezes rapidamente. O *debounce/throttle* deve segurar e impedir pulos de índice.
- [ ] **Teste de Múltiplas Abas (Concorrência):** Abrir a mesma galeria em duas abas. Selecionar uma foto na Aba 1 e verificar se o `onSnapshot` atualiza instantaneamente na Aba 2.
- [ ] **Comportamento Intermitente (Offline Mode):** Desligar o Wi-Fi. Clicar em 3 fotos (devem aparentar selecionadas). Ligar o Wi-Fi. O Firebase deve sincronizar em background automaticamente, sem perda de estado.

---

## 3. Checklist de Compatibilidade Mobile (iOS/Safari & Android)

- [ ] **Overscroll/Bounce do iOS:** Tentar arrastar o Lightbox visual para cima ou para baixo (eixos Y). A tela do fundo (body) NÃO pode "pular" nem revelar o fundo cinza do Safari.
- [ ] **Safe-Area (Notch/Bottom Bar):** Validar se a interface da *Sticky Bar* ou *Lightbox Controls* não é sobreposta pelos controles nativos do Safari ou teclados.
- [ ] **Memória RAM no Mobile (Crash Test):** Em um iPhone/Android antigo (com pouca RAM), abrir galeria de 500 fotos, entrar no Lightbox, avançar 100 fotos e voltar ao grid. O Safari não deve recarregar a tab forçadamente (*"A webpage was reloaded because it was using significant memory"*).

---

## 4. Checklist de Segurança (Auditoria de Firebase Rules)

- [ ] **Testando Isolamento:** Usar Auth de Cliente "A" para tentar acessar ID da Galeria do Cliente "B" injetando URL (esperado: Tela Vazia / Access Denied).
- [ ] **Bloqueio de Original (Crítico):** Copiar o caminho de um arquivo da pasta `original/...` no Storage. Autenticado como cliente, usar `fetch()` no DevTools para requisitar a imagem. (Esperado: 403 Forbidden).
- [ ] **Prevenção de Flood (Firestore):** Tentar rodar um *loop* JS no DevTools de cliente para selecionar/desmarcar a mesma foto 1.000 vezes em 1 segundo. Avaliar o comportamento de Rate Limiting nativo e verificar consumo no painel Firebase.

---

## 5. Estratégia de Rollback

**Caso o Virtualizer, Lightbox ou Cache LRU demonstrem instabilidade massiva em produção:**
1. **Fallback via Feature Flag:** No código cliente (`src/components/client/ClientGallery.tsx`), podemos injetar via Firebase Remote Config ou simples constante `.env` `VITE_USE_GALLERY_V2=false`.
2. **Reversão View:** A flag acionada trocará o retorno para renderizar a `Gallery V1 (Legado)`.
3. **Isolamento de Estado:** A V1 usa a mesma modelagem de array/booleans, garantindo que o status selecionado não é perdido no Downgrade da UI.

---

## 6. Observabilidade e Logs (Para Validação Real)

Para a homologação ser efetiva, verifique os Console Logs e o Monitor nativo do Google Cloud:
- [ ] **Monitor de Writes:** Avaliar no Firebase Console quantas *Leituras/Escritas* ocorrem quando 1 cliente visualiza e escolhe 20 fotos (deve estar em dezenas, não milhares).
- [ ] **Canvas Rendering Errors:** Verificar no DevTools se o upload printa erros de `Canvas Tainted` ou bloqueios de Memória durante compressão em lote.
- [ ] **Vazamento de Object URLs:** Abrir os *Memory Profiles* do Chrome e procurar por Strings de `blob:...`. O número não deve crescer infinitamente após abrir/fechar o Lightbox 50 vezes (limpeza efetiva).

---

## 7. Instruções sugeridas de Execução

- **Use Dispositivos Físicos:** Evite testar Mobile apenas usando o modo "Responsivo" do Chrome. Ele não simula o limite de RAM nem o *scroll rubber-band* do Safari.
- **Teste de Operadora:** Teste num plano de dados 3G/4G ruim (velocidade reduzida ou alta latência) para validar a fluidez da UI Otimista de seleção.
- **Monitoramento de Custos (Firestore):** Logo após fazer os stress tests de seleções rápidas, avalie a aba *Uso* do Firestore no GCP. O volume de *Writes* dará o balizador de quantos clientes suportaremos.
