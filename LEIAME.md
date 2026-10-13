# Prospecção Tangit — busca, funil e WhatsApp

Sistema próprio na Cloudflare (Pages + Functions + D1), com o WhatsApp do seu número atual ligado por meio da Gowa, numa VPS da Hostinger.

- **Busca** na base pública de CNPJs (Minha Receita), **listas** e **funil** — como antes.
- **Aprovar**: as empresas que entram na etapa Prospecção ganham o primeiro contato já preenchido (nome do sócio, nome da empresa). Você revisa, ajusta se quiser e aprova. Nada sai sem aprovação.
- **Automação**: follow-up, nova tentativa, Outro momento e retomada saem sozinhos, só em dias úteis e no horário definido, um de cada vez, com intervalo.
- **Respostas**: quando alguém responde, a automação para, o card vai para Conversa e aparece como “nova”. Respostas automáticas da empresa (“Obrigado pelo contato…”) são reconhecidas e não param a sequência. Quem responde SAIR é descadastrado na hora.
- **Ficha** com a conversa do WhatsApp: responda por ali ou pelo celular (as duas formas param a automação daquele contato).
- **Formulário do site** (o mesmo do CRM antigo): os contatos do site entram direto no funil, com origem (Google Ads, Meta, Instagram…), Pixel/API de Conversões, GA4 e exportação para o Google Ads.

---

## O que você vai fazer (uma vez)

| Parte | O quê | Tempo |
| --- | --- | --- |
| 1 | Publicar a atualização (GitHub + Cloudflare) | 10 min |
| 2 | Contratar a VPS, criar o endereço `gowa.tangit.com.br`, instalar a Gowa e conectar o WhatsApp | 20 min |
| 3 | Reescrever as mensagens padrão e ligar a automação | 10 min |

Tudo no Safari, no Mac. O iPhone entra só para ler o QR code do WhatsApp.

---

## Parte 1 — Publicar a atualização

### Pré-requisitos
- O arquivo `prospeccao-tangit-fase1.zip` baixado. No Finder, dê dois cliques nele: aparece a pasta `prospeccao-tangit`.
- Acesso ao GitHub (repositório `oavb23/prospeccao-tangit`) e à Cloudflare, os mesmos de sempre.

### 1.1 Cópia de segurança (antes de tudo)
1. Abra o sistema como hoje e clique em **Ajustes** (menu da esquerda).
2. Em **Cópia de segurança**, clique em **Baixar cópia**. Guarde o arquivo `.json`.

A atualização mexe no banco sozinha na primeira vez que o sistema abrir (cria as tabelas novas e a etapa **Outro momento**). Ela foi testada numa cópia dos seus dados atuais; a cópia de segurança é só garantia.

### 1.2 Chave de acesso (agora obrigatória)
O sistema passa a guardar dados de pessoas (LGPD) e a enviar mensagens pelo seu WhatsApp, então ele só abre com a chave de acesso ligada. Se o sistema já pede uma chave quando você abre num aparelho novo, pule este passo.

1. Abra **dash.cloudflare.com**. No menu da esquerda, abra **Compute (Workers)** e clique em **Workers & Pages**.
2. Clique no projeto **prospeccao-tangit**.
3. Clique na aba **Settings** (barra superior do projeto).
4. Na seção **Variables and Secrets**, clique em **Add**.
5. **Type**: `Secret`. **Variable name**: `ACCESS_KEY`. **Value**: uma senha longa (guarde no app Senhas). Clique em **Save**.

### 1.3 Enviar os arquivos para o GitHub
1. Abra **github.com/oavb23/prospeccao-tangit**.
2. Acima da lista de arquivos, à direita, ao lado do botão verde **Code**, clique em **Add file** e depois em **Upload files**.
3. Abra a pasta `prospeccao-tangit` no Finder, selecione **o conteúdo** dela (as pastas `functions`, `lib`, `public` e os arquivos `LEIAME.md` e `package.json`) e arraste para a área de upload do GitHub. Não arraste a pasta em si.
4. Espere a lista de arquivos terminar de carregar. Embaixo, clique no botão verde **Commit changes**.

Os arquivos com o mesmo nome são substituídos; os novos são adicionados. A Cloudflare publica sozinha em cerca de 1 minuto.

### 1.4 Conferir
1. Na Cloudflare, no projeto **prospeccao-tangit**, aba **Deployments**: a linha mais recente fica com **Success** em verde.
2. Abra o sistema no endereço de sempre. Se pedir a chave, digite a do passo 1.2.
3. Confira: o menu tem **Aprovar**; o Funil tem a coluna **Outro momento**; as empresas que estão em Prospecção aparecem em **Aprovar → Conferindo o WhatsApp** (elas só serão conferidas depois que a Gowa estiver ligada, na Parte 2).

---

## Parte 2 — VPS, Gowa e WhatsApp

### Pré-requisitos
- Cartão para a Hostinger.
- iPhone com o WhatsApp do número que você usa para a Tangit.
- O app **Terminal**, que já vem no Mac (Finder → **Aplicativos** → **Utilitários** → **Terminal**). Não precisa instalar nada.

### 2.1 Contratar a VPS
1. Em **hostinger.com.br**, entre em **VPS** e escolha o plano **KVM 1** (sobra capacidade para a Gowa).
2. Conclua a compra. Em seguida, o assistente de configuração da VPS pergunta:
   - **Localização**: escolha **Brasil**, se aparecer (senão, a mais próxima).
   - **Sistema operacional**: **Ubuntu 24.04** (se houver “Ubuntu 24.04 com Docker”, também serve).
   - **Senha root**: crie uma senha forte e guarde no app Senhas. Você vai usá-la no passo 2.5.
3. Conclua o assistente e espere a VPS ficar **Em execução** (alguns minutos).

### 2.2 Anotar o IP da VPS
1. No painel da Hostinger (hPanel), clique em **VPS** e, na sua VPS, em **Gerenciar**.
2. Na página de visão geral, no bloco de informações da VPS, copie o **IPv4** (quatro números separados por ponto, ex.: `191.0.0.10`).

### 2.3 Criar o endereço `gowa.tangit.com.br` na Cloudflare
1. Em **dash.cloudflare.com**, clique no domínio **tangit.com.br**.
2. No menu da esquerda, clique em **DNS** e depois em **Records**.
3. Clique no botão azul **Add record** (acima da lista de registros, à direita).
4. Preencha:
   - **Type**: `A`
   - **Name**: `gowa`
   - **IPv4 address**: o IP do passo 2.2
   - **Proxy status**: clique na chave para **desligar** (fica a nuvem cinza, **DNS only**). Isso é necessário para o HTTPS da Gowa funcionar.
   - **TTL**: `Auto`
5. Clique em **Save**.

### 2.4 Gerar o comando de instalação
1. No sistema, clique em **Ajustes** e, no topo, em **WhatsApp**.
2. Abra **Instalar a Gowa na VPS**. Confira o endereço: `gowa.tangit.com.br`.
3. Clique em **Gerar comando** e depois em **Copiar comando**. O comando vale por 30 minutos (se vencer, gere outro).

O comando instala, de uma vez: a Gowa (com usuário e senha), o HTTPS automático e o **relógio**, que chama o sistema a cada 2 minutos para enviar o que estiver na hora. Ele já leva o endereço do sistema, o segredo do webhook e a chave do relógio.

### 2.5 Rodar o comando na VPS
1. Abra o **Terminal** no Mac.
2. Digite `ssh root@` seguido do IP (ex.: `ssh root@191.0.0.10`) e aperte **Enter**.
3. Na primeira vez aparece “Are you sure you want to continue connecting”. Digite `yes` e aperte **Enter**.
4. Digite a senha root do passo 2.1 (ela não aparece enquanto você digita) e aperte **Enter**.
5. Cole o comando com **Command + V** e aperte **Enter**.
6. Espere uns 3 minutos, até aparecer **“Pronto. Volte ao sistema…”**. Pode fechar o Terminal.

Alternativa sem o Terminal do Mac: no hPanel, na página da VPS, o botão **Console web** (Web console) abre um terminal no próprio Safari; entre com `root` e a senha root e cole o comando.

### 2.6 Conectar o WhatsApp
1. No sistema, em **Ajustes → WhatsApp**, clique em **Testar conexão**. Deve aparecer **WhatsApp desconectado** (a Gowa está no ar, falta o WhatsApp).
   - Se aparecer **Sem conexão**, espere 2 minutos (o HTTPS leva um pouco para ficar pronto na primeira vez) e teste de novo.
2. Clique em **Conectar o WhatsApp**. Aparece um QR code.
3. No iPhone, abra o **WhatsApp** e toque em **Configurações** (barra inferior, à direita) → **Aparelhos conectados** → **Conectar um aparelho**. Aponte a câmera para o QR code no Mac.
4. Em alguns segundos o sistema mostra **Conectado** com o seu número.

Sem o Mac por perto, use a aba **Código (só iPhone)** na mesma janela: digite seu número, toque em **Gerar código** e, no WhatsApp, na tela da câmera, toque em **Conectar com número de telefone** e digite o código.

### 2.7 Testar
1. Em **Ajustes → WhatsApp**, clique em **Mensagem de teste**, coloque outro número (de alguém próximo) e envie. A mensagem chega saindo do seu número.
2. Em **Ajustes → Relógio dos envios** deve aparecer **Funcionando** (o relógio roda a cada 2 minutos).

---

## Parte 3 — Mensagens e automação

### 3.1 Reescrever as mensagens padrão
Em **Ajustes → Mensagens da automação** estão quatro rascunhos (primeiro contato, follow-up, nova tentativa e retomada). Reescreva com as suas palavras e clique em **Salvar** em cada um. Os campos entre chaves são preenchidos com os dados de cada empresa:

| Campo | Vira |
| --- | --- |
| `{saudacao}` | “Olá, João” (ou só “Olá”, se a Receita não tiver o sócio) |
| `{nome}` | primeiro nome do sócio (ou do contato do site) |
| `{empresa}` | nome fantasia, com acentos e sem “LTDA” |
| `{razao_social}`, `{cidade}`, `{segmento}` | dados da Receita |

O exemplo embaixo de cada mensagem mostra como ela sai.

### 3.2 Ligar a automação
1. Em **Ajustes → Automação**, confira o horário (09:00 às 17:00) e os limites. Para começar: 10 primeiros contatos por dia, intervalo de 4 minutos.
2. Em **Feriados locais**, coloque os feriados da sua cidade (ex.: `15/08`). Os nacionais já estão no sistema.
3. Ligue a chave **Automação ligada** e clique em **Salvar automação**.

---

## No dia a dia

1. **Busca** → selecione as empresas → **Funil** → etapa **Prospecção**.
2. Em alguns minutos, o sistema confere quais números têm WhatsApp e elas aparecem em **Aprovar** com a mensagem pronta.
3. Em **Aprovar**, revise cada mensagem (o texto editado fica salvo) e clique em **Aprovar** — ou **Aprovar todos**.
   - Se aparecer o aviso **“parece ser o contador da empresa”**, o número da Receita é de outra pessoa: use **⋯ → Usar outro número**.
4. As mensagens saem no horário de envio, uma de cada vez. O card vai para **Primeiro contato**.
5. Quando alguém responde, o número verde aparece em **Funil** no menu e o card fica destacado. Abra o card: a conversa está na ficha, com a caixa para responder.
6. Depois disso, a conversa é sua: responda pela ficha ou pelo celular e mova o card pelas etapas.

### Regras da automação
Todos os prazos se mudam em **Ajustes → Automação**.

| Situação | O que acontece |
| --- | --- |
| Você aprova o primeiro contato | Sai no próximo horário de envio (dias úteis, 09h–17h), com intervalo, até o limite do dia. |
| Não respondeu | Follow-up 2 dias úteis depois. |
| Continua sem resposta | Nova tentativa 7 dias depois. |
| Ainda sem resposta | 2 dias úteis depois, vai para **Outro momento**. |
| Em Outro momento | Mensagem de retomada 90 dias depois (em dia útil). |
| Sem resposta à retomada | 7 dias depois, encerra: vai para **Perdido** (motivo “Sem resposta”). |
| Uma pessoa respondeu | A automação para, o card vai para **Conversa** e aparece como nova. |
| Resposta automática da empresa | É ignorada e a sequência segue. Se uma resposta automática atrasada for tratada como resposta, abra a ficha e use **Era automática: continuar sequência**. |
| Respondeu SAIR (ou “não quero receber”) | Descadastrado na hora; vai para **Perdido**. |
| Você respondeu pelo sistema ou pelo celular | A automação para para aquele contato. |
| Você moveu o card para Proposta ou Negociação | A automação para. |
| Você moveu o card para Outro momento | Retomada agendada (prazo de Ajustes). |
| Você moveu o card de volta para Prospecção | Volta para a fila de aprovação. |

Na ficha, o bloco **WhatsApp** mostra o que vai acontecer com aquele contato e tem os botões **Pausar**, **Assumir conversa**, **Outro momento**, **Desqualificar** e **Voltar para aprovação**.

---

## Formulário do site (trocar o CRM antigo)

O formulário é o mesmo do CRM antigo. Enquanto você não trocar, o site continua mandando os contatos para o CRM antigo — nada se perde.

1. Em **Ajustes → Formulário do site**, preencha o WhatsApp que recebe, os textos e, se usar, o Pixel/API de Conversões da Meta e o GA4. Clique em **Salvar**.
2. Clique em **Abrir página de teste**, envie um contato de teste e confira no **Funil** (etapa Conversa). Depois apague o teste (ficha → **⋯** → **Apagar contato**).
3. Copie a linha do script (botão **Copiar** na mesma seção).
4. No site, troque a linha antiga do CRM pela nova:
   - Abra **github.com/oavb23/tangit** e, no campo de busca do topo, procure `widget.js` (opção “In this repository”).
   - Em cada arquivo encontrado, clique no ícone de lápis (**Edit this file**, canto superior direito do arquivo), troque o endereço antigo pelo novo e clique em **Commit changes**.
   - Se o script estiver no Google Tag Manager, troque na tag de HTML personalizado e publique o contêiner.

Para o Google Ads: **Ajustes → Formulário do site → Baixar CSV para o Google Ads** gera o arquivo de conversões offline (vendas com gclid) para importar no Google Ads.

---

## Se algo der errado

| Sintoma | O que fazer |
| --- | --- |
| Faixa vermelha **“WhatsApp parado”** no topo | **Ajustes → WhatsApp → Testar conexão**. Se estiver **desconectado**, clique em **Conectar o WhatsApp** e leia o QR de novo. Se estiver **sem conexão**, a VPS pode estar desligada: no hPanel, na página da VPS, clique em **Reiniciar**. |
| **Relógio parado** em Aprovar ou em Ajustes | A VPS está desligada ou travada: reinicie pelo hPanel. O relógio volta sozinho. |
| Mensagens aprovadas não saem | Confira em **Aprovar**: automação ligada, WhatsApp conectado, horário de envio, limite do dia. |
| O WhatsApp desconectou no celular | Em **Aparelhos conectados**, o aparelho aparece como **Tangit**. Se você o removeu, conecte de novo (passo 2.6). |
| Sistema pede chave em todo aparelho | Normal: a chave fica salva em cada navegador. **Ajustes → Cópia e acesso → Esquecer a chave** remove de um aparelho. |

---

## Cuidados

- **WhatsApp não oficial**: a Gowa funciona como um WhatsApp Web. Para não chamar atenção, mantenha o ritmo de pessoa: comece com poucos primeiros contatos por dia, aumente aos poucos e mantenha mensagens personalizadas.
- **LGPD**: o sistema só abre com a chave de acesso; o webhook da Gowa é assinado; a Gowa tem senha e HTTPS; todo primeiro contato oferece o SAIR; **Apagar contato** remove a pessoa e a conversa.
- **Limites do plano gratuito da Cloudflare**: o sistema foi feito para ler pouco do banco (as telas só recarregam quando algo muda), folgado para o uso de uma pessoa.

---

## Estrutura

```
public/                 interface (index.html, app.js, styles.css, nomes.js)
public/widget.js        formulário do site (mesmo contrato do CRM antigo) + teste.html
functions/api/
  receita/, ibge/       busca de CNPJ e listas do IBGE
  data/                 listas, funil, anotações, modelos, contatos, exportações
  automacao/            fila de aprovação, painel, ajustes, ações, conversa, envio, relógio
  gowa/webhook.js       mensagens e recibos que chegam do WhatsApp
  public/               formulário do site (público)
  instalar/             link temporário com o script de instalação da VPS
lib/
  automacao.js          motor: aprovação, follow-ups, outro momento, respostas, verificação de números
  calendario.js         dias úteis, feriados (nacionais + locais) e horário de envio
  classificar.js        resposta de pessoa x resposta automática x SAIR (regras + IA opcional)
  gowa.js               cliente da Gowa (envio, verificação, QR code, assinatura do webhook)
  schema.js             tabelas e atualização automática do banco
```

As tabelas são criadas e atualizadas sozinhas. Não é preciso rodar SQL.
