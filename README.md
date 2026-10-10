# 🔥 BAIAK CONQUEST - Servidor de Caça Infinita

**Servidor Baiak Idle profissional com 100+ hunts, progressão infinita, loja VIP e pagamentos por cartão.**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎮 Sobre o Projeto

**Baiak Conquest** é um servidor de jogo idle baseado em web com:

✅ **100 Hunts** distribuídas em 10 regiões únicas  
✅ **Progressão Quase Infinita** com andares escaláveis  
✅ **Loja VIP** com pacotes de gemas  
✅ **Pagamentos Oficiais** - Mercado Pago + Stripe  
✅ **Frontend Integrado** - Abrir no navegador e jogar  
✅ **Caça Offline** - Ganhos enquanto está fora  
✅ **Backup Automático** - Diário às 12:00  
✅ **Segurança de Nível Profissional**  

---

## 🚀 Quick Start

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/samuka95951212-ops/baiak-idle-server.git
cd baiak-idle-server

# Copie o arquivo de ambiente
cp .env.example .env

# Inicie os containers
docker-compose up -d

# Aguarde ~30 segundos
sleep 30

# Instale dependências e migre o banco
npm install
npm run db:migrate

# Acesse
# 🌍 http://localhost:3000
# 📊 pgAdmin: http://localhost:5050 (admin@baiak.com / admin123)
```

### Sem Docker (Local)

```bash
# Instale Node.js 18+ e PostgreSQL 14+

# Clone e instale
git clone https://github.com/samuka95951212-ops/baiak-idle-server.git
cd baiak-idle-server
npm install

# Configure .env
cp .env.example .env
vim .env  # Edite com suas credenciais PostgreSQL

# Migre o banco
npm run db:migrate

# Inicie em desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

---

## 💳 Configurar Pagamentos

### Mercado Pago

1. Crie conta em https://www.mercadopago.com.br
2. Acesse "Configurações" → "Credenciais"
3. Copie o **Access Token** e **Public Key**
4. Adicione ao `.env`:

```env
MP_ACCESS_TOKEN=seu_token_aqui
MP_PUBLIC_KEY=seu_public_key_aqui
PAYMENT_PROVIDER=mercadopago
```

### Stripe

1. Crie conta em https://stripe.com
2. Acesse "Developers" → "API Keys"
3. Copie a **Secret Key**
4. Adicione ao `.env`:

```env
STRIPE_SECRET_KEY=sk_test_seu_secret_aqui
PAYMENT_PROVIDER=stripe
```

### Ambos os Provedores

```env
PAYMENT_PROVIDER=both
MP_ACCESS_TOKEN=...
STRIPE_SECRET_KEY=...
```

---

## 🎮 Como Jogar

1. **Registrar** - Crie uma conta
2. **Login** - Faça login com seu usuário
3. **Criar Personagem** - Nome único para começar
4. **Hunts** - Escolha uma região e comece a caçar
5. **Progresso** - Suba de level, desbloqueie novas hunts
6. **Loja VIP** - Compre gemas com cartão de crédito
7. **Caça Offline** - Ganhe ouro e XP enquanto dorme

---

## 📡 API Endpoints

### Autenticação

```bash
# Registrar
POST /api/auth/register
{
  "username": "player1",
  "email": "player@example.com",
  "password": "secure_password"
}

# Login
POST /api/auth/login
{
  "username": "player1",
  "password": "secure_password"
}
```

### Jogador

```bash
# Perfil
GET /api/player/me

# Criar personagem
POST /api/player/create-character
{ "characterName": "Guerreiro" }

# Status
GET /api/game/status/{playerId}
```

### Hunts

```bash
# Listar hunts
GET /api/hunts/list

# Detalhes
GET /api/hunts/{huntId}

# Caçar
POST /api/hunts/{huntId}/hunt
{ "playerId": "uuid", "quantity": 1 }

# Stats
GET /api/hunts/{playerId}/stats
```

### Offline

```bash
# Resgatar ganhos offline
POST /api/offline/{playerId}/claim-offline
{ "lastHuntId": "hunt_001" }

# Andar infinito
GET /api/offline/infinite/floor/{floorNumber}
```

### Pagamentos

```bash
# Pacotes
GET /api/payments/packages

# Checkout (Mercado Pago)
POST /api/payments/mercadopago/checkout
{ "playerId": "uuid", "packageId": "starter" }

# Checkout (Stripe)
POST /api/payments/stripe/checkout
{ "playerId": "uuid", "packageId": "vip" }

# Histórico
GET /api/payments/history/{playerId}
```

---

## 🏗️ Arquitetura

```
baiak-idle-server/
├── src/
│   ├── config/              # Configuração (env, logger, tipos)
│   ├── database/            # PostgreSQL (connection, schema)
│   ├── middleware/          # Express (auth, error, request)
│   ├── routes/              # Rotas API (auth, player, hunts, payment)
│   ├── services/            # Business logic (payment, scheduler)
│   ├── data/                # Dados estáticos (100 hunts)
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Utilitários (backup, etc)
│   ├── app.ts               # Express app
│   └── index.ts             # Entry point
├── public/                  # Frontend (HTML, CSS, JS)
│   ├── index.html           # SPA
│   ├── styles.css           # Estilos
│   └── app.js               # JavaScript
├── docker-compose.yml       # Ambiente local
├── Dockerfile               # Container
├── tsconfig.json            # TypeScript config
├── package.json             # Dependências
└── README.md                # Este arquivo
```

---

## 🎯 Regiões de Hunts

| # | Região | Level | Descrição |
|---|--------|-------|----------|
| 1️⃣ | Terras Iniciais | 1-100 | Floresta, cavernas, lobos |
| 2️⃣ | Reinos Selvagens | 100-500 | Pântanos, trolls, ogros |
| 3️⃣ | Abismo Sombrio | 500-1.000 | Catacumbas, demônios |
| 4️⃣ | Império Dracônico | 1.000-2.500 | Covis de dragões |
| 5️⃣ | Inferno Eterno | 2.500-5.000 | Vulcões, lava |
| 6️⃣ | Reino Glacial | 5.000-10.000 | Geleiras, gigantes do gelo |
| 7️⃣ | Dimensão Arcana | 10.000-25.000 | Magia, golens |
| 8️⃣ | Mundos Corrompidos | 25.000-50.000 | Aberrações |
| 9️⃣ | Plano Celestial | 50.000-100.000 | Templos, sentinelas |
| 🔟 | Vazio Infinito | 100.000+ | Dimensões cósmicas |

---

## 💎 Pacotes VIP

| Pacote | Preço | Gemas | Bônus |
|--------|-------|-------|-------|
| 🟢 Starter | R$ 9,99 | 100 | Base |
| 🔵 VIP | R$ 19,99 | 250 | +10% XP |
| 🟣 Elite | R$ 49,99 | 700 | +25% Gold |
| 🟡 Legend | R$ 99,99 | 1.800 | +50% Tudo |

---

## 📊 Scripts

```bash
# Desenvolvimento
npm run dev              # Modo desenvolvimento com hot-reload
npm run build            # Build TypeScript
npm start                # Iniciar em produção

# Database
npm run db:migrate       # Executar migrations
npm run db:seed          # Popula dados padrão

# Backup
npm run backup           # Backup manual do banco

# Quality
npm run lint             # ESLint
npm run format           # Prettier
npm run test             # Jest
npm run test:coverage    # Coverage report

# Docker
npm run docker:build     # Build da imagem
npm run docker:up        # Iniciar containers
npm run docker:down      # Parar containers
```

---

## 🔐 Segurança

✅ JWT com expiração configurável  
✅ Hash de senhas com bcrypt  
✅ Rate limiting por IP  
✅ CORS restrito  
✅ Helmet para headers de segurança  
✅ Validação de inputs  
✅ Proteção contra exploits de XP/Ouro  
✅ Logs de auditoria completos  
✅ Transações de banco de dados  
✅ Backup automático diário  

---

## 📈 Escalabilidade

- ✅ Pool de conexões PostgreSQL
- ✅ Redis para cache (futuro)
- ✅ Rate limiting inteligente
- ✅ Fórmulas de progressão balanceadas
- ✅ Suporte a múltiplos jogadores simultâneos
- ✅ Andares infinitos sem limite de progressão
- ✅ Estrutura modular e extensível

---

## 🐛 Troubleshooting

### Erro: "Connection refused" no banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Ou com Docker
docker-compose logs postgres
```

### Erro: "Port 3000 already in use"

```bash
# Mudar porta em .env
PORT=3001
```

### Frontend não carrega

```bash
# Verificar se Express está servindo arquivos estáticos
curl http://localhost:3000/

# Verificar logs
docker-compose logs app
```

### Webhook de pagamento não recebe

```bash
# Configurar URL pública no provedor
# Mercado Pago: https://seu-dominio.com/api/payments/mercadopago/webhook
# Stripe: https://seu-dominio.com/api/payments/stripe/webhook
```

---

## 📝 Roadmap

- [x] Sistema de 100 hunts
- [x] Progressão infinita
- [x] Loja VIP com cartão
- [x] Frontend integrado
- [x] Caça offline
- [x] Backup automático
- [ ] Guildas e ranking
- [ ] Sistema de pets
- [ ] Boss diário
- [ ] Dungeon
- [ ] Torre dos desafios
- [ ] Chat global
- [ ] Mercado entre jogadores
- [ ] Mobile app (React Native)

---

## 💬 Suporte

Para suporte, abra uma issue no repositório ou entre em contato.

---

## 📄 Licença

MIT - Sinta-se livre para usar, modificar e compartilhar!

---

## 🎉 Créditos

**Criado com ❤️ para a comunidade Baiak Idle**

**GitHub**: https://github.com/samuka95951212-ops  
**Discord**: Comunidade Baiak  

---

**Aproveite a caça! 🔥⚔️**