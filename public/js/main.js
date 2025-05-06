document.addEventListener('DOMContentLoaded', function() {
    // Handle quiz timer if on a quiz page
    const timerElement = document.getElementById('quiz-timer');
    if (timerElement) {
        let timeLeft = parseInt(timerElement.dataset.timeLimit, 10);
        
        const timerInterval = setInterval(() => {
            timeLeft -= 1;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                const quizForm = document.getElementById('quiz-form');
                if (quizForm) {
                    // Show a countdown before auto-submission
                    timerElement.textContent = "Submitting...";
                    setTimeout(() => quizForm.submit(), 1000);
                }
            }
        }, 1000);
    }
    
    // Form validation for quiz creation
    const quizForm = document.getElementById('create-quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', function(e) {
            const questionInputs = document.querySelectorAll('.question-text');
            let valid = true;
            
            questionInputs.forEach(input => {
                if (input.value.trim() === '') {
                    valid = false;
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
            });
            
            if (!valid) {
                e.preventDefault();
                alert('Please fill in all question fields.');
            }
        });
    }
    
    // Enable Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
