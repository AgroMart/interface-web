# AgroMart Frontend - Interface Vue.js para CSA

## Visão Geral

A nova interface web do Agromart é uma aplicação web progressiva (PWA) desenvolvida em Vue.js com Vuetify, especialmente projetada para agricultores que participam de Comunidades que Sustentam a Agricultura (CSA). A interface foi criada com foco na simplicidade, acessibilidade e usabilidade para usuários com baixo letramento digital, priorizando o acesso via dispositivos móveis.

## Características Principais

### 🌱 Design Centrado no Usuário
- Interface limpa e intuitiva com ícones grandes
- Linguagem simples, evitando jargões técnicos
- Cores naturais (verde) que remetem à agricultura
- Navegação objetiva e direta

### 📱 Mobile-First e Responsivo
- Otimizado para smartphones e tablets
- Layout adaptável para diferentes tamanhos de tela
- Touch-friendly com botões grandes
- Menu de navegação inferior fixo

### 🔄 Funcionalidades Offline
- Service Worker para cache de dados
- Sincronização automática quando online
- Armazenamento local para dados críticos
- PWA instalável no dispositivo

### ⚡ Performance Otimizada
- Lazy loading de componentes e imagens
- Compressão automática de imagens
- Cache inteligente de recursos
- Otimizações para conexões lentas

## Tecnologias Utilizadas

- **Vue.js 3** - Framework JavaScript reativo
- **Vuetify 3** - Biblioteca de componentes Material Design
- **Vue Router 4** - Roteamento SPA
- **Pinia** - Gerenciamento de estado
- **Axios** - Cliente HTTP para API
- **Service Worker** - Funcionalidades offline
- **PWA** - Progressive Web App

## Estrutura do Projeto

```
agromart-frontend/
├── public/
│   ├── manifest.json          # Configuração PWA
│   └── sw.js                  # Service Worker
├── src/
│   ├── assets/
│   │   └── css/
│   │       └── global.css     # Estilos globais
│   ├── components/
│   │   ├── BasketCard.vue     # Card de cesta
│   │   ├── BasketForm.vue     # Formulário de cesta
│   │   ├── EmptyState.vue     # Estado vazio
│   │   ├── LoadingCard.vue    # Card de carregamento
│   │   ├── ProductCard.vue    # Card de produto
│   │   └── ProductForm.vue    # Formulário de produto
│   ├── layouts/
│   │   └── DefaultLayout.vue  # Layout padrão
│   ├── pages/
│   │   ├── BasketsPage.vue    # Página de cestas
│   │   ├── HomePage.vue       # Página inicial
│   │   ├── LoginPage.vue      # Página de login
│   │   ├── OrdersPage.vue     # Página de pedidos
│   │   ├── ProductsPage.vue   # Página de produtos
│   │   ├── ProfilePage.vue    # Página de perfil
│   │   └── StorePage.vue      # Página da loja
│   ├── plugins/
│   │   └── vuetify.js         # Configuração Vuetify
│   ├── router/
│   │   └── index.js           # Configuração de rotas
│   ├── services/
│   │   └── api.js             # Serviços de API
│   ├── store/
│   │   ├── app.js             # Store da aplicação
│   │   ├── auth.js            # Store de autenticação
│   │   ├── baskets.js         # Store de cestas
│   │   ├── index.js           # Store principal
│   │   ├── products.js        # Store de produtos
│   │   └── stores.js          # Store de lojas
│   ├── utils/
│   │   ├── offline.js         # Utilitários offline
│   │   └── performance.js     # Otimizações
│   ├── App.vue                # Componente raiz
│   └── main.js                # Ponto de entrada
└── package.json               # Dependências
```

## Instalação e Configuração

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- API Strapi configurada

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env.local
VUE_APP_STRAPI_URL=http://localhost:1337
VUE_APP_API_TOKEN=your-api-token
```

4. **Execute em desenvolvimento**
```bash
npm run serve
```

5. **Build para produção**
```bash
npm run build
```

## Funcionalidades Implementadas

### 🏠 Página Inicial (Dashboard)
- Visão geral com estatísticas
- Ações rápidas para tarefas comuns
- Dicas e orientações para agricultores
- Cards informativos com métricas

### 📦 Gestão de Produtos
- Listagem de produtos com filtros
- Formulário de cadastro/edição
- Upload de imagens com otimização
- Controle de estoque e preços

### 🧺 Gestão de Cestas
- Criação de cestas semanais
- Organização de produtos por cesta
- Definição de preços e quantidades
- Descrições detalhadas para clientes

### 📋 Acompanhamento de Pedidos
- Lista de pedidos com status
- Filtros por período e status
- Ações de confirmação e preparo
- Informações detalhadas do cliente

### 🏪 Configuração da Loja
- Dados básicos da loja
- Endereço e contato
- Upload de banner
- Configurações de entrega

### 👤 Perfil do Usuário
- Informações pessoais
- Configurações de notificações
- Estatísticas de uso
- Ações de manutenção

## Integração com API Strapi

### Endpoints Configurados

A aplicação está preparada para integrar com os seguintes endpoints da API Strapi:

- `GET /api/produtos-avulsos` - Listar produtos
- `POST /api/produtos-avulsos` - Criar produto
- `PUT /api/produtos-avulsos/:id` - Atualizar produto
- `DELETE /api/produtos-avulsos/:id` - Excluir produto

- `GET /api/cestas` - Listar cestas
- `POST /api/cestas` - Criar cesta
- `PUT /api/cestas/:id` - Atualizar cesta

- `GET /api/lojas` - Listar lojas
- `PUT /api/lojas/:id` - Atualizar loja

- `GET /api/planos` - Listar planos
- `GET /api/assinantes` - Listar assinantes

### Configuração da API

O serviço de API está configurado em `src/services/api.js` com:

- Base URL configurável via variável de ambiente
- Interceptors para tratamento de erros
- Autenticação via token
- Retry automático para falhas de rede
- Cache de requisições

## Funcionalidades Offline

### Service Worker
- Cache de assets estáticos
- Cache dinâmico de dados da API
- Estratégias de cache configuráveis
- Sincronização em background

### Armazenamento Local
- Cache de dados críticos no localStorage
- Compressão de dados para economizar espaço
- Limpeza automática de cache expirado
- Sincronização pendente para quando voltar online

### PWA Features
- Manifest configurado para instalação
- Ícones para diferentes dispositivos
- Splash screen personalizada
- Shortcuts para ações rápidas


## Acessibilidade

### Navegação
- Navegação por teclado
- Foco visível em elementos
- Ordem lógica de tabulação
- Atalhos de teclado

### Visual
- Contraste adequado de cores
- Textos legíveis e escaláveis
- Ícones com labels descritivos
- Feedback visual para ações

### Semântica
- HTML semântico correto
- ARIA labels onde necessário
- Estrutura de headings lógica
- Descrições alternativas para imagens


## Deploy e Produção

### Build de Produção
```bash
npm run build
```

### Variáveis de Ambiente
```bash
VUE_APP_STRAPI_URL=https://api.agromart.com
VUE_APP_API_TOKEN=production-token
VUE_APP_ENVIRONMENT=production
```

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

