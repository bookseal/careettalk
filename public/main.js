// Firebase 초기화
const firebaseConfig = {
  // 여기에 Firebase 설정을 넣으세요
};
firebase.initializeApp(firebaseConfig);

// Cloud Function URL 설정
const functionUrl = 'https://us-central1-career-1fac5.cloudfunctions.net/convertPhrases';
                    
const form = document.getElementById('converterForm');
const inputTypeSelect = document.getElementById('input-type');
const sentencesInput = document.getElementById('sentences');
const contextInput = document.getElementById('context');
const outputTable = document.getElementById('outputTable');
const convertBtn = document.querySelector('.convert-btn');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  outputTable.innerHTML = '<tr><td colspan="2">Converting...</td></tr>';
  convertBtn.disabled = true;
  convertBtn.textContent = 'Converting...';

  try {
    const inputType = inputTypeSelect.value;
    const sentences = sentencesInput.value;
    const context = contextInput.value;

    // Cloud Function 직접 호출
    const response = await fetch(functionUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ inputType, sentences, context }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();

    let outputHtml = '';
    result.forEach((row, index) => {
      outputHtml += `
        <tr style="opacity: 0">
          <td>${row.englishPhrase}</td>
          <td>${row.koreanTranslation}</td>
        </tr>
      `;
    });

    outputTable.innerHTML = outputHtml;

    // Animate rows
    const rows = outputTable.querySelectorAll('tr');
    rows.forEach((row, index) => {
      setTimeout(() => {
        row.style.transition = 'opacity 0.5s, transform 0.5s';
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      }, index * 100);
    });

  } catch (e) {
    outputTable.innerHTML = `<tr><td colspan="2">Error: ${e.message}</td></tr>`;
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert';
  }
};

// Add subtle parallax effect
document.addEventListener('mousemove', (e) => {
  const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
  const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
  document.body.style.backgroundPosition = `${moveX}px ${moveY}px`;
});