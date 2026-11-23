// Error propio del servicio de IA: lleva un código estable y el estado HTTP a devolver.
class ErrorIA extends Error {
  constructor(codigo, mensaje, status = 500) {
    super(mensaje);
    this.name = 'ErrorIA';
    this.codigo = codigo;
    this.status = status;
  }
}

module.exports = { ErrorIA };
