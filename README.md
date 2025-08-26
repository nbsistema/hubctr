# NB Consultoria - Sistema de Gestão Médica

Sistema de gestão para clínicas e laboratórios com foco em certificações e selos de qualidade.

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **Supabase** - Backend as a Service (Database + Auth)
- **Tailwind CSS** - Estilização
- **TypeScript** - Tipagem estática
- **Radix UI** - Componentes acessíveis

## 📋 Funcionalidades

### Roles de Usuário
- **Admin**: Gestão completa do sistema
- **Recepção**: Gerenciamento de pedidos e empresas
- **Parceiro**: Gestão de médicos, convênios e encaminhamentos
- **Check-up**: Gestão de baterias de exames corporativos

### Principais Features
- ✅ Sistema de autenticação com roles
- ✅ Gestão de empresas parceiras
- ✅ Cadastro de médicos e convênios
- ✅ Encaminhamentos de exames
- ✅ Check-ups corporativos
- ✅ Dashboard com estatísticas
- ✅ Relatórios (em desenvolvimento)

## 🛠️ Configuração

### 1. Clonar o repositório
```bash
git clone <repository-url>
cd medical-referral-system
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie o arquivo `.env.example` para `.env.local`
3. Preencha as variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Executar migrações

Execute as migrações SQL no painel do Supabase:
- `supabase/migrations/20250825193524_heavy_paper.sql`
- `supabase/migrations/fix_empresas_email.sql`

### 5. Executar o projeto

```bash
npm run dev
```

## 🚀 Deploy

### Netlify

1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. O deploy será automático com as configurações do `netlify.toml`

### Variáveis de Ambiente (Netlify)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Estrutura do Banco de Dados

### Principais Tabelas
- `user_profiles` - Perfis de usuários com roles
- `empresas` - Empresas parceiras e de check-up
- `medicos` - Médicos por empresa
- `pacientes` - Pacientes por empresa
- `exames` - Catálogo de exames
- `encaminhamentos` - Encaminhamentos de exames
- `checkups` - Baterias de check-up corporativo

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas baseadas em roles de usuário
- Autenticação via Supabase Auth

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 📱 Mobile
- 📱 Tablet  
- 💻 Desktop

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.