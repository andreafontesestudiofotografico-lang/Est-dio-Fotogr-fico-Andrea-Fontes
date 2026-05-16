# Arquitetura do Sistema - Andrea Fontes Estúdio

## Visão Geral
A plataforma é um SaaS (Software as a Service) focado em estúdios de fotografia premium, oferecendo uma experiência cinematográfica tanto no site público quanto nas áreas restritas (Admin e Cliente).

## Tecnologias
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend (BaaS):** Firebase (Auth, Firestore, Storage)
- **Hospedagem / Build:** Cloud Run (escalável)

## Coleções do Firestore
A estrutura de dados foi projetada para alto desempenho e segurança:

1. \`users\`: Perfis dos clientes autenticados.
2. \`admins\`: Lista de UIDs com privilégios administrativos.
3. \`bookings\`: Controle central dos agendamentos (CRM, pagamentos e status do ensaio).
   - *Relação:* Pertence a um \`clientId\`.
4. \`galleries\`: Espelho lógico do \`bookings\` para controle específico da fase de envio de fotos.
   - *Relação:* 1:1 com \`bookings\`.
5. \`galleries/{galleryId}/photos\`: Subcoleção com todas as fotos. 
   - Armazena URL do \`Storage\`, e permite controle de status individual (curtida, não curtida).

## Fluxo de Estado das Galerias (Booking Status)
A pipeline principal do ciclo de vida de um cliente segue as seguintes fases:
1. \`pending_payment\` - Aguardando Pagamento.
2. \`confirmed\` - Ensaio Agendado.
3. \`session_done\` - Ensaio Realizado.
4. \`in_selection\` - Fotos em Seleção (Cliente escolhe via app).
5. \`in_editing\` - Fotos em Edição.
6. \`ready\` - Galeria Liberada.
7. \`completed\` - Download Realizado/Disponível.
8. \`cancelled\` - Cancelado.

## Segurança
- **Firestore Rules:** Segue o padrão de *Attribute-Based Access Control* (ABAC). Todos os updates passam por validadores rigorosos (\`isValidBookingUpdate\`, \`isValidGallery\`, etc) e as leituras checam o \`clientId\` com o respectivo \`request.auth.uid\`.
- **Storage Rules:** Protege os arquivos em \`/galleries/{bookingId}/{fileName}\`, impedindo leitura pública e verificando através de \`firestore.get(...)\` se aquele download pertence ao \`request.auth.uid\` atual.
- O e-mail raiz \`andreafontesestudiofotografico@gmail.com\` está configurado estaticamente para auto-promoção de Admin com segurança nas rules.

## Integrações Futuras Preparadas
- **Pagamentos Automáticos (Mercado Pago / PIX):** O status \`pending_payment\` já está preparado para receber webhooks do MP, atualizar para \`confirmed\` e disparar eventos.
- **Armazenamento / ZIP:** Processamento de múltiplos UUIDs pelo backend ou client-side para montar o ZIP localmente de forma controlada.
- **Notificações:** Infraestrutura base compatível com Cloud Functions para disparar e-mails via SendGrid ou resend na transição de status (ex: cliente clica em "Finalizar seleção", atualiza \`bookings\` para \`in_editing\` e dispara notificação).
