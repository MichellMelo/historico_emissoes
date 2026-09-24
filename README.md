# Histórico de Emissões

Aplicação web para gerenciamento do histórico de ofertas de passagens aéreas.

## Stack
- Vite
- JavaScript
- Supabase
- Netlify

## Dados
O frontend usa o Supabase como fonte única de verdade. A chave publishable pode ser exposta no navegador quando o RLS estiver corretamente configurado.

## Desenvolvimento
```bash
npm install
npm run dev
```

## Deploy
O projeto está preparado para deploy no Netlify com `npm run build`.
