<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&style=for-the-badge" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&style=for-the-badge" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&style=for-the-badge" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&style=for-the-badge" alt="MongoDB 7" />
  <img src="https://img.shields.io/badge/TypeORM-1.0-fc3434?style=for-the-badge" alt="TypeORM 1.0" />
  <img src="https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&style=for-the-badge" alt="JWT" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger&style=for-the-badge" alt="Swagger" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&style=for-the-badge" alt="Docker" />
  <img src="https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&style=for-the-badge" alt="Node 22" />
  <img src="https://img.shields.io/badge/Jest-30-C21325?logo=jest&style=for-the-badge" alt="Jest 30" />
  <img src="https://img.shields.io/badge/license-UNLICENSED-lightgrey?style=for-the-badge" alt="License" />
</p>

# Superheros API

API RESTful para gerenciamento de super-heróis com autenticação JWT, controle de acesso por perfil (RBAC), ciclo de vida de heróis, batalhas entre editoras e logging estruturado no MongoDB.

---

## Stack

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| **Runtime** | Node.js | 22 LTS |
| **Linguagem** | TypeScript | 5.7 |
| **Framework** | NestJS (Express) | 11 |
| **ORM** | TypeORM | 1.0 |
| **ODM (logs)** | Mongoose | 9 |
| **Banco relacional** | PostgreSQL | 16 |
| **Banco de logs** | MongoDB | 7 |
| **Autenticação** | Passport + JWT | 0.7 / 4.0 |
| **Hash de senhas** | bcrypt | 6 |
| **Validação** | class-validator + class-transformer | 0.15 / 0.5 |
| **Documentação** | Swagger / OpenAPI | 11 |
| **Rate limiting** | @nestjs/throttler | 6 |
| **Segurança** | Helmet | 8 |
| **Testes** | Jest + Supertest + better-sqlite3 | 30 / 7 / 12 |
| **Container** | Docker (multi-stage) | 24 (Alpine) |

---

## Funcionalidades

### Autenticação e Usuários
- Registro com validação de CPF (algoritmo de dígitos verificadores)
- Login por CPF ou e-mail
- JWT com access token (15min) + refresh token (7d)
- Logout com revogação imediata de tokens
- Perfil do usuário (CRUD) com soft delete
- RBAC: **ADMIN**, **EDITOR**, **VIEWER**

### Super-Heróis
- Ciclo de vida completo: **DRAFT** → **PUBLISHED** → **ARCHIVED**
- Publicação validada (exige editora + alinhamento + 3 atributos + 2 poderes)
- CRUD completo com soft delete
- Atributos numéricos (0-100) e poderes (com valor opcional)

### Relatórios e Batalhas
- Relatório paginado de heróis com filtros por atributo, poder, alinhamento e editora
- Ordenação por soma de atributos ou poderes
- Batalhas entre editoras com 3 níveis de resultado:
  1. **Round**: cada atributo/poder em comum entre dois heróis
  2. **Match**: herói A vs herói B (soma dos rounds)
  3. **Publisher**: soma de todos os matches entre duas editoras

### Infraestrutura
- Soft delete em todas as entidades
- Logging estruturado no MongoDB (requests, erros, eventos de negócio)
- Rate limiting (100 requisições/minuto)
- Cabeçalhos de segurança com Helmet
- CORS configurável via ambiente
- Respostas padronizadas: `{ success, data, timestamp }`
- Erros padronizados: `{ statusCode, timestamp, path, method, message }`

---

## Pré-requisitos

- **Node.js** 22+
- **Docker** e **Docker Compose**
- **npm**

---

## Configuração Local

### 1. Clone o repositório

```bash
git clone <repo-url>
cd superheros-api
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário. Os valores padrão funcionam com o Docker Compose.

### 3. Suba os bancos de dados

```bash
docker-compose up -d postgres mongo
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Execute as migrations

```bash
npm run migration:run
```

### 6. Popule o banco com dados de exemplo

```bash
npm run seed
```

Saída esperada:
```
🌱 Starting seed...
✅ Admin user created
📚 Seeding publishers... ✅ 25 publishers
📚 Seeding alignments... ✅ 4 alignments
📚 Seeding heroes... ✅ 25 heroes (Marvel, DC, Dark Horse, etc.)
📚 Seeding attributes... ✅ 125 attributes
📚 Seeding powers... ✅ 50+ powers
✨ Seed completed successfully!
```

### 7. Inicie o servidor

```bash
npm run start:dev
```

Acesse:
- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`

---

## Deploy com Docker Compose

```bash
# Build e inicie todos os serviços
docker-compose up -d --build

# Execute as migrations
docker-compose exec api npm run migration:run

# Popule o banco
docker-compose exec api npm run seed
```

---

## Deploy em Nuvem

### Railway

1. Conecte o repositório GitHub ao Railway
2. Adicione os serviços:
   - PostgreSQL (Railway plugin)
   - MongoDB (Railway plugin)
   - Web service da API
3. Configure as variáveis de ambiente no Railway
4. O Railway executa `npm run build` automaticamente
5. Configure o start command: `npm run start:prod`
6. Adicione script `POSTBUILD`: `npm run migration:run && npm run seed`

### Render

1. Crie um Blueprint a partir do repositório
2. Adicione os serviços PostgreSQL e MongoDB
3. Configure as variáveis de ambiente
4. Build command: `npm ci && npm run build`
5. Start command: `npm run start:prod`

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Compila o projeto |
| `npm run start:dev` | Inicia em modo dev com watch |
| `npm run start:prod` | Inicia em modo produção |
| `npm run lint` | Executa ESLint |
| `npm test` | Testes unitários (54 testes) |
| `npm run test:e2e` | Testes de integração (60+ testes) |
| `npm run migration:run` | Executa migrations pendentes |
| `npm run seed` | Popula o banco com dados de exemplo |

---

## Estrutura do Projeto

```
src/
├── auth/              # Autenticação (JWT, register, login, logout, refresh)
│   ├── strategies/    #   jwt.strategy.ts, jwt-refresh.strategy.ts
│   ├── dto/           #   register.dto.ts, login.dto.ts, refresh-token.dto.ts
│   └── entities/      #   revoked-token.entity.ts
├── users/             # Gerenciamento de usuários (CRUD, perfis)
│   ├── dto/           #   update-user.dto.ts
│   ├── entities/      #   user.entity.ts
│   └── enums/         #   user-role.enum.ts (ADMIN, EDITOR, VIEWER)
├── heroes/            # CRUD de super-heróis e ciclo de vida
│   ├── dto/           #   create-hero.dto.ts, update-hero.dto.ts
│   ├── entities/      #   hero.entity.ts, publisher.entity.ts, alignment.entity.ts
│   └── enums/         #   hero-status.enum.ts (DRAFT, PUBLISHED, ARCHIVED)
├── attributes/        # CRUD de atributos dos heróis
│   ├── dto/           #   create-attribute.dto.ts, update-attribute.dto.ts
│   └── entities/      #   attribute.entity.ts
├── powers/            # CRUD de poderes dos heróis
│   ├── dto/           #   create-power.dto.ts, update-power.dto.ts
│   └── entities/      #   power.entity.ts
├── reports/           # Relatório paginado de heróis com filtros
│   └── dto/           #   hero-report-filter.dto.ts
├── battles/           # Batalhas entre editoras
│   └── dto/           #   battle-query.dto.ts
├── logging/           # Logging estruturado no MongoDB
│   └── schemas/       #   log.schema.ts
├── common/            # Compartilhado entre módulos
│   ├── guards/        #   jwt-auth.guard.ts, roles.guard.ts
│   ├── interceptors/  #   logging.interceptor.ts, transform.interceptor.ts
│   ├── filters/       #   global-exception.filter.ts
│   ├── decorators/    #   current-user.decorator.ts, roles.decorator.ts, public.decorator.ts
│   ├── dto/           #   pagination.dto.ts
│   └── validators/    #   is-cpf.validator.ts
├── config/            # Validação de variáveis de ambiente (Joi)
└── database/          # Conexões, migrations e seeds
    ├── postgres/
    │   ├── migrations/  #   InitialSchema, AddLastLogoutAt
    │   └── seeds/       #   hero.seed.ts, user.seed.ts, run-seed.ts
    └── mongo/           #   mongoose.config.ts
```

---

## Testes

O projeto utiliza **Jest** com **Supertest** para testes.

### Unitários (54 testes — 8 suites)

```bash
npm test
```

| Suite | Testes |
|-------|--------|
| AuthService | register, login, logout, inactivate |
| UsersService | findMe, update, findAll, findDeleted |
| HeroesService | create, publish, archive, findOne |
| AttributesService | create, findAll, update, remove |
| PowersService | create, findAll, update, remove |
| ReportsService | filters, sorting, pagination |
| BattlesService | validation, rounds, draws |
| AppController | health check |

### Integração/E2E (60+ testes — 7 suites)

```bash
npm run test:e2e
```

Os testes E2E usam **better-sqlite3** em memória, eliminando a necessidade de PostgreSQL para testes.

| Suite | Cobertura |
|-------|-----------|
| Auth | Register, login, validate, refresh, logout |
| Users | Perfil, update, inativação, ADMIN listing |
| Heroes | CRUD completo, publish, archive, soft delete |
| Attributes | CRUD, validações, restauração |
| Powers | CRUD, validações, restauração |
| Reports | Filtros, ordenação, paginação |
| Battles | Validação, rounds, resultado por publisher |

---

## Endpoints da API

Todos os endpoints têm prefixo `/api/v1`.

### Auth (públicos)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registro de novo usuário |
| POST | `/auth/login` | Login (CPF ou email) |
| POST | `/auth/refresh` | Renova access token |
| GET | `/auth/validate` | Valida access token |
| POST | `/auth/logout` | Revoga todos os tokens |

### Users
| Método | Rota | Perfis | Descrição |
|--------|------|--------|-----------|
| GET | `/users/me` | Todos | Perfil do usuário logado |
| PATCH | `/users/me` | Todos | Atualiza perfil |
| DELETE | `/users/me` | Todos | Inativa conta |
| GET | `/users` | ADMIN | Lista usuários ativos |
| GET | `/users/deleted` | ADMIN | Lista usuários deletados |

### Heroes
| Método | Rota | Perfis | Descrição |
|--------|------|--------|-----------|
| POST | `/heroes` | ADMIN, EDITOR | Cria herói como DRAFT |
| GET | `/heroes` | Todos | Lista heróis (VIEWER: só PUBLISHED) |
| GET | `/heroes/:id` | Todos | Detalhe do herói |
| PATCH | `/heroes/:id` | ADMIN, EDITOR | Atualiza herói |
| PATCH | `/heroes/:id/publish` | ADMIN, EDITOR | Publica herói |
| PATCH | `/heroes/:id/archive` | ADMIN | Arquiva herói |
| DELETE | `/heroes/:id` | ADMIN | Soft delete |
| GET | `/heroes/deleted` | ADMIN | Lista heróis deletados |

### Attributes
| Método | Rota | Perfis | Descrição |
|--------|------|--------|-----------|
| POST | `/heroes/:heroId/attributes` | ADMIN, EDITOR | Cria atributo |
| GET | `/heroes/:heroId/attributes` | Todos | Lista atributos |
| PATCH | `/heroes/:heroId/attributes/:id` | ADMIN, EDITOR | Atualiza atributo |
| DELETE | `/heroes/:heroId/attributes/:id` | ADMIN | Soft delete |

### Powers
| Método | Rota | Perfis | Descrição |
|--------|------|--------|-----------|
| POST | `/heroes/:heroId/powers` | ADMIN, EDITOR | Cria poder |
| GET | `/heroes/:heroId/powers` | Todos | Lista poderes |
| PATCH | `/heroes/:heroId/powers/:id` | ADMIN, EDITOR | Atualiza poder |
| DELETE | `/heroes/:heroId/powers/:id` | ADMIN | Soft delete |

### Reports
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/reports/heroes?page=&limit=&orderBy=&order=&attribute=&power=&alignment=&publisher=` | Relatório paginado com filtros |

### Battles
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/battles?publisherAId=&publisherBId=&page=&limit=` | Batalha entre duas editoras |

---

## CI/CD

O projeto possui pipelines de GitHub Actions que executam automaticamente em Pull Requests para a branch `main`:

### CI (`ci.yml`)
Executa em push para `main`/`develop` e PR para `main`:
- Lint (ESLint)
- Build
- Testes unitários
- Testes E2E (com PostgreSQL e MongoDB como serviços)

### PR Checks (`run-tests.yml`)
Executa exclusivamente em Pull Requests para `main`:
- Lint
- Build
- Testes unitários
- Testes E2E (com PostgreSQL e MongoDB como serviços)

---

## Licença

UNLICENSED — Projeto privado.
