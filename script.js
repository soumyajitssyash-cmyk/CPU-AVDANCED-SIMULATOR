// --- CPU SIMULATOR LOGIC ---
let queue = [];
let pipeline = { F: null, D: null, E: null, M: null, WB: null };
let registers = { R1: 0, R2: 0, R3: 0, R4: 0 };
let memory = {};
let cache = new Set();
let stats = { cacheHits: 0, cacheTotal: 0, maxStorage: 32 };
let flags = { Z: 0, E: 0 };
let pc = 0;

let autoPlayInterval = null;
let quizCallback = null;

// Event Listeners setup
document.getElementById('add-btn').addEventListener('click', addInstruction);
document.getElementById('step-btn').addEventListener('click', step);
document.getElementById('auto-btn').addEventListener('click', toggleAuto);
document.getElementById('submit-quiz-btn').addEventListener('click', submitQuiz);
document.getElementById('chip-avatar').addEventListener('click', toggleChat);
document.getElementById('toggle-settings-btn').addEventListener('click', toggleSettings);
document.getElementById('save-key-btn').addEventListener('click', saveApiKey);
document.getElementById('send-msg-btn').addEventListener('click', sendMessage);
document.getElementById('chat-input-field').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

function log(msg) {
    const consoleEl = document.getElementById('console-output');
    consoleEl.innerHTML += `> ${msg}<br>`;
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function addInstruction() {
    const op = document.getElementById('op-select').value;
    const reg1 = document.getElementById('reg1-select').value;
    const src1 = document.getElementById('src1-select').value;
    const val = document.getElementById('val-input').value || "0";

    const instStr = `${op} ${reg1 !== '-' ? reg1 : ''} ${src1 !== '-' ? src1 : ''} ${val}`.trim();
    queue.push({
        id: queue.length,
        raw: instStr, op, reg1, src1, val, result: null
    });
    
    updateQueueUI();
    updateStorageBar();
}

function updateQueueUI() {
    const list = document.getElementById('queue-list');
    list.innerHTML = '';
    queue.forEach((inst, i) => {
        const isNext = i === pc;
        list.innerHTML += `<li class="p-2 rounded border ${isNext ? 'bg-blue-50 border-blue-200 font-bold' : 'bg-white border-gray-100'}">
            <span class="text-xs text-gray-400 mr-2">[${i}]</span> ${inst.raw}
        </li>`;
    });
}

function updateStorageBar() {
    let memCount = Object.keys(memory).length;
    let totalUsed = queue.length + memCount;
    let pct = Math.min((totalUsed / stats.maxStorage) * 100, 100);
    document.getElementById('storage-bar').style.width = `${pct}%`;
    document.getElementById('storage-pct').innerText = `${Math.round(pct)}%`;
}

function getVal(str) {
    if (!str || str === '-') return 0;
    if (registers.hasOwnProperty(str)) return registers[str];
    return parseInt(str) || 0;
}

function step() {
    if(quizCallback) return; // Block step if quiz is active

    // 5. WRITE BACK (WB)
    if (pipeline.M) {
        pipeline.WB = { ...pipeline.M };
        const inst = pipeline.WB;
        
        if (inst.reg1 !== '-' && ['LOAD', 'ADD', 'SUB', 'MUL'].includes(inst.op)) {
            const writeToReg = () => {
                registers[inst.reg1] = inst.result;
                document.querySelector(`#reg-${inst.reg1} .value`).innerText = inst.result;
                document.getElementById(`reg-${inst.reg1}`).style.backgroundColor = 'var(--accent-2)';
                setTimeout(() => document.getElementById(`reg-${inst.reg1}`).style.backgroundColor = 'white', 500);
                log(`WB: Wrote ${inst.result} to ${inst.reg1}`);
            };

            if (document.getElementById('learning-mode').checked) {
                showQuiz(inst, writeToReg);
                pipeline.M = null;
                updatePipelineUI();
                return; 
            } else {
                writeToReg();
            }
        }
    } else {
        pipeline.WB = null;
    }

    // 4. MEMORY (M)
    if (pipeline.E) {
        pipeline.M = { ...pipeline.E };
        const inst = pipeline.M;
        if (inst.op === 'LOAD') {
            stats.cacheTotal++;
            let addr = getVal(inst.val).toString();
            if (cache.has(addr)) {
                stats.cacheHits++;
                log(`M: Cache HIT (Addr ${addr})`);
            } else {
                cache.add(addr);
                log(`M: Cache MISS (Addr ${addr}). Fetched to cache.`);
            }
            inst.result = memory[addr] || 0;
        } else if (inst.op === 'STORE') {
            let addr = getVal(inst.val).toString();
            memory[addr] = getVal(inst.src1);
            cache.add(addr);
            log(`M: Stored ${getVal(inst.src1)} to Addr ${addr}`);
            updateStorageBar();
        }

        if (stats.cacheTotal > 0) {
            let hitRate = (stats.cacheHits / stats.cacheTotal) * 100;
            document.getElementById('cache-bar').style.width = `${hitRate}%`;
            document.getElementById('cache-pct').innerText = `${Math.round(hitRate)}%`;
        }
    } else {
        pipeline.M = null;
    }

    // 3. EXECUTE (E)
    if (pipeline.D) {
        pipeline.E = { ...pipeline.D };
        const inst = pipeline.E;
        let val1 = getVal(inst.src1);
        let val2 = getVal(inst.val);
        
        if (inst.op === 'ADD') inst.result = val1 + val2;
        if (inst.op === 'SUB') inst.result = val1 - val2;
        if (inst.op === 'MUL') inst.result = val1 * val2;
        
        if (['ADD', 'SUB', 'MUL'].includes(inst.op)) {
            flags.Z = (inst.result === 0) ? 1 : 0;
            document.getElementById('flag-z').innerText = flags.Z;
        }

        if (['BEQ', 'BNE'].includes(inst.op)) {
            let compareReg = getVal(inst.reg1);
            let compareVal = getVal(inst.src1);
            flags.E = (compareReg === compareVal) ? 1 : 0;
            document.getElementById('flag-e').innerText = flags.E;
            
            let targetStep = parseInt(inst.val);
            let shouldBranch = (inst.op === 'BEQ' && flags.E) || (inst.op === 'BNE' && !flags.E);
            
            if (shouldBranch) {
                log(`E: Branch Taken! Jump to step ${targetStep}`);
                pc = targetStep;
                pipeline.F = null; pipeline.D = null;
            }
        }

        if (inst.op === 'LOOP') {
            let targetStep = parseInt(inst.val);
            log(`E: LOOP Taken. Jump to step ${targetStep}`);
            pc = targetStep;
            pipeline.F = null; pipeline.D = null;
        }
        if(!['BEQ', 'BNE', 'LOOP'].includes(inst.op)) log(`E: Executed ${inst.op}`);
    } else {
        pipeline.E = null;
    }

    // 2. DECODE (D)
    if (pipeline.F) {
        pipeline.D = { ...pipeline.F };
        log(`D: Decoded ${pipeline.D.raw}`);
    } else {
        pipeline.D = null;
    }

    // 1. FETCH (F)
    if (pc < queue.length) {
        pipeline.F = { ...queue[pc] };
        log(`F: Fetched [${pc}] ${pipeline.F.raw}`);
        pc++;
    } else {
        pipeline.F = null;
    }

    updateQueueUI();
    updatePipelineUI();
}

function updatePipelineUI() {
    const stages = ['F', 'D', 'E', 'M', 'WB'];
    stages.forEach(stage => {
        const el = document.getElementById(`stage-${stage}`);
        const textEl = el.querySelector('.inst-text');
        if (pipeline[stage]) {
            textEl.innerText = pipeline[stage].raw;
            el.classList.add('active-stage');
            el.style.backgroundColor = 'var(--panel-bg)';
        } else {
            textEl.innerText = '-';
            el.classList.remove('active-stage');
            el.style.backgroundColor = 'white';
        }
    });
}

function toggleAuto() {
    const btn = document.getElementById('auto-btn');
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        btn.innerHTML = '<i class="fas fa-play"></i> Auto Play';
    } else {
        autoPlayInterval = setInterval(() => { if(!quizCallback) step(); }, 1500);
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
}

function showQuiz(inst, callback) {
    quizCallback = callback;
    document.getElementById('quiz-text').innerText = `The ${inst.op} instruction is completing. What will be saved to ${inst.reg1}?`;
    document.getElementById('quiz-answer').value = '';
    document.getElementById('quiz-modal').classList.remove('hidden');
    document.getElementById('quiz-answer').focus();
}

function submitQuiz() {
    const ans = parseInt(document.getElementById('quiz-answer').value);
    if(pipeline.WB && ans === pipeline.WB.result) {
        alert("Correct!");
        document.getElementById('quiz-modal').classList.add('hidden');
        let cb = quizCallback; quizCallback = null; cb();
        updatePipelineUI();
    } else {
        alert("Incorrect. Check the math in the Execute stage!");
        document.getElementById('quiz-answer').value = '';
    }
}

// --- CHIP AI TUTOR LOGIC (GEMINI API) ---
let apiKey = localStorage.getItem('gemini_api_key') || "";

function toggleChat() {
    const chat = document.getElementById('chip-chat');
    chat.style.display = chat.style.display === 'flex' ? 'none' : 'flex';
}

function toggleSettings() {
    const settings = document.getElementById('api-settings');
    settings.style.display = settings.style.display === 'block' ? 'none' : 'block';
    document.getElementById('api-key-input').value = apiKey;
}

function saveApiKey() {
    apiKey = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('gemini_api_key', apiKey);
    toggleSettings();
    appendMessage("chip", "API Key saved! Try asking me a question now.");
}

function appendMessage(sender, text) {
    const box = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `msg ${sender}`;
    msg.innerText = text;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chat-input-field');
    const text = input.value.trim();
    if(!text) return;
    
    appendMessage("user", text);
    input.value = "";

    if(!apiKey) {
        appendMessage("chip", "Please click the gear icon ⚙️ and add your Gemini API Key first!");
        return;
    }

    appendMessage("chip", "Thinking...");

    try {
        const prompt = `You are Chip, a cute AI tutor in a CPU Simulator. Keep answers brief (1-3 paragraphs) and easy for an engineering student. Answer this: ${text}`;
        
        // THIS IS THE LINE UPDATED TO gemini-3.8-flash BASED ON THE ERROR MESSAGE
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        
        // Remove "Thinking..."
        const msgs = document.getElementById('chat-messages');
        msgs.removeChild(msgs.lastChild);
        
        if(data.candidates && data.candidates[0].content) {
            appendMessage("chip", data.candidates[0].content.parts[0].text);
        } else if (data.error) {
            appendMessage("chip", "Google Error: " + data.error.message);
        } else {
            appendMessage("chip", "Unknown Error. Check the console.");
        }
    } catch (e) {
        const msgs = document.getElementById('chat-messages');
        msgs.removeChild(msgs.lastChild);
        appendMessage("chip", "Network Error: Could not reach Google. Make sure you are using Live Server!");
    }
}