# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2c1c1c73-5d38-452d-b200-b49efbf4c022

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2c1c1c73-5d38-452d-b200-b49efbf4c022) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2c1c1c73-5d38-452d-b200-b49efbf4c022) and click on Share -> Publish.

## Sistema Administrativo

### Configuração

Este projeto inclui um sistema admin completo para gerenciar filmes e séries com integração TMDB e PrimeVicio.

#### Secrets Necessários

O projeto já está configurado com os seguintes secrets:
- `TMDB_API_KEY` - API key do The Movie Database (TMDB)
- Secrets do Supabase (configurados automaticamente)

#### Como Tornar um Usuário Admin

Para dar permissões admin a um usuário, você precisa:

1. Criar uma conta através da página `/signup`
2. Adicionar o role admin no banco de dados:

```sql
-- Substitua 'USER_ID' pelo ID real do usuário
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID', 'admin');
```

### Funcionalidades Admin

O painel admin (`/admin`) oferece:

#### 1. Gerenciamento de Items
- **Adicionar**: Insira um TMDB ID e tipo (filme/série) para adicionar automaticamente com metadados do TMDB
- **Check**: Verifica disponibilidade no PrimeVicio e atualiza status
- **Preview**: Visualiza poster, sinopse e informações do item
- **Publish/Unpublish**: Publica ou despublica items (só permite publish após check OK)
- **Manual Embed**: Mostra iframe pronto e permite copiar código
- **Delete**: Remove item do banco de dados

#### 2. Sincronização Automática
O botão "Sincronizar Agora" executa verificação em lote:
- Verifica todos os items não publicados ou sem check recente
- Publica automaticamente items disponíveis no PrimeVicio
- Respeita rate limits (500ms entre requests)
- Gera relatório completo com contadores

#### 3. Cache
- Sistema de cache de 6 horas para requisições PrimeVicio
- Botão "Limpar Cache" para forçar limpeza
- Cache automático expira e é limpo periodicamente

#### 4. Logs
Seção de logs mostrando:
- Ações administrativas (create, update, delete, check, publish)
- Timestamps e status
- Mensagens de detalhes

### APIs Disponíveis

Todas as rotas requerem autenticação admin:

- `GET /functions/v1/admin-items?page=1` - Lista items paginada
- `POST /functions/v1/admin-items` - Cria item via TMDB ID
- `PUT /functions/v1/admin-items/:id` - Atualiza item
- `DELETE /functions/v1/admin-items/:id` - Remove item
- `POST /functions/v1/admin-check` - Verifica item no PrimeVicio
- `POST /functions/v1/admin-publish` - Publica/despublica item
- `POST /functions/v1/admin-sync` - Sincronização em lote
- `DELETE /functions/v1/admin-cache` - Limpa cache
- `GET /functions/v1/admin-logs` - Retorna logs

### Fluxo de Trabalho Recomendado

1. Adicione items via TMDB ID
2. Execute "Check" para verificar disponibilidade no PrimeVicio
3. Items com status OK podem ser publicados
4. Use "Sincronizar Agora" periodicamente para verificar em lote
5. Configure um cron job para executar sync automaticamente

### Segurança

- Todas as rotas admin verificam role admin via RLS policies
- Cache e logs protegidos por RLS
- Sessões gerenciadas via Supabase Auth
- Email auto-confirmado habilitado para desenvolvimento

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
