document.addEventListener('DOMContentLoaded', function() {
    let startTime = Date.now();
    let currentQuestion = 0;
    const totalQuestions = document.querySelectorAll('.question-slide').length;
    const questionSlides = document.querySelectorAll('.question-slide');
    const currentQuestionNumber = document.getElementById('current-question-number');
    const quizProgress = document.getElementById('quiz-progress');
    const timeTakenField = document.getElementById('time-taken');
    
    // Initialize question navigation
    function showQuestion(index) {
      // Hide all questions
      questionSlides.forEach(slide => {
        slide.style.display = 'none';
      });
      
      // Show the selected question
      if (index >= 0 && index < questionSlides.length) {
        questionSlides[index].style.display = 'block';
        currentQuestion = index;
        currentQuestionNumber.textContent = index + 1;
        
        // Update progress bar
        const progressPercentage = ((index + 1) / totalQuestions) * 100;
        quizProgress.style.width = progressPercentage + '%';
        
        // Update active state in navigation buttons
        document.querySelectorAll('.question-nav-btn').forEach((btn, idx) => {
          if (idx === index) {
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-outline-secondary');
          } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-secondary');
          }
          
          // Check if this question has an answer
          const questionData = questionSlides[idx];
          const questionId = questionData.dataset.questionIndex;
          const radioInputs = questionData.querySelectorAll('input[type="radio"]');
          const textInput = questionData.querySelector('input[type="text"]');
          let hasAnswer = false;
          
          if (radioInputs.length > 0) {
            hasAnswer = Array.from(radioInputs).some(input => input.checked && input.value !== 'unanswered');
          } else if (textInput && textInput.value.trim() !== '') {
            hasAnswer = true;
          }
          
          if (hasAnswer) {
            btn.classList.add('btn-success');
            btn.classList.remove('btn-outline-secondary', 'btn-primary');
          }
        });
      }
    }
    
    // Set up event listeners for navigation buttons
    document.querySelectorAll('.next-question, .prev-question').forEach(button => {
      button.addEventListener('click', function() {
        const targetIndex = parseInt(this.dataset.target);
        showQuestion(targetIndex);
      });
    });
    
    // Set up event listeners for question navigation buttons
    document.querySelectorAll('.question-nav-btn').forEach(button => {
      button.addEventListener('click', function() {
        const targetIndex = parseInt(this.dataset.target);
        showQuestion(targetIndex);
      });
    });
    
    // Mark questions as answered
    document.querySelectorAll('input[type="radio"], input[type="text"]').forEach(input => {
      input.addEventListener('change', function() {
        const questionIndex = parseInt(this.closest('.question-slide').dataset.questionIndex);
        const navBtn = document.querySelector('.question-nav-btn[data-target="' + questionIndex + '"]');
        
        if ((input.type === 'radio' && input.checked && input.value !== 'unanswered') || 
            (input.type === 'text' && input.value.trim() !== '')) {
          navBtn.classList.add('btn-success');
          navBtn.classList.remove('btn-outline-secondary', 'btn-primary');
        }
      });
    });
    
    // Handle form submission
    document.getElementById('quiz-form').addEventListener('submit', function() {
      // Calculate total time taken
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      timeTakenField.value = timeTaken;
    });
    
    // Show the first question initially
    showQuestion(0);
});
