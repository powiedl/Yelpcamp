(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.validated-form') // die Klasse validated-form muss am Form gesetzt sein
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => { // Array.from(collection) - macht ein Array aus der collection; dann für jedes Formular (mit der Klasse validated-form)
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()