# 🛠️ Use & Devolva

> **Plataforma Peer-to-Peer (P2P) de compartilhamento e locação de ferramentas.** Uma solução inteligente que promove a sustentabilidade, economia circular e o consumo consciente, conectando quem precisa de uma ferramenta a quem tem uma parada em casa.

---

## 🚀 Link da Aplicação em Produção

O projeto está totalmente configurado e rodando na nuvem com **Deploy Automático**! Você não precisa configurar nada localmente para testar:

🌍 **Acesse agora:** [Use & Devolva - AWS Elastic Beanstalk](http://usedevolva.sa-east-1.elasticbeanstalk.com/)

---

## 🛠️ Technologies & Frameworks

A aplicação utiliza uma stack robusta, unindo a segurança do ecossistema Java no Back-end com a agilidade do desenvolvimento web nativo no Front-end.

### **Back-end & Infraestrutura**
* ![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white) — Linguagem principal (Java 21)
* ![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot) — Framework de desenvolvimento da API REST e MVC
* ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=Spring-Security&logoColor=white) — Autenticação e criptografia de senhas com BCrypt
* ![Spring Mail](https://img.shields.io/badge/Spring_Mail-6DB33F?style=for-the-badge&logo=Spring&logoColor=white) — Disparo automático de notificações por e-mail
* ![AWS](https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white) — Hospedagem via **Elastic Beanstalk** com CI/CD
* ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) — Banco de dados relacional integrado à infraestrutura AWS

### **Front-end & Integrações**
* ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) — Estrutura semântica e acessível
* ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) — Estilização modularizada e responsiva
* ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) — Validações dinâmicas, máscaras e requisições assíncronas (Fetch API)
* ![Thymeleaf](https://img.shields.io/badge/Thymeleaf-005F0F?style=for-the-badge&logo=thymeleaf&logoColor=white) — Engine de renderização de templates HTML dinâmicos

### **APIs e Frameworks Especializados**
* **AbacatePay:** Gateway responsável por processar os pagamentos e transações de aluguel de forma segura.
* **Cloudinary:** Armazenamento em nuvem de imagens das ferramentas e perfil. Conta com **validação automática por IA** contra imagens impróprias antes do salvamento.
* **Leaflet.js:** Biblioteca interativa de mapas para geolocalização e visualização das ferramentas disponíveis na região.
* **ViaCEP:** Integração de API para busca e autopreenchimento de endereços a partir do CEP informado.

---

## 👥 Como a Plataforma Funciona (Fluxo do Ecossistema)

No **Use & Devolva**, não existem contas separadas para quem aluga e quem disponibiliza: **uma única conta unificada** permite que qualquer usuário atue como Locador e Locatário simultaneamente, alternando entre os papéis de forma fluida.

---

### 🔍 1. Descoberta Inteligente e Busca Avançada
O usuário pode encontrar as ferramentas de duas formas integradas:
* **Busca por Nome e Filtros:** Digitando o nome do produto e refinando a pesquisa por faixa de preço, proximidade e categorias.
* **Busca Geográfica Interativa:** Visualizando as ferramentas diretamente no mapa interativo (*Leaflet.js*), identificando com precisão o que está disponível na sua região.

---

### 💬 2. Negociação e Chat Nativo
A plataforma conta com um **sistema de chat interno integrado**. Antes ou durante o processo de reserva, os usuários podem conversar diretamente pela plataforma para:
* Tirar dúvidas sobre o estado de conservação da ferramenta.
* Alinhar pontos de entrega e devolução.
* Combinar detalhes de uso do equipamento.

---

### 💳 3. Reserva, Pagamento e Fluxo de Aprovação
O processo de locação segue um fluxo rigoroso de segurança para garantir que ninguém saia no prejuízo:

```text
  [ Locatário escolhe as datas e faz o Pagamento via AbacatePay ]
                                 │
                                 ▼
                   [ Locador recebe a notificação ]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
            [ ACEITAR ]                     [ RECUSAR ]
                 │                               │
                 ▼                               ▼
      ┌─────────────────────┐         ┌─────────────────────┐
      │ Reserva Confirmada! │         │ Estorno Automático  │
      │ (Datas bloqueadas   │         │    (AbacatePay)     │
      │    no calendário)   │         │          +          │
      └─────────────────────┘         │   Datas continuam   │
                                      │     DISPONÍVEIS     │
                                      └─────────────────────┘
```

## 🤝 Contribuindo

Por se tratar de um projeto voltado para um **Trabalho de Conclusão de Curso (TCC)**, o núcleo do desenvolvimento é gerenciado estritamente pelos integrantes do grupo. No entanto, feedbacks, sugestões de melhorias e relatórios de bugs são extremamente bem-vindos para enriquecer o ecossistema!

Se você deseja colaborar com o aprendizado ou evolução da plataforma:

1. **Reporte Bugs ou Ideias:** Encontrou alguma falha de validação ou instabilidade na AWS? Abra uma [Issue no GitHub](https://github.com/TCC-CAS/tcc-2025-1-e-2-htv/issues).
2. **Análise de Arquitetura:** Críticas construtivas sobre a estrutura do Spring Boot, DTOs ou testes automatizados são ótimas para nossa evolução acadêmica.

Caso queira clonar para fins de estudo ou propor um Pull Request no futuro, siga o fluxo padrão:
* Faça um **Fork** do repositório.
* Crie uma Branch descritiva (`git checkout -b feature/SuaMelhoria`).
* Enviar um **Pull Request** detalhando as alterações propostas.

---

## 📄 Licença

Este projeto está protegido sob a **Licença MIT**. Isso significa que o código é totalmente livre e aberto para fins educacionais, cópias, modificações e estudos, desde que os créditos e a autoria original do TCC sejam mantidos e referenciados.

Para ler os termos completos, consulte o arquivo [LICENSE](https://github.com/TCC-CAS/tcc-2025-1-e-2-htv/blob/main/LICENSE) na raiz do repositório.