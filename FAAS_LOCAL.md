# Integração local FaaS — primeira etapa

Esta branch mantém Strapi como padrão. O fluxo Heroku continua usando sua branch e configuração anteriores. Nenhum recurso AWS é necessário para este teste.

## API

No repositório `api-faas`, use Node.js 24:

```bash
npm ci
npm run local:db
npm run local:setup
npm run dev
```

Crie um administrador local conforme o README da API (`npm run local:admin`). Não use dados reais. O banco é descartável; tokens expiram em uma hora e podem ser invalidados ao reiniciar a API.

## Frontend

No `interface-web`, use uma versão Node suportada pelo seu `package.json` (por exemplo, Node.js 22). Crie `.env.local` com os valores de `.env.faas.example`:

```dotenv
VUE_APP_BACKEND_MODE=faas
VUE_APP_FAAS_API_URL=http://127.0.0.1:3001
```

Execute:

```bash
npm ci
npm run serve -- --port 5173
```

Abra `http://localhost:5173`: essa é a origem CORS local permitida pela API. Se mudar a porta/origem, configure `FRONTEND_ORIGIN` na API e reinicie-a. Reinicie também o frontend após mudar variáveis; elas são incorporadas durante o build, não lidas pelo navegador em tempo de execução.

Entre com o email e a senha do administrador local. Confira lojas, produtos e cestas, recarregue a página e confirme que a sessão é validada novamente. Listas vazias são esperadas em um banco novo; os testes de integração da API verificam registros reais em tabelas temporárias.

## Limites desta etapa

- Listagens FaaS são convertidas para o formato `id/attributes` esperado pela interface; detalhes são localizados na listagem, não em endpoints inexistentes.
- Os resultados ainda estão sujeitos à ausência de paginação da API. Imagens devem conter URLs ou objetos de mídia válidos; não existe upload integrado.
- A API continua exigindo administrador nas listagens de negócio. Clientes autenticados só podem consultar o próprio perfil; autorização por loja/propriedade será uma etapa posterior.
- Cadastro, upload, alterações de dados e senha retornam erro explícito no adaptador. Páginas antigas de perfil, loja e pedidos têm ações demonstrativas; não considere suas mensagens de sucesso como persistência na API.
- Sessão, configurações e caches FaaS são separados por URL da API. Os dados Strapi existentes são preservados. O cache não é isolado por usuário e o token ainda fica no armazenamento local: essa base não está aprovada para produção.
- A sessão inválida é removida ao inicializar a aplicação. Sem acesso à API, uma sessão salva não é considerada validada para entrar.

Para voltar ao Strapi, use `VUE_APP_BACKEND_MODE=strapi` (ou remova a variável), configure `VUE_APP_STRAPI_URL` como antes e reinicie o frontend. Não envie `.env.local` ao Git.

## Verificações

```bash
npm run lint -- --no-fix
npm test -- --runInBand
npm run build
```

O lint atual tem avisos preexistentes. Os testes do adaptador não substituem a validação manual conjunta no navegador nem um futuro teste controlado na AWS.
