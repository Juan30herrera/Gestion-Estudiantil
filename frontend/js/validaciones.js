// Validaciones básicas reutilizables.

const Validar = {
  texto(valor) {
    return String(valor || '').trim();
  },
  nombre(valor) {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,60}$/.test(this.texto(valor));
  },
  correo(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.texto(valor));
  },
  codigo(valor) {
    return /^[A-Za-z0-9-]{2,10}$/.test(this.texto(valor));
  },
  numeroEntre(valor, min, max) {
    if (this.texto(valor) === '') return false;
    const n = Number(valor);
    return !Number.isNaN(n) && n >= min && n <= max;
  },
};
