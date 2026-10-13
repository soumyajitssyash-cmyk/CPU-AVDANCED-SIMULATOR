How to use it:
In your VS Code project folder, create a new file and name it exactly README.md.

Copy all of the code below and paste it into that file.

Save the file (Ctrl + S or Cmd + S).

Push it to your GitHub repository using your terminal:

Bash
git add README.md
git commit -m "Add professional README"
git push
Markdown
# 🖥️ Advanced Interactive CPU X-Ray Simulator

An interactive, browser-based CPU architecture laboratory and simulator built with **HTML**, **Tailwind CSS**, and **JavaScript**. It allows students and developers to watch instructions move through a real-time processor pipeline, track live registers, visualize cache hits/misses, and build custom programs complete with conditional branching and loops. It also features **Chip**, an integrated AI tutor powered by the Gemini API.

---

## ✨ Key Features

- **Animated 5-Stage Pipeline:** Visually trace instructions through *Fetch (F)*, *Decode (D)*, *Execute (E)*, *Memory (M)*, and *Write Back (WB)*.
- **Custom Instruction Builder:** Construct your own programs from scratch using operations like `LOAD`, `STORE`, `ADD`, `SUB`, `MUL`, `BEQ` (Branch if Equal), `BNE` (Branch if Not Equal), and `LOOP`.
- **Hardware State & Registers:** Monitor dynamic register updates (`R1` through `R4`) and CPU flags (`Zero Flag`, `Equal Flag`) in real time.
- **Cache & Storage Analytics:** Track cache hit/miss rates, memory access latency, and overall storage usage dynamically.
- **Interactive Quiz Mode:** Test your knowledge with "Fill in the Blanks" prompts that pause execution during the Write Back stage.
- **Chip the AI Tutor:** A built-in floating assistant powered by the Gemini API to explain computer science concepts, pipeline stalls, and debugging on the fly.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, Tailwind CSS, Custom Glassmorphism & Animations
- **Simulation Engine:** Vanilla JavaScript (Instruction scheduling, branch prediction logic, state management)
- **AI Integration:** Google Gemini API (`gemini-3.8-flash`)

---

## 🚀 How to Run Locally

1. Clone or download this repository to your computer:
   ```bash
   git clone [https://github.com/soumyajitssyash-cmyk/CPU-AVDANCED-SIMULATOR.git](https://github.com/soumyajitssyash-cmyk/CPU-AVDANCED-SIMULATOR.git)
Open the project folder in Visual Studio Code.

Install the Live Server extension by Ritwick Dey in VS Code.

Right-click on index.html and select "Open with Live Server" to launch it instantly in your web browser.

🤖 Setting up Chip the AI Tutor
Launch the simulator in your browser.

Click on Chip (the cute robot icon in the bottom-right corner).

Click the Settings (⚙️) gear icon inside the chat window.

Paste your free Gemini API Key (obtainable from Google AI Studio) and click Save Key.

Ask Chip any question about CPU pipelines, computer architecture, or help with your custom program!

👨‍💻 Author
Built with passion by Soumyajit Saha (Computer Science & Engineering B.Tech Student).
