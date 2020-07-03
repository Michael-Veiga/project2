$(document).ready(() => {
  // Getting references to our form and input
  const signUpForm = $('form.signup');
  const emailInput = $('input#email-input');
  const passwordInput = $('input#password-input');

  // When the signup button is clicked, we validate the email and password are not blank
  signUpForm.on('submit', (event) => {
    event.preventDefault();
    const userData = {
      email: emailInput.val().trim(),
      password: passwordInput.val().trim(),
    };

    if (!userData.email || !userData.password) {
      return;
    }
    function handleLoginErr(err) {
      $('#alert .msg').text(err.responseJSON);
      $('#alert').fadeIn(500);
    }
    // If we have an email and password, run the signUpUser function
    function signUpUser(email, password) {
      $.post('/api/signup', {
        email,
        password,
      })
        .then(() => {
          window.location.replace('/members');
          // If there's an error, handle it by throwing up a bootstrap alert
        })
        .catch(handleLoginErr);
    }
    signUpUser(userData.email, userData.password);
    emailInput.val('');
    passwordInput.val('');
  });

  // Does a post to the signup route. If successful, we are redirected to the members page
  // Otherwise we log any errors
});