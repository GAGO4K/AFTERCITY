const express = require('express');
const axios = require('axios');
const session = require('cookie-session');
require('dotenv').config();

const app = express();

// Configuração do cookie de sessão
app.use(session({
  name: 'session',
  keys: ['secretKey'],
  maxAge: 24 * 60 * 60 * 1000
}));

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

// Rota inicial - botão de login
app.get('/login', (req, res) => {
  const discordAuthURL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
  res.redirect(discordAuthURL);
});

// Rota de callback
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Troca do código por um token de acesso
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }));

    const { access_token } = tokenResponse.data;

    // Obter dados do usuário
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    // Salvar usuário na sessão
    req.session.user = userResponse.data;
    res.redirect('/panel');
  } catch (error) {
    console.error(error);
    res.send('Erro ao autenticar');
  }
});

// Painel após login
app.get('/panel', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { username, email } = req.session.user;
  res.send(`
    <h1>Bem-vindo, ${username}!</h1>
    <p>Email: ${email}</p>
    <a href="/logout">Sair</a>
  `);
});

// Rota de logout
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
