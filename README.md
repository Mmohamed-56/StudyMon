# StudyMon

StudyMon is a gamified student dashboard that turns studying into an adventure. Inspired by Pokémon, StudyMon helps you learn by battling, collecting, and training cute monsters — all powered by real studying.

## Features

- **Study Focus System:** Choose a topic to study and all battles will generate questions from that topic.
- **Battle Wild Monsters:** Attack by answering flashcards and quiz questions. The better you answer, the stronger your attacks.
- **Earn SP (Study Points):** SP is gained by studying and used to fight or heal your team.
- **Collect & Train Team:** Capture monsters and build a team of up to 4.
- **Gym Map Progression:** Fight gym leaders with increasingly challenging questions.
- **Home Dashboard Tools:**
  - Timer
  - To-Do List
  - Flashcard Study
  - Monster Healing (by studying more!)
- **Item System:** Use items to boost SP gain, get hints, and more.

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React + JavaScript |
| Styling   | Tailwind CSS |
| Backend   | Supabase (Auth + Database) |
| AI Logic  | Prompt-based quiz generation |

## How It Works

1. Pick your **Study Focus** (ex: Biology, Japanese, Calculus).
2. Start studying using flashcards or quizzes.
3. Earn **SP** by answering correctly.
4. Use that SP in battles against wild monsters or gym leaders.
5. Capture new monsters and grow your team.
6. Keep studying to heal and level up.

## Getting Started (Local)

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/studymon.git
cd studymon

# Install dependencies
npm install

# Run the app
npm run dev

```
Make sure you set up your Supabase project and add your environment keys:

Create a .env.local file:
```bash
VITE_SUPABASE_URL=your-url-here
VITE_SUPABASE_ANON_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
```

## Web App Link
https://studymon.netlify.app/

## Future Plans
1. Monster evolutions
2. Friend battles
3. Daily quests & streaks
4. Device compatability
