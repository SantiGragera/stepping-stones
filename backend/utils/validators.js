const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

function esEmailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function esPasswordValida(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

module.exports = { esEmailValido, esPasswordValida, esTextoNoVacio };
