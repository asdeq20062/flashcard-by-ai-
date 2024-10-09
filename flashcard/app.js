let vocabularyList = [];
let currentIndex = -1;
let vocabularyDatabase = {};
let wordShowCounts = {};
let currentWord = null;
let importedStats = {};
let history = [];

document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('showButton').addEventListener('click', toggleContent);
document.getElementById('nextButton').addEventListener('click', showNextWord);
document.getElementById('refreshButton').addEventListener('click', refreshVocabulary);
document.getElementById('knowButton').addEventListener('click', () => handleResponse('know'));
document.getElementById('dontKnowButton').addEventListener('click', () => handleResponse('dontKnow'));
document.getElementById('saveButton').addEventListener('click', saveToDatabase);
document.getElementById('importButton').addEventListener('click', importLastStats);

// Add event listeners for new buttons

document.getElementById('previousButton').addEventListener('click', showPreviousWord);

// Add this event listener near the top of the file, with the other event listeners
document.addEventListener('keydown', handleKeyPress);

// Add this new function to handle key presses
function handleKeyPress(event) {
    switch(event.key.toLowerCase()) {
        case 'arrowleft':
            showPreviousWord();
            break;
        case 'arrowright':
            showNextWord();
            break;
        case 's':
            toggleContent();
            break;
        case 'p':
            playPronunciation();
            break;
        case 'n':
            handleResponse('know');
            break;
        case 'm':
            handleResponse('dontKnow');
            break;
    }
}

function handleFile(e) {
    const file = e.target.files[0];
    processFile(file);
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        // Skip the header row and process the data
        const processedData = rawData.slice(1);
        vocabularyList = combineVocabulary(processedData);
        
        // Filter out any potential undefined entries
        vocabularyList = vocabularyList.filter(word => word && word.engWord);
        
        // Shuffle the vocabulary list initially
        vocabularyList = shuffleArray(vocabularyList);
        
        // Initialize database entries and show counts for new words
        vocabularyList.forEach(word => {
            if (!vocabularyDatabase[word.engWord]) {
                vocabularyDatabase[word.engWord] = { know_count: 0, not_know_count: 0 };
            }
            wordShowCounts[word.engWord] = 0;
        });
        
        if (vocabularyList.length > 0) {
            showNextWord();
        } else {
            alert('No valid vocabulary words found in the file.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function combineVocabulary(data) {
    const combined = {};
    data.forEach(row => {
        const [engWord, wordType, chineseMeaning, example] = row;
        // Check if engWord is defined and not empty
        if (engWord && engWord.trim() !== '') {
            if (!combined[engWord]) {
                combined[engWord] = {
                    engWord,
                    wordType: wordType || '',
                    meanings: []
                };
            }
            if (chineseMeaning || example) {
                combined[engWord].meanings.push({ 
                    chineseMeaning: chineseMeaning || '', 
                    example: example || '' 
                });
            }
        }
    });
    return Object.values(combined);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function toggleContent() {
    const hiddenContent = document.getElementById('hiddenContent');
    const showButton = document.getElementById('showButton');
    
    if (hiddenContent.classList.contains('hidden')) {
        hiddenContent.classList.remove('hidden');
        showButton.textContent = 'Hide (S)';
    } else {
        hiddenContent.classList.add('hidden');
        showButton.textContent = 'Show (S)';
    }
}

function showNextWord() {
    if (vocabularyList.length === 0) {
        alert('No vocabulary words available.');
        return;
    }

    if (currentWord) {
        history.push(currentIndex);
    }

    // Choose a random index, different from the current one
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * vocabularyList.length);
    } while (newIndex === currentIndex && vocabularyList.length > 1);

    currentIndex = newIndex;
    currentWord = vocabularyList[currentIndex];

    if (currentWord && currentWord.engWord) {
        wordShowCounts[currentWord.engWord] = (wordShowCounts[currentWord.engWord] || 0) + 1;
        updateWordDisplay();
    } else {
        // If we somehow got an invalid word, try again
        showNextWord();
    }
}

function showPreviousWord() {
    if (history.length === 0) {
        alert("No previous words available.");
        return;
    }

    currentIndex = history.pop();
    currentWord = vocabularyList[currentIndex];
    updateWordDisplay();
}

function updateWordDisplay() {
    if (!currentWord || !currentWord.engWord) {
        console.error('Invalid current word:', currentWord);
        return;
    }

    document.getElementById('engWord').textContent = currentWord.engWord;
    document.getElementById('wordType').textContent = currentWord.wordType || '';

    const hiddenContent = document.getElementById('hiddenContent');
    hiddenContent.innerHTML = ''; // Clear previous content

    if (currentWord.meanings && currentWord.meanings.length > 0) {
        currentWord.meanings.forEach((meaning, index) => {
            const meaningBox = document.createElement('div');
            meaningBox.className = 'meaning-box';
            
            const meaningHeader = document.createElement('h3');
            meaningHeader.textContent = `Meaning ${index + 1}`;
            meaningBox.appendChild(meaningHeader);

            if (meaning.chineseMeaning) {
                const chineseMeaningP = document.createElement('p');
                chineseMeaningP.textContent = meaning.chineseMeaning;
                meaningBox.appendChild(chineseMeaningP);
            }

            if (meaning.example) {
                const exampleP = document.createElement('p');
                exampleP.textContent = `Example: ${meaning.example}`;
                meaningBox.appendChild(exampleP);
            }

            hiddenContent.appendChild(meaningBox);
        });
    } else {
        const noMeaningP = document.createElement('p');
        noMeaningP.textContent = 'No meanings available for this word.';
        hiddenContent.appendChild(noMeaningP);
    }

    hiddenContent.classList.add('hidden');
    document.getElementById('showButton').textContent = 'Show (S)';

    // Add this line to display the number of times the word has been shown
    document.getElementById('showCount').textContent = `Times shown: ${wordShowCounts[currentWord.engWord]}`;
}

function refreshVocabulary() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        processFile(fileInput.files[0]);
    } else {
        alert('Please select an Excel file first.');
    }
}

function handleResponse(response) {
    const currentWord = vocabularyList[currentIndex].engWord;
    // Remove the check for shownWords.has(currentWord) as we want to update stats every time
    if (response === 'know') {
        vocabularyDatabase[currentWord].know_count++;
    } else {
        vocabularyDatabase[currentWord].not_know_count++;
    }
    
    showNextWord();
}

function saveToDatabase() {
    const mergedStats = { ...importedStats };

    for (const [word, counts] of Object.entries(vocabularyDatabase)) {
        // Remove the check for shownWords.has(word) as we're tracking all words now
        if (mergedStats[word]) {
            mergedStats[word].know_count += counts.know_count;
            mergedStats[word].not_know_count += counts.not_know_count;
        } else {
            mergedStats[word] = { ...counts };
        }
    }

    let data = "vocab know_count not_know_count\n";
    for (const [word, counts] of Object.entries(mergedStats)) {
        data += `${word} ${counts.know_count} ${counts.not_know_count}\n`;
    }

    const blob = new Blob([data], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary_stats.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function parseExistingStats(content) {
    const existingStats = {};
    const lines = content.split('\n');
    lines.shift(); // Remove header line
    lines.forEach(line => {
        if (line.trim() !== '') {
            const parts = line.split(' ');
            const vocab = parts.slice(0, parts.length - 2).join(' '); // Join all but the last two parts as the vocabulary
            const knowCount = parts[parts.length - 2];
            const notKnowCount = parts[parts.length - 1];
            existingStats[vocab] = {
                know_count: parseInt(knowCount, 10) || 0,
                not_know_count: parseInt(notKnowCount, 10) || 0
            };
        }
    });
    console.log(existingStats);
    return existingStats;
}

// Add this new function to play the pronunciation
function playPronunciation() {
    if (currentWord) {
        const utterance = new SpeechSynthesisUtterance(currentWord.engWord);
        utterance.lang = 'en-US'; // Set language to English
        utterance.rate = 0.8; // Slightly slower speed for clarity
        
        speechSynthesis.speak(utterance);
    }
}

// Add event listener for the pronunciation button
document.getElementById('playPronunciation').addEventListener('click', playPronunciation);

// Add this new function to import last stats
function importLastStats() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                importedStats = parseExistingStats(content);
                alert('Stats imported successfully!');
            };
            reader.readAsText(file);
        }
        document.body.removeChild(fileInput);
    });

    fileInput.click();
}