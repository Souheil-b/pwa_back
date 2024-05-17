// server.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// MONGOOSE
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://zoroetlufy:Pepito1%26@cluster0.xdapwkb.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
    .then(() => console.log("Connexion à MongoDB réussie !"))
    .catch((err) => console.log("Connexion à MongoDB échouée !", err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("try login email = ", email);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: "Connexion réussie", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion de l'utilisateur" });
  }
  console.log("end login email = ", email);
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  console.log("try register email = ", email);
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur." });
  }
  console.log("end register email = ", email);
});

app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération du profil de l'utilisateur." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));