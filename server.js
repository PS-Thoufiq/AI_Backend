// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://AI:AI1234@cluster0.fzfz74z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: String,
  resumeSkills: [String],
  experience: String,
  durationMinutes: Number,
  conversation: [{ role: String, text: String, stage: String }],
  proctoringLogs: [{ timestamp: String, event: String }],
  userReport: String,
  clientReport: String,
  timer: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Interview = mongoose.model('Interview', InterviewSchema);

// Routes
app.post('/api/interviews', async (req, res) => {
  try {
    const { userName, topic, resumeSkills, experience, durationMinutes, conversation, proctoringLogs, userReport, clientReport, timer } = req.body;
    
    let user = await User.findOne({ name: userName });
    if (!user) {
      user = new User({ name: userName });
      await user.save();
    }
    
    const interview = new Interview({
      userId: user._id,
      topic,
      resumeSkills,
      experience,
      durationMinutes,
      conversation,
      proctoringLogs,
      userReport,
      clientReport,
      timer,
    });
    
    await interview.save();
    res.status(201).json({ message: 'Interview saved', interviewId: interview._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'interviews',
          localField: '_id',
          foreignField: 'userId',
          as: 'interviews'
        }
      }
    ]);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/interviews/:interviewId', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));