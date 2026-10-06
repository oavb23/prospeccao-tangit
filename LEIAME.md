# Prospecção — busca de empresas, listas e funil

Ferramenta própria, custo zero, que roda no plano gratuito da Cloudflare (Pages + Functions + D1).

- **Busca**: dados públicos de CNPJ da Receita Federal (via Minha Receita), filtros por estado, cidade, segmento (CNAE), porte, capital social, ano de abertura, situação, matriz/filial, contato disponível e nome.
- **Resultados** em lista ou grade, com seleção individual, “selecionar todos” e ações em massa.
- **Ficha da empresa** com todos os dados disponíveis, sócios, CNAEs, endereço e os botões Ligar (`tel:`), WhatsApp (`wa.me`), Localização (Google Maps) e E-mail (`mailto:`).
- **Listas** (grupos) para separar empresas.
- **Funil** em quadro (arrastar entre etapas), com valor, próximo contato, motivo de perda e histórico de contatos.
- **Ajustes**: etapas do funil, modelos de mensagem para WhatsApp/E-mail, cópia de segurança.

Nenhuma chave paga é usada. Google Places e OpenStreetMap não fazem parte do projeto.

---

## Estrutura

```
public/              interface (index.html, app.js, styles.css)
functions/api/       rotas do servidor (Cloudflare Pages Functions)
  receita/           busca e consulta de CNPJ no Minha Receita
  ibge/              lista de cidades e de CNAEs do IBGE
  data/              listas, funil, anotações e modelos (banco D1)
lib/                 código compartilhado e criação automática das tabelas
```

As tabelas do banco são criadas sozinhas na primeira vez que a ferramenta abre. Não é preciso rodar SQL.

---

## Publicar na Cloudflare (Safari, sem instalar nada)

### Pré-requisitos
- Conta no GitHub e conta na Cloudflare (as mesmas que você já usa).
- Este projeto descompactado no Mac.

### 1. Criar o repositório no GitHub
1. No Safari, abra **github.com**. No canto superior direito, clique no **+** e depois em **New repository**.
2. Em **Repository name**, digite o nome (ex.: `prospeccao-tangit`). Marque **Private**. Clique em **Create repository** (botão verde, embaixo).
3. Na página do repositório vazio, clique no link **uploading an existing file** (no meio da tela).
4. Arraste para a área de upload **o conteúdo** da pasta `prospeccao-tangit` (as pastas `public`, `functions`, `lib` e os arquivos `package.json` e `LEIAME.md`), não a pasta em si.
5. Embaixo, clique em **Commit changes**.

### 2. Criar o banco D1
1. No Safari, abra **dash.cloudflare.com**.
2. No menu da esquerda, abra **Storage & databases** e clique em **D1 SQL database**.
3. Clique em **Create** (botão azul, canto superior direito).
4. Em **Name**, digite `prospeccao`. Clique em **Create**.

### 3. Criar o projeto no Pages
1. No menu da esquerda, abra **Compute (Workers)** e clique em **Workers & Pages**.
2. Clique em **Create** (botão azul, canto superior direito). Escolha a aba **Pages** e depois **Import an existing Git repository**.
   - Se aparecer apenas a opção de Workers, procure o link **Looking to deploy Pages? Get started**, no rodapé da tela.
3. Escolha o repositório criado no passo 1 e clique em **Begin setup**.
4. Preencha:
   - **Framework preset**: `None`
   - **Build command**: deixe vazio
   - **Build output directory**: `public`
5. Clique em **Save and Deploy**. Aguarde terminar e clique em **Continue to project**.

### 4. Ligar o banco ao projeto
1. Dentro do projeto, clique na aba **Settings** (barra superior do projeto).
2. Na seção **Bindings**, clique em **Add** e escolha **D1 database**.
3. Em **Variable name**, digite exatamente `DB`. Em **D1 database**, escolha `prospeccao`. Clique em **Save**.

### 5. (Recomendado) Proteger com uma chave
Sem isso, qualquer pessoa com o link consegue abrir a ferramenta e ver suas listas.
1. Ainda em **Settings**, na seção **Variables and Secrets**, clique em **Add**.
2. **Type**: `Secret`. **Variable name**: `ACCESS_KEY`. **Value**: a senha que você quiser. Clique em **Save**.
3. Na primeira vez que abrir a ferramenta em cada aparelho, ela pede essa chave e guarda no navegador.

### 6. Publicar de novo para aplicar o banco e a chave
1. Clique na aba **Deployments** (barra superior do projeto).
2. No deploy mais recente, clique nos **três pontinhos (⋯)**, no lado direito da linha, e escolha **Retry deployment**.
3. Quando terminar, abra o endereço `https://<nome-do-projeto>.pages.dev`.

### No iPhone
Abra o endereço no Safari, toque no botão **Compartilhar** (quadrado com seta, barra inferior) e escolha **Adicionar à Tela de Início**. A ferramenta abre como um app.

---

## Limites que valem saber
- A busca da Receita só filtra no servidor por estado, cidade e segmento. Porte, capital, ano, contato e nome são filtrados depois, aqui na ferramenta. Por isso aparece “X empresas · Y analisadas” e o botão **Buscar mais**.
- A API pública do Minha Receita é gratuita e sem garantia de disponibilidade. Se ela estiver fora do ar, a busca mostra um aviso; listas e funil continuam funcionando.
- Telefone e e-mail são os declarados à Receita e podem estar desatualizados. O botão **Ver no Maps** abre o perfil público da empresa no Google Maps, sem custo.
- Plano gratuito da Cloudflare: 100 mil requisições por dia nas Functions e 5 GB no D1 — muito acima do uso individual.
