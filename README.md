# 🧬 DNA Merge: Species Survival Engine

A conservation genetics game where you merge endangered species, simulate their survival across 3 cycles, and fight extinction — powered by AI narration and localStorage saves.

---

## 🚀 Deploy to GitHub Pages in 3 Steps

1. **Upload this folder to a new GitHub repo**
   - Go to [github.com/new](https://github.com/new)
   - Name it anything (e.g. `dna-merge-game`)
   - Drag the `index.html` file into the repo (or use `git push`)

2. **Enable GitHub Pages**
   - Go to your repo → **Settings** → **Pages**
   - Under "Source" select **Deploy from a branch**
   - Branch: `main` · Folder: `/ (root)`
   - Click **Save**

3. **Your game is live in ~60 seconds**
   - URL: `https://YOUR-USERNAME.github.io/dna-merge-game/`

---

## 🎮 How to Play

| Step | Action |
|------|--------|
| **Gene Lab** | Select two endangered species (A + B) |
| **Merge** | AI generates a scientifically-flavoured hybrid with blended trait scores |
| **Cycle 1** | Face an environmental pressure · deploy a resource · predict the outcome |
| **Cycle 2** | Hidden genetic defects reveal · choose how to respond |
| **Cycle 3** | Final judgment — establishment, fragile survival, or permanent extinction |

> The displayed survival rate shows your *expected* probability.  
> Actual outcomes always carry hidden variance — predictions matter.

---

## 🤖 AI Narration (Optional)

The game runs fully without an API key using built-in biology descriptions.

To unlock AI-powered narration:
1. Get an [Anthropic API key](https://console.anthropic.com/)
2. Open the game → click **⚙️ Settings** → paste your key
3. The key is saved only in your browser's localStorage

Uses **claude-sonnet-4** for:
- Hybrid name + biology generation
- Cycle survival narration  
- Genetic defect diagnosis
- Final extinction autopsy

---

## 💾 LocalStorage Keys

All progress is auto-saved to your browser:

| Key | Contents |
|-----|----------|
| `dna_hybrids` | All hybrids ever created |
| `dna_extinctions` | Permanently extinct combos (locked forever) |
| `dna_fame` | Established / Hall of Fame hybrids |
| `dna_resources` | Current conservation resource count |
| `dna_predictions` | Full prediction history + accuracy |
| `dna_log` | Complete cycle event log |
| `dna_apikey` | Your Anthropic API key |

---

## 🌍 Species List

| Emoji | Species | IUCN Status |
|-------|---------|-------------|
| 🐆 | Snow Leopard | VU |
| 🐈 | Amur Leopard | CR |
| 🦎 | Axolotl | CR |
| 🐬 | Vaquita | CR |
| 🦏 | Javan Rhino | CR |
| 🐯 | Sunda Tiger | CR |
| 🦜 | Kakapo | CR |
| 🦍 | Mountain Gorilla | EN |
| 🐾 | Chinese Pangolin | CR |
| 🐢 | Leatherback Turtle | VU |
| 🦌 | Saola | CR |
| 🦧 | Sumatran Orangutan | CR |

---

## 📁 File Structure

```
dna-merge-game/
└── index.html      ← The entire game (single file, zero dependencies)
└── README.md       ← This file
```

Zero build steps. Zero npm. Zero dependencies. Just open `index.html`.

---

## 🛠 Local Development

Just open `index.html` in any browser. No server needed.

```bash
# Optional: serve locally
npx serve .
# or
python3 -m http.server 8080
```

---

MIT License · Built with 🧬 and Anthropic Claude
